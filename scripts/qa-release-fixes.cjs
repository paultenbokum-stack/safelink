const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const json = (body, options = {}) => ({ body, status: options.status || 200 });
function load(file, names, mocks = {}) {
  const source = readFileSync(file, 'utf8').replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/^export \{.*\};?\r?\n/gm, '').replace(/export (async function|function|class|const)/g, '$1');
  return vm.runInNewContext(source + '\n({' + names.join(',') + '});', { console: { warn(){}, error(){}, log(){} }, NextResponse: { json }, FieldValue: { serverTimestamp: () => 'now' }, ...mocks });
}
function location({ failed = false, revokeDuringUpload = false } = {}) {
  const records = new Map();
  const db = { collection: name => ({ doc: id => ({ key: `${name}/${id}`, get: async () => ({ exists: records.has(`${name}/${id}`), data: () => records.get(`${name}/${id}`) }) }), where: () => ({ get: async () => ({ empty: true }) }) }), batch: () => {
    const operations = [];
    return { set: (ref, data) => operations.push(() => records.set(ref.key, { ...records.get(ref.key), ...data })), delete: ref => operations.push(() => records.delete(ref.key)), commit: async () => { if (failed) throw Error('offline'); operations.forEach(fn => fn()); } };
  }, runTransaction: async fn => { if (failed) throw Error('offline'); if (revokeDuringUpload) records.set('phone_sharing_consent/alice', { consentGranted: false }); return fn({ get: ref => ref.get(), set: (ref, data) => records.set(ref.key, data) }); } };
  return { records, ...load('src/app/api/location/share/route.js', ['POST'], { authenticateFirebaseRequest: async () => ({ uid: 'alice' }), getAdminFirestore: () => db, timestampMillis: value => value || null, batteryPercent: value => value ?? null }) };
}
const request = body => ({ json: async () => body });
test('consent changes and report deletion commit together; uploads require persisted consent', async () => {
  const { POST, records } = location();
  assert.equal((await POST(request({ lat: 1, lng: 2 }))).status, 403);
  assert.equal((await POST(request({ action: 'opt_in' }))).status, 200);
  assert.equal((await POST(request({ lat: 1, lng: 2 }))).status, 200);
  assert.ok(records.has('device_locations/phone_alice'));
  assert.equal((await POST(request({ action: 'opt_out' }))).status, 200);
  assert.equal(records.has('device_locations/phone_alice'), false);
  assert.equal(records.get('devices/phone_alice').status, 'inactive');
});
test('failed opt-in, opt-out and report writes never claim success', async () => {
  const { POST, records } = location({ failed: true });
  for (const action of ['opt_in', 'opt_out']) assert.equal((await POST(request({ action }))).status, 503);
  assert.equal(records.size, 0);
  records.set('phone_sharing_consent/alice', { consentGranted: true });
  assert.equal((await POST(request({ lat: 1, lng: 2 }))).status, 503);
});
test('revocation between initial check and transaction blocks upload', async () => {
  const { POST, records } = location({ revokeDuringUpload: true });
  records.set('phone_sharing_consent/alice', { consentGranted: true });
  assert.equal((await POST(request({ lat: 1, lng: 2 }))).status, 403);
  assert.equal(records.has('device_locations/phone_alice'), false);
});
test('every management entry point blocks requests before database access', async () => {
  for (const route of ['control-room/company', 'control-room/incidents', 'control-room/aura-test', 'control-room/accounting-test', 'cream/companies']) {
    const source = readFileSync(`src/app/api/${route}/route.js`, 'utf8');
    const methods = ['GET', 'POST'].filter(name => source.includes(`export async function ${name}`));
    const handlers = load(`src/app/api/${route}/route.js`, methods, { managementAccessError: async () => json({ error: 'denied' }, { status: 403 }), getAdminFirestore: () => { throw Error('Must not access database'); } });
    for (const method of methods) assert.equal((await handlers[method]({})).status, 403, route);
  }
});
test('management permissions use server allowlist and verified auth', async () => {
  for (const [uid, expected] of [[null, 401], ['customer', 403], ['admin', null]]) {
    const { managementAccessError } = load('src/lib/management-auth.js', ['managementAccessError'], { process: { env: { CREAM_ADMIN_UIDS: 'admin' } }, authenticateFirebaseRequest: async () => { if (!uid) throw Error('UNAUTHENTICATED'); return { uid }; } });
    assert.equal((await managementAccessError({}))?.status || null, expected);
  }
});
test('neutral and unknown companies cannot inherit global response credentials', async () => {
  let reads = 0;
  const { getAuraConfigForCompany } = load('src/lib/aura.js', ['getAuraConfigForCompany'], { process: { env: { AURA_CLIENT_ID: 'global-id', AURA_CLIENT_SECRET: 'global-secret' } }, getAdminFirestore: () => ({ collection: () => ({ doc: () => ({ get: async () => { reads++; return { exists: false }; } }) }) }) });
  assert.equal((await getAuraConfigForCompany('safelink_default')).enabled, false);
  assert.equal(reads, 0);
  assert.equal((await getAuraConfigForCompany('missing')).clientSecret, '');
});
test('checkout initializes with canonical amount and server-owned company routing', async () => {
  const crypto = require('node:crypto');
  const products = load('src/lib/products.js', ['SENTINEL_PRODUCTS','MAX_ORDER_QUANTITY','VAT_RATE','getLinePriceBreakdown','roundCurrency']);
  const pricing = load('src/lib/paystack-checkout.js', ['buildCanonicalCheckout','normaliseDelivery','normaliseEmail','CheckoutInputError','getPaystackSecret','paystackMode'], { ...products, crypto, process: { env: { PAYSTACK_SECRET_KEY: 'sk_test_fixture' } } });
  let payload, intent;
  const { POST } = load('src/app/api/paystack/initialize/route.js', ['POST'], { ...pricing, crypto, AbortSignal,
    authenticateFirebaseRequest: async () => ({ uid: 'alice', email: 'alice@example.invalid' }),
    getAdminFirestore: () => ({ collection: name => ({ doc: id => ({ get: async () => ({ exists: true, data: () => name === 'households' ? { securityCompanyId: 'assigned' } : id === 'assigned' ? { paystackSubaccountCode: 'ACCT_assigned' } : {} }) }) }) }),
    savePaymentIntent: async value => { intent = value; }, fetch: async (url, options) => { payload = JSON.parse(options.body); return { ok: true, json: async () => ({ status: true, data: { access_code: 'fixture' } }) }; },
  });
  const cart = [{ id: products.SENTINEL_PRODUCTS[0].id, qty: 3, sellingPrice: 0.01 }];
  const delivery = { name: 'Alice Test', phone: '0820000000', addressLine1: '1 Test Road', suburb: 'Test', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4001' };
  const result = await POST({ headers: new Headers(), json: async () => ({ cart, delivery, companyId: 'attacker-selected' }) });
  assert.equal(result.status, 200);
  assert.equal(payload.amount, String(pricing.buildCanonicalCheckout(cart).amountSubunit));
  assert.equal(payload.subaccount, 'ACCT_assigned');
  assert.equal(intent.companyId, 'assigned');
});

test('email administration requires exact verified identity', () => {
  const { isManagementAdmin } = load('src/lib/management-auth.js', ['isManagementAdmin'], { process: { env: { CREAM_ADMIN_EMAILS: 'owner@example.invalid' } } });
  assert.equal(isManagementAdmin({ uid: 'one', email: 'owner@example.invalid', email_verified: false }), false);
  assert.equal(isManagementAdmin({ uid: 'one', email: 'other@example.invalid', email_verified: true }), false);
  assert.equal(isManagementAdmin({ uid: 'one', email: 'owner@example.invalid', email_verified: true }), true);
});
