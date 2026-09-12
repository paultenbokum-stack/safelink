import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { familyInviteService } from '@/lib/family-invites';

async function manage(request, revoke) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (user.familyMember) return NextResponse.json({ error: 'Only guardians can invite family members.' }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 1000) return NextResponse.json({ error: 'Invalid invitation request.' }, { status: 400 });
    const { memberId } = JSON.parse(raw);
    if (typeof memberId !== 'string' || memberId.length > 128) return NextResponse.json({ error: 'Choose a family member.' }, { status: 400 });
    const result = await familyInviteService({ firestore: getAdminFirestore(), auth: getAuth(adminApp) }).issue(user.uid, memberId, revoke);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error.status ? error.message : 'Could not update the invitation. Please retry.' }, { status: error.message === 'UNAUTHENTICATED' ? 401 : error.status || 503 });
  }
}
export const POST = request => manage(request, false);
export const DELETE = request => manage(request, true);
