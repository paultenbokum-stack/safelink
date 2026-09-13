'use client';
import { useState } from 'react';
import { refreshAll } from '@/lib/refresh';

export default function RefreshButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [hasUpdate, setHasUpdate] = useState(false);

  const handleRefresh = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setHasUpdate(false);
    try {
      if (!navigator.onLine) throw new Error('You’re offline. Showing last known data.');

      // Check Service Worker registration and force update check
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
              setHasUpdate(true);
            }
          }
        } catch (e) {
          console.warn('[PWA] Service worker update check notice:', e);
        }
      }

      await refreshAll();
      setMessage('Refresh completed. Check each device’s last report time.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Refresh data and check for app updates"
        title="Refresh"
        disabled={busy}
        className="w-11 h-11 rounded-full text-on-surface-variant hover:bg-secondary/10 disabled:opacity-50 flex items-center justify-center transition-colors"
        onClick={handleRefresh}
      >
        <span aria-hidden="true" className={`material-symbols-outlined ${busy ? 'animate-spin' : ''}`}>
          refresh
        </span>
      </button>
      {message && (
        <div
          role="status"
          className="fixed top-16 left-4 right-4 mx-auto max-w-md p-3 rounded-xl shadow-lg border border-outline/30 bg-surface-container text-on-surface text-xs flex items-center gap-2 z-50"
        >
          <span className="flex-1">{message}</span>
          {hasUpdate && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-2.5 py-1 bg-secondary text-on-secondary rounded-lg font-bold text-[11px]"
            >
              Reload
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss refresh status"
            className="w-11 h-11 flex items-center justify-center text-lg"
            onClick={() => setMessage('')}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
