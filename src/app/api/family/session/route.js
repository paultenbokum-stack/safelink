import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!user.familyMember) return NextResponse.json({ error: 'This page is for invited family members.' }, { status: 403 });
    const household = (await getAdminFirestore().collection('households').doc(user.guardianUid).get()).data();
    const member = household?.members?.find(m => m.id === user.familyMemberId && m.linkedUid === user.uid);
    if (!member) return NextResponse.json({ error: 'Your family access has ended. Ask your guardian for a new invitation.' }, { status: 403 });
    return NextResponse.json({ name: member.name, householdName: household.householdName || 'My Family' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Your family access could not be verified. Retry, or ask your guardian for a new invitation.' }, { status: 401 });
  }
}
