'use client';

import React, { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Capture PWA Install Prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);

      // Check if previously dismissed recently
      const dismissedUntil = localStorage.getItem('safelink_pwa_dismissed');
      if (!dismissedUntil || Date.now() > parseInt(dismissedUntil, 10)) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log('[PWA] User response to install prompt:', outcome);
    setInstallPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 7 days
    localStorage.setItem('safelink_pwa_dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  if (!showBanner || !installPrompt) return null;

  return (
    <aside aria-label="Install App" className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-[92%] max-w-md animate-fadeIn">
      <div className="glass-panel bg-surface-container/95 border border-secondary/40 rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary text-2xl">install_mobile</span>
          </div>
          <div>
            <h3 className="font-headline-md text-xs font-bold text-on-surface">Install SafeLink App</h3>
            <p className="font-body-sm text-[11px] text-on-surface-variant">
              Quick access, offline readiness, and live background tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-secondary text-on-secondary text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-secondary-fixed transition-all active:scale-95 shadow-[0_0_12px_rgba(255,195,47,0.3)] cursor-pointer"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
