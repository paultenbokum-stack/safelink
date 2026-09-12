import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createSubaccount, verifyBankAccount } from '@/lib/paystack-subaccounts';

/**
 * GET /api/cream/company-signup?token=xxx
 * Validate an invite token
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No invite token provided.' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const snap = await db.collection('companyInvites').doc(token).get();

    if (!snap.exists) {
      return NextResponse.json({ valid: false, error: 'Invite token not found.' }, { status: 404 });
    }

    const invite = snap.data();
    const expiresAt = invite.expiresAt?.toDate?.() || new Date(invite.expiresAt);
    if (Date.now() > expiresAt.getTime()) {
      return NextResponse.json({ valid: false, error: 'Invite token has expired.' }, { status: 410 });
    }

    if (invite.status === 'completed') {
      return NextResponse.json({ valid: false, error: 'Invite token has already been used.' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      companyName: invite.companyName,
      contactEmail: invite.contactEmail,
    });
  } catch (err) {
    console.error('[api/cream/company-signup] GET Error:', err);
    return NextResponse.json({ valid: false, error: 'Could not validate invite.' }, { status: 500 });
  }
}

/**
 * POST /api/cream/company-signup
 * Submit self-service security company registration
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      token,
      name,
      registrationNumber,
      psiraNumber,
      contactEmail,
      dispatchPhone,
      address,
      bankDetails,
      accountingProvider,
    } = body;

    if (!name || !registrationNumber || !contactEmail) {
      return NextResponse.json({ error: 'Company Name, Registration Number, and Contact Email are required.' }, { status: 400 });
    }

    const db = getAdminFirestore();

    // Verify token if provided
    if (token) {
      const inviteSnap = await db.collection('companyInvites').doc(token).get();
      if (inviteSnap.exists) {
        const invite = inviteSnap.data();
        if (invite.status === 'completed') {
          return NextResponse.json({ error: 'Invite token has already been used.' }, { status: 400 });
        }
      }
    }

    const companyId = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32);

    // Try creating Paystack subaccount if bank details provided
    let subaccountData = null;
    if (bankDetails?.bankCode && bankDetails?.accountNumber) {
      try {
        let verifiedName = null;
        try {
          const verified = await verifyBankAccount(bankDetails.accountNumber, bankDetails.bankCode);
          verifiedName = verified.accountName;
        } catch (e) {
          console.warn('Bank verification notice:', e.message);
        }

        const sub = await createSubaccount({
          businessName: name,
          settlementBank: bankDetails.bankCode,
          accountNumber: bankDetails.accountNumber,
          description: `SafeLink Settlement Subaccount for ${name}`,
        });
        subaccountData = {
          code: sub.subaccountCode,
          id: sub.subaccountId,
          accountName: verifiedName,
        };
      } catch (paystackErr) {
        console.warn('Paystack subaccount auto-creation notice:', paystackErr.message);
      }
    }

    const newCompany = {
      id: companyId,
      name,
      registrationNumber: registrationNumber || '',
      psiraNumber: psiraNumber || '',
      contactEmail,
      dispatchPhone: dispatchPhone || '',
      address: address || {},
      bankDetails: {
        ...(bankDetails || {}),
        accountName: subaccountData?.accountName || bankDetails?.accountName || '',
        verified: !!subaccountData?.accountName,
      },
      paystackSubaccountCode: subaccountData?.code || null,
      paystackSubaccountId: subaccountData?.id || null,
      accounting: {
        provider: accountingProvider || 'sage',
        status: 'pending_setup',
      },
      status: 'pending', // Pending review by CREAM admin
      memberCount: 0,
      deviceCount: 0,
      aura: { enabled: true, environment: 'staging' },
      cameraSystem: { defaultBrand: 'Hikvision', status: 'pending' },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('security_companies').doc(companyId).set(newCompany);

    if (token) {
      await db.collection('companyInvites').doc(token).update({
        status: 'completed',
        usedAt: FieldValue.serverTimestamp(),
        createdCompanyId: companyId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully. A CREAM administrator will review and activate your company account.',
      companyId,
    });
  } catch (err) {
    console.error('[api/cream/company-signup] POST Error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed.' }, { status: 500 });
  }
}
