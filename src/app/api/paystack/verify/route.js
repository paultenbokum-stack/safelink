import { NextResponse } from 'next/server';

/**
 * POST /api/paystack/verify
 * Body: { reference: string }
 *
 * Verifies a Paystack payment server-side to prevent client-side spoofing.
 * The secret key must be stored as PAYSTACK_SECRET_KEY in your server env vars
 * (not prefixed with NEXT_PUBLIC_ so it never reaches the browser).
 */
export async function POST(request) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!data.status || data.data?.status !== 'success') {
      return NextResponse.json({ verified: false, message: data.message }, { status: 400 });
    }

    return NextResponse.json({
      verified: true,
      amount:   data.data.amount / 100, // Convert from kobo to ZAR
      reference: data.data.reference,
      email:    data.data.customer?.email,
    });
  } catch (err) {
    console.error('Paystack verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
