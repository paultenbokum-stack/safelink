/**
 * POST /api/webhooks/paystack — Paystack webhook receiver.
 *
 * Handles subscription events:
 * - charge.success (initial payment + recurring)
 * - subscription.create
 * - subscription.disable (cancellation)
 * - invoice.payment_failed
 *
 * Verifies webhook signature using Paystack secret key.
 */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

/**
 * Verify Paystack webhook signature.
 */
function verifyPaystackSignature(body, signature) {
  if (!PAYSTACK_SECRET) {
    console.warn('[webhook/paystack] No secret key configured — skipping verification');
    return true; // Allow in dev
  }
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(body)
    .digest('hex');
  return hash === signature;
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';

    // Verify webhook authenticity
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.error('[webhook/paystack] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { event, data } = JSON.parse(rawBody);
    const firestore = getAdminFirestore();

    console.log(`[webhook/paystack] Event: ${event}`, data?.reference || data?.subscription_code || '');

    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(firestore, data);
        break;

      case 'subscription.create':
        await handleSubscriptionCreate(firestore, data);
        break;

      case 'subscription.not_renew':
      case 'subscription.disable':
        await handleSubscriptionCancel(firestore, data);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(firestore, data);
        break;

      default:
        console.log(`[webhook/paystack] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/paystack] Error:', err);
    return NextResponse.json({ received: true, error: err.message });
  }
}

/**
 * Handle successful charge — initial subscription payment or renewal.
 */
async function handleChargeSuccess(firestore, data) {
  const { reference, customer, plan, metadata } = data;
  const uid = metadata?.uid || customer?.metadata?.uid;

  if (!uid) {
    console.warn('[webhook/paystack] charge.success missing uid in metadata');
    return;
  }

  // Determine tier from plan code
  const tier = determineTierFromPlan(plan?.plan_code || data.plan_code);

  // Update household subscription status
  await firestore.collection('households').doc(uid).set({
    subscription: {
      status: 'active',
      tier,
      planCode: plan?.plan_code || data.plan_code || null,
      subscriptionCode: data.subscription_code || null,
      customerCode: customer?.customer_code || null,
      lastPaymentRef: reference,
      lastPaymentDate: data.paid_at || new Date().toISOString(),
      amountPaid: data.amount, // In kobo/cents
      currency: data.currency || 'ZAR',
    },
    membershipStatus: 'active',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Log payment event
  await firestore.collection('payment_events').add({
    uid,
    event: 'charge.success',
    reference,
    amount: data.amount,
    currency: data.currency,
    tier,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Handle subscription creation.
 */
async function handleSubscriptionCreate(firestore, data) {
  const uid = data.customer?.metadata?.uid;
  if (!uid) return;

  const tier = determineTierFromPlan(data.plan?.plan_code);

  await firestore.collection('households').doc(uid).set({
    subscription: {
      status: 'active',
      tier,
      subscriptionCode: data.subscription_code,
      planCode: data.plan?.plan_code,
      customerCode: data.customer?.customer_code,
      nextPaymentDate: data.next_payment_date,
    },
    membershipStatus: 'active',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * Handle subscription cancellation.
 */
async function handleSubscriptionCancel(firestore, data) {
  const uid = data.customer?.metadata?.uid;
  if (!uid) return;

  await firestore.collection('households').doc(uid).set({
    subscription: {
      status: 'cancelled',
      tier: 'free', // Downgrade to free tier
      cancelledAt: new Date().toISOString(),
      cancelReason: data.reason || 'user_cancelled',
    },
    membershipStatus: 'inactive',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await firestore.collection('payment_events').add({
    uid,
    event: 'subscription.cancel',
    subscriptionCode: data.subscription_code,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Handle failed payment.
 */
async function handlePaymentFailed(firestore, data) {
  const uid = data.customer?.metadata?.uid;
  if (!uid) return;

  await firestore.collection('households').doc(uid).set({
    subscription: {
      status: 'past_due',
      failedAt: new Date().toISOString(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await firestore.collection('payment_events').add({
    uid,
    event: 'payment.failed',
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Map Paystack plan code to SafeLink subscription tier.
 */
function determineTierFromPlan(planCode) {
  if (!planCode) return 'standard'; // Default assumption

  const standardPlan = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_STANDARD || '';
  const premiumPlan = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PREMIUM || '';

  if (planCode === premiumPlan) return 'premium';
  if (planCode === standardPlan) return 'standard';

  // Fallback: check plan name patterns
  if (planCode.toLowerCase().includes('premium') || planCode.toLowerCase().includes('guarded')) return 'premium';
  return 'standard';
}
