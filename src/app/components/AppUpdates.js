'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRefresh } from '@/lib/refresh';

export default function AppUpdates() {
  const pathname = usePathname();
  const [pending, setPending] = useState(null);
  const checking = useRef(null);
  const reloading = useRef(false);
  const edited = useRef(new Set());
  useEffect(() => {
    const remember = event => { if (event.target.closest?.('form')) edited.current.add(event.target); };
    document.addEventListener('input', remember);
    document.addEventListener('change', remember);
    return () => { document.removeEventListener('input', remember); document.removeEventListener('change', remember); };
  }, []);
  const check = useCallback(() => {
    if (checking.current) return checking.current;
    checking.current = (async () => {
      if (!navigator.onLine || document.hidden || process.env.NODE_ENV !== 'production') return;
      const response = await fetch('/api/app-version', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('App version check unavailable.');
      const { version } = await response.json();
      if (typeof version === 'string' && version !== process.env.NEXT_PUBLIC_APP_RELEASE) setPending(version);
    })().finally(() => { checking.current = null; });
    return checking.current;
  }, []);
  useRefresh('app-version', check);
  useEffect(() => {
    const run = () => { check().catch(() => {}); };
    run();
    const timer = setInterval(run, 60000);
    window.addEventListener('online', run);
    window.addEventListener('pageshow', run);
    document.addEventListener('visibilitychange', run);
    return () => { clearInterval(timer); window.removeEventListener('online', run); window.removeEventListener('pageshow', run); document.removeEventListener('visibilitychange', run); };
  }, [check]);
  useEffect(() => {
    if (!pending) return;
    const apply = async () => {
      if (reloading.current || !navigator.onLine || document.hidden || /^\/(sos\/active|subscribe|store\/checkout|login|signup|join)(\/|$)/.test(pathname)) return;
      if (document.querySelector('[data-update-blocked="true"], form input:focus, form textarea:focus, [aria-busy="true"]')) return;
      const dirty = [...document.querySelectorAll('form input, form textarea')].some(input => input.type !== 'hidden' && input.value && input.value !== input.defaultValue);
      if (dirty || [...edited.current].some(input => input.isConnected && input.closest("form"))) return;
      try {
        const previous = JSON.parse(sessionStorage.getItem('safelink_update_attempt') || 'null');
        if (previous?.version === pending && Date.now() - previous.at < 300000) return;
        reloading.current = true;
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.installing) await new Promise(resolve => {
            const worker = registration.installing;
            const timer = setTimeout(resolve, 5000);
            worker.addEventListener('statechange', () => { if (['installed', 'redundant'].includes(worker.state)) { clearTimeout(timer); resolve(); } });
          });
          if (registration.waiting) await new Promise(resolve => {
            const done = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', done); resolve(); };
            const timer = setTimeout(done, 5000);
            navigator.serviceWorker.addEventListener('controllerchange', done);
            registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
          });
        }
        sessionStorage.setItem('safelink_update_attempt', JSON.stringify({ version: pending, at: Date.now() }));
        window.dispatchEvent(new Event('safelink_before_update'));
        window.location.reload();
      } catch { reloading.current = false; }
    };
    apply();
    const timer = setInterval(apply, 5000);
    return () => clearInterval(timer);
  }, [pending, pathname]);
  return pending ? <span role="status" className="sr-only">A SafeLink update will apply automatically when your current action is complete.</span> : null;
}
