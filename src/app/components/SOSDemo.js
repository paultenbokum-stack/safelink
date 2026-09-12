'use client';
import { useEffect, useRef, useState } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import AuthGuard from './AuthGuard';

export default function SOSPage() { return <AuthGuard><SOSDemo /></AuthGuard>; }
function SOSDemo() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationNote, setLocationNote] = useState('Your location stays on this screen during the demo.');
  const [tracking, setTracking] = useState(false);
  const [type, setType] = useState('Armed Response');
  const run = useRef(0);
  const timers = useRef(new Set());
  const busy = useRef(false);
  const pause = (ms) => new Promise(resolve => {
    const timer = setTimeout(() => { timers.current.delete(timer); resolve(); }, ms);
    timers.current.add(timer);
  });
  useEffect(() => () => { run.current++; timers.current.forEach(clearTimeout); }, []);
  const cancel = () => { run.current++; busy.current = false; setStep(0); setTracking(false); };
  async function activate(selectedType) {
    if (busy.current) return;
    busy.current = true;
    const current = ++run.current;
    setType(selectedType); setStep(1); setLocation(null); setTracking(false);
    const position = await new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 });
    });
    if (run.current !== current) return;
    if (position) { setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }); setLocationNote('Current GPS location · used locally for this demonstration'); }
    else setLocationNote('GPS unavailable or permission declined. Continuing demo without a location.');
    setStep(2); await pause(1500);
    if (run.current !== current) return;
    setStep(3);
    // TODO: Connect to Aura API — POST /dispatch with user location and security company ID
    // UI demonstration only. No dispatch endpoint, database write or external service is called.
    await pause(1500);
    if (run.current !== current) return;
    setStep(4);
  }
  const labels = ['📍 Locating you...', '🛡 Contacting Safelink Network...', type === 'Armed Response' ? '🚀 Dispatching nearest armed response via Aura...' : `🚀 Requesting ${type.toLowerCase()} assistance...`];
  return <div data-update-blocked={step > 0} className="min-h-screen bg-background text-on-surface pb-28"><Header title="SOS · Response Demo" showNotification={false} /><main className="pt-24 px-4 max-w-xl mx-auto space-y-5">
    <div className="flex flex-wrap justify-between items-center gap-3"><h1 className="text-2xl font-black">Help, when it matters.</h1><span className="text-xs text-secondary border border-secondary/30 rounded-full px-3 py-2">Powered by Aura</span></div>
    <div className="glass-panel rounded-xl p-4 border border-secondary/30"><p className="text-sm font-bold">[Demo] Investor demonstration</p><p className="text-xs text-on-surface-variant mt-1">No emergency service or officer will be contacted. In a real emergency, contact your response provider directly.</p></div>
    {step === 0 ? <section className="space-y-3">{[['Armed Response', '🛡', 'Intruder, hijacking or physical threat'], ['Medical', '🚑', 'Medical assistance demonstration'], ['Fire', '🚒', 'Fire response demonstration']].map(([name, icon, desc]) => <button key={name} onClick={() => activate(name)} className="glass-panel rounded-2xl border-l-2 border-l-secondary p-5 text-left w-full flex gap-4 items-center hover:bg-white/5 active:scale-[0.99]"><span className="text-3xl" aria-hidden="true">{icon}</span><span><strong className="block">{name}</strong><span className="text-xs text-on-surface-variant">{desc}</span><span className="block text-xs text-secondary mt-2">Start demo →</span></span></button>)}</section> : <>
      <ol aria-live="polite" className="glass-panel rounded-2xl p-5 space-y-5">{labels.map((label, i) => <li key={label} className={`flex items-center gap-3 text-sm ${step < i + 1 ? 'text-on-surface-variant/50' : 'text-on-surface'}`}><span className={`w-6 h-6 flex items-center justify-center rounded-full border shrink-0 ${step === i + 1 ? 'border-secondary border-t-transparent animate-spin' : 'border-white/20'}`}>{step > i + 1 ? '✓' : step === i + 1 ? '' : i + 1}</span>{label}</li>)}</ol>
      <p className="text-xs text-on-surface-variant">{locationNote}{location && <span className="block mt-1">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>}</p>
      {step === 4 && <section role="status" className="glass-panel rounded-2xl p-6 border border-emerald-400/40 space-y-3"><span className="text-xs text-on-surface-variant">[Demo]</span><h2 className="text-2xl font-bold text-emerald-400">✅ Response Dispatched</h2><p>Officer en route · ETA ~8 minutes</p><p className="text-xs text-on-surface-variant">Powered by Aura · Nationwide coverage</p><button onClick={() => setTracking(v => !v)} className="w-full bg-secondary text-on-secondary rounded-xl py-3 font-bold">{tracking ? 'Hide Officer' : 'Track Officer →'}</button>{tracking && <div className="border-t border-white/10 pt-4"><p className="font-bold">[Demo] Response unit AR-402</p><p className="text-sm text-on-surface-variant mt-2">Assigned → En route → Arrival</p><div className="h-2 bg-white/10 rounded-full my-3"><div className="w-1/2 h-full bg-secondary rounded-full" /></div><p className="text-xs text-on-surface-variant">Illustrative journey · no live officer location is available.</p></div>}</section>}
      <button onClick={cancel} className="glass-panel rounded-xl py-3 w-full font-bold">Cancel</button>
    </>}
  </main><BottomNav /></div>;
}
