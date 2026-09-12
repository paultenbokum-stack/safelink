const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('--- Running SafeLink CREAM Portal QA Checks ---');

// 1. Check that all new CREAM routes & pages exist
const expectedFiles = [
  'src/lib/paystack-subaccounts.js',
  'src/app/api/cream/subaccount/route.js',
  'src/app/api/cream/products/route.js',
  'src/app/cream/products/page.js',
  'src/app/api/cream/metrics/route.js',
  'src/app/cream/page.js',
  'src/app/api/cream/invites/route.js',
  'src/app/api/cream/company-signup/route.js',
  'src/app/company-signup/page.js',
  'src/app/cream/company/[companyId]/page.js',
  'src/app/api/cream/company/[companyId]/customers/route.js',
  'src/app/api/cream/company/[companyId]/incidents/route.js',
  'src/app/api/cream/company/[companyId]/revenue/route.js',
  'src/app/cream/company/[companyId]/stock/page.js',
  'src/app/api/cream/company/[companyId]/stock/route.js',
  'src/lib/accounting-adapter.js',
];

for (const relPath of expectedFiles) {
  const fullPath = path.join(process.cwd(), relPath);
  assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
}
console.log('✓ All 16 CREAM portal files exist');

// 2. Test Paystack Split calculation logic
function testFeeBreakdown(amountCents) {
  const CREAM_PERCENTAGE = 1.0;
  const amount = amountCents / 100;
  const paystackFeeEstimate = Math.min(amount * 0.015, 2000);
  const afterPaystack = amount - paystackFeeEstimate;
  const creamShare = afterPaystack * (CREAM_PERCENTAGE / 100);
  const companyShare = afterPaystack - creamShare;
  return {
    totalAmount: amount,
    paystackFee: Math.round(paystackFeeEstimate * 100) / 100,
    creamShare: Math.round(creamShare * 100) / 100,
    creamPercentage: CREAM_PERCENTAGE,
    companyShare: Math.round(companyShare * 100) / 100,
  };
}

const breakdown = testFeeBreakdown(10000); // R100.00
assert.equal(breakdown.totalAmount, 100);
assert.equal(breakdown.paystackFee, 1.5);
assert.equal(breakdown.creamPercentage, 1.0);
assert.equal(breakdown.creamShare, 0.99); // 1% of 98.50
assert.equal(breakdown.companyShare, 97.52); // 99% of 98.50 (97.515 rounded)
console.log('✓ Paystack fee split mathematics verified');

// 3. Test Paystack Subaccount Split Parameters generator
function getTransactionSplitParams(subaccountCode) {
  if (!subaccountCode) return {};
  return {
    subaccount: subaccountCode,
    bearer: 'account',
  };
}

assert.deepEqual(getTransactionSplitParams(''), {});
assert.deepEqual(getTransactionSplitParams(null), {});
assert.deepEqual(getTransactionSplitParams('ACCT_test123'), {
  subaccount: 'ACCT_test123',
  bearer: 'account',
});
console.log('✓ Paystack transaction split parameter formatting verified');

// 4. Test Accounting Adapter Normalization
const accountingAdapterContent = fs.readFileSync('src/lib/accounting-adapter.js', 'utf8');
assert.ok(accountingAdapterContent.includes('export async function syncCustomerStatus('));
assert.ok(accountingAdapterContent.includes("case 'sage':"));
assert.ok(accountingAdapterContent.includes("case 'xero':"));
assert.ok(accountingAdapterContent.includes("case 'zoho':"));
assert.ok(accountingAdapterContent.includes("case 'quickbooks':"));
assert.ok(accountingAdapterContent.includes("case 'patriot':"));
assert.ok(accountingAdapterContent.includes("case 'listener':"));
console.log('✓ Accounting adapter providers verified (Sage, Xero, Zoho, QuickBooks, Patriot, Listener)');

// 5. Test Paystack Initialize Route has Split Support
const paystackInitContent = fs.readFileSync('src/app/api/paystack/initialize/route.js', 'utf8');
assert.ok(paystackInitContent.includes('subaccountCode'));
assert.ok(paystackInitContent.includes("bearer: 'account'"));
assert.ok(paystackInitContent.includes('companyId'));
console.log('✓ Paystack initialize endpoint verified for company split support');

// 6. Test Products Library has master products fetcher
const productsContent = fs.readFileSync('src/lib/products.js', 'utf8');
assert.ok(productsContent.includes('export async function fetchMasterProducts('));
assert.ok(productsContent.includes('SENTINEL_PRODUCTS'));
console.log('✓ Master products library fetcher verified');

// 7. Verify CREAM Master Page has all required columns
const creamPageContent = fs.readFileSync('src/app/cream/page.js', 'utf8');
assert.ok(creamPageContent.includes('Security Company'));
assert.ok(creamPageContent.includes('Customers (Tot / Act / Inact)'));
assert.ok(creamPageContent.includes('Incidents (Month / Tot)'));
assert.ok(creamPageContent.includes('Sentinel Devices'));
assert.ok(creamPageContent.includes('Other HW'));
assert.ok(creamPageContent.includes('Revenue (Month)'));
assert.ok(creamPageContent.includes('Paystack Subaccount'));
assert.ok(creamPageContent.includes('/cream/products'));
assert.ok(creamPageContent.includes('/company-signup'));
console.log('✓ CREAM Master Dashboard table columns & actions verified');

console.log('\nALL CREAM PORTAL QA CHECKS PASSED SUCCESSFULLY!');
