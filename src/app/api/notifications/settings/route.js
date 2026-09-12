import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { normalizePreferences } from '@/lib/notification-policy';

async function handle(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    const db = getAdminFirestore();
    const ref = db.collection('notificationPreferences').doc(user.uid);
    if (request.method === 'GET') return NextResponse.json({ preferences: normalizePreferences((await ref.get()).data()) });
    const raw = await request.text();
    if (raw.length > 10000) return NextResponse.json({ error: 'Request too large' }, { status: 400 });
    const body = JSON.parse(raw);
    if (body.preferences) await ref.set(normalizePreferences(body.preferences));
    if (body.token != null) {
      if (typeof body.token !== 'string' || body.token.length < 20 || body.token.length > 4096) return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
      const tokenRef = db.collection('notificationPushTokens').doc(createHash('sha256').update(body.token).digest('hex'));
      if (body.remove === true) {
        await db.runTransaction(async tx => { const existing = (await tx.get(tokenRef)).data(); if (existing?.uid === user.uid) tx.delete(tokenRef); });
      } else {
        await tokenRef.set({ uid: user.uid, token: body.token, updatedAt: Date.now(), expiresAt: Date.now() + 30 * 86400000 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: error.message === 'UNAUTHENTICATED' ? 'Please sign in again.' : 'Notification settings could not be saved.' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 400 }); }
}
export const GET = handle;
export const POST = handle;
