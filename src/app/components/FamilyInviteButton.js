'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';

export default function FamilyInviteButton({ member, onChanged }) {
  const [invite, setInvite] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function manage(revoke = false) {
    setBusy(true); setMessage('');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Please sign in again.');
      const response = await fetch('/api/profile/family/invite', {
        method: revoke ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create the invitation.');
      setInvite(revoke ? null : { url: `${window.location.origin}/join#${data.token}`, expiresAt: data.expiresAt });
      setMessage(revoke ? 'Invitation link revoked.' : 'Link ready. Share it privately with this family member.');
      onChanged?.();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  const text = `Join my family on SafeLink, ${member.name}. Open this private link to sign in — no email or password needed. This link works once and expires after 24 hours. Please keep it private and don’t forward it.`;
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'SafeLink family invite', text, url: invite.url });
      else { await navigator.clipboard.writeText(`${text}\n${invite.url}`); setMessage('Invite copied. Paste it into WhatsApp or another message.'); }
    } catch (error) { if (error.name !== 'AbortError') setMessage('Sharing is unavailable here. Copy the link below.'); }
  }
  return <div className="mt-3 space-y-2 text-xs">
    {member.linkedUid && <p className="text-emerald-400">Joined SafeLink</p>}
    <button type="button" disabled={busy} onClick={() => manage()} className="text-secondary font-bold underline disabled:opacity-50">
      {busy ? 'Updating invite…' : member.linkedUid ? 'Send new sign-in invite' : 'Invite to SafeLink'}
    </button>
    {(invite || member.inviteHash) && <button type="button" disabled={busy} onClick={() => manage(true)} className="ml-3 text-on-surface-variant underline">Revoke invite link</button>}
    {invite && <div className="rounded-xl bg-surface-container p-3 space-y-3">
      <p>Use once within 24 hours. Anyone with this link can sign in as {member.name}. A new link replaces the previous one.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={share} className="bg-secondary text-on-secondary px-3 py-2 rounded-lg font-bold">Share invite</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${invite.url}`)}`} target="_blank" rel="noopener noreferrer" className="border border-white/20 px-3 py-2 rounded-lg">WhatsApp</a>
      </div>
      <label className="block">Or copy this private link<input aria-label={`Invite link for ${member.name}`} readOnly value={invite.url} onFocus={event => event.target.select()} className="mt-1 w-full bg-surface rounded p-2" /></label>
    </div>}
    {message && <p role="status" className="text-on-surface-variant">{message}</p>}
  </div>;
}
