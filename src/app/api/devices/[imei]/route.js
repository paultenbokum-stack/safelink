/**
 * DELETE /api/devices/[imei] — Unbind and remove a device.
 * GET /api/devices/[imei] — Get detailed info for a specific device.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { unbindDevice, getDeviceDetail } from '@/lib/tracksolid';

export async function DELETE(request, context) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const params = await context.params;
    const { imei } = params;

    if (!imei) {
      return NextResponse.json({ error: 'Device IMEI is required' }, { status: 400 });
    }

    const firestore = getAdminFirestore();

    // 1. Find device record in Firestore
    const deviceSnap = await firestore
      .collection('devices')
      .where('uid', '==', decoded.uid)
      .where('imei_plain', '==', imei)
      .limit(1)
      .get();

    // 2. Also check TrackSolid sub-account if any
    const householdDoc = await firestore.collection('households').doc(decoded.uid).get();
    const tracksolidAccount = householdDoc.data()?.tracksolidAccount || decoded.uid;

    try {
      // Unbind from TrackSolid platform
      await unbindDevice(imei, tracksolidAccount);
    } catch (e) {
      console.warn(`[api/devices/${imei}] TrackSolid unbind notice:`, e.message);
    }

    // 3. Delete from Firestore collections
    const batch = firestore.batch();

    if (!deviceSnap.empty) {
      batch.delete(deviceSnap.docs[0].ref);
    }

    // Also remove from device_locations and device_status
    const locRef = firestore.collection('device_locations').doc(imei);
    const statusRef = firestore.collection('device_status').doc(imei);
    batch.delete(locRef);
    batch.delete(statusRef);

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Device ${imei} successfully unlinked and removed`,
    });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices/[imei]] DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to remove device', message: err.message }, { status: 500 });
  }
}

export async function GET(request, context) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const params = await context.params;
    const { imei } = params;

    if (!imei) {
      return NextResponse.json({ error: 'Device IMEI is required' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const detail = await getDeviceDetail(imei);

    return NextResponse.json({ detail });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices/[imei]] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch device detail' }, { status: 500 });
  }
}
