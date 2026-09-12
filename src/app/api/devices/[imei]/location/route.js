/**
 * GET /api/devices/[imei]/location — Get real-time GPS location.
 *
 * Returns lat, lng, speed, direction, address, and timestamp
 * for a specific device identified by IMEI.
 */
import { batteryPercent } from '@/lib/telemetry';
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, assertDeviceOwnership } from '@/lib/firebase-admin';
import { getDeviceLocation, getTagLocation } from '@/lib/tracksolid';

export async function GET(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    const { imei } = await params;

    if (!imei || !/^\d{15}$/.test(imei)) {
      return NextResponse.json({ error: 'Invalid IMEI' }, { status: 400 });
    }

    await assertDeviceOwnership(user.uid, imei);

    // Try GPS device first, then BLE TAG
    let result = await getDeviceLocation(imei);

    if (result.code === 0 && result.result) {
      const locations = Array.isArray(result.result) ? result.result : [result.result];
      const device = locations.find((d) => String(d.imei) === imei) || (locations.length === 1 && !locations[0].imei ? locations[0] : null);

      if (device) {
        let address = device.address;
        const lat = parseFloat(device.lat);
        const lng = parseFloat(device.lng);

        if (!address && !isNaN(lat) && !isNaN(lng) && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          try {
            const geoRes = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              address = geoData.results?.[0]?.formatted_address || null;
            }
          } catch (geoErr) {
            console.warn('[location] Geocode fallback warning:', geoErr.message);
          }
        }

        return NextResponse.json({
          imei,
          lat,
          lng,
          speed: parseFloat(device.speed) || 0,
          direction: parseFloat(device.direction) || 0,
          gpsTime: device.gpsTime || device.positionTime,
          address: address || (lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : null),
          status: device.status,
          batteryLevel: batteryPercent(device.batteryPowerVal ?? device.electricity ?? device.batteryLevel),
          isOnline: device.status === '0' || device.status === '1' || device.status === 'online' || device.status === 'NORMAL',
          deviceName: device.deviceName || 'Sentinel Tag',
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
        tagBattery: batteryPercent(tagData.battery),
        gpsTime: tagData.gpsTime || null,
      });
    }

    return NextResponse.json(
      { error: 'Device location not available', code: result.code },
      { status: 404 }
    );
  } catch (err) {
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices/location] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
