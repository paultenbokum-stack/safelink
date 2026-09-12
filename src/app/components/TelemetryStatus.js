'use client';
import { useEffect, useState } from 'react';
import { batteryPercent, relativeTime, timestampMillis } from '@/lib/telemetry';

export default function TelemetryStatus({ checkedAt, reportedAt, battery, onRefresh, name = 'device', staleAfter = 120000 }) {
  const [now, setNow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const initial = setTimeout(() => setNow(Date.now()), 0); const timer = setInterval(() => setNow(Date.now()), 30000); return () => { clearTimeout(initial); clearInterval(timer); }; }, []);
  const level = batteryPercent(battery);
  const stale = now && timestampMillis(reportedAt) && now - timestampMillis(reportedAt) > staleAfter;
  return <div className="py-2 text-xs text-on-surface-variant" aria-label={`${name} telemetry`}>
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 space-y-1">
        <p>{checkedAt ? `Checked ${now ? relativeTime(checkedAt, now) : '—'}` : 'Not checked yet'}</p>
        <p className={stale ? 'text-amber-600 dark:text-amber-300' : ''}>{reportedAt ? `Last reported ${now ? relativeTime(reportedAt, now) : '—'}` : 'No device report yet'}{stale ? ' · Stale' : ''}</p>
        {level !== null && <p className="flex items-center gap-1"><span aria-hidden="true" className="material-symbols-outlined text-base">{level <= 20 ? 'battery_alert' : 'battery_5_bar'}</span><span>Battery {level}%</span></p>}
      </div>
      {onRefresh && <button type="button" className="shrink-0 w-11 h-11 rounded-full text-secondary hover:bg-secondary/10 disabled:opacity-50" disabled={busy} title="Check latest available report" aria-label={`Refresh ${name}`} onClick={async () => {
        if (busy) return;
        setBusy(true); setError('');
        try { await onRefresh(); setNow(Date.now()); } catch { setError('Could not refresh. Showing last known data.'); } finally { setBusy(false); }
      }}><span aria-hidden="true" className={`material-symbols-outlined ${busy ? 'animate-spin' : ''}`}>refresh</span></button>}
    </div>
    {error && <p role="status" className="mt-1 text-error">{error}</p>}
  </div>;
}
