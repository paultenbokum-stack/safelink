import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function failure(error) {
  return NextResponse.json({ error: error.message === 'UNAUTHENTICATED' ? 'Please sign in again.' : 'Family members could not be saved or loaded. Please retry.' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 503 });
}

function isoTime(value) {
  return value?.toDate?.()?.toISOString?.() || value || null;
}

async function addSharingStatus(firestore, guardianUid, members) {
  return Promise.all(members.map(async member => {
    const sharingUid = member.isSelf ? guardianUid : member.linkedUid;
    if (!sharingUid) return { ...member, sharingEnabled: false, lastReportedAt: null };

    if (!member.isSelf) {
      const membership = await firestore.collection('familyMemberships').doc(sharingUid).get();
      const linked = membership.data();
      if (!membership.exists || linked?.guardianUid !== guardianUid || linked?.memberId !== member.id) {
        return { ...member, sharingEnabled: false, lastReportedAt: null };
      }
    }

    const [consent, location] = await Promise.all([
      firestore.collection('phone_sharing_consent').doc(sharingUid).get(),
      firestore.collection('device_locations').doc(`phone_${sharingUid}`).get(),
    ]);
    return {
      ...member,
      sharingEnabled: consent.exists && consent.data()?.consentGranted === true,
      lastReportedAt: location.exists ? isoTime(location.data()?.updatedAt || location.data()?.gpsTime) : null,
    };
  }));
}

export async function GET(request) {
  try {
    const { uid } = await authenticateFirebaseRequest(request, { allowUnverified: true });
    const firestore = getAdminFirestore();
    const snapshot = await firestore.collection('households').doc(uid).get();
    // null distinguishes legacy device-only lists from an explicitly empty saved list.
    const savedMembers = snapshot.data()?.members;
    const members = Array.isArray(savedMembers) ? await addSharingStatus(firestore, uid, savedMembers) : null;
    return NextResponse.json({ members }, { headers: { 'Cache-Control': 'private, no-store' } });
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
