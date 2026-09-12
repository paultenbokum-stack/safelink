import { createHash } from 'node:crypto';
import { normalizePreferences, countsForBadge } from './notification-policy';

const hash = value => createHash('sha256').update(value).digest('hex');
const problem = (message, status = 400) => Object.assign(new Error(message), { status });
const channelValid = channel => channel?.active === true && ['community', 'security'].includes(channel.kind);
const nameOf = household => [household?.adminFirstName, household?.adminLastName].filter(Boolean).join(' ') || 'Family guardian';

function familyContext(user, household) {
  const guardianUid = user.familyMember === true ? user.guardianUid : user.uid;
  const joined = (household?.members || []).filter(m => m.linkedUid && !m.isSelf);
  if (user.familyMember === true && !joined.some(m => m.id === user.familyMemberId && m.linkedUid === user.uid)) throw problem('Family access has ended.', 403);
  const participants = [{ uid: guardianUid, name: nameOf(household) }, ...joined.map(m => ({ uid: m.linkedUid, name: m.name }))];
  return { guardianUid, participants: [...new Map(participants.map(p => [p.uid, p])).values()], senderName: participants.find(p => p.uid === user.uid)?.name || nameOf(household) };
}

export function notificationService({ firestore, now = Date.now }) {
  const inbox = uid => firestore.collection('notificationInboxes').doc(uid).collection('items');
  const reads = uid => firestore.collection('notificationReads').doc(uid).collection('items');
  const householdRef = user => firestore.collection('households').doc(user.familyMember === true ? user.guardianUid : user.uid);

  async function verifiedFamily(user, household, get = ref => ref.get()) {
    const guardianUid = user.familyMember === true ? user.guardianUid : user.uid;
    const members = household?.members || [];
    const verified = await Promise.all(members.map(async member => {
      if (!member.linkedUid) return null;
      const membership = (await get(firestore.collection('familyMemberships').doc(member.linkedUid))).data();
      return membership?.guardianUid === guardianUid && membership.memberId === member.id ? member : null;
    }));
    return familyContext(user, { ...household, members: verified.filter(Boolean) });
  }

  async function list(user, options = {}) {
    const household = (await householdRef(user).get()).data();
    const family = await verifiedFamily(user, household);
    const [personal, subscriptions, publishers] = await Promise.all([
      inbox(user.uid).orderBy('createdAt', 'desc').get(),
      firestore.collection('notificationChannels').where('householdIds', 'array-contains', family.guardianUid).get(),
      user.familyMember ? Promise.resolve({ docs: [] }) : firestore.collection('notificationChannels').where('publisherUids', 'array-contains', user.uid).get(),
    ]);
    let items = personal.docs.map(doc => ({ ...doc.data(), id: `family:${doc.id}`, kind: doc.data().kind || 'family' }));
    const subscribed = [...new Map([...subscriptions.docs, ...publishers.docs].filter(doc => channelValid(doc.data())).map(doc => [doc.id, doc])).values()];
    const bulletins = await Promise.all(subscribed.map(async channel => {
      const info = channel.data();
      const messages = await channel.ref.collection('updates').orderBy('createdAt', 'desc').get();
      return messages.docs.map(doc => ({ ...doc.data(), id: `channel:${channel.id}:${doc.id}`, kind: info.kind, senderName: info.name }));
    }));
    const [releases, receiptDocs, preferenceDoc] = await Promise.all([
      firestore.collection('notificationReleases').orderBy('createdAt', 'desc').get(),
      reads(user.uid).get(), firestore.collection('notificationPreferences').doc(user.uid).get(),
    ]);
    items = items.concat(...bulletins, ...releases.docs.map(doc => ({ ...doc.data(), id: `release:${doc.id}`, kind: 'updates', senderName: 'SafeLink' }))).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
    const receiptMap = new Map(receiptDocs.docs.map(doc => [doc.id, doc.data()]));
    const preferences = normalizePreferences(preferenceDoc.data());
    const notifications = items.map((item) => ({
      id: item.id, title: item.title, body: item.body, kind: item.kind, senderName: item.senderName,
      recipientLabel: item.recipientLabel || '', createdAt: item.createdAt,
      priority: ['urgent', 'important'].includes(item.priority) ? item.priority : 'routine',
      groupId: item.groupId || item.id, acknowledged: !!receiptMap.get(hash(item.id))?.acknowledgedAt,
      sent: item.senderUid === user.uid, read: !!receiptMap.get(hash(item.id))?.readAt || item.senderUid === user.uid,
    }));
    notifications.sort((a, b) => (b.priority === 'urgent' && !b.acknowledged) - (a.priority === 'urgent' && !a.acknowledged) || b.createdAt - a.createdAt || a.id.localeCompare(b.id));
    const filtered = notifications.filter(item => (!options.kind || options.kind === 'all' || item.kind === options.kind) && (!options.unread || !item.read));
    const offset = Number(options.offset) || 0;
    if (!Number.isSafeInteger(offset) || offset < 0) throw problem('Invalid page.');
    return { notifications: options.all ? filtered : filtered.slice(offset, offset + 50),
      nextOffset: offset + 50 < filtered.length ? offset + 50 : null,
      total: filtered.length, preferences,
      unreadCount: notifications.filter(item => !item.read).length,
      urgentCount: notifications.filter(item => item.priority === 'urgent' && !item.acknowledged).length,
      badgeCount: notifications.filter(item => countsForBadge(item, preferences)).length,
      recipients: family.participants.filter(p => p.uid !== user.uid),
      publisherChannels: publishers.docs.filter(doc => channelValid(doc.data())).map(doc => ({ id: doc.id, name: doc.data().name, kind: doc.data().kind, canSendUrgent: doc.data().urgentPublisherUids?.includes(user.uid) === true })),
    };
  }

  async function markRead(user, ids, acknowledge = false) {
    if (!Array.isArray(ids) || ids.length > 50 || ids.some(id => typeof id !== 'string' || id.length > 400)) throw problem('Invalid notification selection.');
    const feed = await list(user, { all: true });
    const allowed = new Set(feed.notifications.map(item => item.id));
    if (ids.some(id => !allowed.has(id))) throw problem('Notification is unavailable. Refresh and retry.', 403);
    const batch = firestore.batch();
    for (const id of new Set(ids)) batch.set(reads(user.uid).doc(hash(id)), { readAt: now(), ...(acknowledge ? { acknowledgedAt: now() } : {}) }, { merge: true });
    if (ids.length) await batch.commit();
    return { success: true };
  }

  async function send(user, input, broadcast = false) {
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const body = typeof input.body === 'string' ? input.body.trim() : '';
    if (!title || title.length > 100 || !body || body.length > 1000 || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.requestId || '')) throw problem('Enter a title (up to 100 characters) and message (up to 1,000 characters).');
    if (broadcast && user.familyMember) throw problem('Only authorised publishers can send these updates.', 403);
    const destination = broadcast ? input.channelId : input.recipientUid;
    if (typeof destination !== 'string' || !destination || destination.length > 128 || destination.includes('/')) throw problem('Choose a recipient.');
    const id = hash(`${user.uid}:${input.requestId}`);
    const requestedPriority = ['urgent', 'important'].includes(input.priority) ? input.priority : 'routine';
    const fingerprint = hash(JSON.stringify({ title, body, destination, broadcast, requestedPriority }));
    const requestRef = firestore.collection('notificationRequests').doc(id);
    const limitRef = firestore.collection('notificationSendLimits').doc(user.uid);
    return firestore.runTransaction(async tx => {
      // Recheck membership and publisher permissions even on idempotent retries.
      const family = await verifiedFamily(user, (await tx.get(householdRef(user))).data(), ref => tx.get(ref));
      const channelRef = broadcast ? firestore.collection('notificationChannels').doc(destination) : null;
      const channel = channelRef ? (await tx.get(channelRef)).data() : null;
      if (broadcast && (!channelValid(channel) || !channel.publisherUids?.includes(user.uid))) throw problem('You are not authorised to publish to this channel.', 403);
      if (requestedPriority !== 'routine' && !broadcast) throw problem('Family messages use routine priority. Use SOS for an emergency.', 403);
      if (requestedPriority === 'urgent' && !channel?.urgentPublisherUids?.includes(user.uid)) throw problem('Only designated emergency publishers can send urgent alerts.', 403);
      const recipients = family.participants.filter(p => p.uid !== user.uid && (destination === 'all' || destination === p.uid));
      if (!broadcast && !recipients.length) throw problem('Choose a joined member of your family. Send them an invite first if needed.', 403);
      const existing = (await tx.get(requestRef)).data();
      if (existing) {
        if (existing.fingerprint !== fingerprint) throw problem('This request has already been used for a different message.', 409);
        return { success: true, duplicate: true };
      }
      const limit = (await tx.get(limitRef)).data();
      if (limit && now() - limit.lastSentAt < 5000) throw problem('Please wait a few seconds before sending another message.', 429);
      const message = { title, body, priority: requestedPriority, groupId: broadcast ? `channel:${destination}` : `family:${family.guardianUid}:${user.uid}`, createdAt: now(), senderUid: user.uid, senderName: broadcast ? channel.name : family.senderName,
        recipientLabel: broadcast ? channel.name : destination === 'all' ? 'Everyone in your family' : recipients[0].name };
      if (broadcast) tx.set(channelRef.collection('updates').doc(id), message);
      else for (const uid of [user.uid, ...recipients.map(p => p.uid)]) tx.set(inbox(uid).doc(id), message);
      tx.set(firestore.collection('notificationPushJobs').doc(id), {
        eventId: broadcast ? `channel:${destination}:${id}` : `family:${id}`,
        audience: broadcast ? 'channel' : 'family', channelId: broadcast ? destination : null,
        recipientUids: broadcast ? [] : recipients.map(p => p.uid), guardianUid: family.guardianUid,
        priority: requestedPriority, nextAttemptAt: now(), createdAt: now(), expiresAt: now() + (requestedPriority === 'urgent' ? 300000 : 172800000),
      });
      tx.set(requestRef, { fingerprint, createdAt: now() });
      tx.set(limitRef, { lastSentAt: now() });
      return { success: true };
    });
  }
  return { list, markRead, send };
}
