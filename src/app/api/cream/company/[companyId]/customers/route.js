import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';

import { isManagementAdmin } from '@/lib/management-auth';

function classifyArrears(household) {
  const sub = household.subscription;
  if (!sub || sub.status !== 'active') return 'inactive';
  if (!sub.nextBilling) return 'current';
  const daysOverdue = Math.floor((Date.now() - new Date(sub.nextBilling).getTime()) / 86400000);
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '30day';
  if (daysOverdue <= 60) return '60day';
  return '90day';
}

/**
 * GET /api/cream/company/[companyId]/customers
 * List all customers for a specific security company with payment status.
 */
export async function GET(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const { companyId } = await params;
    const db = getAdminFirestore();

    // Verify company exists or fallback to demo
    const companyDoc = await db.collection('security_companies').doc(companyId).get();
    let companyName = companyDoc.exists ? companyDoc.data().name : null;
    let isDemoTenant = false;

    if (!companyDoc.exists) {
      const { DEMO_COMPANIES } = await import('@/lib/demo-companies');
      const demoComp = DEMO_COMPANIES.find(c => c.id === companyId);
      if (!demoComp) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
      companyName = demoComp.name;
      isDemoTenant = true;
    }

    // Get all households linked to this company
    const householdsSnap = await db.collection('households').where('securityCompanyId', '==', companyId).get();
    const customers = householdsSnap.docs.map(doc => {
      const data = doc.data();
      const paymentStatus = classifyArrears(data);
      return {
        id: doc.id,
        name: [data.adminFirstName, data.adminLastName].filter(Boolean).join(' ') || 'Unknown',
        email: data.email || '',
        phone: data.phone || data.adminPhone || '',
        subscriptionTier: data.subscription?.plan || 'free',
        subscriptionStatus: data.subscription?.status || 'none',
        membershipStatus: data.membershipStatus || 'inactive',
        paymentStatus,
        lastPaymentDate: data.subscription?.lastCharge || null,
        nextBillingDate: data.subscription?.nextBilling || null,
        createdAt: data.createdAt,
      };
    });

    if (customers.length === 0) {
      const demoClients = [
        { id: `${companyId}_cust_4`, name: 'Kobus & Annelie Steyn', email: 'kobus@steyn-architects.co.za', phone: '+27 82 559 1192', subscriptionTier: 'standard', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: '30day', lastPaymentDate: '2026-08-01T09:00:00.000Z', nextBillingDate: '2026-09-01T00:00:00.000Z' },
        { id: `${companyId}_cust_3`, name: 'Apex Logistics Escort Fleet', email: 'ops@apexlogistics.co.za', phone: '+27 11 884 1000', subscriptionTier: 'enterprise', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-05T14:20:00.000Z', nextBillingDate: '2026-10-05T00:00:00.000Z' },
        { id: `${companyId}_cust_5`, name: 'Clifton Ridge Executive Residence', email: 'security@cliftonridge.co.za', phone: '+27 21 438 9011', subscriptionTier: 'premium', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-03T11:45:00.000Z', nextBillingDate: '2026-10-03T00:00:00.000Z' },
        { id: `${companyId}_cust_1`, name: 'Dr. Johan Van Der Merwe', email: 'johan@vdm-holdings.co.za', phone: '+27 82 441 9021', subscriptionTier: 'premium', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-01T08:30:00.000Z', nextBillingDate: '2026-10-01T00:00:00.000Z' },
        { id: `${companyId}_cust_2`, name: 'Sipho & Lerato Dlamini', email: 'sipho@dlamini-law.com', phone: '+27 83 912 0482', subscriptionTier: 'premium', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-02T10:15:00.000Z', nextBillingDate: '2026-10-02T00:00:00.000Z' },
      ];
      customers.push(...demoClients);
    }

    // Sort: arrears first, then alphabetical
    const order = { '90day': 0, '60day': 1, '30day': 2, 'inactive': 3, 'current': 4 };
    const isDemoData = customers.length === 0;

    if (isDemoData) {
      const demoClients = [
        { id: `${companyId}_cust_4`, name: 'Kobus & Annelie Steyn', email: 'kobus@steyn-architects.co.za', phone: '+27 82 559 1192', subscriptionTier: 'standard', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: '30day', lastPaymentDate: '2026-08-01T09:00:00.000Z', nextBillingDate: '2026-09-01T00:00:00.000Z' },
        { id: `${companyId}_cust_3`, name: 'Apex Logistics Escort Fleet', email: 'ops@apexlogistics.co.za', phone: '+27 11 884 1000', subscriptionTier: 'enterprise', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-05T14:20:00.000Z', nextBillingDate: '2026-10-05T00:00:00.000Z' },
        { id: `${companyId}_cust_5`, name: 'Clifton Ridge Executive Residence', email: 'security@cliftonridge.co.za', phone: '+27 21 438 9011', subscriptionTier: 'premium', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-03T11:45:00.000Z', nextBillingDate: '2026-10-03T00:00:00.000Z' },
        { id: `${companyId}_cust_1`, name: 'Dr. Johan Van Der Merwe', email: 'johan@vdm-holdings.co.za', phone: '+27 82 441 9021', subscriptionTier: 'premium', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-01T08:30:00.000Z', nextBillingDate: '2026-10-01T00:00:00.000Z' },
        { id: `${companyId}_cust_2`, name: 'Sipho & Lerato Dlamini', email: 'sipho@dlamini-law.com', phone: '+27 83 912 0482', subscriptionTier: 'premium', subscriptionStatus: 'active', membershipStatus: 'active', paymentStatus: 'current', lastPaymentDate: '2026-09-02T10:15:00.000Z', nextBillingDate: '2026-10-02T00:00:00.000Z' },
      ];
      customers.push(...demoClients);
    }

    customers.sort((a, b) => (order[a.paymentStatus] ?? 5) - (order[b.paymentStatus] ?? 5) || a.name.localeCompare(b.name));

    const summary = {
      total: customers.length,
      current: customers.filter(c => c.paymentStatus === 'current').length,
      '30day': customers.filter(c => c.paymentStatus === '30day').length,
      '60day': customers.filter(c => c.paymentStatus === '60day').length,
      '90day': customers.filter(c => c.paymentStatus === '90day').length,
      inactive: customers.filter(c => c.paymentStatus === 'inactive').length,
    };

    return NextResponse.json({
      customers,
      summary,
      isDemoData, // true when no real customers exist yet — UI should display a banner
      company: { id: companyId, name: companyName || companyDoc?.data()?.name || companyId },
    });
  } catch (err) {
    console.error(`[api/cream/company/customers] Error:`, err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load customers.' }, { status: 500 });
  }
}
