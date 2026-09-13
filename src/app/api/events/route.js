import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore, getFamilyCircleAccess } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    const access = await getFamilyCircleAccess(user);
    // A single-field account query works with the existing project; no new index or rules.
    const snapshots = await Promise.all(access.ownerUids.map(uid => getAdminFirestore().collection('events').where('uid', '==', uid).get()));
    const events = snapshots.flatMap(snap => snap.docs).map((doc) => {
      const e = doc.data();
      const time = e.createdAt || e.timestamp || e.receivedAt;
      return { id: doc.id, title: e.title, description: e.description || e.message, icon: e.icon,
        createdAt: time?.toDate?.().toISOString() || (typeof time === 'string' ? time : null) };
    }).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)).slice(0, 20);
    return NextResponse.json({ events }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Activity unavailable' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 503 });
  }
}
