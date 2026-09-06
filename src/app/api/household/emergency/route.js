import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request).catch(() => null);
    const body = await request.json();
    const uid = decoded?.uid || body.uid;

    if (!uid) {
      return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    await firestore.collection('households').doc(uid).set({
      emergency: body.emergency || {},
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/household/emergency] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
