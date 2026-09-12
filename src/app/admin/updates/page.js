'use client';
import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';

export default function ReleasePublisher() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    user?.getIdTokenResult?.().then(result => { if (active) setAllowed(result.claims.notificationAdmin === true); }).catch(() => {});
    return () => { active = false; };
  }, [user]);
  return <AuthGuard><div className="min-h-screen bg-background"><Header title="App releases" showBack /><main className="pt-20 px-4 pb-12 max-w-xl mx-auto">
    {!allowed ? <p>Release publishing requires a SafeLink notification administrator.</p> : <form className="glass-panel rounded-2xl p-4 space-y-4" data-update-blocked={busy || !!title || !!body} onSubmit={async event => {
      event.preventDefault(); setBusy(true); setNotice('');
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch('/api/notifications/releases', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ version: process.env.NEXT_PUBLIC_APP_RELEASE, title, body, important }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not publish release');
        setNotice('Release published to the app inbox. Eligible phone notifications are queued.'); setTitle(''); setBody('');
      } catch (error) { setNotice(error.message); } finally { setBusy(false); }
    }}>
      <h1 className="font-bold">What’s new in SafeLink</h1>
      <p className="text-xs text-on-surface-variant">Publish one announcement for this deployed release. App updates install automatically; this message explains the changes.</p>
      <label className="block text-sm">Title<input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} className="mt-1 block w-full rounded-xl bg-surface p-3" /></label>
      <label className="block text-sm">Release notes<textarea required maxLength={1000} rows={5} value={body} onChange={event => setBody(event.target.value)} className="mt-1 block w-full rounded-xl bg-surface p-3" /></label>
      <label className="flex items-center gap-2 min-h-11 text-sm"><input type="checkbox" checked={important} onChange={event => setImportant(event.target.checked)} />Important release: notify users who enabled app-update push</label>
      <button disabled={busy} className="min-h-11 px-4 rounded-xl bg-secondary text-on-secondary font-semibold">{busy ? 'Publishing…' : 'Publish release announcement'}</button>
    </form>}
    {notice && <p role="status" className="mt-4 text-sm">{notice}</p>}
  </main></div></AuthGuard>;
}
