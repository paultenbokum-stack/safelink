import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { isManagementAdmin } from '@/lib/management-auth';

/**
 * GET /api/cream/invites
 * List pending/active company invite links
 */
export async function GET(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const db = getAdminFirestore();
    const snap = await db.collection('companyInvites').orderBy('createdAt', 'desc').limit(50).get();
    const invites = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ invites });
  } catch (err) {
    console.error('[api/cream/invites] GET Error:', err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to load invites.' }, { status: 500 });
  }
}

/**
 * POST /api/cream/invites
 * Create a new self-service signup invite token for a security company
 */
export async function POST(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const body = await request.json();
    const { companyName, contactEmail, notes } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const db = getAdminFirestore();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

    await db.collection('companyInvites').doc(token).set({
      token,
      companyName,
      contactEmail: contactEmail || '',
      notes: notes || '',
      status: 'pending',
      createdBy: user.uid,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
    });

    const inviteUrl = `/company-signup?token=${token}`;

    return NextResponse.json({
      success: true,
      token,
      inviteUrl,
      companyName,
      expiresAt: expiresAt.toDate().toISOString(),
    });
  } catch (err) {
    console.error('[api/cream/invites] POST Error:', err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: err.message || 'Failed to create invite.' }, { status: 500 });
  }
}
