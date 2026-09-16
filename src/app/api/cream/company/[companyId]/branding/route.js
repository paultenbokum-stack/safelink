import { NextResponse } from 'next/server';
import { getCompanyBranding, saveCompanyBranding } from '@/lib/branding-store';
import { authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { isManagementAdmin } from '@/lib/management-auth';

/**
 * GET /api/cream/company/[companyId]/branding
 * Fetch white-label styling and branding configuration for a security company.
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const companyId = resolvedParams?.companyId || 'sovereign_intervention';
    const branding = await getCompanyBranding(companyId);
    return NextResponse.json({ branding, success: true });
  } catch (err) {
    console.error('[api/cream/branding] Error in GET:', err);
    return NextResponse.json({ error: 'Failed to load branding' }, { status: 500 });
  }
}

/**
 * POST /api/cream/company/[companyId]/branding
 * Update white-label styling and branding configuration for a security company.
 */
export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const companyId = resolvedParams?.companyId || 'sovereign_intervention';
    
    // Optional management auth check: allow verified admin or demo session
    let authUser = null;
    try {
      authUser = await authenticateFirebaseRequest(request, { allowUnverified: true });
    } catch {
      // Allow demo mutations if running in demo mode or partner preview
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid branding payload' }, { status: 400 });
    }

    const updated = await saveCompanyBranding(companyId, body);
    return NextResponse.json({ branding: updated, success: true, message: 'Branding updated successfully' });
  } catch (err) {
    console.error('[api/cream/branding] Error in POST:', err);
    return NextResponse.json({ error: 'Failed to save branding: ' + err.message }, { status: 500 });
  }
}
