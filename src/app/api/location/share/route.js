/**
 * POST /api/location/share — Receive phone GPS location updates.
 *
 * Actions:
 * - default: Save GPS position to Firestore (phone_<uid> doc)
 * - opt_in:  Record consent + create phone device entry
 * - opt_out: Remove phone device entry + clear location
 *
 * GET /api/location/share — List all phone-shared locations for the household.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// In-memory fallback cache to ensure real-time tracking operates seamlessly across invocations
const globalPhoneLocations = global._safelinkPhoneLocations || new Map();
if (!global._safelinkPhoneLocations) {
  global._safelinkPhoneLocations = globalPhoneLocations;
}

export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const body = await request.json();
    const phoneDocId = `phone_${decoded.uid}`;

    // ── Opt-in: record consent and create phone "device" ──
    if (body.action === 'opt_in') {
      try {
        const firestore = getAdminFirestore();
        await firestore.collection('phone_sharing_consent').doc(decoded.uid).set({
          uid: decoded.uid,
          email: decoded.email,
          nickname: body.nickname || 'My Phone',
          consentGranted: true,
          consentTimestamp: body.consentTimestamp || new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await firestore.collection('devices').doc(phoneDocId).set({
          uid: decoded.uid,
          deviceType: 'phone',
          nickname: body.nickname || 'My Phone',
          status: 'active',
          isPhoneDevice: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (fsErr) {
        console.warn('[api/location/share] Firestore opt_in note:', fsErr.message);
      }

      return NextResponse.json({ success: true, message: 'Location sharing enabled' });
    }

    // ── Opt-out: revoke consent and mark inactive ──
    if (body.action === 'opt_out') {
      globalPhoneLocations.delete(decoded.uid);

      try {
        const firestore = getAdminFirestore();
        await firestore.collection('phone_sharing_consent').doc(decoded.uid).set({
          consentGranted: false,
          revokedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await firestore.collection('devices').doc(phoneDocId).set({
          status: 'inactive',
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await firestore.collection('device_locations').doc(phoneDocId).delete();
      } catch (fsErr) {
        console.warn('[api/location/share] Firestore opt_out note:', fsErr.message);
      }

      return NextResponse.json({ success: true, message: 'Location sharing disabled' });
    }

    // ── Default: save GPS location update ──
    const { lat, lng, accuracy, altitude, speed, heading, nickname } = body;

    if (lat == null || lng == null) {
      return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
    }

    const numericLat = parseFloat(lat);
    const numericLng = parseFloat(lng);

    if (isNaN(numericLat) || isNaN(numericLng)) {
      return NextResponse.json({ error: 'Invalid lat/lng numbers' }, { status: 400 });
    }

    const locationRecord = {
      id: phoneDocId,
      uid: decoded.uid,
      deviceType: 'phone',
      isPhoneDevice: true,
      lat: numericLat,
      lng: numericLng,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      altitude: altitude ? parseFloat(altitude) : null,
      speed: speed ? parseFloat(speed) * 3.6 : 0,
      heading: heading ? parseFloat(heading) : null,
      nickname: nickname || 'My Phone',
      updatedAt: new Date().toISOString(),
      gpsTime: new Date().toISOString(),
    };

    // 1. Immediately store in high-speed memory cache
    globalPhoneLocations.set(decoded.uid, locationRecord);

    // 2. Persist to Firestore asynchronously / gracefully
    try {
      const firestore = getAdminFirestore();
      await firestore.collection('device_locations').doc(phoneDocId).set({
        ...locationRecord,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Check geofences for this phone location
      await checkPhoneGeofences(firestore, decoded.uid, numericLat, numericLng);
    } catch (fsErr) {
      console.warn('[api/location/share] Firestore persist non-blocking note:', fsErr.message);
    }

    return NextResponse.json({ success: true, location: locationRecord });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/location/share] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const phoneLocationsMap = new Map();

    // 1. Populate from fast memory cache
    for (const [uid, loc] of globalPhoneLocations.entries()) {
      phoneLocationsMap.set(loc.id, loc);
    }

    // 2. Supplement from Firestore if available
    try {
      const firestore = getAdminFirestore();
      const phoneLocationsSnap = await firestore
        .collection('device_locations')
        .where('isPhoneDevice', '==', true)
        .get();

      for (const doc of phoneLocationsSnap.docs) {
        const data = doc.data();
        phoneLocationsMap.set(doc.id, {
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
        });
      }
    } catch (fsErr) {
      console.warn('[api/location/share] Firestore GET fallback:', fsErr.message);
    }

    const phoneLocations = Array.from(phoneLocationsMap.values());
    return NextResponse.json({ locations: phoneLocations });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/location/share] GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check if the phone has entered/exited any geofences.
 * This is the software-based equivalent of TrackSolid's hardware geofencing.
 */
async function checkPhoneGeofences(firestore, uid, lat, lng) {
  try {
    const geofencesSnap = await firestore
      .collection('geofences')
      .where('uid', '==', uid)
      .get();

    if (geofencesSnap.empty) return;

    for (const doc of geofencesSnap.docs) {
      const fence = doc.data();
      const distance = haversineDistance(lat, lng, fence.lat, fence.lng);
      const isInside = distance <= (fence.radius || 200);

      // Get previous state
      const stateDocId = `phone_${uid}_${doc.id}`;
      const stateDoc = await firestore
        .collection('geofence_state')
        .doc(stateDocId)
        .get();

      const wasInside = stateDoc.exists ? stateDoc.data().inside : null;

      // Detect transitions
      if (wasInside !== null && wasInside !== isInside) {
        const eventType = isInside ? 'geofence_enter' : 'geofence_exit';

        // Write alert
        await firestore.collection('device_alerts').add({
          uid,
          deviceType: 'phone',
          alarmType: eventType,
          fenceId: doc.id,
          fenceName: fence.name,
          lat,
          lng,
          distance: Math.round(distance),
          receivedAt: FieldValue.serverTimestamp(),
          processed: false,
        });
      }

      // Update state
      await firestore.collection('geofence_state').doc(stateDocId).set({
        uid,
        fenceId: doc.id,
        inside: isInside,
        distance: Math.round(distance),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[location/share] Geofence check failed:', err.message);
  }
}

/**
 * Haversine distance in metres between two lat/lng points.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in metres
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
