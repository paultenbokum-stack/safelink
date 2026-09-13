'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';

export default function TermsPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased">
      <Header title="Terms & Conditions" showBack={true} showNotification={false} />

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-gutter pt-20 pb-10">
        <div className="bg-surface-container/80 backdrop-blur-md border border-white/10 rounded-2xl p-md md:p-lg flex-1 flex flex-col shadow-2xl space-y-lg">
          <p className="text-sm text-on-surface-variant">
            Welcome to SafeLink. Before proceeding, please carefully review our terms regarding emergency armed response, POPIA compliance, and location tracking telemetry.
          </p>

          <div className="space-y-md">
            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
                1. Background Location Tracking
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                To provide Digital Bodyguard services, this application uses GPS telemetry while SafeLink is open to calculate dispatch routes and update authorised household members during panic alerts.
              </p>
            </div>

            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mic
                </span>
                2. Emergency Audio Capture
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Upon activation of an SOS panic button, available incident information may be transmitted to the response provider linked to your SafeLink account to verify the situation and coordinate assistance.
              </p>
            </div>

            <div>
              <h2 className="font-headline-md text-base font-bold text-on-surface mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
                3. South African POPIA & PSIRA Compliance
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                All data is encrypted with AES-256 and localized on South African sovereign infrastructure in compliance with the Protection of Personal Information Act (POPIA). Armed responders are PSIRA registered and vetted.
              </p>
            </div>
          </div>

          <div className="pt-md border-t border-white/10 flex flex-col gap-sm">
            <label className="flex items-center gap-sm cursor-pointer text-xs text-on-surface">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 text-secondary focus:ring-secondary"
              />
              <span>I have read, understood, and accept the terms of service and POPIA consent.</span>
            </label>

            <button
              onClick={() => router.back()}
              disabled={!agreed}
              className={`w-full py-3 rounded-xl font-label-md text-sm font-bold transition-all ${
                agreed
                  ? 'bg-secondary text-on-secondary hover:bg-secondary-fixed shadow-[0_0_12px_rgba(247,187,35,0.3)] cursor-pointer'
                  : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-50'
              }`}
            >
              Accept & Return
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
