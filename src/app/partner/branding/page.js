'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Legacy Partner Branding Route.
 * Redirects to the multi-tenant Look & Feel Studio (/cream/company/[companyId]/branding).
 *
 * The target company is resolved from the active partner session (preferred),
 * falling back to the household's securityCompanyId, then to the default.
 */
export default function PartnerBrandingRedirectPage() {
  const router = useRouter();
  const { partnerSession } = useAuth();

  useEffect(() => {
    // Resolve the active company ID from the partner session or household cache.
    let companyId = null;

    if (partnerSession?.partnerId) {
      // Partner session stores partner prefix (e.g. "SB") — normalise to company ID.
      const prefix = String(partnerSession.partnerId).toUpperCase().split('-')[0];
      const prefixMap = { SB: 'sb_security', SI: 'sovereign_intervention' };
      companyId = prefixMap[prefix] || prefix.toLowerCase();
    }

    if (!companyId) {
      try {
        const household = JSON.parse(localStorage.getItem('active_household') || '{}');
        if (household.securityCompanyId) companyId = household.securityCompanyId;
      } catch { /* ignore */ }
    }

    router.replace(`/cream/company/${companyId || 'sovereign_intervention'}/branding`);
  }, [router, partnerSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040D16] text-white">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="material-symbols-outlined animate-spin text-amber-400">progress_activity</span>
        <span>Loading Look &amp; Feel Studio...</span>
      </div>
    </div>
  );
}
