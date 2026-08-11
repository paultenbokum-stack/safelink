'use client';

import { useRouter } from 'next/navigation';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';

// This route is no longer used — SOS active state is now managed
// inside /sos/page.js as a state transition (idle → holding → active).
// This file exists as a safety redirect.
export default function SOSActivePage() {
  const router = useRouter();
  if (typeof window !== 'undefined') router.replace('/sos');
  return null;
}
