import {
  doc, setDoc, getDoc, updateDoc,
  collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { encryptIMEI } from './crypto';

/* ─── Households ─────────────────────────────────────────────── */

export async function createHousehold(uid, data) {
  const record = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    membershipStatus: 'active',
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(`household_${uid}`, JSON.stringify(record));
    localStorage.setItem('active_household', JSON.stringify({ id: uid, ...record }));
  }
  try {
    await setDoc(doc(db, 'households', uid), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      membershipStatus: 'active',
    });
  } catch (err) {
    console.warn('Firestore setDoc notice (using local storage fallback):', err.message);
  }
}

export async function getHousehold(uid) {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`household_${uid}`) || localStorage.getItem('active_household');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
  }
  try {
    const snap = await getDoc(doc(db, 'households', uid));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn('Firestore getDoc notice (using local storage fallback):', err.message);
  }
  return null;
}

export async function updateHousehold(uid, data) {
  await updateDoc(doc(db, 'households', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ─── Orders ─────────────────────────────────────────────────── */

export async function createOrder(uid, orderData) {
  const ref = await addDoc(collection(db, 'orders'), {
    ...orderData,
    uid,
    status: 'pending',
    referralCode: `SBSec-${Date.now().toString(36).toUpperCase()}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserOrders(uid) {
  const q = query(
    collection(db, 'orders'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/* ─── Devices & IMEI ─────────────────────────────────────────── */

export async function getUserDevices(uid) {
  const q = query(
    collection(db, 'devices'),
    where('uid', '==', uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function allocateIMEI(deviceId, imei, nickname, uid) {
  // Encrypt IMEI before persisting — POPIA compliance
  const encryptedIMEI = uid ? await encryptIMEI(imei, uid) : imei;
  await updateDoc(doc(db, 'devices', deviceId), {
    imei: encryptedIMEI,
    nickname: nickname || '',
    imeiAllocatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createDevice(uid, orderId, productId, productName) {
  const ref = await addDoc(collection(db, 'devices'), {
    uid,
    orderId,
    productId,
    productName,
    imei: null,
    nickname: '',
    status: 'pending',
    lastSeen: null,
    batteryLevel: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDeviceStatus(deviceId, status) {
  await updateDoc(doc(db, 'devices', deviceId), {
    status,
    updatedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
}

/* ─── Incidents (SOS) ────────────────────────────────────────── */

export async function createIncident(uid, data) {
  const ref = await addDoc(collection(db, 'incidents'), {
    uid,
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function resolveIncident(incidentId) {
  await updateDoc(doc(db, 'incidents', incidentId), {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
  });
}

/* ─── Subscriptions ──────────────────────────────────────────── */

export async function updateSubscription(uid, subscriptionData) {
  await updateDoc(doc(db, 'households', uid), {
    subscription: subscriptionData,
    membershipStatus: subscriptionData.status === 'active' ? 'active' : 'inactive',
    updatedAt: serverTimestamp(),
  });
}

export async function getSubscriptionStatus(uid) {
  const snap = await getDoc(doc(db, 'households', uid));
  if (!snap.exists()) return null;
  return snap.data()?.subscription || null;
}

/* ─── Admin ──────────────────────────────────────────────────── */

export async function getAllOrders() {
  const snap = await getDocs(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

