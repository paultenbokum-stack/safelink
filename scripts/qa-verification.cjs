const { test } = require('node:test');
const assert = require('node:assert/strict');
const helpers = import('../src/lib/verification-errors.js');

test('does not report success before the email provider accepts the request', async () => {
  const { requestVerificationEmail } = await helpers;
  const states = [];
  let accept;
  const response = new Promise(resolve => { accept = resolve; });
  const request = requestVerificationEmail({ uid: 'test-user' }, () => response, state => states.push(state));
  assert.deepEqual(states.map(s => s.status), ['sending']);
  accept();
  await request;
  assert.deepEqual(states.map(s => s.status), ['sending', 'sent']);
  assert.ok(states[1].retryAt > Date.now() + 59000);
});

test('failed sends remain failures and preserve the signed-in account', async () => {
  const { requestVerificationEmail } = await helpers;
  for (const code of ['auth/network-request-failed', 'auth/too-many-requests', 'auth/quota-exceeded', 'auth/user-token-expired', 'auth/operation-not-allowed']) {
    const account = { uid: 'test-user', emailVerified: false };
    const states = [];
    const failure = Object.assign(new Error('provider failure'), { code });
    await assert.rejects(requestVerificationEmail(account, async () => { throw failure; }, state => states.push(state)), failure);
    assert.deepEqual(states.map(s => s.status), ['sending', 'error']);
    assert.equal(account.emailVerified, false);
    assert.ok(states[1].message.length > 0);
    assert.equal(states[1].retryAt > Date.now(), code === 'auth/too-many-requests');
  }
});

test('a signed-out request never calls the email service or reports success', async () => {
  const { requestVerificationEmail } = await helpers;
  await assert.rejects(requestVerificationEmail(null, () => assert.fail('Unexpected send'), () => assert.fail('Unexpected status')), /sign in again/);
});
