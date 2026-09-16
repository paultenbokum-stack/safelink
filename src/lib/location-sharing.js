'use client';

/**
 * Phone GPS Location Sharing Service
 *
 * Enables "Phone as Device" mode — the user's phone becomes a trackable
 * device in the Family Radar map, alongside any physical Sentinel BLE devices.
 *
 * Key design decisions:
 * - Explicit opt-in required (POPIA compliance)
 * - Uses navigator.geolocation.watchPosition for continuous GPS
 * - Sends updates to Firestore via /api/location/share
 * - Configurable update interval (default: 30s foreground)
 * - Battery-conscious: stops when tab is backgrounded in PWA mode
 * - Consent status persisted in localStorage + Firestore
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './auth-context';

const LOCATION_UPDATE_INTERVAL = 15000; // 15 seconds for responsive live tracking
const LOCATION_STALE_THRESHOLD = 120000; // 2 minutes — mark stale after this
const STORAGE_KEY_CONSENT = 'safelink_location_sharing_consent';
const STORAGE_KEY_POPIA = 'popia_gps_consent';
const STORAGE_KEY_NICKNAME = 'safelink_phone_nickname';
const STORAGE_KEY_LAST_GPS = 'last_known_pwa_gps';

/**
 * useLocationSharing — Hook that manages opt-in phone GPS tracking.
 *
 * Usage:
 *   const {
 *     isSharing, isOptedIn, consent, error,
 *     optIn, optOut, setNickname,
 *   } = useLocationSharing();
 */
const LocationSharingContext = createContext(null);

function useLocationSharingController() {
  const { user } = useAuth();
  const alive = useRef(true);
  const sharingAllowed = useRef(false);
  const consentVersion = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; sharingAllowed.current = false; }; }, []);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [lastPosition, setLastPosition] = useState(null);
  const [error, setError] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);
  const [battery, setBattery] = useState(null);
  const batteryRef = useRef(null);
  const positionRef = useRef(null);
  useEffect(() => { positionRef.current = lastPosition; }, [lastPosition]);
  useEffect(() => {
    let active = true, manager;
    const sync = () => { if (active && manager) { batteryRef.current = Math.round(manager.level * 100); setBattery(batteryRef.current); } };
    navigator.getBattery?.().then(value => { if (!active) return; manager = value; sync(); manager.addEventListener('levelchange', sync); }).catch(() => {});
    return () => { active = false; manager?.removeEventListener('levelchange', sync); };
  }, []);
  const [nickname, setNicknameState] = useState('My Phone');

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSentRef = useRef(0);

  // Load consent status and cached GPS from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.uid || localStorage.getItem('safelink_account_uid') !== user.uid) return;
    const timer = setTimeout(() => {
    const consent = localStorage.getItem(STORAGE_KEY_CONSENT) || localStorage.getItem(STORAGE_KEY_POPIA);
    const savedNickname = localStorage.getItem(STORAGE_KEY_NICKNAME);
    const cachedGpsRaw = localStorage.getItem(STORAGE_KEY_LAST_GPS);

    if (consent === 'granted') {
      sharingAllowed.current = true;
      setIsOptedIn(true);
      localStorage.setItem(STORAGE_KEY_CONSENT, 'granted');
      localStorage.setItem(STORAGE_KEY_POPIA, 'granted');
    }
    if (savedNickname) {
      setNicknameState(savedNickname);
    }
    if (cachedGpsRaw) {
      try {
        const cached = JSON.parse(cachedGpsRaw);
        if (cached?.lat && cached?.lng) {
          setLastPosition(cached);
        }
      } catch {}
    }
    }, 0);
    return () => clearTimeout(timer);
  }, [user?.uid]);

  /**
   * Helper to build auth token
   */
  const getAuthToken = useCallback(async () => {
    if (!user || user.isPartnerSession) return null;
    if (typeof user.getIdToken === 'function') {
      try {
        const token = await user.getIdToken();
        if (token) return token;
      } catch {}
    }
    if (user.accessToken) return user.accessToken;
    if (user.isTestSession && user.uid) return `test_${user.uid}`;
    return null;
  }, [user]);

  /**
   * Send location update to server.
   */
  const sendLocationUpdate = useCallback(async (pos) => {
    if (!alive.current || !sharingAllowed.current || !pos || pos.lat == null || pos.lng == null) return false;

    lastSentRef.current = Date.now();

    try {
      let token = await getAuthToken();
      if (!token) throw new Error('No authenticated location-sharing session');
      if (!alive.current || !sharingAllowed.current) return false;

      const payload = JSON.stringify({
        timestamp: pos.timestamp,
        battery: batteryRef.current,
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        altitude: pos.altitude,
        speed: pos.speed,
        heading: pos.heading,
        nickname: user?.displayName || nickname,
        deviceType: 'phone',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      });

      let response = await fetch('/api/location/share', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });

      if (response.status === 401 && user && typeof user.getIdToken === 'function') {
        try {
          token = await user.getIdToken(true);
          response = await fetch('/api/location/share', {
            method: 'POST',
            signal: AbortSignal.timeout(15000),
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: payload,
          });
        } catch {}
      }

      if (!response.ok) throw new Error('Location upload failed');
      if (!alive.current || !sharingAllowed.current) return false;
      setCheckedAt(Date.now());
      setError(null);
      return true;
    } catch (err) {
      console.warn('[location-sharing] Upload non-blocking note:', err?.message);
      return false;
    }
  }, [getAuthToken, nickname, user]);

  /**
   * Start navigator.geolocation.watchPosition with high-accuracy GNSS.
   */
  const startWatching = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!alive.current || !sharingAllowed.current) return;
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        };
        setLastPosition(pos);
        setError(null);

        // Store latest high-accuracy coordinates locally
        localStorage.setItem(STORAGE_KEY_LAST_GPS, JSON.stringify({
          ...pos,
          name: user?.displayName || nickname,
          updatedAt: new Date().toISOString(),
        }));

        // Broadcast to any open map or SOS components
        window.dispatchEvent(new CustomEvent('safelink_phone_location_updated', { detail: pos }));

        // Throttle server uploads
        if (Date.now() - lastSentRef.current >= LOCATION_UPDATE_INTERVAL) {
          sendLocationUpdate(pos);
        }
      },
      (err) => {
        console.warn('[location-sharing] Watch error:', err.message);
        setError(getLocationErrorMessage(err));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  }, [nickname, sendLocationUpdate, user]);

  /**
   * Start GPS watch + periodic upload.
   */
  const startSharing = useCallback(() => {
    if (!alive.current || !sharingAllowed.current || document.hidden) return;
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsSharing(true);
    setError(null);
    startWatching();

    // Periodic upload interval
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (!document.hidden && positionRef.current) {
          sendLocationUpdate(positionRef.current);
        }
      }, LOCATION_UPDATE_INTERVAL);
    }
  }, [sendLocationUpdate, startWatching]);

  /**
   * Stop all GPS tracking.
   */
  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSharing(false);
  }, []);

  /**
   * Opt in to location sharing (requires explicit user action).
   */
  const optIn = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported on this device');
      return false;
    }

    const version = ++consentVersion.current;
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }));
      const token = await getAuthToken();
      if (!token) throw new Error('Please sign in again to share this phone.');
      if (!alive.current || consentVersion.current !== version) return false;
      const response = await fetch('/api/location/share', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'opt_in', nickname: user?.displayName || nickname, consentTimestamp: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Could not enable location sharing. Please retry.');
      if (!alive.current || consentVersion.current !== version) return false;
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, altitude: position.coords.altitude, speed: position.coords.speed, heading: position.coords.heading, timestamp: position.timestamp };
      localStorage.setItem(STORAGE_KEY_CONSENT, 'granted');
      localStorage.setItem(STORAGE_KEY_POPIA, 'granted');
      localStorage.setItem(STORAGE_KEY_LAST_GPS, JSON.stringify(pos));
      sharingAllowed.current = true;
      positionRef.current = pos;
      setLastPosition(pos);
      setIsOptedIn(true);
      setError(null);
      window.dispatchEvent(new CustomEvent('safelink_phone_location_updated', { detail: pos }));
      // The shared provider owns the single watcher; its effect starts it.
      return true;
    } catch (err) {
      if (alive.current) setError(err.code ? getLocationErrorMessage(err) : err.message || 'Could not enable location sharing. Please retry.');
      return false;
    }
  }, [getAuthToken, nickname, user]);

  /**
   * Opt out — stop sharing and revoke consent.
   */
  const optOut = useCallback(async () => {
    consentVersion.current++;
    sharingAllowed.current = false;
    positionRef.current = null;
    stopSharing();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_CONSENT);
      localStorage.removeItem(STORAGE_KEY_POPIA);
      localStorage.removeItem(STORAGE_KEY_LAST_GPS);
    }
    setIsOptedIn(false);
    setLastPosition(null);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Please sign in again to revoke sharing.');
      const response = await fetch('/api/location/share', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'opt_out' }),
      });
      if (!response.ok) throw new Error('Could not revoke sharing on the server.');
      setError(null);
      return true;
    } catch (err) {
      console.warn('[location-sharing] Opt-out notification failed:', err);
      if (alive.current) setError('Phone tracking stopped locally, but server revocation failed. Please retry Decline / Later in GPS consent.');
      return false;
    }
  }, [getAuthToken, stopSharing]);

  /**
   * Update the nickname for this phone on the map.
   */
  const setNickname = useCallback((name) => {
    setNicknameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NICKNAME, name);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    if (!isOptedIn || !navigator.geolocation) throw new Error('Location sharing is off');
    const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }));
    const pos = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, altitude: position.coords.altitude, speed: position.coords.speed, heading: position.coords.heading, timestamp: position.timestamp };
    if (!alive.current || !sharingAllowed.current) throw new Error('Location sharing is off');
    setLastPosition(pos);
    localStorage.setItem(STORAGE_KEY_LAST_GPS, JSON.stringify(pos));
    window.dispatchEvent(new CustomEvent('safelink_phone_location_updated', { detail: pos }));
    if (!await sendLocationUpdate(pos)) throw new Error('Could not upload report');
    setError(null);
  }, [isOptedIn, sendLocationUpdate]);

  // Auto-start sharing when opted in
  useEffect(() => {
    const timer = setTimeout(() => { if (isOptedIn && user && !user.isPartnerSession) startSharing(); }, 0);
    return () => { clearTimeout(timer); stopSharing(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOptedIn, user]);

  // Handle visibility change — maintain continuous GPS in foreground
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      } else {
        if (isOptedIn && user && !user.isPartnerSession) {
          startSharing();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOptedIn, startSharing, user]);


  return {
    refreshLocation, checkedAt, battery,
    isOptedIn,
    isSharing,
    lastPosition,
    error,
    nickname,
    optIn,
    optOut,
    setNickname,
  };
}

function AccountLocationSharingProvider({ children }) {
  const value = useLocationSharingController();
  return <LocationSharingContext.Provider value={value}>{children}</LocationSharingContext.Provider>;
}

export function LocationSharingProvider({ children }) {
  const { user } = useAuth();
  return <AccountLocationSharingProvider key={user?.uid || 'signed-out'}>{children}</AccountLocationSharingProvider>;
}

export function useLocationSharing() {
  const value = useContext(LocationSharingContext);
  if (!value) throw new Error('useLocationSharing must be used within LocationSharingProvider');
  return value;
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function getLocationErrorMessage(err) {
  switch (err.code) {
    case 1: return 'Location permission denied. Please enable GPS access in your browser settings.';
    case 2: return 'Location unavailable. Please check that GPS is enabled on your device.';
    case 3: return 'Location request timed out. Please try again.';
    default: return 'Could not determine your location.';
  }
}
