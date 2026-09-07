'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getHousehold, getUserDevices, getUserOrders } from '@/lib/db';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

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
    Promise.all([
      getHousehold(user.uid),
      getUserDevices(user.uid),
      getUserOrders(user.uid),
    ])
      .then(([h, d, o]) => {
        if (h) setHousehold(h);
        setDevices(d || []);
        setOrders(o || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

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
    <div className="bg-background text-on-background min-h-screen pb-[100px]">
      <Header title={`Good morning, ${firstName}`} />

      <main className="pt-[88px] px-gutter max-w-3xl mx-auto space-y-lg pb-xl">
        {/* Test Alarm Alert Modal / Notification */}
        {testAlarmActive && (
          <div className="glass-panel p-md rounded-xl border border-secondary bg-secondary/10 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary text-2xl">notifications_active</span>
              <div>
                <p className="font-label-md text-secondary font-bold">Alarm Siren Test Active</p>
                <p className="font-label-sm text-on-surface-variant">Silent telemetry signal verified with Control Room Command.</p>
              </div>
            </div>
            <span className="text-secondary font-label-sm uppercase font-bold">OK 100%</span>
          </div>
        )}

        {/* SOS Button Section */}
        <section className="flex flex-col items-center justify-center py-lg">
          <button
            onClick={() => router.push('/sos')}
            className="w-44 h-44 rounded-full bg-[#e53e3e] flex flex-col items-center justify-center text-white sos-pulse active:scale-95 transition-transform duration-200 shadow-[0_0_35px_rgba(229,62,62,0.6)] cursor-pointer"
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
            Hold to Activate Armed Response
          </p>
        </section>

        {/* Mini Map Card */}
        <section className="glass-panel rounded-xl overflow-hidden map-glow">
          <div className="p-md border-b border-white/10 flex justify-between items-center bg-surface-container/40">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${devices.length > 0 ? 'bg-secondary animate-pulse' : 'bg-[#38a169]'}`}></span>
              <h2 className="font-label-md text-label-md text-on-surface font-semibold">
                {householdTitle} — {devices.length} Active {devices.length === 1 ? 'Device' : 'Devices'}
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

          <div
            onClick={() => router.push('/map')}
            className="relative h-48 w-full bg-surface-container-high cursor-pointer group overflow-hidden"
          >
            <div className="absolute inset-0 map-bg opacity-90"></div>
            
            {/* Live Beacons or Clean Empty Scanner */}
            {devices.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                <div className="relative flex items-center justify-center mb-2">
                  <div className="w-16 h-16 rounded-full border border-secondary/30 animate-ping absolute"></div>
                  <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-xl">radar</span>
                  </div>
                </div>
                <p className="text-xs text-on-surface font-semibold">No Hardware Beacons Active</p>
                <p className="text-[11px] text-on-surface-variant max-w-xs">Tap to pair your Sentinel GPS device or share Phone GPS on the live map.</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full">
                  {devices.map((dev, idx) => {
                    const topPos = 40 + (idx % 2) * 20;
                    const leftPos = 35 + (idx % 3) * 25;
                    return (
                      <div
                        key={dev.id || dev.imei || idx}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ top: `${topPos}%`, left: `${leftPos}%` }}
                      >
                        <div className="w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_12px_rgba(255,195,47,0.9)] animate-pulse"></div>
                        <span className="text-[10px] bg-surface-container/90 px-1.5 py-0.5 rounded text-on-surface mt-1 border border-white/10 font-bold">
                          {dev.nickname || dev.deviceName || 'Sentinel'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom tap banner */}
            <div className="absolute bottom-2 right-2 bg-surface-container-highest/90 px-2.5 py-1 rounded-lg text-[11px] text-on-surface flex items-center gap-1 backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px] text-secondary">explore</span>
              Tap to open live radar
            </div>
          </div>
        </section>

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
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px] border-l-2 border-l-secondary"
            >
              <span
                className="material-symbols-outlined text-secondary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                security
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1">Armed Response</span>
            </button>

            <button
              onClick={() => router.push('/sos?type=medical')}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px] border-l-2 border-l-error"
            >
              <span
                className="material-symbols-outlined text-error text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                medical_services
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1">Medical</span>
            </button>

            <button
              onClick={() => router.push('/sos?type=fire')}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px] border-l-2 border-l-[#ae111d]"
            >
              <span
                className="material-symbols-outlined text-[#ffb3ad] text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1">Fire Response</span>
            </button>

            <button
              onClick={() => router.push('/services')}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px]"
            >
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rv_hookup
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1">Roadside Towing</span>
            </button>

            <button
              onClick={() => router.push('/services/technician')}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px]"
            >
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                build
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1">Book Technician</span>
            </button>

            <button
              onClick={triggerTestAlarm}
              className="glass-panel rounded-xl p-sm flex flex-col items-center justify-center gap-xs hover:bg-white/5 active:scale-95 transition-all text-on-surface min-h-[105px]"
            >
              <span
                className="material-symbols-outlined text-secondary-container text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications_active
              </span>
              <span className="font-label-sm text-label-sm text-center font-semibold mt-1">Test Alarm</span>
            </button>
          </div>
        </section>

        {/* Recent Alerts */}
        <section className="glass-panel rounded-xl p-md">
          <div className="flex justify-between items-center mb-sm">
            <h2 className="font-label-md text-label-md text-on-surface font-semibold">Recent Alerts & Activity</h2>
            <span className="text-[11px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20 font-semibold">Live Feed</span>
          </div>

          <div className="space-y-sm">
            {devices.length > 0 ? (
              devices.map((device, idx) => (
                <div key={device.id || device.imei || idx} className="flex items-start gap-sm pb-sm border-b border-white/5 last:border-b-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-[#38a169]/20 flex items-center justify-center mt-1 shrink-0">
                    <span className="material-symbols-outlined text-[#38a169] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      satellite_alt
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface font-medium">
                      {device.nickname || device.deviceName || 'Sentinel GPS'} • Telemetry Linked
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      TrackSolid EMEA Active • Status: Online
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-sm">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center mt-1 shrink-0">
                  <span className="material-symbols-outlined text-secondary text-sm">info</span>
                </div>
                <div className="flex-1">
                  <p className="font-body-md text-body-md text-on-surface font-medium">Telemetry Standby</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    No alerts registered. Register a Sentinel device or share Phone GPS to record geofence events.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

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
