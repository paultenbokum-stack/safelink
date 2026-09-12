const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const policy = fs.readFileSync('src/lib/notification-policy.js', 'utf8').replace(/export /g, '');
const source = fs.readFileSync('src/lib/notifications.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const context = vm.createContext({ ...crypto, Date, Set, Map, Error, Promise });
vm.runInContext(policy + "\n" + source, context);
let clock = 100000000;
const records = new Map([
  ['households/guardian', { adminFirstName: 'Guardian', members: [{ id: 'child-member', linkedUid: 'child', name: 'Child' }, { id: 'sibling-member', linkedUid: 'sibling', name: 'Sibling' }, { id: 'not-joined', name: 'Not joined' }] }],
  ['familyMemberships/child', { guardianUid: 'guardian', memberId: 'child-member' }],
  ['familyMemberships/sibling', { guardianUid: 'guardian', memberId: 'sibling-member' }],
  ['notificationChannels/security-one', { name: 'Security One', kind: 'security', active: true, publisherUids: ['publisher'], householdIds: ['guardian'] }],
]);
const snapshot = path => ({ id: path.split('/').pop(), ref: doc(path), exists: records.has(path), data: () => structuredClone(records.get(path)) });
function doc(path) { return { path, get: async () => snapshot(path), collection: name => collection(`${path}/${name}`) }; }
function collection(path, filters = [], order = null, count = Infinity) {
  return {
    doc: id => doc(`${path}/${id}`),
    where: (key, op, value) => collection(path, [...filters, { key, op, value }], order, count),
    orderBy: (key, direction) => collection(path, filters, { key, direction }, count),
    limit: n => collection(path, filters, order, n),
    get: async () => {
      let list = [...records.keys()].filter(key => key.startsWith(path + '/') && key.slice(path.length + 1).indexOf('/') === -1).map(snapshot);
      list = list.filter(row => filters.every(f => f.op === 'array-contains' ? row.data()[f.key]?.includes(f.value) : row.data()[f.key] === f.value));
      if (order) list.sort((a, b) => (a.data()[order.key] - b.data()[order.key]) * (order.direction === 'desc' ? -1 : 1));
      return { docs: list.slice(0, count) };
    },
  };
}
let queue = Promise.resolve();
const firestore = { collection, getAll: async (...refs) => refs.map(ref => snapshot(ref.path)),
  batch: () => { const writes = []; return { set: (ref, data) => writes.push([ref.path, data]), commit: async () => { for (const [key, value] of writes) records.set(key, value); } }; },
  runTransaction: work => { const operation = queue.then(async () => { const writes = []; const result = await work({ get: ref => ref.get(), set: (ref, data) => writes.push([ref.path, data]) }); for (const [key, value] of writes) records.set(key, structuredClone(value)); return result; }); queue = operation.catch(() => {}); return operation; },
};
const service = context.notificationService({ firestore, now: () => clock });
const guardian = { uid: 'guardian' }, child = { uid: 'child', familyMember: true, guardianUid: 'guardian', familyMemberId: 'child-member' }, publisher = { uid: 'publisher' }, outsider = { uid: 'outsider' };
const message = (extra = {}) => ({ requestId: crypto.randomUUID(), title: 'Home safely', body: 'I am home.', recipientUid: 'all', ...extra });
(async () => {
  const original = message({ senderName: 'Fake security company', kind: 'security' });
  await service.send(guardian, original);
  let feed = await service.list(child);
  assert.equal(feed.unreadCount, 1); assert.equal(feed.notifications[0].senderName, 'Guardian'); assert.equal(feed.notifications[0].kind, 'family');
  assert.equal((await service.list(guardian)).unreadCount, 0, 'Sent copy must not create an unread badge');
  assert.equal((await service.list(outsider)).notifications.length, 0);
  assert.equal((await service.send(guardian, original)).duplicate, true);
  assert.equal((await service.list(child)).notifications.length, 1);
  await assert.rejects(service.send(guardian, { ...original, body: 'Changed' }), /different message/);
  await assert.rejects(service.send(guardian, message()), /wait a few seconds/);
  await assert.rejects(service.send(guardian, message({ recipientUid: 'outsider' })), /joined member/);
  await assert.rejects(service.send(guardian, message({ recipientUid: 'not-joined' })), /joined member/);
  const id = feed.notifications[0].id;
  await assert.rejects(service.markRead(outsider, [id]), /unavailable/);
  await service.markRead(child, [id]); assert.equal((await service.list(child)).unreadCount, 0);
  assert.equal((await service.list({ uid: 'sibling', familyMember: true, guardianUid: 'guardian', familyMemberId: 'sibling-member' })).unreadCount, 1);
  clock += 6000;
  await service.send(child, message({ recipientUid: 'guardian' }));
  assert.equal((await service.list(guardian)).unreadCount, 1);
  const bulletin = message({ channelId: 'security-one' });
  await assert.rejects(service.send(guardian, bulletin, true), /not authorised/);
  await assert.rejects(service.send(child, bulletin, true), /Only authorised/);
  await service.send(publisher, bulletin, true);
  assert.ok((await service.list(child)).notifications.some(item => item.kind === 'security' && item.senderName === 'Security One'));
  assert.equal((await service.list(outsider)).notifications.length, 0);
  assert.equal((await service.list(guardian)).publisherChannels.length, 0);
  assert.equal((await service.list(publisher)).publisherChannels.length, 1);
  assert.equal((await service.list(publisher)).notifications.length, 1, 'Publishers can review their posted update');
  records.get('households/guardian').members.push({ id: 'fake-member', linkedUid: 'outsider', name: 'Forged recipient' });
  await assert.rejects(service.send(guardian, message({ recipientUid: 'outsider' })), /joined member/);
  records.get('notificationChannels/security-one').active = false;
  assert.ok(!(await service.list(child)).notifications.some(item => item.kind === 'security'));
  await assert.rejects(service.send(publisher, message({ channelId: 'security-one' }), true), /not authorised/);
  records.get('households/guardian').members = [];
  await assert.rejects(service.list(child), /access has ended/);
  await assert.rejects(service.send(guardian, message({ body: 'a'.repeat(1001) })), /1,000/);
  for (let i = 0; i < 75; i++) records.set(`notificationInboxes/outsider/items/history${i}`, { title: `Message ${i}`, body: 'History', createdAt: clock + i, senderUid: 'another' });
  const firstPage = await service.list(outsider);
  assert.equal(firstPage.notifications.length, 50);
  assert.equal(firstPage.unreadCount, 75, 'Unread count includes older pages');
  assert.equal(firstPage.nextOffset, 50);
  const secondPage = await service.list(outsider, { offset: 50 });
  assert.equal(secondPage.notifications.length, 25);
  await service.markRead(outsider, [secondPage.notifications[0].id]);
  assert.equal((await service.list(outsider)).unreadCount, 74);
  records.set('notificationInboxes/outsider/items/emergency', { title: 'Emergency', body: 'Help', createdAt: 1, kind: 'alerts', priority: 'urgent' });
  let alertFeed = await service.list(outsider);
  assert.equal(alertFeed.notifications[0].title, 'Emergency', 'Unacknowledged urgent alerts precede newer routine messages');
  await service.markRead(outsider, ['family:emergency']);
  assert.equal((await service.list(outsider)).urgentCount, 1, 'Reading is not acknowledgement');
  await service.markRead(outsider, ['family:emergency'], true);
  assert.equal((await service.list(outsider)).urgentCount, 0);
  records.set('notificationReleases/release-one', { title: 'Release', body: 'New version', createdAt: clock });
  assert.ok((await service.list(outsider, { kind: 'updates' })).notifications.some(item => item.kind === 'updates'));
  await assert.rejects(service.send(guardian, message({ priority: 'urgent' })), /routine priority/);
  console.log('PASS: family-only delivery, invited-member replies, sender identity, isolated inboxes/read receipts, sent copies, idempotency, throttling, unjoined recipients, publisher authorisation, channel subscriptions, disabled channels, removed members and message limits.');
})().catch(error => { console.error(error); process.exitCode = 1; });
