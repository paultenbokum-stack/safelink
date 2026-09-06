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

const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds
const LOCATION_STALE_THRESHOLD = 120000; // 2 minutes — mark stale after this
const STORAGE_KEY_CONSENT = 'safelink_location_sharing_consent';
const STORAGE_KEY_NICKNAME = 'safelink_phone_nickname';

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
  const [nickname, setNicknameState] = useState('My Phone');

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastSentRef = useRef(0);

  // Load consent status from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const consent = localStorage.getItem(STORAGE_KEY_CONSENT);
    const savedNickname = localStorage.getItem(STORAGE_KEY_NICKNAME);

    if (consent === 'granted') {
      setIsOptedIn(true);
    }
    if (savedNickname) {
      setNicknameState(savedNickname);
    }
  }, []);

  // Auto-start sharing when opted in
  useEffect(() => {
    if (isOptedIn && user) {
      startSharing();
    }
    return () => stopSharing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOptedIn, user]);

  // Handle visibility change — pause when backgrounded to save battery
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        // Tab backgrounded — stop active watching, rely on interval
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      } else {
        // Tab foregrounded — resume active watching
        if (isOptedIn && isSharing) {
          startWatching();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOptedIn, isSharing]);

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

    // Periodic upload interval as backup
    intervalRef.current = setInterval(() => {
      if (lastPosition) {
        sendLocationUpdate(lastPosition);
      }
    }, LOCATION_UPDATE_INTERVAL);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPosition]);

  /**
   * Start navigator.geolocation.watchPosition.
   */
  const startWatching = useCallback(() => {
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

        // Throttle: only send if enough time has passed
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
        maximumAge: 15000,
        timeout: 10000,
      }
    );
  }, []);

  /**
   * Send location update to server.
   */
  const sendLocationUpdate = useCallback(async (pos) => {
    if (!user || !pos) return;

    lastSentRef.current = Date.now();

    try {
      const token = user?.accessToken || user?.stsTokenManager?.accessToken || (user?.isTestSession ? `test_${user.uid}` : (user?.isPartnerSession ? `test_${user.uid}` : null));

      await fetch('/api/location/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          altitude: pos.altitude,
          speed: pos.speed,
          heading: pos.heading,
          nickname,
          deviceType: 'phone',
          userAgent: navigator.userAgent,
        }),
      });
    } catch (err) {
      console.warn('[location-sharing] Upload failed:', err);
    }
  }, [user, nickname]);

  /**
   * Stop all GPS tracking.
   */
  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
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
    // Request permission first
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setError('Location permission was denied. Please enable it in your browser settings.');
          return false;
        }
      } catch (e) {
        // permissions API not supported — will prompt on watchPosition
      }
    }

    // Test that we can get a position
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Success — store consent
          localStorage.setItem(STORAGE_KEY_CONSENT, 'granted');
          setIsOptedIn(true);
          setError(null);

          // Also store consent in Firestore via API
          const token = user?.accessToken || user?.stsTokenManager?.accessToken || (user?.isTestSession ? `test_${user.uid}` : (user?.isPartnerSession ? `test_${user.uid}` : null));
          fetch('/api/location/share', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              action: 'opt_in',
              nickname,
              consentTimestamp: new Date().toISOString(),
            }),
          }).catch(() => {});

          resolve(true);
        },
        (err) => {
          setError(getLocationErrorMessage(err));
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [user, nickname]);

  /**
   * Opt out — stop sharing and revoke consent.
   */
  const optOut = useCallback(async () => {
    stopSharing();
    localStorage.removeItem(STORAGE_KEY_CONSENT);
    setIsOptedIn(false);
    setLastPosition(null);

    // Notify server
    try {
      const token = user?.accessToken || user?.stsTokenManager?.accessToken || (user?.isTestSession ? `test_${user.uid}` : (user?.isPartnerSession ? `test_${user.uid}` : null));
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
  }, [user, stopSharing]);

  /**
   * Update the nickname for this phone on the map.
   */
  const setNickname = useCallback((name) => {
    setNicknameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NICKNAME, name);
    }
  }, []);

  return {
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
