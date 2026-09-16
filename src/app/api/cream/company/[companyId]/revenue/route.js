import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { estimateFeeBreakdown } from '@/lib/paystack-subaccounts';

import { isManagementAdmin } from '@/lib/management-auth';

/**
 * GET /api/cream/company/[companyId]/revenue
 * Revenue breakdown with Paystack fee, CREAM 1%, and company share.
 */
export async function GET(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const { companyId } = await params;
    const db = getAdminFirestore();

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

    // Get all paid orders for this company
    const ordersSnap = await db.collection('orders')
      .where('securityCompanyId', '==', companyId)
      .where('status', '==', 'paid')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const transactions = ordersSnap.docs.map(doc => {
      const data = doc.data();
      const totalCents = Math.round((data.totalInclVat || data.total || 0) * 100);
      const breakdown = estimateFeeBreakdown(totalCents);
      const created = data.createdAt?.toDate?.() || (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : new Date(data.createdAt));

      return {
        id: doc.id,
        reference: data.paystackReference || doc.id,
        customerName: data.customerName || data.email || '',
        items: (data.items || []).map(i => ({ name: i.name, qty: i.qty, price: i.totalInclVat || i.price })),
        totalAmount: breakdown.totalAmount,
        paystackFee: data.paystackSplit?.paystackFee || breakdown.paystackFee,
        creamShare: data.paystackSplit?.creamShare || breakdown.creamShare,
        companyShare: data.paystackSplit?.subaccountShare || breakdown.companyShare,
        createdAt: created.toISOString(),
      };
    });

    if ((isDemoTenant || companyId === 'sovereign_intervention') && transactions.length === 0) {
      const demoTransactions = [
        { id: 'sov_tx_1', reference: 'PSK_SOV_991823', customerName: 'Apex Logistics Escort Fleet', items: [{ name: 'Executive Close Protection & Mobile Panic Fob Suite', qty: 10, price: 14500 }], totalAmount: 14500, paystackFee: 217.50, creamShare: 142.83, companyShare: 14139.67, createdAt: '2026-09-05T14:20:00.000Z' },
        { id: 'sov_tx_2', reference: 'PSK_SOV_991824', customerName: 'Dr. Johan Van Der Merwe', items: [{ name: 'Sentinel LTE Asset Tag & VIP Dispatch Plan', qty: 2, price: 1780 }], totalAmount: 1780, paystackFee: 26.70, creamShare: 17.53, companyShare: 1735.77, createdAt: '2026-09-01T08:30:00.000Z' },
        { id: 'sov_tx_3', reference: 'PSK_SOV_991825', customerName: 'Clifton Ridge Executive Residence', items: [{ name: 'SafeLink Premium Armed Escort Membership', qty: 1, price: 890 }], totalAmount: 890, paystackFee: 13.35, creamShare: 8.77, companyShare: 867.88, createdAt: '2026-09-03T11:45:00.000Z' },
        { id: 'sov_tx_4', reference: 'PSK_SOV_991826', customerName: 'Sipho & Lerato Dlamini', items: [{ name: 'Family Shield Multi-Fob Subscription', qty: 1, price: 890 }], totalAmount: 890, paystackFee: 13.35, creamShare: 8.77, companyShare: 867.88, createdAt: '2026-09-02T10:15:00.000Z' },
      ];
      transactions.push(...demoTransactions);
    }

    // Summary
    const totalRevenue = transactions.reduce((s, t) => s + t.totalAmount, 0);
    const totalPaystackFees = transactions.reduce((s, t) => s + t.paystackFee, 0);
    const totalCreamShare = transactions.reduce((s, t) => s + t.creamShare, 0);
    const totalCompanyShare = transactions.reduce((s, t) => s + t.companyShare, 0);

    // Monthly breakdown
    const monthlyMap = {};
    for (const t of transactions) {
      const month = t.createdAt.substring(0, 7); // YYYY-MM
      if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, paystackFees: 0, creamShare: 0, companyShare: 0, count: 0 };
      monthlyMap[month].revenue += t.totalAmount;
      monthlyMap[month].paystackFees += t.paystackFee;
      monthlyMap[month].creamShare += t.creamShare;
      monthlyMap[month].companyShare += t.companyShare;
      monthlyMap[month].count++;
    }
    const monthly = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));

    return NextResponse.json({
      transactions,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPaystackFees: Math.round(totalPaystackFees * 100) / 100,
        totalCreamShare: Math.round(totalCreamShare * 100) / 100,
        totalCompanyShare: Math.round(totalCompanyShare * 100) / 100,
        transactionCount: transactions.length,
      },
      monthly,
      company: { id: companyId, name: companyName || companyDoc?.data()?.name || companyId },
    });
  } catch (err) {
    console.error(`[api/cream/company/revenue] Error:`, err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load revenue.' }, { status: 500 });
  }
}
