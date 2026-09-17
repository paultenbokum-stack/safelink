'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy Partner Branding Route:
 * Redirects to the multi-tenant Look & Feel Studio (/cream/company/[companyId]/branding).
 */
export default function PartnerBrandingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cream/company/sovereign_intervention/branding');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040D16] text-white">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="material-symbols-outlined animate-spin text-amber-400">progress_activity</span>
        <span>Loading Look & Feel Studio...</span>
      </div>
    </div>
  );
}
