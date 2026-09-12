'use client';
import { useState } from 'react';
import { refreshAll } from '@/lib/refresh';

export default function RefreshButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <div className="relative shrink-0">
    <button type="button" aria-label="Refresh data and check for app updates" title="Refresh" disabled={busy} className="w-11 h-11 rounded-full text-on-surface-variant hover:bg-secondary/10 disabled:opacity-50" onClick={async () => {
      if (busy) return;
      setBusy(true); setMessage('');
      try {
        if (!navigator.onLine) throw new Error('You’re offline. Showing last known data.');
        await refreshAll(); setMessage('Refresh completed. Check each device’s last report time.');
      } catch (error) { setMessage(error.message); } finally { setBusy(false); }
    }}><span aria-hidden="true" className={`material-symbols-outlined ${busy ? 'animate-spin' : ''}`}>refresh</span></button>
    {message && <div role="status" className="fixed top-16 left-4 right-4 mx-auto max-w-md p-3 rounded-xl shadow-lg border border-outline/30 bg-surface-container text-on-surface text-xs flex items-center gap-2"><span className="flex-1">{message}</span><button type="button" aria-label="Dismiss refresh status" className="w-11 h-11" onClick={() => setMessage('')}>×</button></div>}
  </div>;
}
