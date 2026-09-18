/**
 * SafeLink Partner Adapter — Base Interface & Registry
 *
 * Security partners (Security Brokers, Thompsons, Marshal's) each implement
 * this interface. SafeLink calls the adapter — never their raw systems directly.
 *
 * POPIA Design:
 *   - Personal data NEVER written to SafeLink's Firestore
 *   - Adapters return only what SafeLink needs to render the UI
 *   - Device IMEIs are hashed before touching the client
 *   - Client identity is an opaque reference from the partner's system
 */
import 'server-only';
import crypto from 'crypto';

/* ─── Base Adapter Class ─────────────────────────────────────────── */

export class PartnerAdapter {
  constructor(partnerId) {
    this.partnerId = partnerId;
  }

  /**
   * Verify a client's credentials against the partner's system.
   * @returns {{ valid: boolean, clientRef: string, displayName: string, tier: string, deviceImeis: string[] }}
   */
  async verifyClient(_clientId, _secret) {
    throw new Error(`${this.constructor.name} must implement verifyClient()`);
  }

  /**
   * Get live device list for a verified client.
   * Returns hashed IMEI references — never raw IMEIs.
   * @returns {{ hashedImei: string, nickname: string|null, type: string }[]}
   */
  async getDevices(_clientRef) {
    throw new Error(`${this.constructor.name} must implement getDevices()`);
  }

  /**
   * Get client profile for display (read-only — not stored by SafeLink).
   * @returns {{ displayName: string, tier: string, partnerName: string, since: string|null }}
   */
  async getClientProfile(_clientRef) {
    throw new Error(`${this.constructor.name} must implement getClientProfile()`);
  }
}

/* ─── IMEI Hashing Utility ───────────────────────────────────────── */

/**
 * One-way hash an IMEI for safe storage.
 * The hash is deterministic — same IMEI always → same hash.
 * TrackSolid calls use the original IMEI server-side; client only ever sees the hash.
 */
export function hashImei(imei) {
  // IMEI_SALT must be a server-only secret — never use NEXT_PUBLIC_ for HMAC keys.
  const salt = process.env.IMEI_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[partner-adapter] IMEI_SALT environment variable is not set. IMEI hashing is unavailable.');
    }
    // Development-only fallback — will never reach production.
    console.warn('[partner-adapter] IMEI_SALT not set; using insecure development fallback.');
  }
  return crypto
    .createHmac('sha256', salt || 'safelink-imei-dev-only-salt')
    .update(String(imei).trim())
    .digest('hex')
    .substring(0, 16); // 16-char reference — unguessable, non-reversible
}

/* ─── Partner Registry ───────────────────────────────────────────── */

/**
 * Maps partner ID prefixes to their adapter.
 * When Security Brokers provides their real API, replace MockPartnerAdapter
 * with SecurityBrokersAdapter — one line change.
 */
const PARTNER_REGISTRY = {};

/**
 * Resolve the correct adapter for a given partner client ID.
 * e.g. "SB-000001" → SecurityBrokersAdapter
 *      "TH-000042" → ThompsonsAdapter (future)
 */
export async function resolveAdapter(partnerId) {
  if (!partnerId || typeof partnerId !== 'string') return null;

  const prefix = partnerId.toUpperCase().split('-')[0];

  // Lazy-load adapters to keep bundle clean
  if (prefix === 'SI') {
    const { MockSovereignInterventionAdapter } = await import('./adapters/mock-partner.js');
    return new MockSovereignInterventionAdapter();
  }

  if (prefix === 'SB') {
    const { MockSecurityBrokersAdapter } = await import('./adapters/mock-partner.js');
    return new MockSecurityBrokersAdapter();
  }

  if (prefix === 'TH') {
    // Future: const { ThompsonsAdapter } = await import('./adapters/thompsons.js');
    return null;
  }

  if (prefix === 'MS') {
    // Future: const { MarshalsAdapter } = await import('./adapters/marshals.js');
    return null;
  }

  return null;
}

/* ─── Session Token Utilities ────────────────────────────────────── */

const SESSION_SECRET = process.env.PARTNER_SESSION_SECRET;

/**
 * Issue a signed partner session token.
 * Contains: clientRef, partnerId, tier, deviceImeis[], iat, exp
 * This is stored in-memory on the client (not localStorage) via auth-context.
 */
export function issuePartnerSession(payload) {
  if (!SESSION_SECRET) {
    throw new Error('Partner sessions are not configured.');
  }
  const data = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 8 * 3600, // 8-hour session
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${sig}`;
}

/**
 * Verify and decode a partner session token.
 * Returns null if invalid or expired.
 */
export function verifyPartnerSession(token) {
  if (!SESSION_SECRET || !token || typeof token !== 'string') return null;

  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (sig !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
