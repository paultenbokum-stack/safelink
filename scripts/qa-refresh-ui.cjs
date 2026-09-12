const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/saffy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.QA_BASE || 'http://localhost:3081';
const uid = 'local-ui-fixture';
const email = 'local-ui-fixture@example.invalid';
const now = Math.floor(Date.now() / 1000);
const token = [Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: uid, user_id: uid, aud: 'safelink-b8071', iss: 'https://securetoken.google.com/safelink-b8071', iat: now, exp: now + 3600, auth_time: now, email, email_verified: true, firebase: { sign_in_provider: 'password' } })).toString('base64url'), 'fixture'].join('.');
const account = { localId: uid, email, emailVerified: true, displayName: 'Kyle', providerUserInfo: [{ providerId: 'password', email, federatedId: email, rawId: email }], createdAt: String(Date.now()), lastLoginAt: String(Date.now()) };
const preferences = { categories: Object.fromEntries(['alerts', 'family', 'community', 'security', 'updates'].map(kind => [kind, { push: kind === 'alerts', badge: true }])), quietHours: { enabled: false, start: '22:00', end: '07:00', timeZone: 'Africa/Johannesburg' }, communityDigest: true, digestHour: 18, previews: false };
const device = { id: 'tracker-fixture', imei: '123456789012345', nickname: 'Kyle’s tracker', model: 'Sentinel', status: 'active', lat: -29.48999, lng: 31.25021, updatedAt: new Date(Date.now() - 360000).toISOString(), batteryLevel: 0, checkedAt: Date.now() };
const notification = { id: 'family:fixture', title: 'Family safety alert', body: 'A local test notification.', priority: 'urgent', kind: 'alerts', groupId: 'test', senderName: 'SafeLink', createdAt: Date.now(), read: false, acknowledged: false };
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', permissions: ['geolocation'], geolocation: { latitude: -29.48999, longitude: 31.25021 } });
    await context.addInitScript(() => { localStorage.setItem('safelink_theme', 'light'); localStorage.setItem('popia_gps_consent', 'denied'); localStorage.setItem('safelink_account_uid', 'local-ui-fixture'); localStorage.setItem('safelink_pwa_dismissed', String(Date.now() + 86400000)); });
    await context.route('**/identitytoolkit.googleapis.com/**', route => route.fulfill({ json: route.request().url().includes('accounts:lookup') ? { users: [account] } : { ...account, idToken: token, refreshToken: 'fixture-refresh', expiresIn: '3600', registered: true } }));
    await context.route('**/securetoken.googleapis.com/**', route => route.fulfill({ json: { access_token: token, refresh_token: 'fixture-refresh', expires_in: '3600', user_id: uid } }));
    await context.route('**/firestore.googleapis.com/**', route => route.abort());
    await context.route('**/maps.googleapis.com/**', route => route.abort());
    let requests = 0, versionRequests = 0, savedPreferences = null;
    const version = await fetch(base + '/api/app-version').then(response => response.json());
    await context.route(base + '/api/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname;
      if (path === '/api/app-version') { versionRequests++; return route.fulfill({ json: version }); }
      if (path === '/api/profile/setup') return route.fulfill({ json: { household: { adminFirstName: 'Kyle', adminLastName: 'Fixture', householdName: 'Saffy Home', members: [], subscription: { tier: 'premium' } } } });
      if (path === '/api/profile/avatar') return route.fulfill({ json: { avatarUrl: null } });
      if (path === '/api/devices') { requests++; return route.fulfill({ json: { devices: [device], tracksolidResolved: true } }); }
      if (path.includes('/location') && path.startsWith('/api/devices/')) { requests++; return route.fulfill({ json: { ...device, gpsTime: device.updatedAt, isOnline: true } }); }
      if (path === '/api/location/share') return route.fulfill({ json: { locations: [], success: true } });
      if (path === '/api/notifications/settings') { savedPreferences = request.postDataJSON()?.preferences; return route.fulfill({ json: { success: true } }); }
      if (path === '/api/notifications') {
        if (request.method() === 'PATCH') { notification.read = true; notification.acknowledged = request.postDataJSON().acknowledge === true; }
        return route.fulfill({ json: { notifications: [notification], unreadCount: notification.read ? 0 : 1, urgentCount: notification.acknowledged ? 0 : 1, badgeCount: 1, nextOffset: null, preferences: savedPreferences || preferences, recipients: [{ uid: 'family-fixture', name: 'Family' }], publisherChannels: [] } });
      }
      return route.fulfill({ json: { events: [], geofences: [] } });
    });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/login');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill('Local-fixture-123!');
    await page.locator('form button[type=submit]').click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('heading', { name: 'Hi Kyle', exact: true }).waitFor();
    const header = page.locator('header');
    assert.equal(await header.getByRole('button').count(), 2);
    assert.equal(await header.boundingBox().then(box => box.y), 0);
    assert.equal(await page.getByRole('switch').count(), 0);
    const before = requests;
    await page.getByRole('button', { name: 'Refresh data and check for app updates' }).click();
    await page.getByText('Refresh completed.', { exact: false }).waitFor();
    assert.ok(requests > before); assert.ok(versionRequests > 0);
    await page.getByRole('button', { name: 'Dismiss refresh status' }).click();
    fs.mkdirSync('.vercel/qa-refresh', { recursive: true });
    await page.screenshot({ path: '.vercel/qa-refresh/dashboard-light.png' });
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.screenshot({ path: '.vercel/qa-refresh/dashboard-dark.png' });
    await page.goto(base + '/devices');
    await page.getByText('Last reported 6 min ago', { exact: false }).waitFor();
    await page.getByText('Battery 0%', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Refresh Kyle’s tracker', exact: true }).click();
    await page.screenshot({ path: '.vercel/qa-refresh/devices.png', fullPage: true });
    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No horizontal overflow at ${width}px`);
      const title = await header.locator('h1').boundingBox(), button = await header.getByRole('button', { name: /Switch to/ }).boundingBox();
      assert.ok(title.x + title.width <= button.x, 'Header title does not overlap controls');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/map');
    await page.getByRole('button', { name: 'Expand device list' }).click();
    await page.getByText('Battery 0%', { exact: true }).waitFor();
    await page.screenshot({ path: '.vercel/qa-refresh/map.png' });
    await page.goto(base + '/notifications');
    await page.getByText('Family safety alert', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Acknowledge alert' }).click();
    await page.getByText('Acknowledged · this does not cancel a response').waitFor();
    await page.getByText('Notification settings', { exact: true }).click();
    await page.getByRole('checkbox', { name: 'Community push', exact: true }).check();
    await page.getByRole('button', { name: 'Save preferences' }).click();
    await page.getByText('Preferences saved.', { exact: true }).waitFor();
    assert.equal(savedPreferences.categories.community.push, true);
    await page.screenshot({ path: '.vercel/qa-refresh/notifications.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: isolated mocked sign-in, compact header, themes, global/device refresh, zero battery, stale report, 320/360/390px layout, map telemetry, acknowledgement and saved preferences.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
