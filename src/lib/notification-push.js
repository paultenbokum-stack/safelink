import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { FieldValue } from 'firebase-admin/firestore';
import { adminApp, getAdminFirestore } from './firebase-admin';
import { notificationService } from './notifications';
import { deliveryPolicy, localClock, normalizePreferences, countsForBadge } from './notification-policy';

const hash = value => createHash('sha256').update(value).digest('hex');

// Jobs are written atomically with messages. A scheduler retries interrupted work.
// Delivery receipts and stable notification tags suppress retries and group related updates.
export async function drainPushQueue() {
  const db = getAdminFirestore();
  const jobs = await db.collection('notificationPushJobs').where('nextAttemptAt', '<=', Date.now()).orderBy('nextAttemptAt').limit(5).get();
  for (const jobDoc of jobs.docs) {
    const lease = randomUUID();
    const job = await db.runTransaction(async tx => {
      const current = (await tx.get(jobDoc.ref)).data();
      if (!current || current.leaseUntil > Date.now() || current.completedAt) return null;
      tx.update(jobDoc.ref, { lease, leaseUntil: Date.now() + 120000 });
      return current;
    });
    if (!job) continue;
    try {
      if (job.expiresAt < Date.now()) { await jobDoc.ref.update({ completedAt: Date.now(), nextAttemptAt: FieldValue.delete(), leaseUntil: 0 }); continue; }
      let query = db.collection('notificationPushTokens').orderBy('__name__').limit(20);
      if (job.cursor) query = query.startAfter(job.cursor);
      const tokens = await query.get();
      let deferred = job.deferred === true;
      for (const tokenDoc of tokens.docs) {
        const target = tokenDoc.data();
        if (target.expiresAt < Date.now()) { await tokenDoc.ref.delete(); continue; }
        if (job.audience === 'family' && !job.recipientUids.includes(target.uid)) continue;
        const receipt = db.collection('notificationPushReceipts').doc(hash(`${jobDoc.id}:${tokenDoc.id}`));
        if ((await receipt.get()).exists) continue;
        const membership = (await db.collection('familyMemberships').doc(target.uid).get()).data();
        const user = membership ? { uid: target.uid, familyMember: true, guardianUid: membership.guardianUid, familyMemberId: membership.memberId } : { uid: target.uid };
        if (job.audience === 'family' && (user.guardianUid || user.uid) !== job.guardianUid) continue;
        let feed;
        try { feed = await notificationService({ firestore: db }).list(user, { all: true }); } catch (error) { if (error.status !== 403) deferred = true; continue; }
        const item = feed.notifications.find(value => value.id === job.eventId);
        if (!item || item.read || item.sent) { await receipt.set({ skippedAt: Date.now() }); continue; }
        const prefs = normalizePreferences(feed.preferences);
        const policy = deliveryPolicy(item, prefs);
        if (policy === 'defer') { deferred = true; continue; }
        if (policy === 'muted') { await receipt.set({ skippedAt: Date.now() }); continue; }
        const digest = policy === 'digest';
        const clock = localClock(Date.now(), prefs.quietHours.timeZone);
        const digestRef = db.collection('notificationPushDigests').doc(hash(`${tokenDoc.id}:${clock.date}:community`));
        if (digest) {
          const claim = await db.runTransaction(async tx => {
            const current = (await tx.get(digestRef)).data();
            if (current?.sentAt) return 'sent';
            if (current?.leaseUntil > Date.now()) return 'busy';
            tx.set(digestRef, { leaseUntil: Date.now() + 120000 });
            return 'claimed';
          });
          if (claim === 'sent') { await receipt.set({ groupedAt: Date.now() }); continue; }
          if (claim === 'busy') { deferred = true; continue; }
        }
        // Recheck token ownership immediately before delivery (shared-device account switch).
        if ((await tokenDoc.ref.get()).data()?.uid !== target.uid) continue;
        try {
          await getMessaging(adminApp).send({
            token: target.token,
            data: {
              uid: target.uid, eventId: item.id, priority: item.priority, groupId: digest ? `community-digest:${clock.date}` : item.groupId,
              title: digest ? 'Your community digest' : prefs.previews ? item.title : item.priority === 'urgent' ? 'Urgent SafeLink alert' : 'SafeLink notification',
              body: digest ? `${feed.notifications.filter(value => value.kind === 'community' && !value.read).length} unread community updates. Open SafeLink to catch up.` : prefs.previews ? item.body : 'Open SafeLink to view your message.',
              badge: String(countsForBadge(item, prefs)),
            },
            webpush: { headers: { TTL: item.priority === 'urgent' ? '60' : '3600', Urgency: item.priority === 'urgent' ? 'high' : 'normal' } },
          });
          await receipt.set({ sentAt: Date.now() });
          if (digest) await digestRef.set({ sentAt: Date.now() });
        } catch (error) {
          if (digest) await digestRef.set({ leaseUntil: 0 });
          if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(error.code)) await tokenDoc.ref.delete();
          else deferred = true;
        }
      }
      const more = tokens.docs.length === 20;
      await jobDoc.ref.update({ cursor: more ? tokens.docs.at(-1).id : null, deferred: more && deferred, leaseUntil: 0,
        nextAttemptAt: more ? Date.now() : deferred ? Date.now() + 60000 : FieldValue.delete(),
        ...(!more && !deferred ? { completedAt: Date.now() } : {}),
      });
    } catch {
      await jobDoc.ref.update({ leaseUntil: 0, nextAttemptAt: Date.now() + 60000 });
    }
  }
  return { processed: jobs.docs.length };
}

// For verified server-side device/incident events only; never accepts client priority.
export async function recordSafetyNotification({ uid, eventId, title, body, priority = 'important', groupId }) {
  if (!uid || !eventId) return;
  const db = getAdminFirestore();
  const membership = (await db.collection('familyMemberships').doc(uid).get()).data();
  const guardianUid = membership?.guardianUid || uid;
  const household = (await db.collection('households').doc(guardianUid).get()).data();
  const recipients = new Set([guardianUid, uid]);
  for (const member of household?.members || []) {
    if (!member.linkedUid) continue;
    const link = (await db.collection('familyMemberships').doc(member.linkedUid).get()).data();
    if (link?.guardianUid === guardianUid && link.memberId === member.id) recipients.add(member.linkedUid);
  }
  const id = hash(eventId);
  await db.runTransaction(async tx => {
    const jobRef = db.collection('notificationPushJobs').doc(id);
    if ((await tx.get(jobRef)).exists) return;
    for (const recipient of recipients) tx.set(db.collection('notificationInboxes').doc(recipient).collection('items').doc(id), {
      title, body, priority, groupId: groupId || id, kind: 'alerts', senderName: 'SafeLink safety alert', createdAt: Date.now(),
    });
    tx.set(jobRef, { eventId: `family:${id}`, audience: 'family', recipientUids: [...recipients], guardianUid, createdAt: Date.now(), nextAttemptAt: Date.now(), expiresAt: Date.now() + (priority === 'urgent' ? 300000 : 86400000) });
  });
}
