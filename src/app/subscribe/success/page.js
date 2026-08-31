'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { getTier } from '@/lib/subscriptions';

export default function SubscribeSuccessPage() {
  return (
    <AuthGuard>
      <SuccessContent />
    </AuthGuard>
  );
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const tierId = searchParams.get('tier') || 'standard';
  const tier = getTier(tierId);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased pb-32">
      <Header title="Subscription Active" showBack={false} showNotification={false} />

      <main className="flex-1 flex flex-col items-center justify-center px-gutter py-lg mt-14 max-w-lg mx-auto w-full text-center">
        {/* Success Animation */}
        <div className="w-24 h-24 rounded-full bg-[#38a169]/20 border-2 border-[#38a169] flex items-center justify-center mb-lg animate-bounce-slow">
          <span
            className="material-symbols-outlined text-5xl text-[#38a169]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        <h1 className="font-display-lg text-2xl font-black text-on-surface mb-xs">
          Welcome to {tier.name}!
        </h1>
        <p className="font-body-md text-sm text-on-surface-variant mb-md">
          Your {tier.priceDisplay}/month subscription is now active. Your family is protected.
        </p>

        {reference && (
          <div className="glass-panel p-sm rounded-xl border border-white/10 mb-md">
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              Payment Reference: {reference}
            </span>
          </div>
        )}

        {/* Features unlocked */}
        <div className="glass-card rounded-2xl p-md w-full mb-lg border border-[#38a169]/30">
          <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-[#38a169] mb-sm">
            Features Unlocked
          </h3>
          <ul className="space-y-2 text-left">
            {tier.features.slice(0, 5).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-on-surface">
                <span className="material-symbols-outlined text-sm text-[#38a169] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Auto redirect */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-secondary hover:bg-secondary-fixed text-on-secondary font-label-md text-sm font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          Go to Dashboard ({countdown}s)
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
