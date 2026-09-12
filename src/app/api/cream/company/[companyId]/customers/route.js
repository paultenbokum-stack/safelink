import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';

const CREAM_ADMINS = (process.env.CREAM_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
function isCreamAdmin(uid) { return CREAM_ADMINS.includes(uid); }

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
    if (!isCreamAdmin(user.uid)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const { companyId } = await params;
    const db = getAdminFirestore();

    // Verify company exists
    const companyDoc = await db.collection('security_companies').doc(companyId).get();
    if (!companyDoc.exists) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });

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

    // Sort: arrears first, then alphabetical
    const order = { '90day': 0, '60day': 1, '30day': 2, 'inactive': 3, 'current': 4 };
    customers.sort((a, b) => (order[a.paymentStatus] ?? 5) - (order[b.paymentStatus] ?? 5) || a.name.localeCompare(b.name));

    const summary = {
      total: customers.length,
      current: customers.filter(c => c.paymentStatus === 'current').length,
      '30day': customers.filter(c => c.paymentStatus === '30day').length,
      '60day': customers.filter(c => c.paymentStatus === '60day').length,
      '90day': customers.filter(c => c.paymentStatus === '90day').length,
      inactive: customers.filter(c => c.paymentStatus === 'inactive').length,
    };

    return NextResponse.json({ customers, summary, company: { id: companyId, name: companyDoc.data().name } });
  } catch (err) {
    console.error(`[api/cream/company/customers] Error:`, err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load customers.' }, { status: 500 });
  }
}
