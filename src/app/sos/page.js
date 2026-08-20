'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

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
  const initialType = searchParams.get('type') || null;

  const [activeIncident, setActiveIncident] = useState(initialType ? true : false);
  const [emergencyType, setEmergencyType] = useState(initialType ? initialType.toUpperCase() : 'ARMED RESPONSE');
  const [secondsActive, setSecondsActive] = useState(38);
  const [etaMinutes, setEtaMinutes] = useState(3);
  const [cancelling, setCancelling] = useState(false);
  const [cancelProgress, setCancelProgress] = useState(0);

  const cancelTimerRef = useRef(null);

  useEffect(() => {
    let timer;
    if (activeIncident) {
      timer = setInterval(() => {
        setSecondsActive((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeIncident]);

  const handleSelectEmergency = (type) => {
    setEmergencyType(type);
    setActiveIncident(true);
  };

  const startCancelHold = () => {
    setCancelling(true);
    let start = Date.now();
    cancelTimerRef.current = setInterval(() => {
      let elapsed = Date.now() - start;
      let pct = Math.min((elapsed / 2000) * 100, 100);
      setCancelProgress(pct);
      if (pct >= 100) {
        clearInterval(cancelTimerRef.current);
        setActiveIncident(false);
        setCancelling(false);
        setCancelProgress(0);
      }
    }, 30);
  };

  const stopCancelHold = () => {
    clearInterval(cancelTimerRef.current);
    setCancelling(false);
    setCancelProgress(0);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

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
        {/* ================= STATE 1: ACTIVE INCIDENT DISPATCH ================= */}
        {activeIncident ? (
          <div className="space-y-md animate-fade-in">
            {/* Pulsing Emergency Status Header */}
            <div className="glass-panel p-md rounded-2xl border-2 border-error bg-error/10 relative overflow-hidden text-center shadow-[0_0_30px_rgba(229,62,62,0.4)]">
              <div className="flex items-center justify-between mb-xs">
                <span className="bg-error text-white font-label-sm text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  LIVE SOS #{emergencyType}
                </span>
                <span className="font-mono text-error font-bold text-sm tracking-wider">
                  ⏱ {formatTime(secondsActive)} ACTIVE
                </span>
              </div>
              <h2 className="font-headline-lg-mobile text-2xl font-black text-white tracking-wide mt-1">
                DISPATCH ACTIVATED
              </h2>
              <p className="font-label-sm text-xs text-on-surface-variant mt-0.5">
                GPS telemetry linked with Help24 Armed Command & SAPS
              </p>

              {/* Audio Waveform Recording Animation */}
              <div className="flex items-center justify-center gap-1.5 py-3 mt-2 bg-surface-container-lowest/60 rounded-xl border border-white/5">
                <span className="material-symbols-outlined text-error text-sm animate-pulse">mic</span>
                <span className="text-[11px] font-semibold text-error mr-2">Live Audio Uplink</span>
                {[4, 14, 8, 22, 18, 10, 24, 16, 8, 20, 12, 6].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-error rounded-full waveform-bar"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  ></div>
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
                      Unit AR-402 (Help24 Tactical)
                    </h3>
                    <p className="font-label-sm text-xs text-on-surface-variant">
                      Officer Khumalo • Armoured Response 4x4
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-secondary font-headline-md text-lg font-black">{etaMinutes} MINS</span>
                  <p className="text-[10px] text-secondary font-semibold uppercase">Estimated Arrival</p>
                </div>
              </div>

              {/* Distance Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                  <span>1.4 km away from your location</span>
                  <span className="text-[#38a169]">Approaching via Sandton Dr</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-3/4 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-sm pt-1">
                <button
                  onClick={() => alert('Connecting live patch to Help24 Dispatcher...')}
                  className="bg-secondary text-on-secondary font-label-md text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(255,195,47,0.3)]"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Call Officer
                </button>
                <button
                  onClick={() => alert('Location beacon pinned and shared to WhatsApp family group.')}
                  className="glass-panel text-on-surface font-label-md text-xs py-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 hover:bg-white/5 active:scale-95 border-white/10"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">share_location</span>
                  Share Location
                </button>
              </div>
            </div>

            {/* Notified Contacts Status */}
            <div className="glass-panel p-md rounded-2xl border border-white/10 space-y-sm">
              <h4 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                Emergency Notifications Dispatched
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface font-medium">Naledi Molefe (Wife)</span>
                  <span className="text-[#38a169] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> SMS & App Alert Delivered
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface font-medium">Help24 Control Room 24/7</span>
                  <span className="text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">radio</span> Operator Assigned
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface font-medium">Sandton SAPS Sector 3</span>
                  <span className="text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">security</span> Relayed
                  </span>
                </div>
              </div>
            </div>

            {/* Hold to Cancel SOS */}
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
                  ></div>
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
          /* ================= STATE 2: PANIC SELECTOR PANEL ================= */
          <div className="flex flex-col gap-md">
            <div className="text-center mb-sm">
              <p className="font-body-md text-sm text-error font-semibold tracking-wide">
                Immediate response team will be dispatched upon selection
              </p>
            </div>

            {/* Armed Response Card */}
            <button
              onClick={() => handleSelectEmergency('ARMED RESPONSE')}
              className="glass-panel rounded-2xl p-md flex items-center gap-md text-left transition-all active:scale-95 hover:bg-surface-container-high/90 border-l-4 border-l-secondary relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-surface-container rounded-2xl p-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-[36px] text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_police
                </span>
              </div>
              <div className="flex-grow">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Armed Response</h3>
                <p className="font-body-md text-xs text-on-surface-variant line-clamp-1">
                  Intruder, hijacking, home invasion, or physical threat.
                </p>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">
                chevron_right
              </span>
            </button>

            {/* Medical Card */}
            <button
              onClick={() => handleSelectEmergency('MEDICAL SOS')}
              className="glass-panel rounded-2xl p-md flex items-center gap-md text-left transition-all active:scale-95 hover:bg-surface-container-high/90 border-l-4 border-l-[#38a169] relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-surface-container rounded-2xl p-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-[36px] text-[#38a169]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  medical_services
                </span>
              </div>
              <div className="flex-grow">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Medical Emergency</h3>
                <p className="font-body-md text-xs text-on-surface-variant line-clamp-1">
                  Cardiac event, injury, trauma, or critical ambulance needed.
                </p>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-[#38a169] transition-colors">
                chevron_right
              </span>
            </button>

            {/* Fire Card */}
            <button
              onClick={() => handleSelectEmergency('FIRE EMERGENCY')}
              className="glass-panel rounded-2xl p-md flex items-center gap-md text-left transition-all active:scale-95 hover:bg-surface-container-high/90 border-l-4 border-l-error relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-surface-container rounded-2xl p-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-[36px] text-error"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
              </div>
              <div className="flex-grow">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Fire & Rescue</h3>
                <p className="font-body-md text-xs text-on-surface-variant line-clamp-1">
                  Structural fire, electrical explosion, or smoke hazard.
                </p>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-error transition-colors">
                chevron_right
              </span>
            </button>

            {/* Roadside Assistance / Towing */}
            <button
              onClick={() => handleSelectEmergency('ROADSIDE ASSIST')}
              className="glass-panel rounded-2xl p-md flex items-center gap-md text-left transition-all active:scale-95 hover:bg-surface-container-high/90 border-l-4 border-l-primary relative overflow-hidden group cursor-pointer"
            >
              <div className="bg-surface-container rounded-2xl p-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-[36px] text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  rv_hookup
                </span>
              </div>
              <div className="flex-grow">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Roadside & Towing</h3>
                <p className="font-body-md text-xs text-on-surface-variant line-clamp-1">
                  Vehicle breakdown, flat tyre, jump-start, or towing escort.
                </p>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
