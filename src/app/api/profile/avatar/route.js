import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/profile/avatar
 * Update user & household profile avatar image in Firestore.
 */
export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request, { allowUnverified: true });
    const body = await request.json();
    const uid = decoded.uid;
    const { avatarUrl } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    if (typeof avatarUrl !== 'string' || !/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(avatarUrl)) {
      return NextResponse.json({ error: 'Please select a valid profile image.' }, { status: 400 });
    }
    if (Buffer.byteLength(avatarUrl, 'utf8') > 750000) {
      return NextResponse.json({ error: 'This picture is too large. Please choose a smaller image.' }, { status: 413 });
    }

    const firestore = getAdminFirestore();

    const batch = firestore.batch();
    batch.set(firestore.collection('households').doc(uid), {
      avatarUrl,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Also update users collection if exists
    batch.set(firestore.collection('users').doc(uid), {
      photoURL: avatarUrl,
      avatarUrl,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await batch.commit();
    return NextResponse.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('[api/profile/avatar] Error:', err);
    return NextResponse.json({ error: err.message === 'UNAUTHENTICATED' ? 'Please sign in again to save your picture.' : 'Your picture could not be saved. Please try again.' }, { status: err.message === 'UNAUTHENTICATED' ? 401 : 500 });
  }
}

export async function GET(request) {
  try {
    const { uid } = await authenticateFirebaseRequest(request, { allowUnverified: true });
    const snapshot = await getAdminFirestore().collection('households').doc(uid).get();
    return NextResponse.json({ avatarUrl: snapshot.data()?.avatarUrl || null }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return NextResponse.json({ error: 'Profile picture unavailable.' }, { status: err.message === 'UNAUTHENTICATED' ? 401 : 503 });
  }
}
