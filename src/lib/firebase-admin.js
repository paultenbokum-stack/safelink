import 'server-only';
import { authorizeInvitedMember } from './family-invites';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'safelink-b8071';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

let credential;
if (clientEmail && privateKey) {
  try {
    credential = cert({
      projectId,
      clientEmail,
      privateKey,
    });
  } catch (err) {
    console.warn('[firebase-admin] Service account cert parse warning:', err.message);
  }
}

export const adminApp =
  getApps()[0] ??
  initializeApp({
    projectId: projectId || undefined,
    ...(credential ? { credential } : {}),
  });

export function getAdminFirestore() {
  return getFirestore(adminApp);
}

export async function authenticateFirebaseRequest(request, { allowUnverified = false } = {}) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    throw new Error('UNAUTHENTICATED');
  }

  const idToken = authorization.slice(7).trim();
  if (!idToken || idToken.length > 4096) {
    throw new Error('UNAUTHENTICATED');
  }

  // Demo tokens are deliberately opt-in and can never authenticate production traffic.
  // A staging developer must set both flags explicitly; the public deployment must not.
  if (
    process.env.NODE_ENV !== 'production'
    && process.env.SAFELINK_ALLOW_DEMO_AUTH === 'true'
    && (idToken.startsWith('test_') || idToken === 'demo-test-token')
  ) {
    const cleanUid = idToken.startsWith('test_') ? idToken.replace('test_', '') : 'user_827675092';
    return {
      uid: cleanUid,
      email: `${cleanUid}@safelink.co.za`,
      displayName: 'SafeLink User',
    };
  }

  // Real Firebase ID token verification
  try {
    const decoded = await getAuth(adminApp).verifyIdToken(idToken);
    if (!decoded.uid || (!allowUnverified && !decoded.email_verified && !decoded.phone_number && decoded.familyMember !== true)) {
      throw new Error('UNAUTHENTICATED');
    }
    await authorizeInvitedMember(decoded, request, getAdminFirestore());
    return decoded;
  } catch (err) {
    // Never trust an unverified JWT payload. A malformed Firebase Admin setup must
    // fail closed instead of turning an attacker-controlled payload into a session.
    console.warn('[auth] Firebase token verification rejected:', err.code || err.name || 'verification-failed', err instanceof TypeError ? err.message.slice(0, 120) : '');
    throw new Error('UNAUTHENTICATED');
  }
}

export async function assertDeviceOwnership(uid, imei) {
  const snapshot = await getAdminFirestore().collection('devices').doc(`device_${imei}`).get();
  if (!snapshot.exists || snapshot.data()?.uid !== uid) {
    throw new Error('FORBIDDEN');
  }
}

/** Resolve the account IDs that belong to the signed-in user's family circle. */
export async function getFamilyCircleAccess(user) {
  const firestore = getAdminFirestore();
  const guardianUid = user.familyMember === true ? user.guardianUid : user.uid;
  const householdSnapshot = await firestore.collection('households').doc(guardianUid).get();
  const household = householdSnapshot.data() || {};
  const members = Array.isArray(household.members) ? household.members : [];
  const linkedMembers = (await Promise.all(members.filter(member => member?.linkedUid).map(async member => {
    const membership = await firestore.collection('familyMemberships').doc(member.linkedUid).get();
    const link = membership.data();
    return membership.exists && link?.guardianUid === guardianUid && link?.memberId === member.id ? member : null;
  }))).filter(Boolean);

  if (user.familyMember === true) {
    const membership = await firestore.collection('familyMemberships').doc(user.uid).get();
    const link = membership.data();
    const member = members.find(item => item.id === user.familyMemberId && item.linkedUid === user.uid);
    if (!membership.exists || !member || link?.guardianUid !== guardianUid || link?.memberId !== member.id) {
      throw new Error('FORBIDDEN');
    }
  }

  return {
    guardianUid,
    household,
    members,
    linkedMembers,
    ownerUids: [...new Set([guardianUid, ...linkedMembers.map(member => member.linkedUid)])],
  };
}

export async function assertDeviceFamilyAccess(user, imei) {
  const snapshot = await getAdminFirestore().collection('devices').doc(`device_${imei}`).get();
  if (!snapshot.exists) throw new Error('FORBIDDEN');
  const access = await getFamilyCircleAccess(user);
  if (!access.ownerUids.includes(snapshot.data()?.uid)) throw new Error('FORBIDDEN');
  return snapshot.data();
}

export async function savePaymentIntent({ uid, email, reference, checkout, delivery, companyId }) {
  const firestore = getAdminFirestore();
  await firestore.collection('paymentIntents').doc(reference).set({
    uid,
    email,
    reference,
    items: checkout.items,
    subtotal: checkout.subtotal,
    vat: checkout.vat,
    total: checkout.total,
    amountSubunit: checkout.amountSubunit,
    currency: checkout.currency,
    fingerprint: checkout.fingerprint,
    delivery,
    companyId: companyId || null,
    status: 'initialized',
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function getPaymentIntent(reference) {
  const snapshot = await getAdminFirestore().collection('paymentIntents').doc(reference).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

function safeTransactionId(value) {
  if (typeof value === 'string' && /^\d+$/.test(value)) return value;
  if (Number.isSafeInteger(value) && value >= 0) return String(value);
  return null;
}

export async function saveVerifiedPaidOrder({ paymentIntent, transaction: paystackTransaction }) {
  const firestore = getAdminFirestore();
  const { uid, reference } = paymentIntent;
  const orderRef = firestore.collection('orders').doc(reference);
  const intentRef = firestore.collection('paymentIntents').doc(reference);
  let alreadyCreated = false;

  await firestore.runTransaction(async (firestoreTransaction) => {
    const existing = await firestoreTransaction.get(orderRef);

    if (existing.exists && existing.data()?.paymentStatus === 'paid') {
      if (existing.data()?.uid !== uid || existing.data()?.paystackRef !== reference) {
        throw new Error('ORDER_REFERENCE_CONFLICT');
      }
      alreadyCreated = true;
      return;
    }

    firestoreTransaction.set(orderRef, {
      items: paymentIntent.items,
      subtotal: paymentIntent.subtotal,
      vat: paymentIntent.vat,
      total: paymentIntent.total,
      currency: paymentIntent.currency,
      delivery: paymentIntent.delivery,
      paystackRef: reference,
      paystackTransactionId: safeTransactionId(paystackTransaction.id),
      paidAt: paystackTransaction.paid_at || paystackTransaction.paidAt || null,
      paymentChannel: paystackTransaction.channel || null,
      paymentGateway: 'paystack',
      securityCompanyId: paymentIntent.companyId || null,
      uid,
      householdId: uid,
      status: 'pending',
      paymentStatus: 'paid',
      referralCode: `SBSec-${reference.slice(-10).toUpperCase()}`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    firestoreTransaction.set(intentRef, {
      status: 'completed',
      paystackTransactionId: safeTransactionId(paystackTransaction.id),
      paidAt: paystackTransaction.paid_at || paystackTransaction.paidAt || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  return { orderId: reference, alreadyCreated };
}
