import 'server-only';

import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

const configuredEmails = () => (process.env.PRESENTATION_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export async function requirePresentationAdmin(request) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');

  const token = authorization.slice(7).trim();
  if (!token || token.length > 4096) throw new Error('UNAUTHENTICATED');

  const decoded = await getAuth(adminApp).verifyIdToken(token, true);
  const email = String(decoded.email || '').toLowerCase();
  const allowed = decoded.presentationAdmin === true || configuredEmails().includes(email);
  if (!allowed) throw new Error('FORBIDDEN');
  return decoded;
}
