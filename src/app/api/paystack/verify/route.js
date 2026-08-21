import { NextResponse } from 'next/server';
import {
  authenticateFirebaseRequest,
  getPaymentIntent,
  saveVerifiedPaidOrder,
} from '@/lib/firebase-admin';
import {
  CheckoutInputError,
  getPaystackSecret,
  normaliseEmail,
  validatePaystackTransaction,
} from '@/lib/paystack-checkout';

const MAX_BODY_BYTES = 24_576;
const REFERENCE_PATTERN = /^SL-[A-Z0-9]+-[A-F0-9]{12}$/;

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Verification request is too large.' }, { status: 413 });
    }

    const customer = await authenticateFirebaseRequest(request);
    const customerEmail = normaliseEmail(customer.email);
    const { reference } = await request.json();

    if (typeof reference !== 'string' || !REFERENCE_PATTERN.test(reference)) {
      return NextResponse.json({ error: 'Payment reference is invalid.' }, { status: 400 });
    }

    const paymentIntent = await getPaymentIntent(reference);
    if (!paymentIntent || paymentIntent.uid !== customer.uid || normaliseEmail(paymentIntent.email) !== customerEmail) {
      return NextResponse.json({ error: 'This payment does not match your checkout.' }, { status: 404 });
    }

    const secret = getPaystackSecret();
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      },
    );
    const paystack = await response.json().catch(() => null);
    const transaction = paystack?.data;

    if (!response.ok || !paystack?.status || transaction?.status !== 'success') {
      return NextResponse.json(
        { verified: false, error: 'Paystack has not confirmed this payment.' },
        { status: 400 },
      );
    }

    if (!validatePaystackTransaction(transaction, paymentIntent)) {
      console.error('Paystack verification mismatch for reference:', reference);
      return NextResponse.json(
        { verified: false, error: 'The confirmed payment does not match this order.' },
        { status: 409 },
      );
    }

    const { orderId, alreadyCreated } = await saveVerifiedPaidOrder({
      paymentIntent,
      transaction,
    });

    return NextResponse.json({
      verified: true,
      orderId,
      alreadyCreated,
      amount: paymentIntent.total,
      currency: paymentIntent.currency,
      reference,
    });
  } catch (error) {
    if (error?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Please sign in again before confirming payment.' }, { status: 401 });
    }
    if (error instanceof CheckoutInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });
    }

    console.error('Paystack verify error:', error);
    return NextResponse.json(
      { error: 'Payment confirmation is temporarily unavailable. Keep your Paystack reference and contact support if this persists.' },
      { status: 500 },
    );
  }
}
