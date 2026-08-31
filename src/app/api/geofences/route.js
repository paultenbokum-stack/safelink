/**
 * GET    /api/geofences — List all geofences for the authenticated user.
 * POST   /api/geofences — Create a new geofence (Home, School, Work, etc.).
 * DELETE /api/geofences — Delete a geofence by ID.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import {
  createGeofence,
  listGeofences,
  deleteGeofence,
  bindGeofence,
} from '@/lib/tracksolid';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request) {
  try {
    await authenticateFirebaseRequest(request);

    const result = await listGeofences();
    if (result.code !== 0) {
      return NextResponse.json(
        { error: 'Failed to list geofences', details: result.message },
        { status: 502 }
      );
    }

    return NextResponse.json({ geofences: result.result || [] });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/geofences] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const body = await request.json();

    const { name, type, lat, lng, radius, deviceImeis, alarmType } = body;

    if (!name || !lat || !lng) {
      return NextResponse.json({ error: 'Missing required fields: name, lat, lng' }, { status: 400 });
    }

    // Build fence data for TrackSolid
    // Circle geofence: { center_lat, center_lng, radius }
    const fenceData = JSON.stringify({
      center_lat: parseFloat(lat),
      center_lng: parseFloat(lng),
      radius: parseInt(radius) || 200, // Default 200m radius
    });

    const result = await createGeofence({
      fenceName: name,
      fenceType: type || 'circle',
      fenceData,
      alarmType: alarmType ?? 0, // 0 = enter+exit, 1 = enter only, 2 = exit only
    });

    if (result.code !== 0) {
      return NextResponse.json(
        { error: 'Failed to create geofence', details: result.message },
        { status: 502 }
      );
    }

    const fenceId = result.result?.fenceId || result.result?.fence_id;

    // If device IMEIs provided, bind them to the geofence
    if (fenceId && deviceImeis) {
      const imeiList = Array.isArray(deviceImeis) ? deviceImeis.join(',') : deviceImeis;
      await bindGeofence(fenceId, imeiList);
    }

    // Also store in Firestore for local queries and partner portal
    const firestore = getAdminFirestore();
    await firestore.collection('geofences').doc(fenceId || `local_${Date.now()}`).set({
      uid: decoded.uid,
      name,
      type: type || 'circle',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius) || 200,
      alarmType: alarmType ?? 0,
      tracksolidFenceId: fenceId,
      deviceImeis: deviceImeis || [],
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      fenceId,
      message: `Geofence "${name}" created successfully`,
    });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/geofences] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await authenticateFirebaseRequest(request);
    const { searchParams } = new URL(request.url);
    const fenceId = searchParams.get('fenceId');

    if (!fenceId) {
      return NextResponse.json({ error: 'Missing fenceId' }, { status: 400 });
    }

    const result = await deleteGeofence(fenceId);
    if (result.code !== 0) {
      return NextResponse.json(
        { error: 'Failed to delete geofence', details: result.message },
        { status: 502 }
      );
    }

    // Also remove from Firestore
    const firestore = getAdminFirestore();
    await firestore.collection('geofences').doc(fenceId).delete();

    return NextResponse.json({ success: true, message: 'Geofence deleted' });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/geofences] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
