/**
 * TrackSolid Pro (JIMI IoT) — Server-Side API Client
 *
 * This module handles ALL communication with the TrackSolid Pro Open API.
 * It must NEVER be imported from client-side code — the appSecret would leak.
 *
 * API Docs: https://tracksolidprodocs.jimicloud.com/
 *
 * Architecture:
 *   SafeLink API route → this client → TrackSolid REST API
 *                                        ↓
 *                                   JIMI IoT servers
 */
import 'server-only';

import crypto from 'crypto';
import { getAdminFirestore } from './firebase-admin';

/* ─── Configuration ───────────────────────────────────────────── */

const CONFIG = {
  apiUrl: process.env.TRACKSOLID_API_URL,
  appKey: process.env.TRACKSOLID_APP_KEY,
  appSecret: process.env.TRACKSOLID_APP_SECRET,
  userId: process.env.TRACKSOLID_USER_ID,
  userPwdMd5: process.env.TRACKSOLID_USER_PWD_MD5,
};

const TOKEN_CACHE_COLLECTION = '_tracksolid_tokens';
const TOKEN_DOC_ID = 'current';
const TOKEN_TTL_SECONDS = 7000; // Refresh 200s before 7200s expiry

/* ─── MD5 Signature Generation ────────────────────────────────── */

/**
 * Generate the MD5 sign per JIMI's algorithm:
 * 1. Sort all params alphabetically by key (exclude 'sign')
 * 2. Concatenate key+value pairs with no delimiter
 * 3. Wrap with appSecret and MD5 hash
 * 4. Return UPPERCASE hex string
 */
function generateSign(params) {
  const sorted = Object.keys(params)
    .filter((k) => k !== 'sign')
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('');

  const signString = `${CONFIG.appSecret}${sorted}${CONFIG.appSecret}`;
  return crypto
    .createHash('md5')
    .update(signString, 'utf8')
    .digest('hex')
    .toUpperCase();
}

/**
 * Get current UTC timestamp in JIMI's required format.
 */
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

/* ─── Token Management ────────────────────────────────────────── */

let memoryTokenCache = null; // In-memory fallback

/**
 * Get a valid access token — uses Firestore cache with TTL,
 * falls back to in-memory cache, and auto-refreshes when expired.
 */
async function getAccessToken() {
  // 1. Try in-memory cache first
  if (memoryTokenCache && Date.now() < memoryTokenCache.expiresAt) {
    return memoryTokenCache.accessToken;
  }

  // 2. Try Firestore cache
  try {
    const firestore = getAdminFirestore();
    const doc = await firestore.collection(TOKEN_CACHE_COLLECTION).doc(TOKEN_DOC_ID).get();
    if (doc.exists) {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toMillis?.() || data.expiresAt;
      if (expiresAt && Date.now() < expiresAt) {
        memoryTokenCache = { accessToken: data.accessToken, expiresAt };
        return data.accessToken;
      }
    }
  } catch (err) {
    console.warn('[tracksolid] Firestore token cache read failed:', err.message);
  }

  // 3. Fetch new token
  return requestNewToken();
}

/**
 * Request a new access token from JIMI.
 */
async function requestNewToken() {
  if (!CONFIG.apiUrl || !CONFIG.appKey || !CONFIG.appSecret || !CONFIG.userId || !CONFIG.userPwdMd5) {
    throw new Error('[tracksolid] API credentials are not configured.');
  }
  const params = {
    method: 'jimi.oauth.token.get',
    timestamp: getTimestamp(),
    app_key: CONFIG.appKey,
    sign_method: 'md5',
    v: '1.0',
    format: 'json',
    user_id: CONFIG.userId,
    user_pwd_md5: CONFIG.userPwdMd5,
    expires_in: 7200,
  };
  params.sign = generateSign(params);

  const response = await callApi(params, true);
  if (response.code !== 0 || !response.result?.accessToken) {
    throw new Error(`[tracksolid] Token request failed: ${response.message || JSON.stringify(response)}`);
  }

  const { accessToken, refreshToken } = response.result;
  const expiresAt = Date.now() + TOKEN_TTL_SECONDS * 1000;

  // Cache in memory
  memoryTokenCache = { accessToken, expiresAt };

  // Cache in Firestore
  try {
    const firestore = getAdminFirestore();
    const { Timestamp } = await import('firebase-admin/firestore');
    await firestore.collection(TOKEN_CACHE_COLLECTION).doc(TOKEN_DOC_ID).set({
      accessToken,
      refreshToken,
      expiresAt: Timestamp.fromMillis(expiresAt),
      updatedAt: Timestamp.now(),
    });
  } catch (err) {
    console.warn('[tracksolid] Firestore token cache write failed:', err.message);
  }

  return accessToken;
}

/* ─── Core API Call ────────────────────────────────────────────── */

/**
 * Make a signed POST request to the TrackSolid Pro API.
 * All JIMI API calls use the same URL — the `method` param determines the endpoint.
 */
async function callApi(params, skipAuth = false) {
  const url = CONFIG.apiUrl;

  const formBody = Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: formBody,
  });

  if (!response.ok) {
    throw new Error(`[tracksolid] HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convenience wrapper — builds common params, signs, and calls.
 */
async function apiRequest(method, privateParams = {}) {
  const accessToken = await getAccessToken();

  const params = {
    method,
    timestamp: getTimestamp(),
    app_key: CONFIG.appKey,
    sign_method: 'md5',
    v: '1.0',
    format: 'json',
    access_token: accessToken,
    ...privateParams,
  };
  params.sign = generateSign(params);

  const result = await callApi(params);

  // Handle token expiry (code 1004) — retry once with fresh token
  if (result.code === 1004) {
    memoryTokenCache = null;
    const freshToken = await requestNewToken();
    params.access_token = freshToken;
    params.timestamp = getTimestamp();
    params.sign = generateSign(params);
    return callApi(params);
  }

  return result;
}

/* ─── Device Management ───────────────────────────────────────── */

/**
 * List all devices for a sub-account.
 * @param {string} target - The account to query devices for.
 */
export async function listDevices(target) {
  return apiRequest('jimi.user.device.list', { target });
}

/**
 * Get detailed info for a specific device by IMEI.
 * @param {string} imei - Device IMEI number.
 */
export async function getDeviceDetail(imei) {
  return apiRequest('jimi.track.device.detail', { imei });
}

/**
 * Bind a device to a user account after purchase.
 * @param {string} imei - Device IMEI.
 * @param {string} account - Target user account.
 */
export async function bindDevice(imei, account) {
  return apiRequest('jimi.open.device.bind', { imei, account });
}

/**
 * Unbind a device from a user account.
 * @param {string} imei - Device IMEI.
 * @param {string} account - User account to unbind from.
 */
export async function unbindDevice(imei, account) {
  return apiRequest('jimi.open.device.unbind', { imei, account });
}

/**
 * Create a device group (e.g. "Family", "Vehicles").
 * @param {string} groupName - Name for the new group.
 */
export async function createDeviceGroup(groupName) {
  return apiRequest('jimi.device.group.create', { group_name: groupName });
}

/**
 * List device groups for the account.
 */
export async function listDeviceGroups() {
  return apiRequest('jimi.device.group.list');
}

/* ─── Real-Time Tracking ──────────────────────────────────────── */

/**
 * Get real-time GPS location for one or more devices.
 * @param {string} imeis - Comma-separated IMEI list (max 100).
 */
export async function getDeviceLocation(imeis) {
  return apiRequest('jimi.device.location.get', { imeis });
}

/**
 * Get locations of ALL devices under a sub-account.
 * @param {string} target - Account to query.
 */
export async function getAccountDeviceLocations(target) {
  return apiRequest('jimi.user.device.location.list', { target });
}

/**
 * Get BLE TAG device location (for Sentinel passive tags).
 * @param {string} imeis - Comma-separated TAG IMEI list.
 */
export async function getTagLocation(imeis) {
  return apiRequest('jimi.device.location.getTagMsg', { imeis });
}

/**
 * Batch refresh TAG positions.
 * @param {string} imeis - Comma-separated TAG IMEI list.
 */
export async function refreshTagDevices(imeis) {
  return apiRequest('jimi.device.location.updateTagDevices', { imeis });
}

/**
 * Get a shareable live location URL for a device.
 * @param {string} imei - Device IMEI.
 */
export async function getShareLocationUrl(imei) {
  return apiRequest('jimi.device.location.URL.share', { imei });
}

/**
 * Get historical track/route data for playback.
 * @param {string} imei - Device IMEI.
 * @param {string} beginTime - Start time (UTC) format: yyyy-MM-dd HH:mm:ss
 * @param {string} endTime - End time (UTC) format: yyyy-MM-dd HH:mm:ss
 */
export async function getTrackHistory(imei, beginTime, endTime) {
  return apiRequest('jimi.device.track.list', {
    imei,
    begin_time: beginTime,
    end_time: endTime,
  });
}

/**
 * Get mileage data for a device.
 * @param {string} imei - Device IMEI.
 * @param {string} beginTime - Start time (UTC).
 * @param {string} endTime - End time (UTC).
 */
export async function getDeviceMileage(imei, beginTime, endTime) {
  return apiRequest('jimi.device.track.mileage', {
    imei,
    begin_time: beginTime,
    end_time: endTime,
  });
}

/* ─── Geofencing ──────────────────────────────────────────────── */

/**
 * Create a platform-level geofence.
 * @param {object} opts
 * @param {string} opts.fenceName - Fence name (e.g. "Home", "School").
 * @param {string} opts.fenceType - "circle" or "polygon".
 * @param {string} opts.fenceData - JSON string defining the fence shape.
 * @param {number} opts.alarmType - 0: in+out, 1: enter only, 2: exit only.
 */
export async function createGeofence({ fenceName, fenceType, fenceData, alarmType = 0 }) {
  return apiRequest('jimi.open.platform.fence.create', {
    fence_name: fenceName,
    fence_type: fenceType,
    fence_data: fenceData,
    alarm_type: alarmType,
  });
}

/**
 * Bind device(s) to a geofence.
 * @param {string} fenceId - Geofence ID.
 * @param {string} imeis - Comma-separated IMEI list.
 */
export async function bindGeofence(fenceId, imeis) {
  return apiRequest('jimi.open.platform.fence.bind', {
    fence_id: fenceId,
    imeis,
  });
}

/**
 * List all geofences for the account.
 */
export async function listGeofences() {
  return apiRequest('jimi.open.platform.fence.list');
}

/**
 * Get single geofence detail.
 * @param {string} fenceId - Geofence ID.
 */
export async function getGeofenceDetail(fenceId) {
  return apiRequest('jimi.open.platform.fence.detail', { fence_id: fenceId });
}

/**
 * Delete a geofence.
 * @param {string} fenceId - Geofence ID.
 */
export async function deleteGeofence(fenceId) {
  return apiRequest('jimi.open.platform.fence.delete', { fence_id: fenceId });
}

/**
 * Get geofence entry/exit duration data for devices.
 * @param {string} imei - Device IMEI.
 * @param {string} beginTime - Start time (UTC).
 * @param {string} endTime - End time (UTC).
 */
export async function getGeofenceDuration(imei, beginTime, endTime) {
  return apiRequest('jimi.open.platform.fence.duration', {
    imei,
    begin_time: beginTime,
    end_time: endTime,
  });
}

/* ─── Commands ────────────────────────────────────────────────── */

/**
 * Get list of commands supported by a device model.
 * @param {string} imei - Device IMEI.
 */
export async function getCommandList(imei) {
  return apiRequest('jimi.open.instruction.list', { imei });
}

/**
 * Send a command to a device (e.g. alarm test, arm/disarm).
 * @param {string} imei - Device IMEI.
 * @param {string} instructionId - Command identifier.
 * @param {object} params - Command parameters.
 */
export async function sendCommand(imei, instructionId, params = {}) {
  return apiRequest('jimi.open.instruction.send', {
    imei,
    instruction_id: instructionId,
    ...params,
  });
}

/**
 * Get the result of a previously sent command.
 * @param {string} cmdId - Command execution ID.
 */
export async function getCommandResult(cmdId) {
  return apiRequest('jimi.open.instruction.result', { cmd_id: cmdId });
}

/* ─── Alarms & Reports ────────────────────────────────────────── */

/**
 * Get alarm history for a device.
 * @param {string} imei - Device IMEI.
 * @param {string} beginTime - Start time (UTC).
 * @param {string} endTime - End time (UTC).
 */
export async function getAlarmHistory(imei, beginTime, endTime) {
  return apiRequest('jimi.device.alarm.list', {
    imei,
    begin_time: beginTime,
    end_time: endTime,
  });
}

/**
 * Get trip reports for a device.
 * @param {string} imei - Device IMEI.
 * @param {string} beginTime - Start time (UTC).
 * @param {string} endTime - End time (UTC).
 */
export async function getTripReport(imei, beginTime, endTime) {
  return apiRequest('jimi.open.platform.report.trips', {
    imei,
    begin_time: beginTime,
    end_time: endTime,
  });
}

/**
 * Get parking/idle reports for a device.
 * @param {string} imei - Device IMEI.
 * @param {string} beginTime - Start time (UTC).
 * @param {string} endTime - End time (UTC).
 */
export async function getParkingReport(imei, beginTime, endTime) {
  return apiRequest('jimi.open.platform.report.parking', {
    imei,
    begin_time: beginTime,
    end_time: endTime,
  });
}

/* ─── Account Management (White-Label) ────────────────────────── */

/**
 * Create a sub-account (for security company white-label).
 * @param {string} account - New account name.
 * @param {string} password - Account password.
 * @param {string} customerName - Display name.
 */
export async function createSubAccount(account, password, customerName) {
  const pwdMd5 = crypto.createHash('md5').update(password, 'utf8').digest('hex');
  return apiRequest('jimi.user.child.create', {
    account,
    password: pwdMd5,
    customer_name: customerName,
  });
}

/**
 * List all sub-accounts.
 */
export async function listSubAccounts() {
  return apiRequest('jimi.user.child.list');
}

/**
 * Move devices to a sub-account (for security company onboarding).
 * @param {string} imeis - Comma-separated IMEI list.
 * @param {string} targetAccount - Destination account.
 */
export async function moveDevices(imeis, targetAccount) {
  return apiRequest('jimi.open.device.move', {
    imeis,
    to_account: targetAccount,
  });
}

/* ─── Exports for testing ─────────────────────────────────────── */

export const _testing = {
  generateSign,
  getTimestamp,
  CONFIG,
};
