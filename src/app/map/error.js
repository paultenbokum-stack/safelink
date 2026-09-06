'use client';

import React, { useEffect } from 'react';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';

export default function MapError({ error, reset }) {
  useEffect(() => {
    console.error('[map] MapPage runtime error captured:', error);
  }, [error]);

  return (
    <div className="bg-background text-on-background font-body-md h-screen w-screen overflow-hidden flex flex-col relative">
      <Header title="Live Radar & GPS" showNotification={false} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <span className="material-symbols-outlined text-3xl">radar</span>
        </div>

        <h2 className="font-headline-md text-xl font-bold text-on-surface">
          Radar Map Temporarily Unavailable
        </h2>

        <p className="text-sm text-on-surface-variant leading-relaxed">
          The radar map encountered a display refresh issue. You can reload the map or return to your devices dashboard.
        </p>

        <div className="flex items-center gap-3 pt-2 w-full justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            Reload Radar
          </button>
          <button
            onClick={() => { window.location.href = '/devices'; }}
            className="px-5 py-2.5 rounded-xl glass-panel text-on-surface font-label-md text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/10"
          >
            View Devices
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
