import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, savePaymentIntent } from '@/lib/firebase-admin';
import {
  CheckoutInputError,
  buildCanonicalCheckout,
  getPaystackSecret,
  normaliseDelivery,
  normaliseEmail,
  paystackMode,
} from '@/lib/paystack-checkout';

const MAX_BODY_BYTES = 16_384;

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Checkout request is too large.' }, { status: 413 });
    }

    const customer = await authenticateFirebaseRequest(request);
    const email = normaliseEmail(customer.email);
    const { cart, delivery } = await request.json();
    const checkout = buildCanonicalCheckout(cart);
    const safeDelivery = normaliseDelivery(delivery);
    const secret = getPaystackSecret();
    const reference = `SL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    await savePaymentIntent({
      uid: customer.uid,
      email,
      reference,
      checkout,
      delivery: safeDelivery,
    });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: String(checkout.amountSubunit),
        currency: checkout.currency,
        reference,
        metadata: {
          safelink_checkout: true,
          safelink_user_id: customer.uid,
          cart_fingerprint: checkout.fingerprint,
          expected_amount_subunit: checkout.amountSubunit,
          items: checkout.items.map(({ id, name, qty }) => ({ id, name, qty })),
        },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    const paystack = await response.json().catch(() => null);
    if (!response.ok || !paystack?.status || !paystack.data?.access_code) {
      console.error('Paystack initialize rejected the checkout:', response.status, paystack?.message);
      return NextResponse.json(
        { error: 'The payment gateway could not start this payment. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      accessCode: paystack.data.access_code,
      reference,
      amount: checkout.total,
      currency: checkout.currency,
      mode: paystackMode(secret),
    });
  } catch (error) {
    if (error?.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Please sign in again before paying.' }, { status: 401 });
    }
    if (error instanceof CheckoutInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });
    }

    console.error('Paystack initialize error:', error);
    return NextResponse.json({ error: 'The payment gateway is temporarily unavailable.' }, { status: 500 });
  }
}
