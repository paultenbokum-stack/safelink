import 'server-only';

/**
 * Paystack Subaccounts — split payment utilities for CREAM multi-tenant model.
 *
 * Money flow per transaction:
 *   Customer pays → Paystack deducts processing fee → 1% to CREAM → 99% to security company
 *
 * Uses Paystack Subaccount API:
 *   https://paystack.com/docs/api/subaccount/
 */

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const CREAM_PERCENTAGE = 1.0; // CREAM takes 1% of every transaction

async function paystackRequest(method, path, body) {
  if (!PAYSTACK_SECRET) throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  const response = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok || data.status === false) {
    throw Object.assign(new Error(data.message || 'Paystack request failed.'), { status: response.status, paystackData: data });
  }
  return data;
}

import { SA_BANKS } from './banks';
export { SA_BANKS };

/**
 * Fetch full bank list from Paystack (cached in-memory for 24h).
 */
let bankListCache = { data: null, fetchedAt: 0 };
export async function listBanks() {
  if (bankListCache.data && Date.now() - bankListCache.fetchedAt < 86400000) return bankListCache.data;
  const result = await paystackRequest('GET', '/bank?country=south_africa&perPage=100');
  bankListCache = { data: result.data, fetchedAt: Date.now() };
  return result.data;
}

/**
 * Verify a bank account number resolves to a real account.
 * Returns the account name if valid.
 */
export async function verifyBankAccount(accountNumber, bankCode) {
  if (!accountNumber || !bankCode) throw new Error('Account number and bank code are required.');
  const result = await paystackRequest('GET', `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`);
  return { accountName: result.data.account_name, accountNumber: result.data.account_number, bankId: result.data.bank_id };
}

/**
 * Create a Paystack subaccount for a security company.
 * percentage_charge = CREAM's 1% commission. The remainder settles to the company's bank.
 */
export async function createSubaccount({ businessName, settlementBank, accountNumber, description }) {
  if (!businessName || !settlementBank || !accountNumber) {
    throw new Error('Business name, bank code, and account number are required to create a subaccount.');
  }
  const result = await paystackRequest('POST', '/subaccount', {
    business_name: businessName,
    settlement_bank: settlementBank,
    account_number: accountNumber,
    percentage_charge: CREAM_PERCENTAGE,
    description: description || `SafeLink settlement for ${businessName}`,
  });
  return {
    subaccountCode: result.data.subaccount_code,
    subaccountId: result.data.id,
    businessName: result.data.business_name,
    percentageCharge: result.data.percentage_charge,
    settlementBank: result.data.settlement_bank,
    accountNumber: result.data.account_number,
  };
}

/**
 * Update an existing Paystack subaccount (e.g. bank details change).
 */
export async function updateSubaccount(subaccountCodeOrId, updates) {
  const body = {};
  if (updates.businessName) body.business_name = updates.businessName;
  if (updates.settlementBank) body.settlement_bank = updates.settlementBank;
  if (updates.accountNumber) body.account_number = updates.accountNumber;
  if (updates.description) body.description = updates.description;
  if (typeof updates.percentageCharge === 'number') body.percentage_charge = updates.percentageCharge;
  const result = await paystackRequest('PUT', `/subaccount/${encodeURIComponent(subaccountCodeOrId)}`, body);
  return result.data;
}

/**
 * Fetch details of a subaccount.
 */
export async function getSubaccount(subaccountCodeOrId) {
  const result = await paystackRequest('GET', `/subaccount/${encodeURIComponent(subaccountCodeOrId)}`);
  return result.data;
}

/**
 * Get the transaction split parameters for a security company.
 * Pass these into the Paystack transaction initialisation call.
 *
 * bearer = "account" → Paystack fees come from CREAM's share (not the company's).
 */
export function getTransactionSplitParams(subaccountCode) {
  if (!subaccountCode) return {};
  return {
    subaccount: subaccountCode,
    bearer: 'account',
  };
}

/**
 * Calculate the fee breakdown for a given transaction amount (in kobo/cents).
 * Returns approximate values — actual Paystack fee depends on payment method.
 */
export function estimateFeeBreakdown(amountCents) {
  const amount = amountCents / 100;
  // Paystack local card: 1.5% + R0 (capped at R2,000 for transactions over R2,500)
  // International: 3.9% + R5.50
  // Using local card estimate for SA
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
