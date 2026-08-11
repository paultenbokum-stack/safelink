/**
 * Paystack Subscription Webhook Handler
 *
 * Handles subscription lifecycle events from Paystack:
 *  - subscription.create  → activate membership
 *  - subscription.disable → deactivate membership
 *  - charge.success       → recurring charge confirmation
 *
 * Set the webhook URL in your Paystack dashboard:
 *   https://yourdomain.com/api/paystack/subscription
 *
 * Paystack signs every webhook with HMAC-SHA512 using your secret key.
 * We verify this signature before trusting the payload.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

function verifySignature(rawBody, signature) {
  if (!PAYSTACK_SECRET) return true; // skip in dev if secret not set
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

async function findHouseholdByEmail(email) {
  const q = query(collection(db, 'households'), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function updateHouseholdSubscription(uid, patch) {
  await updateDoc(doc(db, 'households', uid), {
    subscription: patch,
    membershipStatus: patch.status === 'active' ? 'active' : 'inactive',
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request) {
  const rawBody  = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const { event: eventType, data } = event;
  const customerEmail = data?.customer?.email;

  if (!customerEmail) {
    return NextResponse.json({ received: true });
  }

  const household = await findHouseholdByEmail(customerEmail);
  if (!household) {
    // Unknown customer — log but acknowledge to prevent Paystack retries
    console.warn('[webhook] No household found for email:', customerEmail);
    return NextResponse.json({ received: true });
  }

  switch (eventType) {
    case 'subscription.create': {
      await updateHouseholdSubscription(household.id, {
        status:          'active',
        plan:            data.plan?.interval === 'annually' ? 'annual' : 'monthly',
        paystackSubCode: data.subscription_code,
        startedAt:       data.createdAt,
        nextBilling:     data.next_payment_date,
        amount:          data.amount / 100,
      });
      break;
    }

    case 'subscription.disable':
    case 'subscription.not_renew': {
      await updateHouseholdSubscription(household.id, {
        status:   'cancelled',
        cancelledAt: new Date().toISOString(),
      });
      break;
    }

    case 'charge.success': {
      // Recurring charge — update next billing date
      if (data.metadata?.plan) {
        await updateHouseholdSubscription(household.id, {
          status:      'active',
          nextBilling: data.paid_at
            ? new Date(new Date(data.paid_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null,
          lastCharge:  data.paid_at,
          amount:      data.amount / 100,
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
