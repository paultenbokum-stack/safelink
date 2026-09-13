'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function readInvite() {
  const token = window.location.hash.slice(1);
  if (token) {
    sessionStorage.setItem('safelink_pending_invite', token);
    sessionStorage.removeItem('safelink_invite_attempt');
    window.history.replaceState(null, '', '/join');
  }
  let attempt = sessionStorage.getItem('safelink_invite_attempt');
  if (!attempt) {
    attempt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    sessionStorage.setItem('safelink_invite_attempt', attempt);
  }
  return { token: token || sessionStorage.getItem('safelink_pending_invite'), attempt };
}

export default function JoinFamilyPage() {
  const router = useRouter();
  const task = useRef(null);
  const [message, setMessage] = useState('Opening your SafeLink invitation…');
  const [switchAccount, setSwitchAccount] = useState(false);
  const [failed, setFailed] = useState(false);

  async function join(allowSwitch = false) {
    await auth.authStateReady();
    if (auth.currentUser && !allowSwitch) return 'switch';
    const invite = readInvite();
    if (!invite.token) throw new Error('This invitation is missing. Open the link your guardian shared with you.');
    const response = await fetch('/api/family/redeem', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invite),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not join SafeLink. Please retry.');
    const { user } = await signInWithCustomToken(auth, result.customToken);
    await updateProfile(user, { displayName: result.memberName }).catch(() => {});
    sessionStorage.removeItem('safelink_pending_invite');
    sessionStorage.removeItem('safelink_invite_attempt');
    return 'joined';
  }
  useEffect(() => {
    let active = true;
    // Reuse the same attempt across Strict Mode's effect replay.
    task.current ??= join();
    task.current.then(result => {
      if (!active) return;
      if (result === 'switch') { setSwitchAccount(true); setMessage('You are already signed in. Continue to switch to the invited family member’s account.'); }
      else router.replace('/dashboard');
    }).catch(error => { if (active) { setMessage(error.message); setFailed(true); } });
    return () => { active = false; };
  // The initial invitation must be redeemed only once, independently of renders.
  }, [router]);

  async function retry() {
    setFailed(false); setSwitchAccount(false); setMessage('Signing you into SafeLink…');
    try { await join(true); router.replace('/dashboard'); }
    catch (error) { setMessage(error.message); setFailed(true); }
  }
  return <main className="min-h-screen flex items-center justify-center bg-background text-on-surface p-5">
    <section className="glass-panel rounded-2xl p-6 max-w-md w-full space-y-5">
      <h1 className="text-2xl font-bold text-secondary">Join your family on SafeLink</h1>
      <p role={failed ? 'alert' : 'status'}>{message}</p>
      {(switchAccount || failed) && <button onClick={retry} className="w-full bg-secondary text-on-secondary p-3 rounded-xl font-bold">{switchAccount ? 'Continue as invited member' : 'Retry'}</button>}
      {switchAccount && <a href="/dashboard" className="block text-center text-on-surface-variant">Keep my current account</a>}
      <p className="text-xs text-on-surface-variant">No email or password needed. Your browser will keep you signed in.</p>
    </section>
  </main>;
}
