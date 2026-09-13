import { managementAccessError } from '@/lib/management-auth';
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request) {
  const accessError = await managementAccessError(request);
  if (accessError) return accessError;
  try {
    const body = await request.json();
    const { companyId, provider, apiKey, clientId, companyIdParam, environment, endpoint } = body;

    const start = Date.now();

    // Check if company has an existing saved key if placeholder was passed
    let effectiveKey = apiKey;
    if (!effectiveKey || effectiveKey.includes('••••')) {
      try {
        const firestore = getAdminFirestore();
        const doc = await firestore.collection('security_companies').doc(companyId || 'safelink_default').get();
        if (doc.exists) {
          effectiveKey = doc.data()?.accounting?.apiKey || '';
        }
      } catch {}
    }

    const providerNames = {
      sage: 'Sage Business Cloud / Pastel Evolution',
      zoho: 'Zoho Books API',
      xero: 'Xero Accounting',
      quickbooks: 'Intuit QuickBooks Online',
      listener: 'Listener Security Control Room ERP',
      patriot: 'Patriot Alarm Monitoring & Billing',
      custom_api: 'Custom Webhook / REST Endpoint',
    };

    const friendlyName = providerNames[provider] || provider || 'Accounting Package';

    // Simulate connection ping / token verification
    await new Promise((resolve) => setTimeout(resolve, 350));
    const latencyMs = Date.now() - start;

    if (!effectiveKey && !clientId) {
      return NextResponse.json({
        success: false,
        error: `Please provide an API Key or Client ID for ${friendlyName} before testing.`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: `A live ${friendlyName} connector has not been configured. Credentials have not been verified and no accounts have been synced.`,
    }, { status: 501 });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Accounting verification failed.',
    }, { status: 500 });
  }
}
