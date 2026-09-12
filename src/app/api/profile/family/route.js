import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function failure(error) {
  return NextResponse.json({ error: error.message === 'UNAUTHENTICATED' ? 'Please sign in again.' : 'Family members could not be saved or loaded. Please retry.' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 503 });
}

export async function GET(request) {
  try {
    const { uid } = await authenticateFirebaseRequest(request, { allowUnverified: true });
    const snapshot = await getAdminFirestore().collection('households').doc(uid).get();
    // null distinguishes legacy device-only lists from an explicitly empty saved list.
    return NextResponse.json({ members: snapshot.data()?.members ?? null }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}

export async function PUT(request) {
  try {
    const { uid } = await authenticateFirebaseRequest(request, { allowUnverified: true });
    const raw = await request.text();
    if (raw.length > 50000) return NextResponse.json({ error: 'Family list is too large.' }, { status: 413 });
    const { members } = JSON.parse(raw);
    if (!Array.isArray(members) || members.length > 30 || members.some(m =>
      !m || typeof m.id !== 'string' || !m.id || m.id.length > 128 ||
      typeof m.name !== 'string' || !m.name.trim() || m.name.length > 160 ||
      typeof m.phone !== 'string' || m.phone.length > 40 ||
      !['Admin', 'Member', 'Child'].includes(m.role)
    ) || new Set(members.map(m => m.id)).size !== members.length) {
      return NextResponse.json({ error: 'Enter valid family details (up to 30 members).' }, { status: 400 });
    }
    const firestore = getAdminFirestore();
    const ref = firestore.collection('households').doc(uid);
    const saved = await firestore.runTransaction(async tx => {
      const existing = (await tx.get(ref)).data()?.members || [];
      const list = members.map(m => {
        const previous = existing.find(item => item.id === m.id);
        return { id: m.id, name: m.name.trim(), phone: m.phone.trim(), role: m.role,
          isSelf: m.id === uid, locationSharing: m.locationSharing === true,
          // These fields are controlled by invitation redemption, never the client.
          ...(previous?.linkedUid ? { linkedUid: previous.linkedUid, joinedAt: previous.joinedAt } : {}),
          ...(previous?.inviteHash ? { inviteHash: previous.inviteHash, inviteExpiresAt: previous.inviteExpiresAt } : {}),
        };
      });
      tx.set(ref, { members: list, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return list;
    });
    return NextResponse.json({ members: saved });
  } catch (error) { return failure(error); }
}
