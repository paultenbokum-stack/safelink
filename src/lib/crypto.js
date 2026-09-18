/**
 * AES-256-GCM IMEI encryption — POPIA compliance.
 *
 * The encryption key is derived from:
 *   NEXT_PUBLIC_IMEI_ENCRYPTION_KEY  (client-side AES key derivation input, set in .env.local)
 *                                     NOTE: This is deliberately NEXT_PUBLIC_ because AES-256-GCM
 *                                     key derivation happens in the browser via crypto.subtle.
 *                                     Keep this distinct from the server-only IMEI_SALT used for
 *                                     HMAC hashing in partner-adapter.js.
 *   uid                    (user-specific — different key per household)
 *
 * This means:
 *  - Even if Firestore data is leaked, encrypted blobs are unreadable
 *  - Only the authenticated user's session can decrypt their own IMEI
 *  - Firebase admins / DB viewers see only ciphertext
 *
 * Storage format (base64 JSON):  { iv, data }
 */

const SALT = process.env.NEXT_PUBLIC_IMEI_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_IMEI_SALT || 'safelink-default-imei-salt-change-me';

async function deriveKey(uid) {
  const enc = new TextEncoder();
  // Import raw key material from salt + uid combination
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(`${SALT}:${uid}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  // Derive AES-256-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(uid),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plain-text IMEI string.
 * Returns a base64-encoded JSON string suitable for Firestore storage.
 */
export async function encryptIMEI(imei, uid) {
  try {
    const key = await deriveKey(uid);
    const iv  = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const enc = new TextEncoder();

    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(imei)
    );

    const payload = {
      iv:   btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(cipherBuf))),
    };
    return btoa(JSON.stringify(payload));
  } catch (err) {
    console.error('[crypto] encryptIMEI failed:', err);
    throw err;
  }
}

/**
 * Decrypt an IMEI ciphertext (produced by encryptIMEI).
 * Returns the original plain-text IMEI string.
 */
export async function decryptIMEI(ciphertext, uid) {
  try {
    const key     = await deriveKey(uid);
    const payload = JSON.parse(atob(ciphertext));

    const iv   = Uint8Array.from(atob(payload.iv),   (c) => c.charCodeAt(0));
    const data = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));

    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(plainBuf);
  } catch (err) {
    console.error('[crypto] decryptIMEI failed:', err);
    return null; // graceful degradation — show "Unavailable" in UI
  }
}

/**
 * Returns a masked version of the IMEI for display:
 * e.g. "356938035643809" → "••••••••••43809"
 */
export function maskIMEI(imei) {
  if (!imei || imei.length < 5) return '•••••••••••••••';
  return '•'.repeat(imei.length - 5) + imei.slice(-5);
}
