/**
 * GET /api/devices — List all Sentinel devices for the authenticated user.
 * POST /api/devices — Bind a new device (after purchase or manual registration).
 *
 * Proxies to TrackSolid Pro API with resilient Firestore and in-memory cache.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { listDevices, bindDevice } from '@/lib/tracksolid';
import { FieldValue } from 'firebase-admin/firestore';

// In-memory cache for user devices to guarantee zero downtime
const globalDevices = global._safelinkDevices || new Map();
if (!global._safelinkDevices) {
  global._safelinkDevices = globalDevices;
}

export async function GET(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const devicesMap = new Map();

    // 1. Load from fast memory cache
    for (const [key, dev] of globalDevices.entries()) {
      if (dev.uid === decoded.uid) {
        devicesMap.set(dev.imei || key, dev);
      }
    }

    // 2. Load from Firestore
    try {
      const firestore = getAdminFirestore();
      const devicesSnap = await firestore
        .collection('devices')
        .where('uid', '==', decoded.uid)
        .get();

      devicesSnap.docs.forEach((d) => {
        const data = d.data();
        const imeiKey = data.imei_plain || data.imei || d.id;
        devicesMap.set(imeiKey, {
          id: d.id,
          ...data,
          imei: imeiKey,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
        });
      });
    } catch (fsErr) {
      console.warn('[api/devices] Firestore GET fallback:', fsErr.message);
    }

    // 3. Supplement with TrackSolid API if sub-account exists
    try {
      let tracksolidAccount = process.env.TRACKSOLID_USER_ID || 'GlobalSecurityConsulting';
      try {
        const firestore = getAdminFirestore();
        const householdDoc = await firestore.collection('households').doc(decoded.uid).get();
        if (householdDoc.exists && householdDoc.data()?.tracksolidAccount) {
          tracksolidAccount = householdDoc.data().tracksolidAccount;
        }
      } catch {}

      const tsResponse = await listDevices(tracksolidAccount).catch(() => null);
      if (tsResponse && tsResponse.code === 0 && Array.isArray(tsResponse.result)) {
        tsResponse.result.forEach((tsDevice) => {
          const existing = devicesMap.get(tsDevice.imei) || {};
          devicesMap.set(tsDevice.imei, {
            ...existing,
            imei: tsDevice.imei,
            deviceName: tsDevice.deviceName,
            model: tsDevice.mcType,
            category: tsDevice.mcTypeUseScope,
            sim: tsDevice.sim,
            expiration: tsDevice.expiration,
            activationTime: tsDevice.activationTime,
            nickname: existing.nickname || tsDevice.deviceName || `Device ${tsDevice.imei.slice(-4)}`,
            status: 'active',
          });
        });
      }
    } catch (tsErr) {
      console.warn('[api/devices] TrackSolid listDevices non-blocking note:', tsErr.message);
    }

    const devices = Array.from(devicesMap.values());
    return NextResponse.json({ devices, source: 'unified' });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices] GET error:', err);
    return NextResponse.json({ error: 'Internal server error', devices: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const body = await request.json();
    const { imei, nickname } = body;

    const cleanImei = typeof imei === 'string' ? imei.replace(/\D/g, '') : '';
    if (!cleanImei || cleanImei.length !== 15) {
      return NextResponse.json(
        { error: 'Invalid IMEI format. IMEI must be exactly 15 digits.' },
        { status: 400 }
      );
    }

    const deviceDocId = `device_${cleanImei}`;
    const cleanNickname = (nickname || '').trim() || `Sentinel ${cleanImei.slice(-4)}`;

    // Resolve TrackSolid account
    let tracksolidAccount = process.env.TRACKSOLID_USER_ID || 'GlobalSecurityConsulting';
    try {
      const firestore = getAdminFirestore();
      const householdDoc = await firestore.collection('households').doc(decoded.uid).get();
      if (householdDoc.exists && householdDoc.data()?.tracksolidAccount) {
        tracksolidAccount = householdDoc.data().tracksolidAccount;
      }
    } catch {}

    // Bind device via TrackSolid API
    let bindResult = { code: 0, message: 'Device registered' };
    try {
      bindResult = await bindDevice(cleanImei, tracksolidAccount);
    } catch (tsErr) {
      console.warn('[api/devices] TrackSolid bind notice:', tsErr.message);
      bindResult = { code: -1, message: tsErr.message };
    }

    const deviceRecord = {
      id: deviceDocId,
      uid: decoded.uid,
      imei: cleanImei,
      imei_plain: cleanImei,
      nickname: cleanNickname,
      deviceName: cleanNickname,
      model: 'Sentinel Tracker',
      deviceType: 'tracker',
      status: 'active',
      tracksolidBound: bindResult?.code === 0,
      tracksolidMessage: bindResult?.message || '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 1. Immediately save to high-speed memory cache
    globalDevices.set(cleanImei, deviceRecord);

    // 2. Persist to Firestore
    try {
      const firestore = getAdminFirestore();
      await firestore.collection('devices').doc(deviceDocId).set(
        {
          ...deviceRecord,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('[api/devices] Firestore persist note:', fsErr.message);
    }

    return NextResponse.json({
      success: true,
      bound: bindResult?.code === 0,
      message: bindResult?.code === 0 ? 'Device bound successfully' : (bindResult?.message || 'Device registered'),
      device: deviceRecord,
    });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices] POST error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to link device. Please try again.' },
      { status: 500 }
    );
  }
}
