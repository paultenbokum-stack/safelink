'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '@/app/components/AuthGuard';
import Header from '@/app/components/Header';
import { InstallAppPrompt } from '@/app/components/PwaRegister';

export default function FamilyHome() { return <AuthGuard><FamilyContent /></AuthGuard>; }
function FamilyContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/family/session', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) setProfile(data);
      } catch (error) { if (active) setError(error.message); }
    }
    load();
    return () => { active = false; };
  }, [user]);
  return <main className="min-h-screen bg-background text-on-surface px-5 pt-20 pb-10">
    <Header title="My family" />
    <section className="max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-secondary">SafeLink</h1>
      <InstallAppPrompt />
      {error ? <p role="alert">{error}</p> : profile ? <>
        <div className="glass-panel rounded-2xl p-6 space-y-2"><h2 className="text-xl font-bold">Welcome, {profile.name}</h2><p>You’re connected to {profile.householdName}.</p><p className="text-xs text-on-surface-variant">You’re signed in as a family member. No email address is needed.</p></div>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open_gps_consent_modal'))} className="w-full glass-panel rounded-xl p-4 font-bold">Location sharing settings</button>
        <a href="/sos" className="block text-center bg-error/15 border border-error/30 text-error rounded-xl p-4 font-bold">Try SOS demo</a>
        <p className="text-xs text-on-surface-variant">If you sign out or change phones, ask your guardian for a new sign-in invite.</p>
      </> : <p role="status">Loading your family…</p>}
      <button onClick={async () => { await logout(); router.replace('/login'); }} className="w-full rounded-xl border border-white/15 p-3">Sign out</button>
    </section>
  </main>;
}
