'use client';

import React from 'react';
import Link from 'next/link';
import BrandCustomizer from '@/app/components/BrandCustomizer';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

export default function PartnerBrandingPage() {
  return (
    <AuthGuard>
      <PartnerBrandingContent />
    </AuthGuard>
  );
}

function PartnerBrandingContent() {
  const { partnerSession } = useAuth();
  const companyId = partnerSession?.partnerId || 'sovereign_intervention';

  return (
    <div className="bg-[#03070f] text-on-background min-h-screen font-sans pb-32">
      <Header title="White-Label Portal Studio" showNotification={true} />

      <main className="pt-20 px-gutter max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/partner"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-secondary hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-xl font-bold text-white">Security Partner Look & Feel</h2>
              <p className="text-xs text-on-surface-variant">
                Configure your brand identity across all customer devices
              </p>
            </div>
          </div>

          <Link
            href="/partner"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all"
          >
            Dispatch Operations
          </Link>
        </div>

        <BrandCustomizer companyId={companyId} />
      </main>

      <BottomNav />
    </div>
  );
}
