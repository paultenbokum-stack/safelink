const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = fs.readFileSync('src/lib/family-invites.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const context = vm.createContext({ ...crypto, Date, Set, URL, Error });
vm.runInContext(source, context);
const { familyInviteService, authorizeInvitedMember } = context;
const attempt = () => crypto.randomBytes(32).toString('base64url');
const store = new Map([['households/guardian', { householdName: 'Our Family', members: [{ id: 'child', name: 'Sam', phone: '', role: 'Child', isSelf: false }] }]]);
const ref = path => ({ path, get: async () => ({ data: () => structuredClone(store.get(path)) }) });
let queue = Promise.resolve();
const firestore = {
  collection: name => ({ doc: id => ref(`${name}/${id}`) }),
  runTransaction: fn => {
    const work = queue.then(async () => {
      const writes = [];
      const result = await fn({ get: r => r.get(), set: (r, data, opts) => writes.push([r.path, data, opts]) });
      for (const [key, data, opts] of writes) store.set(key, opts?.merge ? { ...store.get(key), ...structuredClone(data) } : structuredClone(data));
      return result;
    });
    queue = work.catch(() => {});
    return work;
  },
};
let clock = 100000000, signingFails = false;
const auth = { createCustomToken: async (uid, claims) => { if (signingFails) throw new Error('signing unavailable'); return JSON.stringify({ uid, ...claims }); } };
const service = familyInviteService({ firestore, auth, now: () => clock });
const req = (method = 'GET', path = '/api/family/session') => ({ method, url: `https://safelink.test${path}` });
(async () => {
  await assert.rejects(service.issue('stranger', 'child'), /Save this family member/);
  const first = await service.issue('guardian', 'child');
  assert.equal(first.token.length, 43);
  assert.ok(!JSON.stringify([...store]).includes(first.token), 'Only hash stored');
  const second = await service.issue('guardian', 'child');
  await assert.rejects(service.redeem(first.token, attempt()), /replaced or revoked/);
  await service.issue('guardian', 'child', true);
  await assert.rejects(service.redeem(second.token, attempt()), /replaced or revoked/);
  const expired = await service.issue('guardian', 'child'); clock += 86400001;
  await assert.rejects(service.redeem(expired.token, attempt()), /expired/);
  const valid = await service.issue('guardian', 'child');
  const deviceAttempt = attempt(); signingFails = true;
  await assert.rejects(service.redeem(valid.token, deviceAttempt), /signing unavailable/); signingFails = false;
  const result = await service.redeem(valid.token, deviceAttempt);
  const claims = JSON.parse(result.customToken);
  assert.notEqual(claims.uid, 'guardian'); assert.equal(claims.familyMember, true); assert.equal(claims.admin, undefined);
  await authorizeInvitedMember(claims, req(), firestore);
  assert.equal(JSON.parse((await service.redeem(valid.token, deviceAttempt)).customToken).uid, claims.uid, 'Same browser can retry a lost response');
  await assert.rejects(service.redeem(valid.token, attempt()), /already been used/);
  await assert.rejects(authorizeInvitedMember(claims, req('POST', '/api/paystack/initialize'), firestore), /UNAUTHENTICATED/);
  await assert.rejects(authorizeInvitedMember(claims, req('POST', '/api/profile/family/invite'), firestore), /UNAUTHENTICATED/);
  await assert.rejects(authorizeInvitedMember({ ...claims, guardianUid: 'stranger' }, req(), firestore), /UNAUTHENTICATED/);
  const recovery = await service.issue('guardian', 'child');
  const concurrent = await Promise.allSettled([service.redeem(recovery.token, attempt()), service.redeem(recovery.token, attempt())]);
  assert.equal(concurrent.filter(r => r.status === 'fulfilled').length, 1);
  const recovered = JSON.parse(concurrent.find(r => r.status === 'fulfilled').value.customToken);
  assert.equal(recovered.uid, claims.uid);
  await assert.rejects(authorizeInvitedMember(claims, req(), firestore), /UNAUTHENTICATED/);
  await authorizeInvitedMember(recovered, req(), firestore);
  store.set('households/guardian', { members: [] });
  await assert.rejects(authorizeInvitedMember(recovered, req(), firestore), /UNAUTHENTICATED/);
  await assert.rejects(service.redeem('invalid', attempt()), /invalid/);
  console.log('PASS: ownership, token hashing, replacement, revoke, expiry, signing failure rollback, separate member identity, safe retry, replay rejection, restricted permissions, recovery, concurrent redemption, and removal revocation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
