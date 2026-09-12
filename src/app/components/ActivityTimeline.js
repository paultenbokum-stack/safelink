'use client';

import { useEffect, useState } from 'react';
import { registerRefresh, refreshScope } from '@/lib/refresh';
import { useAuth } from '@/lib/auth-context';

const demo = [
  { icon: '📡', title: 'Sentinel NODE-10318', description: 'Location updated', time: '2 min ago' },
  { icon: '✅', title: 'SOS test completed', description: 'Control room acknowledged', time: '1 hr ago' },
  { icon: '🏘️', title: 'Community alert', description: 'Suspicious vehicle reported 400m away', time: '3 hrs ago' },
  { icon: '⚠️', title: 'Geofence exit', description: 'Sentinel device left home zone', time: 'Yesterday' },
];

function relativeTime(value, now) {
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return 'Time unavailable';
  const minutes = Math.max(0, Math.floor((now - ms) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  if (minutes < 2880) return 'Yesterday';
  return new Date(ms).toLocaleDateString('en-ZA');
}

export default function ActivityTimeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [now, setNow] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function refresh() {
      try {
        const token = await user?.getIdToken?.();
        if (!token) throw new Error('Sign in required');
        const res = await fetch('/api/events', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (!res.ok) throw new Error('Feed unavailable');
        const data = await res.json();
        if (!cancelled) { setEvents(data.events); setStatus('ready'); setNow(Date.now()); }
      } catch (error) { if (!cancelled) setStatus('error'); throw error; }
    }
    const unregister = registerRefresh('activity', refresh);
    const run = () => { if (!document.hidden) refreshScope('activity').catch(() => {}); };
    run();
    const timer = setInterval(run, 60000);
    return () => { cancelled = true; unregister(); controller.abort(); clearInterval(timer); };
  }, [user]);
  const isDemo = status === 'ready' && events.length === 0;
  return <section className="glass-panel rounded-xl p-4">
    <div className="flex justify-between gap-3 items-center mb-3"><h2 className="font-bold">Activity Timeline</h2><span className="text-xs text-on-surface-variant">{isDemo ? '[Demo]' : status === 'ready' ? 'Account events' : ''}</span></div>
    {status === 'loading' ? <p className="text-sm text-on-surface-variant">Loading activity…</p> : status === 'error' ? <p className="text-sm text-on-surface-variant">Activity unavailable. Sign in with your account; we’ll retry automatically.</p> :
      <ol>{(isDemo ? demo : events).map((event, i) => <li key={event.id || i} className="flex gap-3 py-3 border-b border-white/10 last:border-0">
        <span aria-hidden="true">{event.icon || '📡'}</span><div className="flex-1 min-w-0"><p className="text-sm font-bold">{event.title || 'Safety event'} {isDemo && <small className="text-on-surface-variant font-normal">[Demo]</small>}</p><p className="text-xs text-on-surface-variant mt-1">{event.description || event.message || 'Account activity recorded'}</p></div><time className="text-[11px] text-on-surface-variant whitespace-nowrap" dateTime={isDemo ? undefined : event.createdAt}>{isDemo ? event.time : relativeTime(event.createdAt, now)}</time>
      </li>)}</ol>}
  </section>;
}
