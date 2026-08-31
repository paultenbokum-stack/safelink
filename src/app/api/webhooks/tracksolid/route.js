/**
 * TrackSolid Pro Webhook Receiver
 *
 * Receives real-time push notifications from JIMI IoT servers:
 * - Device alarms (SOS, vibration, low battery, geofence breach)
 * - GPS position updates
 * - BLE TAG position data
 * - Device online/offline status
 *
 * This endpoint is registered with TrackSolid Pro during API setup.
 * POST https://your-domain.com/api/webhooks/tracksolid
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Alarm type mapping from JIMI's alarm codes to SafeLink alarm types
const ALARM_TYPE_MAP = {
  'SOS':              'sos',
  'LOW_BATTERY':      'low_battery',
  'VIBRATION':        'vibration',
  'FENCE_IN':         'geofence_enter',
  'FENCE_OUT':        'geofence_exit',
  'POWER_OFF':        'power_off',
  'POWER_ON':         'power_on',
  'OVERSPEED':        'overspeed',
  'TAMPER':           'tamper',
  'FALL_DOWN':        'fall_detected',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const firestore = getAdminFirestore();

    // JIMI pushes can be alarm, location, tag, or status events
    // Determine type from the payload structure
    const eventType = determineEventType(body);

    switch (eventType) {
      case 'alarm':
        return handleAlarmPush(body, firestore);
      case 'location':
        return handleLocationPush(body, firestore);
      case 'tag':
        return handleTagPush(body, firestore);
      case 'status':
        return handleStatusPush(body, firestore);
      default:
        console.warn('[webhook/tracksolid] Unknown event type:', JSON.stringify(body).slice(0, 200));
        return NextResponse.json({ received: true });
    }
  } catch (err) {
    console.error('[webhook/tracksolid] Error:', err);
    // Always return 200 to prevent JIMI from retrying
    return NextResponse.json({ received: true, error: err.message });
  }
}

function determineEventType(body) {
  if (body.alarmType || body.alarm_type) return 'alarm';
  if (body.tagData || body.tag_data) return 'tag';
  if (body.deviceStatus || body.device_status) return 'status';
  if (body.lat !== undefined || body.lng !== undefined) return 'location';
  return 'unknown';
}

/**
 * Handle alarm push: SOS, geofence breach, vibration, low battery.
 * Writes to Firestore 'device_alerts' collection.
 * If SOS alarm, also creates an incident for Aura escalation.
 */
async function handleAlarmPush(body, firestore) {
  const imei = body.imei || body.IMEI;
  const alarmCode = body.alarmType || body.alarm_type;
  const safelinkAlarmType = ALARM_TYPE_MAP[alarmCode] || alarmCode;

  const alert = {
    imei,
    alarmType: safelinkAlarmType,
    rawAlarmCode: alarmCode,
    lat: parseFloat(body.lat) || null,
    lng: parseFloat(body.lng) || null,
    speed: parseFloat(body.speed) || 0,
    address: body.address || null,
    deviceTime: body.gpsTime || body.gps_time || null,
    receivedAt: FieldValue.serverTimestamp(),
    processed: false,
  };

  // Write to device_alerts collection
  const alertRef = await firestore.collection('device_alerts').add(alert);

  // If this is an SOS alarm, create an incident for Aura escalation
  if (safelinkAlarmType === 'sos') {
    // Find the user who owns this device
    const deviceQuery = await firestore
      .collection('devices')
      .where('imei_plain', '==', imei)
      .limit(1)
      .get();

    if (!deviceQuery.empty) {
      const deviceDoc = deviceQuery.docs[0];
      const uid = deviceDoc.data().uid;

      await firestore.collection('incidents').add({
        uid,
        imei,
        type: 'sos',
        source: 'device_button',
        lat: alert.lat,
        lng: alert.lng,
        address: alert.address,
        status: 'pending_dispatch',
        alertId: alertRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // Update device's last alert timestamp
  await updateDeviceLastAlert(firestore, imei, safelinkAlarmType);

  console.log(`[webhook/tracksolid] Alarm received: ${imei} → ${safelinkAlarmType}`);
  return NextResponse.json({ received: true, alertId: alertRef.id });
}

/**
 * Handle GPS position push — update device's live location in Firestore.
 */
async function handleLocationPush(body, firestore) {
  const imei = body.imei || body.IMEI;
  const location = {
    lat: parseFloat(body.lat),
    lng: parseFloat(body.lng),
    speed: parseFloat(body.speed) || 0,
    direction: parseFloat(body.direction) || 0,
    gpsTime: body.gpsTime || body.gps_time,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Update device_locations collection (one doc per IMEI, overwritten)
  await firestore.collection('device_locations').doc(imei).set(location, { merge: true });

  return NextResponse.json({ received: true });
}

/**
 * Handle BLE TAG position push — update TAG device location.
 */
async function handleTagPush(body, firestore) {
  const tagData = body.tagData || body.tag_data || body;
  const entries = Array.isArray(tagData) ? tagData : [tagData];

  const batch = firestore.batch();
  for (const tag of entries) {
    const imei = tag.imei || tag.IMEI;
    if (!imei) continue;

    const ref = firestore.collection('device_locations').doc(imei);
    batch.set(ref, {
      lat: parseFloat(tag.lat) || null,
      lng: parseFloat(tag.lng) || null,
      tagRssi: tag.rssi || null,
      tagBattery: tag.battery || null,
      isTag: true,
      gpsTime: tag.gpsTime || tag.gps_time || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
  return NextResponse.json({ received: true, count: entries.length });
}

/**
 * Handle device online/offline status push.
 */
async function handleStatusPush(body, firestore) {
  const imei = body.imei || body.IMEI;
  const isOnline = body.deviceStatus === 'online' || body.device_status === 'online';

  await firestore.collection('device_status').doc(imei).set({
    imei,
    online: isOnline,
    lastStatusChange: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({ received: true });
}

/**
 * Helper: update device's last alert info.
 */
async function updateDeviceLastAlert(firestore, imei, alarmType) {
  try {
    await firestore.collection('device_status').doc(imei).set({
      lastAlarmType: alarmType,
      lastAlarmAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[webhook/tracksolid] Failed to update device alert status:', err.message);
  }
}
