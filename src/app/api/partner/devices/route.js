/**
 * GET /api/partner/devices
 *
 * Returns live device telemetry for a verified partner client.
 * Decodes the partner session to get allowed IMEIs, fetches live
 * data from TrackSolid, strips raw IMEIs from the response.
 *
 * Headers: Authorization: Bearer <partnerSessionToken>
 *
 * Returns:
 *   200 [{ hashedImei, nickname, type, status, battery, lat, lng, lastSeen, address }]
 *   401 { error } — missing/invalid session
 *   502 { error } — TrackSolid unavailable
 *
 * POPIA: Raw IMEIs used only server-side to call TrackSolid.
 * Client receives hashed references + telemetry only.
 */
import { batteryPercent } from '@/lib/telemetry';
import { NextResponse } from 'next/server';
import { verifyPartnerSession, hashImei } from '@/lib/partner-adapter';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    // Extract session token
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Missing partner session token' }, { status: 401 });
    }

    const session = verifyPartnerSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const rawImeis = session._deviceImeis || [];
    const hashedRefs = session.deviceHashes || [];

    if (rawImeis.length === 0) {
      return NextResponse.json([]);
    }

    // Load any saved nicknames from Firestore (stored as hashedImei → label)
    let savedNicknames = {};
    try {
      const db = getAdminFirestore();
    // Namespace labels by partnerId+clientRef to prevent cross-partner collisions.
    const labelDocId = `${session.partnerId}_${session.clientRef}`;
    const labelsDoc = await db
      .collection('device_labels')
      .doc(labelDocId)
      .get();
    if (labelsDoc.exists) {
      savedNicknames = labelsDoc.data() || {};
    }
    } catch (e) {
      // Non-fatal — nicknames from adapter used as fallback
      console.warn('[partner/devices] Could not load labels:', e.message);
    }

    // Fetch live telemetry from TrackSolid for each IMEI
    const { getDeviceLocation } = await import('@/lib/tracksolid');
    const devices = [];

    for (let i = 0; i < rawImeis.length; i++) {
      const imei = rawImeis[i];
      const hashedImei = hashedRefs[i] || hashImei(imei);

      let telemetry = {
        lat: null,
        lng: null,
        battery: null,
        status: 'unknown',
        lastSeen: null, checkedAt: null,
        address: null,
      };

      try {
        const locResult = await getDeviceLocation(imei);
        if (locResult?.code === 0 && locResult?.result) {
          const r = Array.isArray(locResult.result) ? locResult.result.find(item => item.imei === imei) : locResult.result;
          if (!r) throw new Error("No report for device");
          telemetry = {
            lat: parseFloat(r.lat || r.latitude) || null,
            lng: parseFloat(r.lng || r.longitude) || null,
            battery: batteryPercent(r.batteryPowerVal ?? r.electricity ?? r.battery ?? r.batteryLevel),
            status: r.accStatus === 1 ? 'in_motion' : r.online ? 'online' : 'offline',
            lastSeen: r.gpsTime || r.deviceTime || null, checkedAt: Date.now(),
            address: r.address || null,
          };
        }
      } catch (e) {
        console.warn(`[partner/devices] TrackSolid error for hashed device ${hashedImei}:`, e.message);
      }

      // Nickname priority: user-saved label > adapter nickname > generic fallback
      const nickname = savedNicknames[hashedImei]
        || session._deviceNicknames?.[i]
        || `Device ${hashedImei.slice(0, 6)}`;

      devices.push({
        hashedImei,         // client reference — safe to expose
        nickname,
        type: session._deviceTypes?.[i] || 'UNKNOWN',
        ...telemetry,
        // raw IMEI deliberately excluded from response
      });
    }

    return NextResponse.json(devices);
  } catch (err) {
    console.error('[api/partner/devices] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/partner/devices
 * Save a nickname for a device (by hashed IMEI).
 *
 * Body: { hashedImei: "...", nickname: "Kyle's Car" }
 * Stored in Firestore as device_labels/{clientRef}/{hashedImei} = "Kyle's Car"
 * No raw IMEI or personal data stored.
 */
export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const session = verifyPartnerSession(token);

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { hashedImei, nickname } = await request.json();

    if (!hashedImei || !nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'hashedImei and nickname are required' }, { status: 400 });
    }

    // Verify this hashedImei belongs to this session
    if (!session.deviceHashes?.includes(hashedImei)) {
      return NextResponse.json({ error: 'Device not authorised for this session' }, { status: 403 });
    }

    const db = getAdminFirestore();
    // Namespace by partnerId+clientRef — mirrors the read path above.
    const labelDocId = `${session.partnerId}_${session.clientRef}`;
    await db.collection('device_labels').doc(labelDocId).set(
      { [hashedImei]: nickname.trim().substring(0, 50) },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/partner/devices] PATCH Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
