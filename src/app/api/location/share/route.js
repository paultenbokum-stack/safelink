/**
 * POST /api/location/share — Receive phone GPS location updates.
 *
 * Actions:
 * - default: Save GPS position to Firestore (phone_<uid> doc)
 * - opt_in:  Record consent + create phone device entry
 * - opt_out: Remove phone device entry + clear location
 *
 * GET /api/location/share — Read the signed-in account's shared phone location.
 */
import { timestampMillis, batteryPercent } from '@/lib/telemetry';
import { recordSafetyNotification, drainPushQueue } from '@/lib/notification-push';
import { NextResponse, after } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore, getFamilyCircleAccess } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const body = await request.json();
    const phoneDocId = `phone_${decoded.uid}`;

    // ── Opt-in: record consent and create phone "device" ──
    if (body.action === 'opt_in') {
      try {
        const firestore = getAdminFirestore();
        await firestore.runTransaction(async transaction => {
          let householdRef;
          let familyMembers;
          if (decoded.familyMember === true && decoded.guardianUid && decoded.familyMemberId) {
            householdRef = firestore.collection('households').doc(decoded.guardianUid);
            const household = await transaction.get(householdRef);
            familyMembers = household.data()?.members || [];
            if (!familyMembers.some(member => member.id === decoded.familyMemberId && member.linkedUid === decoded.uid)) {
              throw new Error('MEMBERSHIP_ENDED');
            }
          }
          transaction.set(firestore.collection('phone_sharing_consent').doc(decoded.uid), {
            uid: decoded.uid,
            email: decoded.email || '',
            nickname: body.nickname || 'My Phone',
            consentGranted: true,
            consentTimestamp: body.consentTimestamp || new Date().toISOString(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          transaction.set(firestore.collection('devices').doc(phoneDocId), {
            uid: decoded.uid,
            deviceType: 'phone',
            nickname: body.nickname || 'My Phone',
            status: 'active',
            isPhoneDevice: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          transaction.delete(firestore.collection('device_locations').doc(phoneDocId));
          if (householdRef) {
            transaction.set(householdRef, { members: familyMembers.map(member => member.id === decoded.familyMemberId
              ? { ...member, locationSharing: true } : member) }, { merge: true });
          }
        });
      } catch (fsErr) {
        console.warn('[api/location/share] Consent write failed:', fsErr.message);
        return NextResponse.json({ error: fsErr.message === 'MEMBERSHIP_ENDED' ? 'Family membership is no longer active.' : 'Could not save consent. Please retry.' }, { status: fsErr.message === 'MEMBERSHIP_ENDED' ? 403 : 503 });
      }

      return NextResponse.json({ success: true, message: 'Location sharing enabled' });
    }

    // ── Opt-out: revoke consent and mark inactive ──
    if (body.action === 'opt_out') {

      try {
        const firestore = getAdminFirestore();
        await firestore.runTransaction(async transaction => {
          let householdRef;
          let familyMembers;
          if (decoded.familyMember === true && decoded.guardianUid && decoded.familyMemberId) {
            householdRef = firestore.collection('households').doc(decoded.guardianUid);
            familyMembers = (await transaction.get(householdRef)).data()?.members || [];
          }
          transaction.set(firestore.collection('phone_sharing_consent').doc(decoded.uid), {
            consentGranted: false,
            revokedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          transaction.set(firestore.collection('devices').doc(phoneDocId), {
            status: 'inactive',
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          transaction.delete(firestore.collection('device_locations').doc(phoneDocId));
          if (householdRef) transaction.set(householdRef, { members: familyMembers.map(member => member.id === decoded.familyMemberId && member.linkedUid === decoded.uid
            ? { ...member, locationSharing: false } : member) }, { merge: true });
        });
      } catch (fsErr) {
        console.warn('[api/location/share] Consent revocation failed:', fsErr.message);
        return NextResponse.json({ error: 'Could not revoke sharing. Please retry.' }, { status: 503 });
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

    if (!Number.isFinite(numericLat) || !Number.isFinite(numericLng) || Math.abs(numericLat) > 90 || Math.abs(numericLng) > 180) {
      return NextResponse.json({ error: 'Invalid lat/lng numbers' }, { status: 400 });
    }

    let firestore;
    try {
      firestore = getAdminFirestore();
      const consent = await firestore.collection('phone_sharing_consent').doc(decoded.uid).get();
      if (!consent.exists || consent.data()?.consentGranted !== true) {
        return NextResponse.json({ error: 'Location-sharing consent is required' }, { status: 403 });
      }
    } catch (fsErr) {
      console.warn('[api/location/share] Consent check failed:', fsErr.message);
      return NextResponse.json({ error: 'Location sharing is temporarily unavailable' }, { status: 503 });
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
      gpsTime: timestampMillis(body.timestamp) && timestampMillis(body.timestamp) <= Date.now() + 60000 ? new Date(timestampMillis(body.timestamp)).toISOString() : null,
      battery: batteryPercent(body.battery),
    };

    // Serialize consent checks with writes so a concurrent revocation cannot leave a new report.
    try {
      await firestore.runTransaction(async transaction => {
        const consent = await transaction.get(firestore.collection('phone_sharing_consent').doc(decoded.uid));
        if (consent.data()?.consentGranted !== true) throw new Error('CONSENT_REQUIRED');
        transaction.set(firestore.collection('device_locations').doc(phoneDocId), {
          ...locationRecord, updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      });
    } catch (error) {
      return NextResponse.json({ error: 'Could not save the phone report.' }, { status: error.message === 'CONSENT_REQUIRED' ? 403 : 503 });
    }
    await checkPhoneGeofences(firestore, decoded.uid, numericLat, numericLng);

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
    const familyMembers = [];

    // Every joined account sees the family roster. Coordinates remain available
    // only for phones with explicit consent and family-map visibility enabled.
    const firestore = getAdminFirestore();
    const access = await getFamilyCircleAccess(decoded);
    const guardianMember = access.members.find(member => member.isSelf || member.id === access.guardianUid);
    const candidates = [{
      uid: access.guardianUid,
      nickname: guardianMember?.name || [access.household.adminFirstName, access.household.adminLastName].filter(Boolean).join(' ') || 'Family guardian',
      memberId: guardianMember?.id || access.guardianUid,
      isOwn: decoded.uid === access.guardianUid,
      visible: guardianMember ? guardianMember.locationSharing === true : true,
    }];
    for (const member of access.linkedMembers) {
      if (!member?.linkedUid || member.linkedUid === access.guardianUid) continue;
      candidates.push({ uid: member.linkedUid, nickname: member.name, memberId: member.id,
        isOwn: member.linkedUid === decoded.uid, visible: member.locationSharing === true });
    }

    for (const candidate of candidates) {
      const consent = await firestore.collection('phone_sharing_consent').doc(candidate.uid).get();
      const sharingEnabled = consent.exists && consent.data()?.consentGranted === true;
      familyMembers.push({ id: `phone_${candidate.uid}`, uid: candidate.uid, nickname: candidate.nickname,
        memberId: candidate.memberId, isOwn: candidate.isOwn, sharingEnabled, visible: candidate.isOwn || candidate.visible });
      if (!sharingEnabled || (!candidate.isOwn && !candidate.visible)) continue;

      const phoneDocId = `phone_${candidate.uid}`;
      const phoneLocation = await firestore.collection('device_locations').doc(phoneDocId).get();
      if (!phoneLocation.exists) continue;
      const data = phoneLocation.data();
      if (data.uid === candidate.uid && data.isPhoneDevice === true) {
        phoneLocationsMap.set(phoneDocId, {
          ...data,
          id: phoneDocId,
          nickname: candidate.nickname || data.nickname,
          isOwn: candidate.isOwn,
          memberId: candidate.memberId || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
        });
      }
    }
    return NextResponse.json({ locations: Array.from(phoneLocationsMap.values()), familyMembers });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/location/share] GET Error:', err);
    return NextResponse.json({ error: 'Location sharing is temporarily unavailable' }, { status: 503 });
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
        const alertRef = await firestore.collection('device_alerts').add({
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
        await recordSafetyNotification({ uid, eventId: `phone-geofence:${alertRef.id}`, groupId: `phone-geofence:${doc.id}`, title: 'Phone geofence update', body: `Your phone ${isInside ? 'entered' : 'left'} ${fence.name || 'a saved area'}.`, priority: 'important' });
        after(() => drainPushQueue());
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
