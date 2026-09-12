'use client';

import InvestorIntro from '@/app/components/InvestorIntro';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[calc(100dvh-3rem)] w-full flex flex-col justify-between items-center bg-background text-on-surface overflow-hidden">
      <div className="h-16 w-full"></div>

      <main className="flex flex-col items-center justify-center space-y-lg px-gutter w-full max-w-sm">
        {/* Logo Container with Glow */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center mb-xl">
          <div className="w-32 h-32 rounded-3xl bg-secondary/15 border-2 border-secondary/50 flex items-center justify-center p-4 shadow-[0_0_35px_rgba(247,187,35,0.4)] animate-bounce">
            <img
              src="/safelink-shield.png"
              alt="SafeLink Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <InvestorIntro />
      </main>

      <footer className="w-full py-xl px-gutter flex flex-col items-center justify-center pb-12">
        <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">
          Powered by
        </p>
        <p className="font-label-md text-sm text-on-surface font-bold mt-0.5">
          SB Security & Help24 Tactical
        </p>

        <div className="mt-md flex space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>
      </footer>
    </div>
  );
}
