import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Webhook handler for inbound Aura SOS events.
 * https://docs.aurasos.com/overview/core-concepts/webhooks
 */
export async function POST(request) {
  try {
    const payload = await request.json();
    const eventType = payload.type || payload.event || 'callout.updated';
    const callout = payload.data?.callout || payload.callout || payload;

    const calloutId = callout.id || payload.calloutId;
    if (!calloutId) {
      return NextResponse.json({ received: true, note: 'No calloutId' });
    }

    const firestore = getAdminFirestore();

    // Query incident by auraCalloutId
    const snap = await firestore
      .collection('incidents')
      .where('auraCalloutId', '==', calloutId)
      .limit(1)
      .get();

    if (snap.empty) {
      console.warn('[webhook/aura] No matching incident found for callout:', calloutId);
      return NextResponse.json({ received: true, note: 'Incident not found' });
    }

    const incidentDoc = snap.docs[0];
    const updates = {
      auraStatus: callout.status || eventType,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (callout.status === 'Responder Dispatched') {
      updates.status = 'dispatched';
      if (callout.responder) updates.responder = callout.responder;
      if (callout.eta) updates.eta = callout.eta;
    } else if (callout.status === 'Responder Arrived') {
      updates.status = 'on_scene';
    } else if (callout.status === 'Responder Completed' || callout.status === 'closed') {
      updates.status = 'resolved';
      updates.resolvedAt = FieldValue.serverTimestamp();
    } else if (callout.status === 'Responder Cancelled' || callout.cancelledByCustomer) {
      updates.status = 'cancelled';
    }

    if (callout.responderLocation) {
      updates.responderLocation = callout.responderLocation;
    }

    await incidentDoc.ref.update(updates);

    return NextResponse.json({ success: true, processed: true });
  } catch (err) {
    console.error('[webhook/aura] Error processing webhook:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
