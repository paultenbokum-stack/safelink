/**
 * Mock Security Brokers Partner Adapter
 *
 * Simulates what Security Brokers' API/CRM would return.
 * No personal data is stored in SafeLink — this mock reads from a
 * hardcoded dataset that mirrors their likely account structure.
 *
 * TO UPGRADE TO PRODUCTION:
 *   Replace the MOCK_CLIENTS lookup with a real HTTP call to Security Brokers' API.
 *   The rest of SafeLink stays identical — one file swap.
 *
 * Partner Client ID format: SB-XXXXXX (6-digit account number)
 * Partner PIN format: 4-6 digit numeric PIN (they issue this to clients)
 */
import { PartnerAdapter, hashImei } from '../partner-adapter.js';

/* ─── Mock Client Database ───────────────────────────────────────── */
// In production, this would be: await fetch('https://api.securitybrokers.co.za/clients/{id}')
// or a read-only DB connection to their accounting system.

const MOCK_CLIENTS = {
  'SB-000001': {
    displayName: 'Kyle Saffy',
    tier: 'Premium',
    pin: '1234',
    contractSince: '2024-01-15',
    // These IMEIs live in TrackSolid — we just know which ones belong to this client
    deviceImeis: [
      { imei: '123456789012345', nickname: "Kyle's Test Tracker", type: 'BLE_TAG' },
    ],
  },
  'SB-000002': {
    displayName: 'Security Brokers Demo',
    tier: 'Standard',
    pin: '0000',
    contractSince: '2023-06-01',
    deviceImeis: [
      { imei: '987654321098765', nickname: 'Office Vehicle', type: 'VEHICLE_GPS' },
      { imei: '111222333444555', nickname: 'Reception Panic Button', type: 'PANIC_FOB' },
    ],
  },
  'SB-001001': {
    displayName: 'Thabo Molefe',
    tier: 'Premium',
    pin: '5678',
    contractSince: '2023-11-20',
    deviceImeis: [
      { imei: '222333444555666', nickname: "Thabo's BMW", type: 'VEHICLE_GPS' },
      { imei: '333444555666777', nickname: "Lerato's Watch", type: 'BLE_TAG' },
    ],
  },
  'SI-000001': {
    displayName: 'Kyle Saffy',
    tier: 'Executive Armed VIP',
    pin: '1234',
    contractSince: '2024-01-15',
    deviceImeis: [
      { imei: '123456789012345', nickname: "Kyle's Sovereign Sentinel Guard", type: 'BLE_TAG' },
      { imei: '987654321098765', nickname: 'Tactical Patrol Vehicle #01', type: 'VEHICLE_GPS' },
    ],
  },
  'SI-000002': {
    displayName: 'Sovereign Command Center',
    tier: 'Fleet Operations',
    pin: '0000',
    contractSince: '2023-06-01',
    deviceImeis: [
      { imei: '111222333444555', nickname: 'Rapid Response Unit Alpha', type: 'VEHICLE_GPS' },
    ],
  },
};

/* ─── Security Brokers Adapter ───────────────────────────────────── */

export class MockSecurityBrokersAdapter extends PartnerAdapter {
  constructor() {
    super('SB');
    this.partnerName = 'Security Brokers';
    this.partnerLogo = '/logos/security-brokers.png'; // future
    this.primaryColor = '#003366'; // Security Brokers brand (placeholder)
  }

  /**
   * Verify a client's credentials.
   * In production: POST to Security Brokers' auth endpoint.
   */
  async verifyClient(clientId, pin) {
    const normalised = clientId.toUpperCase().trim();

    // Enforce namespace isolation — this adapter only serves SB-* accounts.
    if (!normalised.startsWith('SB-')) {
      return { valid: false, error: 'Account not found. Please contact Security Brokers.' };
    }

    const client = MOCK_CLIENTS[normalised];

    if (!client) {
      return { valid: false, error: 'Account not found. Please contact Security Brokers.' };
    }

    if (String(pin).trim() !== String(client.pin)) {
      return { valid: false, error: 'Incorrect PIN. Please try again.' };
    }

    return {
      valid: true,
      clientRef: normalised,           // opaque reference — not a person's name
      displayName: client.displayName, // for UI rendering only — not stored
      tier: client.tier,
      partnerName: this.partnerName,
      // Return hashed IMEIs — raw IMEIs never leave the server
      deviceRefs: client.deviceImeis.map((d) => ({
        hashedImei: hashImei(d.imei),
        rawImei: d.imei, // only used server-side for TrackSolid calls
        nickname: d.nickname,
        type: d.type,
      })),
    };
  }

  /**
   * Get client-facing profile data (display only — never stored by SafeLink).
   */
  async getClientProfile(clientRef) {
    const client = MOCK_CLIENTS[clientRef];
    if (!client) return null;

    return {
      displayName: client.displayName,
      tier: client.tier,
      partnerName: this.partnerName,
      since: client.contractSince,
      managedBy: 'Security Brokers',
    };
  }

  /**
   * Get device list for a client — returns hashed refs + metadata.
   * Raw IMEIs used server-side to call TrackSolid; never sent to client.
   */
  async getDevices(clientRef) {
    const client = MOCK_CLIENTS[clientRef];
    if (!client) return [];

    return client.deviceImeis.map((d) => ({
      hashedImei: hashImei(d.imei),
      rawImei: d.imei, // stripped before API response is sent to client
      nickname: d.nickname,
      type: d.type,
    }));
  }
}

export class MockSovereignInterventionAdapter extends PartnerAdapter {
  constructor() {
    super('SI');
    this.partnerName = 'Sovereign Intervention';
    this.partnerLogo = '/sovereign-intervention-logo.png';
    this.primaryColor = '#C69A2C';
  }

  async verifyClient(clientId, pin) {
    const normalised = clientId.toUpperCase().trim();

    // Enforce namespace isolation — this adapter only serves SI-* accounts.
    if (!normalised.startsWith('SI-')) {
      return { valid: false, error: 'Account not found. Please contact Sovereign Intervention.' };
    }

    const client = MOCK_CLIENTS[normalised];

    if (!client) {
      // Demo fallback: any unknown SI-* with the default PIN gets a generic VIP profile.
      if (String(pin).trim() === '1234') {
        return {
          valid: true,
          clientRef: normalised,
          displayName: 'Sovereign VIP Member',
          tier: 'Armed VIP Tier',
          partnerName: this.partnerName,
          deviceRefs: [
            {
              hashedImei: hashImei('123456789012345'),
              rawImei: '123456789012345',
              nickname: 'Sovereign Rapid Response Sentinel',
              type: 'BLE_TAG',
            },
          ],
        };
      }
      return { valid: false, error: 'Account not found. Please contact Sovereign Intervention.' };
    }

    if (String(pin).trim() !== String(client.pin)) {
      return { valid: false, error: 'Incorrect PIN. Please try again.' };
    }

    return {
      valid: true,
      clientRef: normalised,
      displayName: client.displayName,
      tier: client.tier,
      partnerName: this.partnerName,
      deviceRefs: client.deviceImeis.map((d) => ({
        hashedImei: hashImei(d.imei),
        rawImei: d.imei,
        nickname: d.nickname,
        type: d.type,
      })),
    };
  }

  async getClientProfile(clientRef) {
    const client = MOCK_CLIENTS[clientRef];
    return {
      displayName: client?.displayName || 'Sovereign Client',
      tier: client?.tier || 'Armed VIP',
      partnerName: this.partnerName,
      since: client?.contractSince || '2024-01-01',
      managedBy: 'Sovereign Intervention',
    };
  }

  async getDevices(clientRef) {
    const client = MOCK_CLIENTS[clientRef];
    if (!client) return [];
    return client.deviceImeis.map((d) => ({
      hashedImei: hashImei(d.imei),
      rawImei: d.imei,
      nickname: d.nickname,
      type: d.type,
    }));
  }
}
