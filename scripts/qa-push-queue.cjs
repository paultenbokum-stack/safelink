const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
function fixture({ muted = false, fail = false, digest = false } = {}) {
  const clock = Date.parse('2026-09-12T17:00:00Z');
  const store = new Map([
    ['notificationPushTokens/token1', { uid: 'alice', token: 'fixture-token', expiresAt: clock + 86400000 }],
    ['notificationPushTokens/token2', { uid: 'outsider', token: 'outsider-token', expiresAt: clock + 86400000 }],
    ['notificationPushJobs/job1', { eventId: 'family:event1', audience: 'family', recipientUids: ['alice'], guardianUid: 'alice', nextAttemptAt: clock, createdAt: clock, expiresAt: clock + 86400000 }],
  ]);
  const remove = Symbol('delete');
  const snapshot = path => ({ id: path.split('/').at(-1), ref: doc(path), exists: store.has(path), data: () => store.get(path) });
  function update(path, fields) { const data = { ...store.get(path) }; for (const [key, value] of Object.entries(fields)) { if (value === remove) delete data[key]; else data[key] = value; } store.set(path, data); }
  function doc(path) { return { path, id: path.split('/').at(-1), get: async () => snapshot(path), set: async data => store.set(path, data), update: async fields => update(path, fields), delete: async () => store.delete(path), collection: name => collection(`${path}/${name}`) }; }
  function collection(path, filters = [], limit = Infinity, cursor = null) {
    return { doc: id => doc(`${path}/${id}`), where: (key, op, value) => collection(path, [...filters, { key, op, value }], limit, cursor), orderBy: () => collection(path, filters, limit, cursor), limit: count => collection(path, filters, count, cursor), startAfter: id => collection(path, filters, limit, id), get: async () => ({ docs: [...store.keys()].filter(key => key.startsWith(path + '/') && !key.slice(path.length + 1).includes('/')).map(snapshot).filter(row => (!cursor || row.id > cursor) && filters.every(filter => filter.op === '<=' ? row.data()[filter.key] <= filter.value : row.data()[filter.key] === filter.value)).slice(0, limit) }) };
  }
  let serial = Promise.resolve();
  const db = { collection, runTransaction: work => {
    const task = serial.then(() => work({ get: ref => ref.get(), set: (ref, data) => ref.set(data), update: (ref, data) => ref.update(data) })); serial = task.catch(() => {}); return task;
  } };
  const sent = [];
  let failing = fail;
  const policy = fs.readFileSync('src/lib/notification-policy.js', 'utf8').replace(/export /g, '');
  const source = fs.readFileSync('src/lib/notification-push.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
  const context = { ...crypto, Date: class extends Date { static now() { return clock; } }, FieldValue: { delete: () => remove }, getAdminFirestore: () => db, adminApp: {}, getMessaging: () => ({ send: async payload => { if (failing) throw Object.assign(new Error('temporary'), { code: 'messaging/server-unavailable' }); sent.push(payload); return 'ok'; } }), notificationService: () => ({ list: async () => ({ preferences: { categories: { [digest ? 'community' : 'alerts']: { push: !muted } } }, notifications: [{ id: 'family:event1', title: 'Private content', body: 'Private message', kind: digest ? 'community' : 'alerts', priority: 'routine', groupId: 'group1', read: false }] }) }) };
  const drain = vm.runInNewContext(policy + '\n' + source + '\ndrainPushQueue;', context);
  return { drain, sent, store, retry: () => { failing = false; update('notificationPushJobs/job1', { nextAttemptAt: clock }); } };
}
test('queue deduplicates concurrent workers and excludes unrelated accounts', async () => {
  const f = fixture();
  await Promise.all([f.drain(), f.drain()]);
  await f.drain();
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].token, 'fixture-token');
  assert.equal(f.sent[0].data.uid, 'alice');
  assert.equal(f.sent[0].data.body, 'Open SafeLink to view your message.');
});
test('muted category never reaches provider', async () => {
  const f = fixture({ muted: true }); await f.drain(); assert.equal(f.sent.length, 0);
});
test('provider failures remain retryable', async () => {
  const f = fixture({ fail: true }); await f.drain();
  assert.equal(f.sent.length, 0); assert.ok(f.store.get('notificationPushJobs/job1').nextAttemptAt);
  f.retry(); await f.drain(); assert.equal(f.sent.length, 1);
});
test('community jobs produce one digest per device per day', async () => {
  const f = fixture({ digest: true });
  f.store.set('notificationPushJobs/job2', { ...f.store.get('notificationPushJobs/job1') });
  await Promise.all([f.drain(), f.drain()]);
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].data.title, 'Your community digest');
});
