const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/saffy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const base = process.env.QA_BASE || 'http://localhost:3087';
const uid = 'family_sarah_fixture';
const guardianUid = 'guardian_fixture';
const now = Math.floor(Date.now() / 1000);
const claims = { sub: uid, user_id: uid, aud: 'safelink-b8071', iss: 'https://securetoken.google.com/safelink-b8071', iat: now, exp: now + 3600,
  auth_time: now, familyMember: true, guardianUid, familyMemberId: 'member_sarah', familySessionVersion: 'fixture-version', firebase: { sign_in_provider: 'custom' } };
const token = [Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url'), Buffer.from(JSON.stringify(claims)).toString('base64url'), 'fixture'].join('.');
const account = { localId: uid, displayName: 'Sarah Saffy', customAttributes: JSON.stringify({ familyMember: true, guardianUid, familyMemberId: 'member_sarah', familySessionVersion: 'fixture-version' }),
  providerUserInfo: [], createdAt: String(Date.now()), lastLoginAt: String(Date.now()) };
const device = { id: 'device_980980820010318', imei: '980980820010318', nickname: "Kyle's pebble", model: 'Sentinel', status: 'active',
  lat: -29.48999, lng: 31.25021, updatedAt: new Date().toISOString(), batteryLevel: 52, checkedAt: Date.now(), isShared: true };

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await context.addInitScript(() => { localStorage.setItem('safelink_theme', 'light'); localStorage.setItem('popia_gps_consent', 'denied'); });
    await context.route('**/identitytoolkit.googleapis.com/**', route => route.fulfill({ json: route.request().url().includes('accounts:lookup')
      ? { users: [account] } : { ...account, idToken: token, refreshToken: 'fixture-refresh', expiresIn: '3600', registered: true } }));
    await context.route('**/securetoken.googleapis.com/**', route => route.fulfill({ json: { access_token: token, refresh_token: 'fixture-refresh', expires_in: '3600', user_id: uid } }));
    await context.route('**/firestore.googleapis.com/**', route => route.abort());
    await context.route('**/maps.googleapis.com/**', route => route.abort());
    await context.route(base + '/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/profile/setup') return route.fulfill({ json: { household: { adminFirstName: 'Sarah', adminLastName: 'Saffy', householdName: 'Saffy Home', onboardingCompleted: true } } });
      if (path === '/api/profile/avatar') return route.fulfill({ json: { avatarUrl: null } });
      if (path === '/api/devices') return route.fulfill({ json: { devices: [device], tracksolidResolved: true } });
      if (/^\/api\/devices\/\d{15}\/location$/.test(path)) return route.fulfill({ json: { ...device, gpsTime: device.updatedAt, isOnline: true } });
      if (path === '/api/location/share') return route.fulfill({ json: { locations: [
        { id: 'phone_guardian_fixture', uid: guardianUid, nickname: 'Kyle', lat: -29.49, lng: 31.25, isPhoneDevice: true, isOwn: false },
        { id: `phone_${uid}`, uid, nickname: 'Sarah Saffy', lat: -29.491, lng: 31.251, isPhoneDevice: true, isOwn: true },
      ], familyMembers: [
        { id: 'phone_guardian_fixture', uid: guardianUid, nickname: 'Kyle', sharingEnabled: true, visible: true, isOwn: false },
        { id: `phone_${uid}`, uid, nickname: 'Sarah Saffy', sharingEnabled: true, visible: true, isOwn: true },
      ] } });
      if (path === '/api/events') return route.fulfill({ json: { events: [] } });
      if (path === '/api/notifications') return route.fulfill({ json: { notifications: [], unreadCount: 0, urgentCount: 0, badgeCount: 0, preferences: {} } });
      if (path === '/api/app-version') return route.fulfill({ json: { version: 'family-fixture' } });
      return route.fulfill({ json: {} });
    });

    const page = await context.newPage();
    await page.goto(base + '/login');
    await page.getByPlaceholder('you@example.com').fill('family@example.invalid');
    await page.getByPlaceholder('Enter your password').fill('fixture-password');
    await page.locator('form button[type=submit]').click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('heading', { name: 'Hi Sarah', exact: true }).waitFor();
    await page.getByRole('button', { name: /SOS/ }).first().waitFor();
    await page.goto(base + '/map');
    await page.getByText("Kyle's pebble", { exact: true }).waitFor();
    await page.locator('summary').filter({ hasText: 'Map tools' }).click();
    await page.getByRole('button', { name: 'Live · 3 devices' }).click();
    await page.getByText('Sarah', { exact: true }).waitFor();
    await page.goto(base + '/devices');
    await page.getByText("Kyle's pebble", { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add Sentinel Device' }).count(), 0);
    await page.getByRole('button', { name: 'View on Family Map' }).waitFor();
    console.log('PASS: invited family members land on Home, retain the standard navigation, and can view family phones and shared Sentinel devices without management controls.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
