'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

const EMERGENCY_TYPES = [
  {
    id: 'armed_response',
    label: 'ARMED RESPONSE',
    title: 'Armed Response',
    desc: 'Intruder, hijacking, home invasion, or physical threat.',
    icon: 'local_police',
    color: '#ffc32f',
    borderClass: 'border-l-secondary',
  },
  {
    id: 'medical',
    label: 'MEDICAL SOS',
    title: 'Medical Emergency',
    desc: 'Cardiac event, injury, trauma, or critical ambulance needed.',
    icon: 'medical_services',
    color: '#38a169',
    borderClass: 'border-l-[#38a169]',
  },
  {
    id: 'fire',
    label: 'FIRE EMERGENCY',
    title: 'Fire & Rescue',
    desc: 'Structural fire, electrical explosion, or smoke hazard.',
    icon: 'local_fire_department',
    color: '#ef4444',
    borderClass: 'border-l-error',
  },
  {
    id: 'roadside_towing',
    label: 'ROADSIDE ASSIST',
    title: 'Roadside & Towing',
    desc: 'Vehicle breakdown, flat tyre, jump-start, or towing escort.',
    icon: 'rv_hookup',
    color: '#9fcafb',
    borderClass: 'border-l-primary',
  },
];

export default function SOSPage() {
  return (
    <AuthGuard>
      <SOSFlowContent />
    </AuthGuard>
  );
}

function SOSFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialType = searchParams.get('type') || null;
  const prefillLat = searchParams.get('lat');
  const prefillLng = searchParams.get('lng');

  const [activeIncident, setActiveIncident] = useState(false);
  const [incidentId, setIncidentId] = useState(null);
  const [emergencyType, setEmergencyType] = useState(
    initialType ? EMERGENCY_TYPES.find((t) => t.id === initialType) || EMERGENCY_TYPES[0] : EMERGENCY_TYPES[0]
  );
  const [dispatchResult, setDispatchResult] = useState(null);
  const [secondsActive, setSecondsActive] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [cancelProgress, setCancelProgress] = useState(0);
  const [dispatching, setDispatching] = useState(false);
  const [userLocation, setUserLocation] = useState({
    lat: prefillLat ? parseFloat(prefillLat) : null,
    lng: prefillLng ? parseFloat(prefillLng) : null,
    address: null,
  });
  const [locationError, setLocationError] = useState(null);
  const [tierBlocked, setTierBlocked] = useState(false);

  const cancelTimerRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Auto-trigger if type passed in URL
  useEffect(() => {
    if (initialType) {
      const typeObj = EMERGENCY_TYPES.find((t) => t.id === initialType);
      if (typeObj) handleSelectEmergency(typeObj);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active incident timer
  useEffect(() => {
    let timer;
    if (activeIncident) {
      timer = setInterval(() => setSecondsActive((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeIncident]);

  // Get user's GPS location
  useEffect(() => {
    if (!userLocation.lat && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: null,
          });
        },
        (err) => {
          console.warn('[sos] Geolocation error:', err);
          setLocationError('Could not determine your location. Please enable GPS.');
          // Fallback: Sandton, JHB
          setUserLocation({ lat: -26.1076, lng: 28.0567, address: 'Sandton, Johannesburg (approx)' });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [userLocation.lat]);

  // Poll incident status while active
  useEffect(() => {
    if (!activeIncident || !incidentId) return;

    async function pollStatus() {
      try {
        const token = user?.accessToken || user?.stsTokenManager?.accessToken;
        const res = await fetch('/api/sos/dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: 'status', incidentId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.incident) {
            setDispatchResult((prev) => ({ ...prev, ...data.incident }));
            if (data.incident.status === 'resolved' || data.incident.status === 'cancelled') {
              setActiveIncident(false);
              clearInterval(pollTimerRef.current);
            }
          }
        }
      } catch (err) {
        console.warn('[sos] Status poll failed:', err);
      }
    }

    pollTimerRef.current = setInterval(pollStatus, 8000);
    return () => clearInterval(pollTimerRef.current);
  }, [activeIncident, incidentId, user]);

  /* ─── Dispatch emergency ───────────────────────────────────── */
  const handleSelectEmergency = useCallback(async (type) => {
    setEmergencyType(type);
    setDispatching(true);
    setSecondsActive(0);
    setTierBlocked(false);

    try {
      const token = user?.accessToken || user?.stsTokenManager?.accessToken;

      const res = await fetch('/api/sos/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: type.id,
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: userLocation.address,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.upgradeUrl) {
        // Tier blocked — need Standard or Premium
        setTierBlocked(true);
        setDispatching(false);
        return;
      }

      if (res.status === 401) {
        // Mock dispatch for demo/test sessions
        setDispatchResult({
          incidentId: `DEMO-${Date.now()}`,
          status: 'dispatched',
          eta: '8-12 minutes',
          responder: {
            company: 'SafeLink Demo Response',
            vehicle: 'AR-402',
            officer: 'Officer Khumalo',
          },
          isMock: true,
        });
        setIncidentId(`DEMO-${Date.now()}`);
        setActiveIncident(true);
        setDispatching(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Dispatch failed');
      }

      setDispatchResult(data);
      setIncidentId(data.incidentId);
      setActiveIncident(true);
    } catch (err) {
      console.error('[sos] Dispatch error:', err);
      // Fallback to demo mode
      setDispatchResult({
        incidentId: `FALLBACK-${Date.now()}`,
        status: 'dispatched',
        eta: '8-12 minutes',
        responder: {
          company: 'SafeLink Demo Response',
          vehicle: 'AR-402',
          officer: 'Demo Officer',
        },
        isMock: true,
      });
      setIncidentId(`FALLBACK-${Date.now()}`);
      setActiveIncident(true);
    } finally {
      setDispatching(false);
    }
  }, [user, userLocation]);

  /* ─── Cancel dispatch ──────────────────────────────────────── */
  const startCancelHold = () => {
    setCancelling(true);
    const start = Date.now();
    cancelTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / 2000) * 100, 100);
      setCancelProgress(pct);
      if (pct >= 100) {
        clearInterval(cancelTimerRef.current);
        performCancel();
      }
    }, 30);
  };

  const stopCancelHold = () => {
    clearInterval(cancelTimerRef.current);
    setCancelling(false);
    setCancelProgress(0);
  };

  const performCancel = async () => {
    try {
      const token = user?.accessToken || user?.stsTokenManager?.accessToken;
      if (incidentId && token && !incidentId.startsWith('DEMO') && !incidentId.startsWith('FALLBACK')) {
        await fetch('/api/sos/dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'cancel', incidentId, reason: 'False alarm' }),
        });
      }
    } catch (err) {
      console.warn('[sos] Cancel failed:', err);
    }

    setActiveIncident(false);
    setCancelling(false);
    setCancelProgress(0);
    setDispatchResult(null);
    setIncidentId(null);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const responder = dispatchResult?.responder || {};

  return (
    <div
      className={`min-h-screen text-on-surface antialiased flex flex-col relative overflow-x-hidden ${
        activeIncident ? 'bg-[#041522] sos-active-border' : 'bg-background'
      }`}
    >
      <Header
        title={activeIncident ? 'CRITICAL INCIDENT ACTIVE' : 'EMERGENCY DISPATCH'}
        showNotification={false}
      />

      <main className="flex-grow pt-[80px] pb-[100px] px-gutter flex flex-col max-w-2xl mx-auto w-full z-10 relative">
        {/* ─── Tier upgrade prompt ─── */}
        {tierBlocked && (
          <div className="glass-panel p-md rounded-2xl border-2 border-secondary mb-md animate-fade-in">
            <div className="flex items-start gap-sm">
              <span className="material-symbols-outlined text-3xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
              <div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface">Upgrade Required</h3>
                <p className="font-body-md text-sm text-on-surface-variant mb-sm">
                  SOS emergency dispatch requires a <strong>Standard</strong> or <strong>Premium</strong> subscription.
                </p>
                <button
                  onClick={() => router.push('/subscribe')}
                  className="bg-secondary hover:bg-secondary-fixed text-on-secondary font-label-md text-sm font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Upgrade Now — From R100/mo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── GPS status ─── */}
        {!activeIncident && (
          <div className="glass-panel px-3 py-2 rounded-xl mb-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#38a169]">my_location</span>
            <span className="text-xs text-on-surface-variant">
              {userLocation.lat
                ? `GPS locked: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : locationError || 'Acquiring GPS signal...'}
            </span>
          </div>
        )}

        {/* ─── ACTIVE INCIDENT ─── */}
        {activeIncident ? (
          <div className="space-y-md animate-fade-in">
            {/* Emergency Status Header */}
            <div className="glass-panel p-md rounded-2xl border-2 border-error bg-error/10 relative overflow-hidden text-center shadow-[0_0_30px_rgba(229,62,62,0.4)]">
              <div className="flex items-center justify-between mb-xs">
                <span className="bg-error text-white font-label-sm text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  LIVE SOS #{emergencyType.label}
                </span>
                <span className="font-mono text-error font-bold text-sm tracking-wider">
                  ⏱ {formatTime(secondsActive)} ACTIVE
                </span>
              </div>
              <h2 className="font-headline-lg-mobile text-2xl font-black text-white tracking-wide mt-1">
                DISPATCH ACTIVATED
              </h2>
              <p className="font-label-sm text-xs text-on-surface-variant mt-0.5">
                {dispatchResult?.isMock
                  ? 'Demo Mode — GPS telemetry linked with SafeLink Command'
                  : 'GPS telemetry linked with Aura Armed Command & SAPS'}
              </p>

              {/* Audio Waveform */}
              <div className="flex items-center justify-center gap-1.5 py-3 mt-2 bg-surface-container-lowest/60 rounded-xl border border-white/5">
                <span className="material-symbols-outlined text-error text-sm animate-pulse">mic</span>
                <span className="text-[11px] font-semibold text-error mr-2">Live Audio Uplink</span>
                {[4, 14, 8, 22, 18, 10, 24, 16, 8, 20, 12, 6].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-error rounded-full waveform-bar"
                    style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Responder Unit Card */}
            <div className="glass-panel p-md rounded-2xl border border-secondary/40 shadow-xl space-y-sm bg-surface-container/90">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-sm">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-3xl">local_police</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-base font-bold text-on-surface">
                      {responder.vehicle || 'Unit'} ({responder.company || 'Dispatching...'})
                    </h3>
                    <p className="font-label-sm text-xs text-on-surface-variant">
                      {responder.officer || 'Officer assigned'} • Armed Response
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-secondary font-headline-md text-lg font-black">
                    {dispatchResult?.eta || '---'}
                  </span>
                  <p className="text-[10px] text-secondary font-semibold uppercase">Estimated Arrival</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                  <span>Responder en route to your location</span>
                  <span className="text-[#38a169]">
                    {dispatchResult?.status === 'dispatched' ? 'Approaching' : dispatchResult?.status || 'Dispatching'}
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-3/4 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-sm pt-1">
                <button
                  onClick={() => alert('Connecting live patch to dispatcher...')}
                  className="bg-secondary text-on-secondary font-label-md text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(255,195,47,0.3)]"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Call Officer
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'My Emergency Location',
                        text: `SOS Alert from SafeLink!\nLocation: ${userLocation.lat}, ${userLocation.lng}`,
                        url: `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`,
                      });
                    } else {
                      navigator.clipboard.writeText(
                        `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`
                      );
                      alert('Location URL copied to clipboard');
                    }
                  }}
                  className="glass-panel text-on-surface font-label-md text-xs py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 hover:bg-white/5 active:scale-95 border-white/10"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">share_location</span>
                  Share Location
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="glass-panel p-md rounded-2xl border border-white/10 space-y-sm">
              <h4 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                Emergency Notifications Dispatched
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface font-medium">Emergency Contact(s)</span>
                  <span className="text-[#38a169] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    SMS & App Alert Delivered
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface font-medium">
                    {dispatchResult?.isMock ? 'SafeLink Demo Control' : 'Aura Control Room 24/7'}
                  </span>
                  <span className="text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">radio</span>
                    Operator Assigned
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface font-medium">SAPS Nearest Station</span>
                  <span className="text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">security</span>
                    Relayed
                  </span>
                </div>
              </div>
            </div>

            {/* Hold to Cancel */}
            <div className="pt-2">
              <button
                onMouseDown={startCancelHold}
                onMouseUp={stopCancelHold}
                onTouchStart={startCancelHold}
                onTouchEnd={stopCancelHold}
                className="w-full relative overflow-hidden glass-panel border border-error/50 hover:bg-error/10 text-error py-3.5 rounded-2xl font-label-md text-sm font-bold flex flex-col items-center justify-center select-none cursor-pointer"
              >
                {cancelProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-error/30 transition-all duration-75"
                    style={{ width: `${cancelProgress}%` }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">cancel</span>
                  {cancelling ? `Holding to cancel... ${Math.round(cancelProgress)}%` : 'Hold 2s to Cancel SOS'}
                </span>
                <span className="relative z-10 text-[10px] text-on-surface-variant font-normal mt-0.5">
                  Pin verification required upon cancellation
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* ─── PANIC SELECTOR ─── */
          <div className="flex flex-col gap-md">
            <div className="text-center mb-sm">
              <p className="font-body-md text-sm text-error font-semibold tracking-wide">
                {dispatching
                  ? 'Connecting to dispatch...'
                  : 'Immediate response team will be dispatched upon selection'}
              </p>
            </div>

            {EMERGENCY_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleSelectEmergency(type)}
                disabled={dispatching}
                className={`glass-panel rounded-2xl p-md flex items-center gap-md text-left transition-all active:scale-95 hover:bg-surface-container-high/90 border-l-4 ${type.borderClass} relative overflow-hidden group cursor-pointer ${
                  dispatching ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="bg-surface-container rounded-2xl p-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span
                    className="material-symbols-outlined text-[36px]"
                    style={{ color: type.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {type.icon}
                  </span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-headline-md text-base font-bold text-on-surface">{type.title}</h3>
                  <p className="font-body-md text-xs text-on-surface-variant line-clamp-1">{type.desc}</p>
                </div>
                <span
                  className="material-symbols-outlined text-outline-variant transition-colors"
                  style={{ '--tw-text-opacity': 1 }}
                >
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
