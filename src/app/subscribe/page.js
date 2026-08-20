'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

export default function SubscribePage() {
  return (
    <AuthGuard>
      <SubscriptionContent />
    </AuthGuard>
  );
}

function SubscriptionContent() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly | annual
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = () => {
    setProcessing(true);
    setTimeout(() => {
      alert('Redirecting to Paystack 3D-Secure Payment Gateway...');
      setProcessing(false);
    }, 1200);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased pb-32">
      <Header title="Join SafeLink Protection" showBack={true} showNotification={false} />

      <main className="flex-1 flex flex-col items-center justify-center px-gutter py-lg mt-14 max-w-2xl mx-auto w-full">
        {/* Hero Title (from Stitch subscription_plan/code.html) */}
        <div className="text-center mb-lg space-y-1">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-xs font-bold uppercase tracking-widest border border-secondary/30">
            Uncompromised Security
          </span>
          <h1 className="font-display-lg text-3xl md:text-4xl font-black text-on-surface tracking-tight">
            Secure Your World
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-md mx-auto">
            The elite digital bodyguard and armed response platform for the modern South African.
          </p>
        </div>

        {/* Pricing Card (from Stitch subscription_plan/code.html) */}
        <div className="w-full glass-card rounded-2xl p-md md:p-lg mb-lg glow-effect relative overflow-hidden border border-secondary/40 shadow-2xl">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-md mb-md">
              <div>
                <span className="bg-secondary text-on-secondary font-label-sm text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  All-Inclusive Plan
                </span>
                <h2 className="font-headline-md text-xl font-bold text-secondary mt-1">SafeLink Platinum Member</h2>
                <p className="font-body-md text-xs text-on-surface-variant">Complete family & armed protection plan</p>
              </div>
              <div className="text-right">
                <div className="font-headline-lg text-3xl font-black text-on-surface">R100</div>
                <div className="font-label-sm text-xs text-on-surface-variant">/month per household</div>
              </div>
            </div>

            {/* Feature Checklist */}
            <ul className="space-y-sm mb-lg">
              <li className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="font-body-md text-sm text-on-surface font-medium">
                  Instant mobile panic button with armed tactical response dispatch
                </span>
              </li>
              <li className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="font-body-md text-sm text-on-surface font-medium">
                  Real-time live family radar & geofence safety perimeter alerts
                </span>
              </li>
              <li className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="font-body-md text-sm text-on-surface font-medium">
                  24/7 Medical ER, Fire & Rescue, and roadside towing response
                </span>
              </li>
              <li className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="font-body-md text-sm text-on-surface font-medium">
                  Sentinel BLE tags & OBD-II vehicle tracking telemetry integration
                </span>
              </li>
              <li className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="font-body-md text-sm text-on-surface font-medium">
                  PSIRA-certified control center monitoring with nationwide coverage
                </span>
              </li>
            </ul>

            {/* CTA Button */}
            <button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full bg-secondary hover:bg-secondary-fixed text-on-secondary font-label-md text-sm font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(247,187,35,0.3)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">verified_user</span>
              {processing ? 'Connecting Paystack Gateway...' : 'Activate Membership (R100/mo)'}
            </button>

            <div className="flex items-center justify-center gap-2 mt-sm text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-[#38a169]">lock</span>
              <span>Encrypted via Paystack • Cancel anytime without penalty</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
