import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { drainPushQueue } from '@/lib/notification-push';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (!expected || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await drainPushQueue());
}
