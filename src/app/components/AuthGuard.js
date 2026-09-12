'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Wraps protected pages — redirects to /login if not authenticated.
 * Shows a loading spinner while auth state is resolving.
 */
export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const familyRedirect = user?.isFamilyMember && !['/family', '/sos', '/notifications'].includes(pathname);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && familyRedirect) {
      router.replace('/family');
    } else if (!loading && user && !user.isPartnerSession && !user.isFamilyMember && !user.emailVerified) {
      router.replace('/login/verify');
    }
  }, [user, loading, router, familyRedirect]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: 'var(--bg-dark)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || familyRedirect || (!user.isPartnerSession && !user.isFamilyMember && !user.emailVerified)) return null;

  return children;
}
