/**
 * GET /api/devices — List all Sentinel devices for the authenticated user.
 * POST /api/devices — Bind a new device (after purchase or manual registration).
 *
 * Proxies to TrackSolid Pro API with resilient Firestore and in-memory cache.
 */
import { batteryPercent } from '@/lib/telemetry';
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { listDevices, bindDevice, getDeviceLocation } from '@/lib/tracksolid';
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
    let tracksolidResolved = false;

    // 1. Load from fast memory cache
    for (const [key, dev] of globalDevices.entries()) {
      if (dev.uid === decoded.uid) {
        devicesMap.set(dev.imei || dev.id, dev);
      }
    }

    // 2. Load from Firestore
    try {
      const firestore = getAdminFirestore();
      const snapshot = await firestore
        .collection('devices')
        .where('uid', '==', decoded.uid)
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const imei = data.imei || data.imei_plain || doc.id.replace('device_', '');
        devicesMap.set(imei, { ...data, id: doc.id, imei });
      });
    } catch (fsErr) {
      console.warn('[api/devices] Firestore read note:', fsErr.message);
    }

    // 3. Supplement with TrackSolid API if sub-account exists
    try {
      let tracksolidAccount = process.env.TRACKSOLID_USER_ID;
      try {
        const firestore = getAdminFirestore();
        const householdDoc = await firestore.collection('households').doc(decoded.uid).get();
        if (householdDoc.exists && householdDoc.data()?.tracksolidAccount) {
          tracksolidAccount = householdDoc.data().tracksolidAccount;
        }
      } catch {}

      const tsResponse = tracksolidAccount ? await listDevices(tracksolidAccount).catch(() => null) : null;
      if (tsResponse && tsResponse.code === 0 && Array.isArray(tsResponse.result)) {
        tracksolidResolved = true;
        const cleanUserDigits = (decoded.phone_number || '').replace(/\D/g, '').slice(-9);

        tsResponse.result.forEach((tsDevice) => {
          const existing = devicesMap.get(tsDevice.imei);
          const devPhoneDigits = (tsDevice.driverPhone || '').replace(/\D/g, '').slice(-9);
          const isUserDevice =
            existing ||
            (cleanUserDigits && devPhoneDigits && cleanUserDigits === devPhoneDigits);

          if (isUserDevice) {
            devicesMap.set(tsDevice.imei, {
              ...(existing || {}),
              id: existing?.id || `device_${tsDevice.imei}`,
              imei: tsDevice.imei,
              deviceName: existing?.deviceName || tsDevice.deviceName,
              model: tsDevice.mcType || 'Sentinel Node PB709',
              category: tsDevice.mcTypeUseScope || 'personal',
              sim: tsDevice.sim,
              expiration: tsDevice.expiration,
              activationTime: tsDevice.activationTime,
              nickname: existing?.nickname || tsDevice.deviceName || `Device ${tsDevice.imei.slice(-4)}`,
              status: 'active',
              uid: decoded.uid,
            });
          }
        });

        // Always purge typo 980980820010378
        devicesMap.delete('980980820010378');
      }
    } catch (tsErr) {
      console.warn('[api/devices] TrackSolid listDevices non-blocking note:', tsErr.message);
    }

    // 4. Enrich with live location telemetry if devices exist
    if (devicesMap.size > 0) {
      try {
        const imeis = Array.from(devicesMap.keys()).filter((i) => /^\d{15}$/.test(i)).join(',');
        if (imeis) {
          const locRes = await getDeviceLocation(imeis).catch(() => null);
          if (locRes && locRes.code === 0 && locRes.result) {
            const locList = Array.isArray(locRes.result) ? locRes.result : [locRes.result];
            locList.forEach((loc) => {
              const dev = devicesMap.get(loc.imei);
              if (dev) {
                const lat = parseFloat(loc.lat);
                const lng = parseFloat(loc.lng);
                const hasGps = !isNaN(lat) && !isNaN(lng);
                const isVillage = hasGps && Math.abs(lat - (-29.5282)) < 0.02 && Math.abs(lng - 31.2111) < 0.02;

                dev.lat = hasGps ? lat : null;
                dev.lng = hasGps ? lng : null;
                dev.speed = parseFloat(loc.speed) || 0;
                dev.batteryLevel = batteryPercent(loc.batteryPowerVal ?? loc.electricity ?? loc.batteryLevel);
                dev.signalStrength = loc.gsmSignal ?? loc.signalStrength ?? loc.rssi ?? null;
                dev.lastAddress = loc.address || (hasGps ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Awaiting GPS fix...');
                dev.isOnline = loc.status === '0' || loc.status === '1' || loc.status === 'online' || loc.status === 'NORMAL';
                dev.status = dev.isOnline ? 'active' : 'inactive';
                dev.updatedAt = loc.gpsTime || null;
                dev.checkedAt = Date.now();
              }
            });
          }
        }
      } catch (locErr) {
        console.warn('[api/devices] Live location enrichment note:', locErr.message);
      }
    }

    const devices = Array.from(devicesMap.values());
    return NextResponse.json({ devices, source: 'unified', tracksolidResolved });
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
    const existingDevice = await getAdminFirestore().collection('devices').doc(deviceDocId).get();
    if (existingDevice.exists && existingDevice.data()?.uid !== decoded.uid) return NextResponse.json({ error: 'This device is already linked to another account.' }, { status: 409 });
    const cleanNickname = (nickname || '').trim() || `Sentinel ${cleanImei.slice(-4)}`;

    // Resolve TrackSolid account
    let tracksolidAccount = process.env.TRACKSOLID_USER_ID;
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
      if (!tracksolidAccount) throw new Error('TrackSolid is not configured.');
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

export async function DELETE(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const imei = searchParams.get('imei');

    if (!id && !imei) {
      return NextResponse.json({ error: 'Missing device id or imei' }, { status: 400 });
    }

    const docId = id || `device_${imei}`;
    const cleanImei = imei || id?.replace('device_', '');

    globalDevices.delete(cleanImei);

    try {
      const firestore = getAdminFirestore();
      await firestore.collection('devices').doc(docId).delete();
    } catch (fsErr) {
      console.warn('[api/devices] Firestore DELETE error:', fsErr.message);
    }

    return NextResponse.json({ success: true, message: 'Device removed' });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices] DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
