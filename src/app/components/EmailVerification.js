'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function EmailVerification() {
  const { user, loading, verifyEmail, verificationEmail } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const delivery = verificationEmail?.uid === user?.uid ? verificationEmail : null;
  const retryAt = delivery?.retryAt || 0;
  const secondsLeft = Math.max(0, Math.ceil((retryAt - now) / 1000));

  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  async function send() {
    setBusy(true);
    setMessage('');
    try { await verifyEmail(); }
    catch (error) {
      if (!auth.currentUser) setMessage(error.message);
      // Provider errors are displayed from the shared delivery status.
    }
    finally { setNow(Date.now()); setBusy(false); }
  }

  async function check() {
    setBusy(true);
    try {
      if (!auth.currentUser) throw new Error('Not signed in');
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      if (auth.currentUser.emailVerified) router.replace('/dashboard');
      else setMessage('Your email is not verified yet. Open the verification link in your email, then try again.');
    } catch { setMessage('Please sign in again to continue.'); }
    finally { setBusy(false); }
  }

  const status = message || (delivery?.status === 'sent'
    ? 'The email service accepted your verification request. Delivery can take a few minutes; please check your inbox and your spam or junk folder.'
    : delivery?.status === 'error'
      ? delivery.message
      : delivery?.status === 'sending'
        ? 'Requesting your verification email…'
        : 'Request a verification email below, open the link, then return here.');

  return (
    <main className="min-h-screen bg-background text-on-surface p-5 flex items-center justify-center">
      <section className="glass-panel p-6 rounded-2xl max-w-md w-full space-y-5">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-on-surface-variant break-words">{loading ? 'Loading your account…' : user?.email || 'Sign in to verify your account.'}</p>
        <p className="text-sm" role="status">{status}</p>
        <div role="note" className="p-3 rounded-xl bg-secondary/10 border border-secondary/25 flex items-start gap-2.5 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-secondary text-lg shrink-0">mark_email_read</span>
          <span>Look for an email with “Verify your email” in the subject. Check your spam or junk folder too. If it is there, mark it as <strong className="text-on-surface">Not spam</strong> before opening the verification link so the link is enabled and opens correctly.</span>
        </div>
        {user && !user.isPartnerSession && <>
          <button type="button" disabled={busy || secondsLeft > 0 || delivery?.status === 'sending'} onClick={send} className="w-full bg-secondary text-on-secondary p-3 rounded-xl font-bold disabled:opacity-60">
            {delivery?.status === 'sending' ? 'Requesting email…' : secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : 'Send verification email'}
          </button>
          <button type="button" disabled={busy} onClick={check} className="w-full glass-panel p-3 rounded-xl disabled:opacity-60">I’ve verified my email</button>
        </>}
        <Link href="/login" className="block text-center text-secondary text-sm">Back to sign in</Link>
      </section>
    </main>
  );
}
