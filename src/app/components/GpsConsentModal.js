'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function GpsConsentModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [consentStatus, setConsentStatus] = useState('pending');
  const [trackingActive, setTrackingActive] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedConsent = localStorage.getItem('popia_gps_consent');
    if (savedConsent === 'granted') {
      setConsentStatus('granted');
      startLocationWatcher();
    } else if (savedConsent === 'denied') {
      setConsentStatus('denied');
    } else {
      // First-time user, prompt after 1.5s
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }

    const handleReopen = () => setIsOpen(true);
    window.addEventListener('open_gps_consent_modal', handleReopen);
    return () => {
      window.removeEventListener('open_gps_consent_modal', handleReopen);
      stopLocationWatcher();
    };
  }, [user]);

  const getAuthToken = async () => {
    if (user && typeof user.getIdToken === 'function') {
      try {
        const t = await user.getIdToken();
        if (t) return t;
      } catch {}
    }
    if (user?.accessToken) return user.accessToken;
    if (user?.uid) return `test_${user.uid}`;
    return 'demo-test-token';
  };

  const startLocationWatcher = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (watchIdRef.current) return; // Already watching

    const sendCoords = async (position) => {
      const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
      const payload = {
        lat: latitude,
        lng: longitude,
        accuracy,
        speed,
        heading,
        altitude,
        nickname: user?.displayName || 'My Phone',
      };

      // Broadcast to local storage for instant map view
      localStorage.setItem('last_known_pwa_gps', JSON.stringify({
        ...payload,
        name: user?.displayName || 'Phone GPS',
        updatedAt: new Date().toISOString(),
      }));

      // Broadcast event
      window.dispatchEvent(new CustomEvent('safelink_phone_location_updated', { detail: payload }));

      try {
        const token = await getAuthToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        await fetch('/api/location/share', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('GPS telemetry push error:', err);
      }
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setTrackingActive(true);
          sendCoords(pos);
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
          setTrackingActive(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    } catch (e) {
      console.warn('Geolocation could not start:', e);
    }
  };

  const stopLocationWatcher = () => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setTrackingActive(false);
    }
  };

  const handleAccept = async () => {
    localStorage.setItem('popia_gps_consent', 'granted');
    localStorage.setItem('safelink_location_sharing_consent', 'granted');
    setConsentStatus('granted');
    setIsOpen(false);

    try {
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch('/api/location/share', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'opt_in',
          nickname: user?.displayName || 'My Phone',
          consentTimestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn('Failed to post opt_in to backend:', e);
    }

    startLocationWatcher();
  };

  const handleDecline = async () => {
    localStorage.setItem('popia_gps_consent', 'denied');
    localStorage.removeItem('safelink_location_sharing_consent');
    setConsentStatus('denied');
    setIsOpen(false);
    stopLocationWatcher();

    try {
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch('/api/location/share', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'opt_out',
        }),
      });
    } catch (e) {
      console.warn('Failed to post opt_out to backend:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-surface border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-on-surface">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-2xl">my_location</span>
          </div>
          <div>
            <h3 className="font-headline-md text-lg font-bold text-on-surface">POPIA GPS Consent</h3>
            <p className="font-label-sm text-xs text-secondary font-semibold">South Africa POPIA Act 4 of 2013</p>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          SafeLink requires continuous high-accuracy geolocation tracking to dispatch armed security response units, route EMS medical teams to your exact coordinates, and notify verified family members during emergencies.
        </p>

        <div className="space-y-2 py-2">
          <div className="flex items-start gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">verified_user</span>
            <span>Used strictly for life-safety dispatch and geofence safety alerts.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">lock</span>
            <span>Encrypted transmission to authorized security control rooms only.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">toggle_on</span>
            <span>You may revoke tracking consent at any time in Profile Settings.</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-xs uppercase tracking-wider font-bold py-3.5 px-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            Accept & Enable GPS
          </button>
          <button
            onClick={handleDecline}
            className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-on-surface-variant font-label-md text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          >
            Decline / Later
          </button>
        </div>
      </div>
    </div>
  );
}
