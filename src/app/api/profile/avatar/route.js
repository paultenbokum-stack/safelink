import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/profile/avatar
 * Update user & household profile avatar image in Firestore.
 */
export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request).catch(() => null);
    const body = await request.json();
    const uid = decoded?.uid || body.uid;
    const { avatarUrl } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    if (!avatarUrl) {
      return NextResponse.json({ error: 'Missing avatar URL' }, { status: 400 });
    }

    const firestore = getAdminFirestore();

    // Update household record
    await firestore.collection('households').doc(uid).set({
      avatarUrl,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Also update users collection if exists
    await firestore.collection('users').doc(uid).set({
      photoURL: avatarUrl,
      avatarUrl,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('[api/profile/avatar] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
