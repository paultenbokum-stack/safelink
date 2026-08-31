/**
 * POST /api/sos/dispatch — Dispatch an emergency response.
 * POST /api/sos/cancel — Cancel an active dispatch.
 * GET  /api/sos/status — Get incident status.
 */
import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { dispatchEmergency, cancelDispatch, getIncidentStatus } from '@/lib/aura';
import { hasFeature } from '@/lib/subscriptions';

export async function POST(request) {
  try {
    const decoded = await authenticateFirebaseRequest(request);
    const body = await request.json();
    const { action } = body;

    // Check subscription tier — SOS requires Standard or Premium
    const firestore = getAdminFirestore();
    const householdDoc = await firestore.collection('households').doc(decoded.uid).get();
    const tier = householdDoc.data()?.subscription?.tier || 'free';

    if (!hasFeature(tier, 'sos_dispatch')) {
      return NextResponse.json({
        error: 'SOS dispatch requires a Standard or Premium subscription',
        requiredTier: 'standard',
        currentTier: tier,
        upgradeUrl: '/subscribe',
      }, { status: 403 });
    }

    if (action === 'cancel') {
      const { incidentId, reason } = body;
      if (!incidentId) {
        return NextResponse.json({ error: 'Missing incidentId' }, { status: 400 });
      }
      const result = await cancelDispatch(incidentId, decoded.uid, reason);
      return NextResponse.json(result);
    }

    if (action === 'status') {
      const { incidentId } = body;
      if (!incidentId) {
        return NextResponse.json({ error: 'Missing incidentId' }, { status: 400 });
      }
      const incident = await getIncidentStatus(incidentId);
      if (!incident || incident.uid !== decoded.uid) {
        return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
      }
      return NextResponse.json({ incident });
    }

    // Default action: dispatch
    const { type, lat, lng, address } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Location (lat, lng) is required' }, { status: 400 });
    }

    // Get user profile for contact info
    const profile = householdDoc.data() || {};
    const partnerCode = profile.securityPartner || null;

    const result = await dispatchEmergency({
      uid: decoded.uid,
      type: type || 'armed_response',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address,
      contactName: profile.adminFirstName
        ? `${profile.adminFirstName} ${profile.adminLastName || ''}`
        : decoded.email,
      contactPhone: profile.phone || decoded.phone_number || '',
      partnerCode,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[api/sos/dispatch] Error:', err);
    return NextResponse.json({ error: 'Dispatch failed', message: err.message }, { status: 500 });
  }
}
