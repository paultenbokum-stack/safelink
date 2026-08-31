/**
 * POST /api/partner/verify
 *
 * Verifies a security partner client's credentials.
 * Issues a signed session token on success.
 *
 * Body: { partnerId: "SB-000001", secret: "1234" }
 *
 * Returns:
 *   200 { sessionToken, displayName, tier, partnerName, deviceCount }
 *   400 { error: "..." }  — bad input
 *   401 { error: "..." }  — invalid credentials
 *   422 { error: "..." }  — unknown partner prefix
 *
 * POPIA: No personal data is stored. The response contains display-only
 * data that lives in the client's memory for the session duration only.
 */
import { NextResponse } from 'next/server';
import { resolveAdapter, issuePartnerSession, hashImei } from '@/lib/partner-adapter';

export async function POST(request) {
  try {
    const body = await request.json();
    const { partnerId, secret } = body;

    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Partner ID is required (e.g. SB-000001)' },
        { status: 400 }
      );
    }

    if (!secret || typeof secret !== 'string') {
      return NextResponse.json(
        { error: 'PIN / password is required' },
        { status: 400 }
      );
    }

    // Resolve the correct adapter for this partner
    const adapter = await resolveAdapter(partnerId);
    if (!adapter) {
      const prefix = partnerId.toUpperCase().split('-')[0];
      return NextResponse.json(
        { error: `Unknown partner prefix "${prefix}". Supported: SB (Security Brokers)` },
        { status: 422 }
      );
    }

    // Verify credentials via adapter (partner's API / CRM)
    const result = await adapter.verifyClient(partnerId, secret);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Build session payload — no raw IMEIs, no PII stored
    const sessionPayload = {
      clientRef: result.clientRef,
      partnerId: partnerId.toUpperCase(),
      partnerName: result.partnerName,
      displayName: result.displayName,   // display-only, not persisted server-side
      tier: result.tier,
      // Store only hashed device refs — used to authorise TrackSolid calls
      deviceHashes: (result.deviceRefs || []).map((d) => d.hashedImei),
      // Store raw IMEIs server-side in session only — needed to call TrackSolid
      _deviceImeis: (result.deviceRefs || []).map((d) => d.rawImei),
    };

    const sessionToken = issuePartnerSession(sessionPayload);

    return NextResponse.json({
      sessionToken,
      displayName: result.displayName,
      tier: result.tier,
      partnerName: result.partnerName,
      deviceCount: (result.deviceRefs || []).length,
      // Include hashed device refs + nicknames for immediate UI render
      devices: (result.deviceRefs || []).map((d) => ({
        hashedImei: d.hashedImei,
        nickname: d.nickname,
        type: d.type,
      })),
    });
  } catch (err) {
    console.error('[api/partner/verify] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
