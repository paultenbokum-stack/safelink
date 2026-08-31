/**
 * GET /api/devices/[imei]/alarms — Get alarm history for a device.
 * GET /api/devices/[imei]/track — Get historical track/route data.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { getAlarmHistory, getTrackHistory } from '@/lib/tracksolid';

export async function GET(request, { params }) {
  try {
    await authenticateFirebaseRequest(request);
    const { imei } = await params;
    const { searchParams } = new URL(request.url);
    const beginTime = searchParams.get('from');
    const endTime = searchParams.get('to');

    if (!imei || !/^\d{15}$/.test(imei)) {
      return NextResponse.json({ error: 'Invalid IMEI' }, { status: 400 });
    }

    // Default to last 24 hours if no time range provided
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const formatUTC = (d) =>
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

    const from = beginTime || formatUTC(yesterday);
    const to = endTime || formatUTC(now);

    const result = await getAlarmHistory(imei, from, to);
    return NextResponse.json({
      alarms: result.code === 0 ? result.result : [],
      timeRange: { from, to },
      error: result.code !== 0 ? result.message : undefined,
    });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/devices/alarms] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
