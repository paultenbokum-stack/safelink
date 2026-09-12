import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { estimateFeeBreakdown } from '@/lib/paystack-subaccounts';

const CREAM_ADMINS = (process.env.CREAM_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
function isCreamAdmin(uid) { return CREAM_ADMINS.includes(uid); }

/**
 * GET /api/cream/company/[companyId]/revenue
 * Revenue breakdown with Paystack fee, CREAM 1%, and company share.
 */
export async function GET(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isCreamAdmin(user.uid)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const { companyId } = await params;
    const db = getAdminFirestore();

    const companyDoc = await db.collection('security_companies').doc(companyId).get();
    if (!companyDoc.exists) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });

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
      company: { id: companyId, name: companyDoc.data().name },
    });
  } catch (err) {
    console.error(`[api/cream/company/revenue] Error:`, err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load revenue.' }, { status: 500 });
  }
}
