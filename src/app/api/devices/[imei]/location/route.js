/**
 * GET /api/devices/[imei]/location — Get real-time GPS location.
 *
 * Returns lat, lng, speed, direction, address, and timestamp
 * for a specific device identified by IMEI.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { getDeviceLocation, getTagLocation } from '@/lib/tracksolid';

export async function GET(request, { params }) {
  try {
    await authenticateFirebaseRequest(request);
    const { imei } = await params;

    if (!imei || !/^\d{15}$/.test(imei)) {
      return NextResponse.json({ error: 'Invalid IMEI' }, { status: 400 });
    }

    // Try GPS device first, then BLE TAG
    let result = await getDeviceLocation(imei);

    if (result.code === 0 && result.result) {
      const locations = Array.isArray(result.result) ? result.result : [result.result];
      const device = locations.find((d) => d.imei === imei) || locations[0];

      if (device) {
        return NextResponse.json({
          imei,
          lat: parseFloat(device.lat),
          lng: parseFloat(device.lng),
          speed: parseFloat(device.speed) || 0,
          direction: parseFloat(device.direction) || 0,
          gpsTime: device.gpsTime || device.positionTime,
          address: device.address || null,
          status: device.status,
          batteryLevel: device.electricity || device.batteryLevel || null,
          isOnline: device.status === '1' || device.status === 'online',
        });
      }
    }

    // Fallback: try TAG location for BLE devices
    const tagResult = await getTagLocation(imei);
    if (tagResult.code === 0 && tagResult.result) {
      const tagData = Array.isArray(tagResult.result) ? tagResult.result[0] : tagResult.result;
      return NextResponse.json({
        imei,
        lat: parseFloat(tagData.lat) || null,
        lng: parseFloat(tagData.lng) || null,
        isTag: true,
        tagRssi: tagData.rssi || null,
        tagBattery: tagData.battery || null,
        gpsTime: tagData.gpsTime || null,
      });
    }

    return NextResponse.json(
      { error: 'Device location not available', code: result.code },
      { status: 404 }
    );
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices/location] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
