import { createHash, randomBytes } from 'node:crypto';

const digest = value => createHash('sha256').update(value).digest('hex');
const secret = () => randomBytes(32).toString('base64url');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

// Dependencies are injected so expiry, concurrent redemption and revocation can be tested.
export function familyInviteService({ firestore, auth, now = Date.now }) {
  async function issue(guardianUid, memberId, revoke = false) {
    const token = secret();
    const hash = digest(token);
    const expiresAt = now() + 24 * 60 * 60 * 1000;
    const householdRef = firestore.collection('households').doc(guardianUid);
    await firestore.runTransaction(async tx => {
      const household = (await tx.get(householdRef)).data();
      const member = household?.members?.find(m => m.id === memberId && !m.isSelf && m.id !== guardianUid);
      if (!member) throw fail('Save this family member before inviting them.', 404);
      if (!revoke) tx.set(firestore.collection('familyInvites').doc(hash), {
        guardianUid, memberId, expiresAt, createdAt: now(), usedAt: null,
      });
      tx.set(householdRef, { members: household.members.map(m => m.id === memberId
        ? { ...m, inviteHash: revoke ? null : hash, inviteExpiresAt: revoke ? null : expiresAt } : m) }, { merge: true });
    });
    return revoke ? { revoked: true } : { token, expiresAt };
  }

  async function redeem(token, attempt) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token || '') || !/^[A-Za-z0-9_-]{43}$/.test(attempt || '')) {
      throw fail('This invitation is invalid. Ask your guardian for a new link.');
    }
    const hash = digest(token);
    const attemptHash = digest(attempt);
    const inviteRef = firestore.collection('familyInvites').doc(hash);
    return firestore.runTransaction(async tx => {
      const invite = (await tx.get(inviteRef)).data();
      if (!invite || invite.expiresAt <= now()) throw fail('This invitation has expired. Ask your guardian for a new link.', 410);
      const householdRef = firestore.collection('households').doc(invite.guardianUid);
      const household = (await tx.get(householdRef)).data();
      const member = household?.members?.find(m => m.id === invite.memberId);
      if (!member || member.inviteHash !== hash) throw fail('This invitation was replaced or revoked. Ask for a new link.', 410);
      if (invite.usedAt && (invite.attemptHash !== attemptHash || now() - invite.usedAt > 5 * 60 * 1000)) {
        throw fail('This invitation has already been used. Ask your guardian for a new link.', 410);
      }
      const uid = invite.invitedUid || member.linkedUid || `family_${secret()}`;
      const sessionVersion = invite.sessionVersion || secret();
      // Sign before consuming: a missing signing credential must leave the invite usable.
      const customToken = await auth.createCustomToken(uid, {
        familyMember: true, guardianUid: invite.guardianUid, familyMemberId: member.id, familySessionVersion: sessionVersion,
      });
      if (!invite.usedAt) {
        tx.set(inviteRef, { usedAt: now(), attemptHash, invitedUid: uid, sessionVersion }, { merge: true });
        tx.set(householdRef, { members: household.members.map(m => m.id === member.id
          ? { ...m, linkedUid: uid, joinedAt: now() } : m) }, { merge: true });
        tx.set(firestore.collection('familyMemberships').doc(uid), {
          guardianUid: invite.guardianUid, memberId: member.id, sessionVersion,
        });
        tx.set(firestore.collection('households').doc(uid), {
          adminFirstName: member.name, adminLastName: '', phone: member.phone || '',
          householdName: household.householdName || 'My Family', circleRole: member.role,
          onboardingCompleted: true,
        }, { merge: true });
      }
      return { customToken, memberName: member.name };
    });
  }
  return { issue, redeem };
}

export async function authorizeInvitedMember(decoded, request, firestore) {
  if (decoded.familyMember !== true) return;
  const path = new URL(request.url).pathname;
  const allowed = new Set(['GET /api/notifications', 'POST /api/notifications', 'PATCH /api/notifications', 'GET /api/family/session', 'GET /api/profile/avatar', 'POST /api/profile/avatar',
    'GET /api/profile/setup', 'GET /api/location/share', 'POST /api/location/share', 'GET /api/devices', 'GET /api/events', 'POST /api/sos/dispatch']);
  const allowedDeviceRead = request.method === 'GET' && /^\/api\/devices\/\d{15}\/(location|track|alarms)$/.test(path);
  if (!allowed.has(`${request.method} ${path}`) && !allowedDeviceRead) throw new Error('UNAUTHENTICATED');
  const membership = (await firestore.collection('familyMemberships').doc(decoded.uid).get()).data();
  if (!membership || membership.guardianUid !== decoded.guardianUid || membership.memberId !== decoded.familyMemberId ||
    membership.sessionVersion !== decoded.familySessionVersion) throw new Error('UNAUTHENTICATED');
  const household = (await firestore.collection('households').doc(membership.guardianUid).get()).data();
  if (!household?.members?.some(m => m.id === membership.memberId && m.linkedUid === decoded.uid)) throw new Error('UNAUTHENTICATED');
}
