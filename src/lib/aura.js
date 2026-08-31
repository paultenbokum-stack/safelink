/**
 * Aura Dispatch API — Service Layer (Stub)
 *
 * This module will handle communication with the Aura SOS dispatch API
 * once the partnership is formalised and API credentials are provided.
 *
 * Aura (aurasos.com) is the "Stripe of armed response" — they provide
 * the dispatch infrastructure that connects to verified armed response
 * companies across South Africa.
 *
 * Until the Aura API is live, this module provides a mock implementation
 * that logs incidents to Firestore and simulates the dispatch flow.
 */
import 'server-only';

import { getAdminFirestore } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const AURA_CONFIG = {
  apiKey:        process.env.AURA_API_KEY        || '',
  apiUrl:        process.env.AURA_API_URL         || '',
  webhookSecret: process.env.AURA_WEBHOOK_SECRET  || '',
  isLive:        !!process.env.AURA_API_KEY,
};

/* ─── Dispatch Types ──────────────────────────────────────────── */

export const DISPATCH_TYPES = {
  ARMED_RESPONSE: 'armed_response',
  MEDICAL:        'medical',
  FIRE:           'fire',
  ROADSIDE:       'roadside_towing',
};

/* ─── Core Dispatch Function ──────────────────────────────────── */

/**
 * Dispatch an emergency response.
 *
 * @param {object} opts
 * @param {string} opts.uid - User ID.
 * @param {string} opts.type - Dispatch type from DISPATCH_TYPES.
 * @param {number} opts.lat - Latitude.
 * @param {number} opts.lng - Longitude.
 * @param {string} opts.address - Human-readable address (optional).
 * @param {string} opts.contactName - User's display name.
 * @param {string} opts.contactPhone - User's phone number.
 * @param {string} opts.partnerCode - Security company partner code (Premium tier).
 * @returns {object} Dispatch result with incident ID and ETA.
 */
export async function dispatchEmergency({
  uid,
  type = DISPATCH_TYPES.ARMED_RESPONSE,
  lat,
  lng,
  address,
  contactName,
  contactPhone,
  partnerCode,
}) {
  const firestore = getAdminFirestore();

  // Create incident record in Firestore
  const incident = {
    uid,
    type,
    lat,
    lng,
    address: address || 'Location pending',
    contactName: contactName || 'Unknown',
    contactPhone: contactPhone || '',
    partnerCode: partnerCode || null,
    status: 'dispatching',
    dispatchMethod: AURA_CONFIG.isLive ? 'aura' : 'mock',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const incidentRef = await firestore.collection('incidents').add(incident);
  const incidentId = incidentRef.id;

  if (AURA_CONFIG.isLive) {
    // ── LIVE: Call Aura API ──────────────────────────────────
    try {
      const auraResponse = await fetch(`${AURA_CONFIG.apiUrl}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AURA_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          type,
          location: { lat, lng },
          address,
          contact: { name: contactName, phone: contactPhone },
          externalRef: incidentId,
          partnerCode,
        }),
      });

      const auraResult = await auraResponse.json();

      await incidentRef.update({
        status: 'dispatched',
        auraRef: auraResult.id || auraResult.reference,
        auraEta: auraResult.eta || null,
        auraResponder: auraResult.responder || null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        incidentId,
        status: 'dispatched',
        eta: auraResult.eta,
        responder: auraResult.responder,
        message: 'Help is on the way',
      };
    } catch (err) {
      console.error('[aura] Dispatch API call failed:', err);
      await incidentRef.update({
        status: 'dispatch_failed',
        error: err.message,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        incidentId,
        status: 'dispatch_failed',
        message: 'Dispatch failed — please call 10111',
        fallbackNumber: '10111',
      };
    }
  } else {
    // ── MOCK: Simulate dispatch ────────────────────────────
    console.log(`[aura/mock] 🚨 SOS Dispatched: ${type} → ${lat}, ${lng}`);

    await incidentRef.update({
      status: 'dispatched',
      auraRef: `MOCK-${Date.now()}`,
      auraEta: '8-12 minutes',
      auraResponder: {
        company: partnerCode || 'SafeLink Demo Response',
        vehicle: 'AR-001',
        officer: 'Demo Officer',
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      incidentId,
      status: 'dispatched',
      eta: '8-12 minutes',
      responder: {
        company: partnerCode || 'SafeLink Demo Response',
        vehicle: 'AR-001',
      },
      message: 'Help is on the way (demo mode)',
      isMock: true,
    };
  }
}

/**
 * Cancel an active dispatch / false alarm.
 */
export async function cancelDispatch(incidentId, uid, reason) {
  const firestore = getAdminFirestore();
  const incidentRef = firestore.collection('incidents').doc(incidentId);
  const incident = await incidentRef.get();

  if (!incident.exists || incident.data().uid !== uid) {
    throw new Error('Incident not found or unauthorized');
  }

  if (AURA_CONFIG.isLive && incident.data().auraRef) {
    // Cancel via Aura API
    try {
      await fetch(`${AURA_CONFIG.apiUrl}/dispatch/${incident.data().auraRef}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AURA_CONFIG.apiKey}`,
        },
        body: JSON.stringify({ reason: reason || 'False alarm' }),
      });
    } catch (err) {
      console.error('[aura] Cancel API call failed:', err);
    }
  }

  await incidentRef.update({
    status: 'cancelled',
    cancelReason: reason || 'False alarm',
    cancelledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, message: 'Dispatch cancelled' };
}

/**
 * Get incident status.
 */
export async function getIncidentStatus(incidentId) {
  const firestore = getAdminFirestore();
  const doc = await firestore.collection('incidents').doc(incidentId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
