
'use client';

import Link from 'next/link';
import AuthGuard from '@/app/components/AuthGuard';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';

export default function CommunityPage() {
  return <AuthGuard><div className="min-h-screen bg-background text-on-surface pb-28">
    <Header title="Community updates" showBack />
    <main className="pt-20 px-4 max-w-2xl mx-auto">
      <section className="glass-panel rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Your community, in one inbox</h2>
        <p className="text-sm text-on-surface-variant">Read updates from authorised community and security-company publishers in Notifications. Only channels connected to your family appear there.</p>
        <Link href="/notifications" className="inline-block bg-secondary text-on-secondary font-bold rounded-xl px-4 py-3">Open notifications</Link>
      </section>
    </main><BottomNav />
  </div></AuthGuard>;
}
