import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, getAdminFirestore } from '@/lib/firebase-admin';
import { familyInviteService } from '@/lib/family-invites';

export async function POST(request) {
  try {
    const raw = await request.text();
    if (raw.length > 1000) return NextResponse.json({ error: 'Invalid invitation.' }, { status: 400 });
    const { token, attempt } = JSON.parse(raw);
    const result = await familyInviteService({ firestore: getAdminFirestore(), auth: getAuth(adminApp) }).redeem(token, attempt);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    // Never log the bearer link or custom sign-in token.
    return NextResponse.json({ error: error.status ? error.message : 'Could not join SafeLink. Please retry or ask your guardian for a new link.' }, { status: error.status || 503 });
  }
}
