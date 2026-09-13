const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const read = path => readFileSync(path, 'utf8');

test('unassigned customer surfaces use neutral SafeLink branding', () => {
  const manifest = JSON.parse(read('public/manifest.json'));
  assert.equal(manifest.name, 'SafeLink');

  for (const path of [
    'src/app/splash/page.js',
    'src/app/signup/page.js',
    'src/app/terms/page.js',
    'src/app/control-room/page.js',
  ]) {
    assert.doesNotMatch(read(path), /SB Security|Help24/i, path);
  }
});

test('backend fallbacks use an unconfigured SafeLink tenant', () => {
  const companyRoute = read('src/app/api/control-room/company/route.js');
  const dispatchRoute = read('src/app/api/sos/dispatch/route.js');
  assert.match(companyRoute, /safelink_default/);
  assert.match(companyRoute, /enabled: false/);
  assert.match(companyRoute, /status: 'not_configured'/);
  assert.match(dispatchRoute, /'safelink_default'/);
  assert.doesNotMatch(companyRoute, /help24_security/i);
  assert.doesNotMatch(dispatchRoute, /help24_security/i);
});

test('explicit SB partner login remains partner-specific', () => {
  assert.match(read('src/lib/adapters/mock-partner.js'), /partnerName = 'Security Brokers'/);
  assert.match(read('src/app/login/page.js'), /SB: \{ name: 'Security Brokers'/);
});
