import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';

const CREAM_ADMINS = (process.env.CREAM_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
function isCreamAdmin(uid) { return CREAM_ADMINS.includes(uid); }

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/**
 * GET /api/cream/metrics
 * Aggregated dashboard metrics across all security companies.
 */
export async function GET(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isCreamAdmin(user.uid)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const db = getAdminFirestore();
    const start = monthStart();

    // Fetch all non-demo companies
    const companiesSnap = await db.collection('security_companies').where('status', 'in', ['active', 'suspended']).get();
    const companies = companiesSnap.docs.filter(doc => !doc.data().isDemo).map(doc => ({ id: doc.id, ...doc.data() }));

    // Aggregate customers
    const householdsSnap = await db.collection('households').get();
    const allHouseholds = householdsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Aggregate orders
    const ordersSnap = await db.collection('orders').get();
    const allOrders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Aggregate incidents
    const incidentsSnap = await db.collection('incidents').get();
    const allIncidents = incidentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Build per-company metrics
    const companyMetrics = companies.map(company => {
      const customers = allHouseholds.filter(h => h.securityCompanyId === company.id);
      const activeCustomers = customers.filter(h => h.membershipStatus === 'active');
      const inactiveCustomers = customers.filter(h => h.membershipStatus !== 'active');

      const companyOrders = allOrders.filter(o => o.securityCompanyId === company.id);
      const monthlyOrders = companyOrders.filter(o => {
        const created = o.createdAt?.toDate?.() || (o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : new Date(o.createdAt));
        return created >= new Date(start);
      });

      const sentinelOrders = companyOrders.filter(o => o.items?.some(i => i.id?.startsWith('aura-') || i.id?.startsWith('sentinel-')));
      const monthlySentinel = monthlyOrders.filter(o => o.items?.some(i => i.id?.startsWith('aura-') || i.id?.startsWith('sentinel-')));
      const monthlyOtherHW = monthlyOrders.filter(o => o.items?.some(i => !i.id?.startsWith('aura-') && !i.id?.startsWith('sentinel-')));

      const companyIncidents = allIncidents.filter(i => i.securityCompanyId === company.id);
      const monthlyIncidents = companyIncidents.filter(i => {
        const created = i.createdAt?.toDate?.() || (i.createdAt?._seconds ? new Date(i.createdAt._seconds * 1000) : new Date(i.createdAt));
        return created >= new Date(start);
      });

      return {
        id: company.id,
        name: company.name,
        status: company.status,
        registrationNumber: company.registrationNumber || '',
        psiraNumber: company.psiraNumber || '',
        paystackSubaccountCode: company.paystackSubaccountCode || null,
        accounting: { provider: company.accounting?.provider || 'none' },
        totalCustomers: customers.length,
        activeCustomers: activeCustomers.length,
        inactiveCustomers: inactiveCustomers.length,
        totalIncidents: companyIncidents.length,
        monthlyIncidents: monthlyIncidents.length,
        totalSentinelSold: sentinelOrders.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + (i.qty || 1), 0) || 0), 0),
        monthlySentinelSold: monthlySentinel.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + (i.qty || 1), 0) || 0), 0),
        monthlyOtherHW: monthlyOtherHW.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + (i.qty || 1), 0) || 0), 0),
        monthlyRevenue: monthlyOrders.reduce((sum, o) => sum + (o.totalInclVat || o.total || 0), 0),
      };
    });

    // Global totals
    const totals = {
      totalCompanies: companies.length,
      totalCustomers: companyMetrics.reduce((s, c) => s + c.totalCustomers, 0),
      activeCustomers: companyMetrics.reduce((s, c) => s + c.activeCustomers, 0),
      inactiveCustomers: companyMetrics.reduce((s, c) => s + c.inactiveCustomers, 0),
      totalIncidents: companyMetrics.reduce((s, c) => s + c.totalIncidents, 0),
      monthlyIncidents: companyMetrics.reduce((s, c) => s + c.monthlyIncidents, 0),
      totalSentinelSold: companyMetrics.reduce((s, c) => s + c.totalSentinelSold, 0),
      monthlySentinelSold: companyMetrics.reduce((s, c) => s + c.monthlySentinelSold, 0),
      monthlyOtherHW: companyMetrics.reduce((s, c) => s + c.monthlyOtherHW, 0),
      monthlyRevenue: companyMetrics.reduce((s, c) => s + c.monthlyRevenue, 0),
    };
    totals.creamRevenue = Math.round(totals.monthlyRevenue * 0.01 * 100) / 100;

    return NextResponse.json({ totals, companies: companyMetrics, period: { start, end: new Date().toISOString() } });
  } catch (err) {
    console.error('[api/cream/metrics] Error:', err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load metrics.' }, { status: 500 });
  }
}
