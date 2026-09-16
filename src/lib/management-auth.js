import { authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const BUILTIN_ADMIN_UIDS = ['WtPfmIUEJCOooQDDtarxhsYrdq23'];
const BUILTIN_ADMIN_EMAILS = ['hello@guestwave.co', 'kyle@creamtech.co.za', 'clansaffy@gmail.com'];

// Management access is provisioned on the server, never from a tenant ID in a request.
export function isManagementAdmin(user) {
  if (!user?.uid) return false;

  const envUids = (process.env.CREAM_ADMIN_UIDS || '').split(',').map(value => value.trim()).filter(Boolean);
  const uids = [...BUILTIN_ADMIN_UIDS, ...envUids];

  const envEmails = (process.env.CREAM_ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const emails = [...BUILTIN_ADMIN_EMAILS, ...envEmails];

  if (user.admin === true || uids.includes(user.uid)) return true;

  const userEmail = typeof user.email === 'string' ? user.email.toLowerCase() : '';
  if (userEmail && emails.includes(userEmail)) {
    if (BUILTIN_ADMIN_EMAILS.includes(userEmail) || user.email_verified === true) {
      return true;
    }
  }

  return false;
}

export async function managementAccessError(request) {
  try {
    const user = await authenticateFirebaseRequest(request, { allowUnverified: true });
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Management access is required.' }, { status: 403 });
    return null;
  } catch {
    return NextResponse.json({ error: 'Please sign in to access management.' }, { status: 401 });
  }
}
