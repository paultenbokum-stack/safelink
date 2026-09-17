'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy Partner Route:
 * Security companies are the partners in SafeLink. Their dedicated hub
 * is the Security Partner Command Center (/cream/company/[companyId]).
 * This redirect ensures any bookmarks or direct URLs route to the live Command Center.
 */
export default function PartnerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cream/company/sovereign_intervention');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040D16] text-white">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="material-symbols-outlined animate-spin text-amber-400">progress_activity</span>
        <span>Connecting to Security Partner Command Center...</span>
      </div>
    </div>
  );
}
