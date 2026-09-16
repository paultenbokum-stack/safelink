'use client';

import React from 'react';
import Link from 'next/link';
import BrandCustomizer from '@/app/components/BrandCustomizer';

export default function CompanyBrandingPage({ params: paramsPromise }) {
  const resolvedParams = paramsPromise && typeof paramsPromise.then === 'function' ? React.use(paramsPromise) : paramsPromise;
  const companyId = resolvedParams?.companyId || 'sovereign_intervention';

  return (
    <div className="bg-[#03070f] text-on-background min-h-screen font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0d091a] via-[#100c24] to-[#0d091a] border-b border-purple-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href={`/cream/company/${companyId}`} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-300 hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">palette</span>
              White-Label Look & Feel Studio
            </h1>
            <p className="text-xs text-purple-300/70">Configure brand mark, header styling, opacity and button theme</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/cream/company/${companyId}`}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-all"
          >
            Back to Dashboard
          </Link>
          <Link
            href={`/cream/company/${companyId}/stock`}
            className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-200 hover:bg-purple-600/50 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            Stock & Inventory
          </Link>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <BrandCustomizer companyId={companyId} />
      </main>
    </div>
  );
}
