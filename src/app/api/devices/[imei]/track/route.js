/**
 * GET /api/devices/[imei]/track — Get historical track/route data for playback.
 *
 * Query params:
 *   from - Start time UTC (yyyy-MM-dd HH:mm:ss)
 *   to   - End time UTC (yyyy-MM-dd HH:mm:ss)
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, assertDeviceFamilyAccess } from '@/lib/firebase-admin';
import { getTrackHistory, getDeviceMileage } from '@/lib/tracksolid';

export async function GET(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    const { imei } = await params;
    const { searchParams } = new URL(request.url);
    const beginTime = searchParams.get('from');
    const endTime = searchParams.get('to');
    const includeMileage = searchParams.get('mileage') === 'true';

    if (!imei || !/^\d{15}$/.test(imei)) {
      return NextResponse.json({ error: 'Invalid IMEI' }, { status: 400 });
    }
    await assertDeviceFamilyAccess(user, imei);

    // Default to last 8 hours
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const formatUTC = (d) =>
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

    const from = beginTime || formatUTC(eightHoursAgo);
    const to = endTime || formatUTC(now);

    const trackResult = await getTrackHistory(imei, from, to);

    const response = {
      track: trackResult.code === 0 ? trackResult.result : [],
      timeRange: { from, to },
      error: trackResult.code !== 0 ? trackResult.message : undefined,
    };

    // Optionally include mileage data
    if (includeMileage) {
      const mileageResult = await getDeviceMileage(imei, from, to);
      response.mileage = mileageResult.code === 0 ? mileageResult.result : null;
    }

    return NextResponse.json(response);
  } catch (err) {
    if (err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices/track] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
