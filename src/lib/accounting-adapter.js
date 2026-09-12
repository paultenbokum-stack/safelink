import 'server-only';

/**
 * Accounting package adapter — normalises customer payment status from external ERPs.
 *
 * Each security company connects one accounting provider. The adapter returns a
 * standardised payment status per customer so the CREAM portal can display arrears.
 *
 * Supported providers (initial stubs — real API integration per provider required):
 *   - Sage Pastel / Business Cloud
 *   - Zoho Books
 *   - Xero
 *   - QuickBooks Online
 *   - Listener Security ERP
 *   - Patriot Alarm Monitoring
 *   - Custom REST API
 */

const PAYMENT_STATUSES = ['current', '30day', '60day', '90day', 'unknown'];

function classifyArrears(daysPastDue) {
  if (daysPastDue == null || daysPastDue < 0) return 'unknown';
  if (daysPastDue <= 0) return 'current';
  if (daysPastDue <= 30) return '30day';
  if (daysPastDue <= 60) return '60day';
  return '90day';
}

/**
 * Fetch customer payment statuses from the security company's accounting provider.
 * Returns an array of { externalId, name, email, status, daysPastDue, lastPaymentDate, amountOwed }.
 */
export async function syncCustomerStatus(company) {
  const provider = company.accounting?.provider;
  const credentials = company.accounting?.credentials || {};

  switch (provider) {
    case 'sage':
      return sageFetchCustomers(credentials, company.id);
    case 'zoho':
      return zohoFetchCustomers(credentials, company.id);
    case 'xero':
      return xeroFetchCustomers(credentials, company.id);
    case 'quickbooks':
      return quickbooksFetchCustomers(credentials, company.id);
    case 'listener':
      return listenerFetchCustomers(credentials, company.id);
    case 'patriot':
      return patriotFetchCustomers(credentials, company.id);
    case 'custom':
      return customApiFetchCustomers(credentials, company.id);
    default:
      return [];
  }
}

// ── Sage Pastel / Business Cloud ──
// API docs: https://accounting.sageone.co.za/api/2.0.0/
// Requires: API Key + Company ID
// Endpoint: GET /Customers → returns customer list with outstanding balances
async function sageFetchCustomers(credentials, companyId) {
  if (!credentials.apiKey || !credentials.companyId) {
    console.warn(`[accounting:sage] No credentials configured for company ${companyId}`);
    return [];
  }
  // TODO: Implement Sage API call
  // const response = await fetch(`https://accounting.sageone.co.za/api/2.0.0/Customers?CompanyId=${credentials.companyId}`, {
  //   headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  // });
  // const data = await response.json();
  // return data.Results.map(c => normaliseCustomer(c));
  console.info(`[accounting:sage] Stub — live sync requires Sage Business Cloud API credentials for company ${companyId}`);
  return [];
}

// ── Zoho Books ──
// API docs: https://www.zoho.com/books/api/v3/
// Requires: OAuth2 token + Organization ID
// Endpoint: GET /invoices?status=overdue
async function zohoFetchCustomers(credentials, companyId) {
  if (!credentials.accessToken || !credentials.organizationId) {
    console.warn(`[accounting:zoho] No credentials configured for company ${companyId}`);
    return [];
  }
  console.info(`[accounting:zoho] Stub — live sync requires Zoho Books OAuth2 token for company ${companyId}`);
  return [];
}

// ── Xero ──
// API docs: https://developer.xero.com/documentation/api/accounting
// Requires: OAuth2 token + Tenant ID
// Endpoint: GET /Invoices?where=Status=="AUTHORISED"&&AmountDue>0
async function xeroFetchCustomers(credentials, companyId) {
  if (!credentials.accessToken || !credentials.tenantId) {
    console.warn(`[accounting:xero] No credentials configured for company ${companyId}`);
    return [];
  }
  console.info(`[accounting:xero] Stub — live sync requires Xero OAuth2 token for company ${companyId}`);
  return [];
}

// ── QuickBooks Online ──
// API docs: https://developer.intuit.com/app/developer/qbo/docs/api
// Requires: OAuth2 token + Realm ID
async function quickbooksFetchCustomers(credentials, companyId) {
  if (!credentials.accessToken || !credentials.realmId) {
    console.warn(`[accounting:quickbooks] No credentials configured for company ${companyId}`);
    return [];
  }
  console.info(`[accounting:quickbooks] Stub — live sync requires QuickBooks OAuth2 token for company ${companyId}`);
  return [];
}

// ── Listener Security ERP ──
// South African security control room management platform
// Requires: API token + Headquarters ID
async function listenerFetchCustomers(credentials, companyId) {
  if (!credentials.apiToken || !credentials.headquartersId) {
    console.warn(`[accounting:listener] No credentials configured for company ${companyId}`);
    return [];
  }
  console.info(`[accounting:listener] Stub — live sync requires Listener ERP API token for company ${companyId}`);
  return [];
}

// ── Patriot Alarm Monitoring ──
// Requires: API credentials
async function patriotFetchCustomers(credentials, companyId) {
  if (!credentials.apiKey) {
    console.warn(`[accounting:patriot] No credentials configured for company ${companyId}`);
    return [];
  }
  console.info(`[accounting:patriot] Stub — live sync requires Patriot Systems API key for company ${companyId}`);
  return [];
}

// ── Custom REST API ──
// Security companies with in-house systems can point to their own endpoint.
// Expects JSON array: [{ id, name, email, daysPastDue, lastPaymentDate, amountOwed }]
async function customApiFetchCustomers(credentials, companyId) {
  if (!credentials.endpoint) {
    console.warn(`[accounting:custom] No endpoint configured for company ${companyId}`);
    return [];
  }
  try {
    const response = await fetch(credentials.endpoint, {
      headers: {
        'Authorization': credentials.apiKey ? `Bearer ${credentials.apiKey}` : '',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const customers = await response.json();
    if (!Array.isArray(customers)) throw new Error('Expected JSON array');
    return customers.map(c => ({
      externalId: String(c.id || ''),
      name: String(c.name || ''),
      email: String(c.email || ''),
      status: classifyArrears(Number(c.daysPastDue)),
      daysPastDue: Number(c.daysPastDue) || 0,
      lastPaymentDate: c.lastPaymentDate || null,
      amountOwed: Number(c.amountOwed) || 0,
    }));
  } catch (err) {
    console.error(`[accounting:custom] Sync failed for company ${companyId}:`, err.message);
    return [];
  }
}

export { PAYMENT_STATUSES, classifyArrears };
