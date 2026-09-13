import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { createSubaccount, updateSubaccount, verifyBankAccount, listBanks, getSubaccount } from '@/lib/paystack-subaccounts';
import { FieldValue } from 'firebase-admin/firestore';

import { isManagementAdmin } from '@/lib/management-auth';

/**
 * POST /api/cream/subaccount
 * Actions: create, update, verify_bank, list_banks, get
 */
export async function POST(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const body = await request.json();
    const { action } = body;
    const db = getAdminFirestore();

    if (action === 'list_banks') {
      const banks = await listBanks();
      return NextResponse.json({ banks });
    }

    if (action === 'verify_bank') {
      const { accountNumber, bankCode } = body;
      const result = await verifyBankAccount(accountNumber, bankCode);
      return NextResponse.json({ verified: true, ...result });
    }

    if (action === 'create') {
      const { companyId, businessName, settlementBank, accountNumber } = body;
      if (!companyId || !businessName || !settlementBank || !accountNumber) {
        return NextResponse.json({ error: 'Company ID, business name, bank code, and account number are required.' }, { status: 400 });
      }

      // Verify the bank account first
      let accountName;
      try {
        const verification = await verifyBankAccount(accountNumber, settlementBank);
        accountName = verification.accountName;
      } catch (err) {
        return NextResponse.json({ error: `Bank verification failed: ${err.message}` }, { status: 400 });
      }

      // Create Paystack subaccount
      const subaccount = await createSubaccount({ businessName, settlementBank, accountNumber });

      // Update security company record
      await db.collection('security_companies').doc(companyId).update({
        paystackSubaccountCode: subaccount.subaccountCode,
        paystackSubaccountId: subaccount.subaccountId,
        bankDetails: { bankCode: settlementBank, accountNumber, accountName, verified: true, verifiedAt: Date.now() },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, subaccount, accountName });
    }

    if (action === 'update') {
      const { companyId, subaccountCode, updates } = body;
      if (!companyId || !subaccountCode) {
        return NextResponse.json({ error: 'Company ID and subaccount code are required.' }, { status: 400 });
      }

      if (updates.accountNumber && updates.settlementBank) {
        try { await verifyBankAccount(updates.accountNumber, updates.settlementBank); }
        catch (err) { return NextResponse.json({ error: `Bank verification failed: ${err.message}` }, { status: 400 }); }
      }

      const result = await updateSubaccount(subaccountCode, updates);

      await db.collection('security_companies').doc(companyId).update({
        ...(updates.accountNumber ? { 'bankDetails.accountNumber': updates.accountNumber } : {}),
        ...(updates.settlementBank ? { 'bankDetails.bankCode': updates.settlementBank } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, subaccount: result });
    }

    if (action === 'get') {
      const { subaccountCode } = body;
      if (!subaccountCode) return NextResponse.json({ error: 'Subaccount code is required.' }, { status: 400 });
      const result = await getSubaccount(subaccountCode);
      return NextResponse.json({ subaccount: result });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('[api/cream/subaccount] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: err.status || 500 });
  }
}
