import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export function GET() {
  const version = process.env.NEXT_PUBLIC_APP_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || '1.2.0';
  return NextResponse.json({ version }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
