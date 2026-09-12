const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = ['src/lib/notification-policy.js', 'src/lib/telemetry.js'].map(path => fs.readFileSync(path, 'utf8').replace(/export /g, '')).join('\n');
const api = vm.runInNewContext(source + '\n({ normalizePreferences, deliveryPolicy, countsForBadge, timestampMillis, batteryPercent, relativeTime });');
test('quiet hours, timezone, urgent preference and daily community digest', () => {
  const prefs = api.normalizePreferences({ categories: { community: { push: true }, alerts: { push: true } }, quietHours: { enabled: true, start: '22:00', end: '07:00', timeZone: 'Africa/Johannesburg' } });
  const night = Date.parse('2026-09-12T21:00:00Z');
  assert.equal(api.deliveryPolicy({ kind: 'alerts', priority: 'important' }, prefs, night), 'defer');
  assert.equal(api.deliveryPolicy({ kind: 'alerts', priority: 'urgent' }, prefs, night), 'send');
  prefs.categories.alerts.push = false;
  assert.equal(api.deliveryPolicy({ kind: 'alerts', priority: 'urgent' }, prefs, night), 'muted');
  assert.equal(api.deliveryPolicy({ kind: 'community', priority: 'routine' }, prefs, Date.parse('2026-09-12T10:00:00Z')), 'defer');
  assert.equal(api.deliveryPolicy({ kind: 'community', priority: 'routine' }, prefs, Date.parse('2026-09-12T16:00:00Z')), 'digest');
  assert.equal(api.deliveryPolicy({ kind: 'updates', priority: 'important' }, {}, night), 'muted');
  assert.equal(api.normalizePreferences({ quietHours: { timeZone: 'invalid-zone', start: '29:99' } }).quietHours.timeZone, 'Africa/Johannesburg');
});
test('badges respect categories but include urgent unread alerts', () => {
  assert.equal(api.countsForBadge({ kind: 'community', priority: 'routine', read: false }, {}), false);
  assert.equal(api.countsForBadge({ kind: 'community', priority: 'urgent', read: false }, {}), true);
  assert.equal(api.countsForBadge({ kind: 'alerts', priority: 'urgent', read: true }, {}), false);
});
test('battery zero, invalid readings and true telemetry timestamps', () => {
  assert.equal(api.batteryPercent(0), 0);
  for (const value of [null, undefined, '', -1, 101, 'unknown']) assert.equal(api.batteryPercent(value), null);
  assert.equal(api.timestampMillis({ _seconds: 1700000000 }), 1700000000000);
  assert.equal(api.timestampMillis('Connected'), null);
  assert.equal(api.timestampMillis('2026-09-12 10:00:00'), Date.parse('2026-09-12T10:00:00Z'));
  assert.equal(api.timestampMillis('1700000000000'), 1700000000000);
  assert.equal(api.relativeTime(1700000000000, 1700000360000), '6 min ago');
});
function worker() {
  const handlers = {}, cached = new Map(), writes = [];
  const context = { URL, Response, Promise, fetch: async () => new Response('fresh'), caches: {
    match: async request => cached.get(typeof request === 'string' ? request : request.url),
    open: async () => ({ addAll: async () => {}, keys: async () => [], put: async (request, response) => { writes.push(request.url); cached.set(request.url, response); } }),
  }, self: { location: { origin: 'https://safelink.test' }, addEventListener: (name, fn) => { handlers[name] = fn; } } };
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), context);
  const request = (path, options = {}) => {
    let response;
    handlers.fetch({ request: { method: 'GET', mode: 'cors', headers: new Headers(), url: new URL(path, 'https://safelink.test').href, ...options }, respondWith: promise => { response = promise; } });
    return response;
  };
  return { request, writes, cached, context };
}
test('worker never caches live API, RSC, cross-origin or account navigation', async () => {
  const sw = worker();
  for (const path of ['/api/devices', '/api/app-version', '/dashboard?_rsc=123', 'https://other.test/file.js']) assert.equal(sw.request(path), undefined);
  assert.equal(sw.request('/dashboard', { headers: new Headers({ RSC: '1' }) }), undefined);
  await sw.request('/dashboard', { mode: 'navigate' });
  assert.deepEqual(sw.writes, []);
  await sw.request('/_next/static/chunk-hash.js');
  assert.equal(sw.writes.length, 1);
  sw.context.fetch = async () => { throw new Error('offline'); };
  sw.cached.set('/offline.html', new Response('Reconnect to SafeLink'));
  assert.equal(await (await sw.request('/dashboard', { mode: 'navigate' })).text(), 'Reconnect to SafeLink');
});
