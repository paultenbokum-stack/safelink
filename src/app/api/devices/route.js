/**
 * GET /api/devices — List all Sentinel devices for the authenticated user.
 * POST /api/devices — Bind a new device (after purchase).
 *
 * Proxies to TrackSolid Pro API. Requires Firebase Auth.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { listDevices, bindDevice } from '@/lib/tracksolid';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const firestore = getAdminFirestore();

    // Get user's TrackSolid sub-account from their household doc
    const householdDoc = await firestore.collection('households').doc(decoded.uid).get();
    const tracksolidAccount = householdDoc.data()?.tracksolidAccount;

    if (!tracksolidAccount) {
      // User has no TrackSolid account yet — return devices from Firestore only
      const devicesSnap = await firestore
        .collection('devices')
        .where('uid', '==', decoded.uid)
        .get();

      const devices = devicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ devices, source: 'firestore' });
    }

    // Fetch live device data from TrackSolid
    const tsResponse = await listDevices(tracksolidAccount);
    if (tsResponse.code !== 0) {
      return NextResponse.json(
        { error: 'Failed to fetch devices', details: tsResponse.message },
        { status: 502 }
      );
    }

    // Merge TrackSolid data with Firestore metadata (nicknames, purchase info)
    const devices = await mergeDeviceData(firestore, decoded.uid, tsResponse.result || []);

    return NextResponse.json({ devices, source: 'tracksolid' });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const { imei, nickname } = await request.json();

    if (!imei || typeof imei !== 'string' || !/^\d{15}$/.test(imei)) {
      return NextResponse.json({ error: 'Invalid IMEI format' }, { status: 400 });
    }

    const firestore = getAdminFirestore();

    // Get or create TrackSolid sub-account for this user
    let householdDoc = await firestore.collection('households').doc(decoded.uid).get();
    let tracksolidAccount = householdDoc.data()?.tracksolidAccount;

    if (!tracksolidAccount) {
      // Will be set up during onboarding — for now, store in Firestore only
      tracksolidAccount = decoded.uid;
    }

    // Bind device via TrackSolid API
    const bindResult = await bindDevice(imei, tracksolidAccount);

    // Also store in Firestore for local queries
    await firestore.collection('devices').add({
      uid: decoded.uid,
      imei_plain: imei, // Stored for webhook IMEI matching
      nickname: nickname || '',
      tracksolidBound: bindResult.code === 0,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      bound: bindResult.code === 0,
      message: bindResult.code === 0 ? 'Device bound successfully' : bindResult.message,
    });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Merge TrackSolid device data with Firestore metadata.
 */
async function mergeDeviceData(firestore, uid, tsDevices) {
  const fsDevicesSnap = await firestore
    .collection('devices')
    .where('uid', '==', uid)
    .get();

  const fsDeviceMap = {};
  fsDevicesSnap.docs.forEach((d) => {
    const data = d.data();
    if (data.imei_plain) {
      fsDeviceMap[data.imei_plain] = { id: d.id, ...data };
    }
  });

  return tsDevices.map((tsDevice) => {
    const fsDevice = fsDeviceMap[tsDevice.imei] || {};
    return {
      imei: tsDevice.imei,
      deviceName: tsDevice.deviceName,
      model: tsDevice.mcType,
      category: tsDevice.mcTypeUseScope,
      sim: tsDevice.sim,
      expiration: tsDevice.expiration,
      activationTime: tsDevice.activationTime,
      // Merge Firestore metadata
      nickname: fsDevice.nickname || tsDevice.deviceName,
      firestoreId: fsDevice.id || null,
      purchaseOrderId: fsDevice.orderId || null,
      productId: fsDevice.productId || null,
    };
  });
}
