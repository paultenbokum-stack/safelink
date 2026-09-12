/**
 * POST /api/devices/[imei]/command — Send a command to a Sentinel device.
 *
 * Supports: alarm test, arm/disarm, siren, locate.
 */
import { NextResponse } from 'next/server';
import { assertDeviceOwnership, authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { sendCommand, getCommandList, getCommandResult } from '@/lib/tracksolid';

export async function POST(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    const { imei } = await params;
    const body = await request.json();
    const { action, instructionId } = body;

    if (!imei || !/^\d{15}$/.test(imei)) {
      return NextResponse.json({ error: 'Invalid IMEI' }, { status: 400 });
    }

    await assertDeviceOwnership(user.uid, imei);

    // Action: list available commands for this device
    if (action === 'list') {
      const result = await getCommandList(imei);
      return NextResponse.json({
        commands: result.code === 0 ? result.result : [],
        error: result.code !== 0 ? result.message : undefined,
      });
    }

    // Action: check result of a previous command
    if (action === 'result' && body.cmdId) {
      const result = await getCommandResult(body.cmdId);
      return NextResponse.json({
        result: result.code === 0 ? result.result : null,
        error: result.code !== 0 ? result.message : undefined,
      });
    }

    // Action: send command
    if (!instructionId) {
      return NextResponse.json({ error: 'Missing instructionId' }, { status: 400 });
    }

    const result = await sendCommand(imei, instructionId, body.params || {});
    return NextResponse.json({
      success: result.code === 0,
      cmdId: result.result?.cmdId || result.result?.cmd_id,
      message: result.message,
    });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'You do not have access to this device.' }, { status: 403 });
    }
    console.error('[api/devices/command] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
