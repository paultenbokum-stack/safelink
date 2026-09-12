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

import { useState, useEffect, useRef, useCallback } from 'react';
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
export function useLocationSharing() {
  const { user } = useAuth();
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
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
    const consent = localStorage.getItem(STORAGE_KEY_CONSENT) || localStorage.getItem(STORAGE_KEY_POPIA);
    const savedNickname = localStorage.getItem(STORAGE_KEY_NICKNAME);
    const cachedGpsRaw = localStorage.getItem(STORAGE_KEY_LAST_GPS);

    if (consent === 'granted') {
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
  }, []);

  /**
   * Helper to build auth token
   */
  const getAuthToken = useCallback(() => {
    return (
      user?.accessToken ||
      user?.stsTokenManager?.accessToken ||
      (user?.isTestSession ? `test_${user.uid}` : null) ||
      (user?.isPartnerSession ? `test_${user.uid}` : null) ||
      (user?.uid ? `test_${user.uid}` : 'demo-test-token')
    );
  }, [user]);

  /**
   * Send location update to server.
   */
  const sendLocationUpdate = useCallback(async (pos) => {
    if (!pos || pos.lat == null || pos.lng == null) return;

    lastSentRef.current = Date.now();

    try {
      const token = getAuthToken();

      const response = await fetch('/api/location/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
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
        }),
      });
      if (!response.ok) throw new Error('Location upload failed');
      setCheckedAt(Date.now());
      return true;
    } catch (err) {
      setError('Could not upload this phone’s report.');
      console.warn('[location-sharing] Upload failed:', err);
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

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          };

          // Store consent in all local keys
          localStorage.setItem(STORAGE_KEY_CONSENT, 'granted');
          localStorage.setItem(STORAGE_KEY_POPIA, 'granted');
          localStorage.setItem(STORAGE_KEY_LAST_GPS, JSON.stringify({
            ...pos,
            name: user?.displayName || nickname,
            updatedAt: new Date().toISOString(),
          }));

          setLastPosition(pos);
          setIsOptedIn(true);
          setError(null);

          // Dispatch event
          window.dispatchEvent(new CustomEvent('safelink_phone_location_updated', { detail: pos }));

          // Notify backend
          const token = getAuthToken();
          fetch('/api/location/share', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              action: 'opt_in',
              nickname: user?.displayName || nickname,
              consentTimestamp: new Date().toISOString(),
              lat: pos.lat,
              lng: pos.lng,
              accuracy: pos.accuracy,
            }),
          }).catch(() => {});

          startSharing();
          resolve(true);
        },
        (err) => {
          setError(getLocationErrorMessage(err));
          resolve(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    });
  }, [getAuthToken, nickname, startSharing, user]);

  /**
   * Opt out — stop sharing and revoke consent.
   */
  const optOut = useCallback(async () => {
    stopSharing();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_CONSENT);
      localStorage.removeItem(STORAGE_KEY_POPIA);
      localStorage.removeItem(STORAGE_KEY_LAST_GPS);
    }
    setIsOptedIn(false);
    setLastPosition(null);

    try {
      const token = getAuthToken();
      await fetch('/api/location/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'opt_out' }),
      });
    } catch (err) {
      console.warn('[location-sharing] Opt-out notification failed:', err);
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
    setLastPosition(pos);
    localStorage.setItem(STORAGE_KEY_LAST_GPS, JSON.stringify(pos));
    window.dispatchEvent(new CustomEvent('safelink_phone_location_updated', { detail: pos }));
    if (!await sendLocationUpdate(pos)) throw new Error('Could not upload report');
    setError(null);
  }, [isOptedIn, sendLocationUpdate]);

  // Auto-start sharing when opted in
  useEffect(() => {
    const timer = setTimeout(() => { if (isOptedIn) startSharing(); }, 0);
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
        if (isOptedIn && isSharing) {
          startWatching();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOptedIn, isSharing]);


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

/* ─── Helpers ──────────────────────────────────────────────────── */

function getLocationErrorMessage(err) {
  switch (err.code) {
    case 1: return 'Location permission denied. Please enable GPS access in your browser settings.';
    case 2: return 'Location unavailable. Please check that GPS is enabled on your device.';
    case 3: return 'Location request timed out. Please try again.';
    default: return 'Could not determine your location.';
  }
}
