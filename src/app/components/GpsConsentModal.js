'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocationSharing } from '@/lib/location-sharing';

const GPS_ROUTES = ['/dashboard', '/map', '/devices', '/family'];

export default function GpsConsentModal() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { isOptedIn, isSharing, error, optIn, optOut } = useLocationSharing();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mayShare = user && !user.isPartnerSession && (user.isFamilyMember || user.emailVerified || user.isTestSession);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mayShare || !GPS_ROUTES.includes(pathname)) return;

    const handleReopen = () => setIsOpen(true);
    window.addEventListener('open_gps_consent_modal', handleReopen);
    const savedConsent = localStorage.getItem('popia_gps_consent');
    const timer = !savedConsent ? setTimeout(() => setIsOpen(true), 1500) : null;

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('open_gps_consent_modal', handleReopen);
    };
  }, [mayShare, pathname]);

  const handleAccept = async () => {
    setIsSaving(true);
    const enabled = await optIn();
    setIsSaving(false);
    if (enabled) setIsOpen(false);
  };

  const handleDecline = async () => {
    setIsSaving(true);
    await optOut();
    localStorage.setItem('popia_gps_consent', 'denied');
    setIsSaving(false);
    setIsOpen(false);
  };

  if (!mayShare || !GPS_ROUTES.includes(pathname) || !isOpen) return null;

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
          Share your phone location with Safelink while the app is open. You can use the app without sharing. Background tracking is not supported by this PWA, and SOS dispatch is a labelled demonstration.
        </p>

        <div className="space-y-2 py-2">
          <div className="flex items-start gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">verified_user</span>
            <span>Used to display your phone on your safety map.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">lock</span>
            <span>Your shared coordinates are available only to your account and an authorised linked guardian.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">toggle_on</span>
            <span>You may revoke tracking consent at any time in Profile Settings.</span>
          </div>
        </div>

        {error && <p role="alert" className="text-xs text-error">{error}</p>}
        {isOptedIn && isSharing && <p className="text-xs text-[#38a169]">Phone location sharing is active.</p>}

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button onClick={handleAccept} disabled={isSaving} className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-xs uppercase tracking-wider font-bold py-3.5 px-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {isSaving ? 'Enabling…' : 'Accept & Enable GPS'}
          </button>
          <button onClick={handleDecline} disabled={isSaving} className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-on-surface-variant font-label-md text-xs font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-60">
            Decline / Later
          </button>
        </div>
      </div>
    </div>
  );
}
