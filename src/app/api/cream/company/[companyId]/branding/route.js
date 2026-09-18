import { NextResponse } from 'next/server';
import { getCompanyBranding, saveCompanyBranding } from '@/lib/branding-store';
import { authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { isManagementAdmin } from '@/lib/management-auth';

/**
 * GET /api/cream/company/[companyId]/branding
 * Fetch white-label styling and branding configuration for a security company.
 *
 * Requires a valid Firebase ID token. Any authenticated user may read branding
 * (so the app can apply the correct theme), but the endpoint is not public.
 */
export async function GET(request, { params }) {
  try {
    // Require authentication — branding is not a public endpoint.
    await authenticateFirebaseRequest(request, { allowUnverified: true });

    const resolvedParams = await params;
    const companyId = resolvedParams?.companyId || 'sovereign_intervention';
    const branding = await getCompanyBranding(companyId);
    return NextResponse.json({ branding, success: true });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Please sign in to load branding.' }, { status: 401 });
    }
    console.error('[api/cream/branding] Error in GET:', err);
    return NextResponse.json({ error: 'Failed to load branding' }, { status: 500 });
  }
}

/**
 * POST /api/cream/company/[companyId]/branding
 * Update white-label styling and branding configuration for a security company.
 *
 * Requires management admin access (CREAM only).
 */
export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const companyId = resolvedParams?.companyId || 'sovereign_intervention';

    // Require management admin authentication — branding writes are CREAM-only.
    const authUser = await authenticateFirebaseRequest(request, { allowUnverified: false });
    if (!isManagementAdmin(authUser)) {
      return NextResponse.json({ error: 'Management access is required to update branding.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid branding payload' }, { status: 400 });
    }

    const updated = await saveCompanyBranding(companyId, body);
    return NextResponse.json({ branding: updated, success: true, message: 'Branding updated successfully' });
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Please sign in to update branding.' }, { status: 401 });
    }
    console.error('[api/cream/branding] Error in POST:', err);
    return NextResponse.json({ error: 'Failed to save branding: ' + err.message }, { status: 500 });
  }
}
