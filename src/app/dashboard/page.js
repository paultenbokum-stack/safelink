'use client';

import { InstallAppPrompt } from '@/app/components/PwaRegister';

import { registerRefresh, refreshScope } from '@/lib/refresh';
import ActivityTimeline from '@/app/components/ActivityTimeline';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useBrand } from '@/lib/brand-context';
import { getHousehold, getUserDevices, getUserOrders } from '@/lib/db';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import LiveMapPreview from '@/app/components/LiveMapPreview';

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user, partnerSession } = useAuth();
  const { brand } = useBrand();
  const router = useRouter();

  const fontStyle = brand?.fontFamily === 'classic'
    ? 'var(--font-cinzel, "Cinzel", serif)'
    : brand?.fontFamily === 'simple'
      ? 'var(--font-space, "Space Grotesk", sans-serif)'
      : undefined;

  const getButtonBg = () => {
    if (!brand?.buttonBgColor) return undefined;
    const hex = brand.buttonBgColor.trim();
    const opacity = (brand.buttonOpacity !== undefined ? brand.buttonOpacity : 100) / 100;
    if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
      let c = hex.substring(1);
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return brand.buttonBgColor;
  };

  const quickButtonCustomStyle = brand?.buttonBgColor ? {
    backgroundColor: getButtonBg(),
    color: brand?.buttonTextColor || undefined,
  } : undefined;

  const [household, setHousehold] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('active_household');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }
    return null;
  });
  const [devices, setDevices] = useState([]);
  const [mapMembers, setMapMembers] = useState([]);
  const [waitingFamilyMembers, setWaitingFamilyMembers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testAlarmActive, setTestAlarmActive] = useState(false);

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const raw = localStorage.getItem('active_household');
        if (raw) setHousehold(JSON.parse(raw));
      } catch (e) {}
    };
    window.addEventListener('safelink_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('safelink_profile_updated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    if (!user) return;
    const collectMapMembers = async (loadedDevices, token) => {
      if (user.isPartnerSession) return { markers: [], waiting: [] };
      const phonesResult = await fetch('/api/location/share', { cache: 'no-store', headers: { Authorization: 'Bearer ' + token } }).catch(() => null);
      const phoneData = phonesResult?.ok ? await phonesResult.json() : { locations: [], familyMembers: [] };
      const hardware = (loadedDevices || []).filter(device => !device.isPhoneDevice && device.imei);
      const locations = await Promise.all(hardware.map(async device => {
        const response = await fetch(`/api/devices/${device.imei}/location`, { cache: 'no-store', headers: { Authorization: 'Bearer ' + token } }).catch(() => null);
        return response?.ok ? response.json() : null;
      }));
      const markers = hardware.map((device, index) => {
        const location = locations[index];
        return location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng)) ? {
          id: device.imei, name: device.nickname || device.deviceName || `Sentinel ${device.imei.slice(-4)}`,
          lat: Number(location.lat), lng: Number(location.lng), isPhone: false,
        } : null;
      }).filter(Boolean);
      (phoneData.locations || []).forEach(phone => {
        if (Number.isFinite(Number(phone.lat)) && Number.isFinite(Number(phone.lng))) {
          markers.push({ id: phone.id || `phone_${phone.uid}`, name: phone.nickname || 'Family phone', lat: Number(phone.lat), lng: Number(phone.lng), isPhone: true });
        }
      });
      const markedIds = new Set(markers.map(member => member.id));
      return { markers, waiting: (phoneData.familyMembers || []).filter(member => !markedIds.has(member.id)).map(member => member.nickname || 'Family member') };
    };

    const load = () => Promise.allSettled([
      getHousehold(user.uid),
      (async () => { const token = await user.getIdToken?.(); const partner = user.isPartnerSession; const res = await fetch(partner ? '/api/partner/devices' : '/api/devices', { cache: 'no-store', headers: { Authorization: 'Bearer ' + (partner ? partnerSession?.sessionToken : token) } }); if (!res.ok) throw new Error('Devices unavailable'); const data = await res.json(); return partner ? data : data.devices; })(),
      Promise.resolve([]),
    ])
      .then(async ([hr, dr, or]) => {
        const h = hr.status === "fulfilled" ? hr.value : null;
        const d = dr.status === "fulfilled" ? dr.value : [];
        const o = or.status === "fulfilled" ? or.value : [];
        if (h) setHousehold(h);
        if (dr.status === "fulfilled") setDevices(d || []);
        if (or.status === "fulfilled") setOrders(o || []);
        if (dr.status === "rejected") throw new Error("Devices could not refresh");
        const token = await user.getIdToken?.();
        const liveMap = await collectMapMembers(d || [], token);
        setMapMembers(liveMap.markers);
        setWaitingFamilyMembers(liveMap.waiting);
      })
      .finally(() => setLoading(false));
    const unregister = registerRefresh('dashboard', load);
    const run = () => { if (!document.hidden) refreshScope('dashboard').catch(() => {}); };
    run();
    const timer = setInterval(run, 30000);
    window.addEventListener('online', run);
    document.addEventListener('visibilitychange', run);
    return () => { unregister(); clearInterval(timer); window.removeEventListener('online', run); document.removeEventListener('visibilitychange', run); };
  }, [user, partnerSession]);

  // Derive user's first name, prioritizing household admin name, displayName, or demo user default
  const firstName = (() => {
    if (household?.adminFirstName && !household.adminFirstName.toLowerCase().includes('safelink')) {
      return household.adminFirstName;
    }
    if (user?.displayName && !user.displayName.toLowerCase().includes('safelink')) {
      return user.displayName.split(' ')[0];
    }
    if (user?.phoneNumber?.includes('827675092')) {
      return 'Kyle';
    }
    return user?.displayName?.split(' ')[0] || 'Member';
  })();

  const householdTitle = (() => {
    if (household?.householdName && !household.householdName.toLowerCase().includes("safelink's safelink")) {
      return household.householdName;
    }
    return `${firstName}'s SafeLink`;
  })();

  const triggerTestAlarm = () => {
    setTestAlarmActive(true);
    setTimeout(() => {
      setTestAlarmActive(false);
    }, 4000);
  };

  return (
    <div
      className="bg-background text-on-background min-h-screen pb-[100px] transition-colors"
      style={{
        backgroundColor: brand?.pageBgColor || undefined,
        backgroundImage: brand?.pageBgImage ? `url("${brand.pageBgImage}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: brand?.pageTextColor || undefined,
        fontFamily: fontStyle,
      }}
    >
      <Header title={`Hi ${firstName}`} />

      <main className="pt-[88px] px-gutter max-w-3xl mx-auto space-y-lg pb-xl">
        <InstallAppPrompt />
        {/* Test Alarm Alert Modal / Notification */}
        {testAlarmActive && (
          <div className="glass-panel p-md rounded-xl border border-secondary bg-secondary/10 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary text-2xl">notifications_active</span>
              <div>
                <p className="font-label-md text-secondary font-bold">[Demo] Alarm Test Active</p>
                <p className="font-label-sm text-on-surface-variant">[Demo] Simulated alarm test. No control room contacted.</p>
              </div>
            </div>
            <span className="text-secondary font-label-sm uppercase font-bold">[Demo]</span>
          </div>
        )}

        {/* SOS Button Section */}
        <section className="flex flex-col items-center justify-center py-lg">
          <button
            onClick={() => router.push('/sos')}
            className="w-44 h-44 rounded-full flex flex-col items-center justify-center sos-pulse active:scale-95 transition-transform duration-200 cursor-pointer"
            style={{
              backgroundColor: brand?.highlightedButtonBg || '#e53e3e',
              color: brand?.highlightedButtonAuto ? '#000000' : (brand?.highlightedButtonText || '#ffffff'),
              boxShadow: `0 0 35px ${(brand?.highlightedButtonBg || '#e53e3e')}99`,
            }}
          >
            <span
              className="material-symbols-outlined text-[52px] mb-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emergency
            </span>
            <span className="font-headline-md text-2xl font-bold tracking-wider">SOS</span>
          </button>
          <p className="mt-md text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest font-semibold">
            Tap to explore the SOS response demo
          </p>
        </section>

        {/* Mini Map Card */}
        <section className="glass-panel rounded-xl overflow-hidden map-glow">
          <div className="p-md border-b border-white/10 flex justify-between items-center bg-surface-container/40">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${devices.length > 0 ? 'bg-secondary animate-pulse' : 'bg-[#38a169]'}`}></span>
              <h2 className="font-label-md text-label-md text-on-surface font-semibold">
                {householdTitle} — {devices.length} Linked {devices.length === 1 ? 'Device' : 'Devices'}
              </h2>
            </div>
            <Link
              href="/map"
              className="text-secondary font-label-sm text-label-sm hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View Live Map</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <LiveMapPreview members={mapMembers} onOpen={() => router.push('/map')} />
          {waitingFamilyMembers.length > 0 && <p className="px-md py-2 text-[11px] text-on-surface-variant border-t border-white/10">{waitingFamilyMembers.join(', ')}: awaiting a shared GPS location.</p>}
        </section>

        <Link href="/about" className="block text-right text-sm text-secondary">ⓘ Why Safelink →</Link>
        {/* Quick Services Grid */}
        <section>
          <div className="flex justify-between items-center mb-md">
            <h2 className="font-headline-md text-headline-md-mobile text-on-surface font-bold">
              Quick Services
            </h2>
            <Link href="/services" className="text-secondary text-label-sm font-semibold hover:underline">
              All Services
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
            <button
              onClick={() => router.push('/sos?type=armed')}
              style={quickButtonCustomStyle}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px] border-l-2 border-l-secondary"
            >
              <span
                className="material-symbols-outlined text-secondary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1", color: brand?.buttonTextColor || undefined }}
              >
                security
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1" style={{ color: brand?.buttonTextColor || undefined }}>Armed Response</span>
            </button>

            <button
              onClick={() => router.push('/sos?type=medical')}
              style={quickButtonCustomStyle}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px] border-l-2 border-l-error"
            >
              <span
                className="material-symbols-outlined text-error text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                medical_services
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1" style={{ color: brand?.buttonTextColor || undefined }}>Medical</span>
            </button>

            <button
              onClick={() => router.push('/sos?type=fire')}
              style={quickButtonCustomStyle}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px] border-l-2 border-l-[#ae111d]"
            >
              <span
                className="material-symbols-outlined text-[#ffb3ad] text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1" style={{ color: brand?.buttonTextColor || undefined }}>Fire Response</span>
            </button>

            <button
              onClick={() => router.push('/services')}
              style={quickButtonCustomStyle}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px]"
            >
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1", color: brand?.buttonTextColor || undefined }}
              >
                rv_hookup
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1" style={{ color: brand?.buttonTextColor || undefined }}>Roadside Towing</span>
            </button>

            <button
              onClick={() => router.push('/services/technician')}
              style={quickButtonCustomStyle}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px]"
            >
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1", color: brand?.buttonTextColor || undefined }}
              >
                build
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1" style={{ color: brand?.buttonTextColor || undefined }}>Book Technician</span>
            </button>

            <button
              onClick={triggerTestAlarm}
              style={quickButtonCustomStyle}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px]"
            >
              <span
                className="material-symbols-outlined text-secondary-container text-3xl"
                style={{ fontVariationSettings: "'FILL' 1", color: brand?.buttonTextColor || undefined }}
              >
                notifications_active
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1" style={{ color: brand?.buttonTextColor || undefined }}>Test Alarm</span>
            </button>
          </div>
        </section>

        <section className="glass-panel rounded-xl p-4"><h2 className="font-bold text-lg mb-2">Your Security Network</h2>{[
          ['🛡', 'Armed Response', brand?.partnerName || household?.securityCompanyName || 'Not yet linked — tap to connect', '/cream'],
          ['🚀', 'Dispatch Network', 'Aura · Nationwide coverage [Demo]', '/sos'],
          ['📡', 'Sentinel Devices', devices.filter(d => !d.isPhoneDevice && (d.status === 'active' || d.status === 'online')).length + ' Active', '/devices'],
          ['📷', 'Camera Systems', (household?.cameras?.filter(c => c.status === 'connected').length || 0) + ' Connected', '/community'],
        ].map(([icon, title, detail, href]) => <Link key={title} href={href} className="flex gap-3 items-center py-3 border-b border-white/10 last:border-0"><span>{icon}</span><div className="flex-1"><p className="font-bold text-sm">{title}</p><p className="text-xs text-on-surface-variant">{detail}</p></div><span className="text-secondary">→</span></Link>)}</section>
        <ActivityTimeline />
        {/* Device Store Teaser */}
        <section className="glass-panel rounded-xl p-md flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border border-secondary/20" onClick={() => router.push('/store')}>
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/30">
              <span className="material-symbols-outlined text-2xl">sensors</span>
            </div>
            <div>
              <h3 className="font-label-md text-on-surface font-bold">Sentinel BLE Tags & GPS Trackers</h3>
              <p className="font-label-sm text-on-surface-variant">Military-grade hardware for vehicles and family</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary">chevron_right</span>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
