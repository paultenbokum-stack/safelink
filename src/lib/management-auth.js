import { authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

// Management access is provisioned on the server, never from a tenant ID in a request.
export function isManagementAdmin(user) {
  const uids = (process.env.CREAM_ADMIN_UIDS || '').split(',').map(value => value.trim()).filter(Boolean);
  const emails = (process.env.CREAM_ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  return !!user?.uid && (uids.includes(user.uid) || (user.email_verified === true && typeof user.email === 'string' && emails.includes(user.email.toLowerCase())));
}

export async function managementAccessError(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Management access is required.' }, { status: 403 });
    return null;
  } catch {
    return NextResponse.json({ error: 'Please sign in to access management.' }, { status: 401 });
  }
}
