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

  const [household, setHousehold] = useState(null);
  const [devices, setDevices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testAlarmActive, setTestAlarmActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getHousehold(user.uid),
      getUserDevices(user.uid),
      getUserOrders(user.uid),
    ])
      .then(([h, d, o]) => {
        setHousehold(h);
        setDevices(d || []);
        setOrders(o || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const userName = household?.adminFirstName || user?.displayName?.split(' ')[0] || 'Thabo';

  const triggerTestAlarm = () => {
    setTestAlarmActive(true);
    setTimeout(() => {
      setTestAlarmActive(false);
    }, 4000);
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-[100px]">
      <Header title={`Good morning, ${userName}`} />

      <main className="pt-[88px] px-gutter max-w-3xl mx-auto space-y-lg pb-xl">
        {/* Test Alarm Alert Modal / Notification */}
        {testAlarmActive && (
          <div className="glass-panel p-md rounded-xl border border-secondary bg-secondary/10 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary text-2xl">notifications_active</span>
              <div>
                <p className="font-label-md text-secondary font-bold">Alarm Siren Test Active</p>
                <p className="font-label-sm text-on-surface-variant">Silent telemetry signal verified with Help24 Command.</p>
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
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
              <h2 className="font-label-md text-label-md text-on-surface font-semibold">
                {household?.householdName || 'Molefe Family'} — 4 members
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
            {/* Map Geofence Rings */}
            <div className="absolute top-[35%] left-[25%] w-[120px] h-[120px] rounded-full border border-[#38a169]/50 bg-[#38a169]/10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <span className="text-[#38a169] text-[10px] uppercase font-bold bg-[#0f1923]/80 px-1.5 py-0.5 rounded">Home</span>
            </div>
            <div className="absolute top-[60%] left-[70%] w-[100px] h-[100px] rounded-full border border-secondary/50 bg-secondary/10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <span className="text-secondary text-[10px] uppercase font-bold bg-[#0f1923]/80 px-1.5 py-0.5 rounded">School</span>
            </div>

            {/* Glowing Family Member Pins */}
            <div className="absolute top-[35%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_12px_rgba(255,195,47,0.9)] animate-ping"></div>
              <div className="w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_12px_rgba(255,195,47,0.9)] -mt-4"></div>
              <span className="text-[10px] bg-surface-container px-1 rounded text-on-surface mt-1">Thabo</span>
            </div>
            <div className="absolute top-[60%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_12px_rgba(255,195,47,0.9)]"></div>
              <span className="text-[10px] bg-surface-container px-1 rounded text-on-surface mt-1">Lesedi</span>
            </div>
            <div className="absolute top-[30%] right-[20%] flex flex-col items-center">
              <div className="w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_12px_rgba(255,195,47,0.9)]"></div>
              <span className="text-[10px] bg-surface-container px-1 rounded text-on-surface mt-1">Naledi</span>
            </div>
            <div className="absolute bottom-[20%] left-[45%] flex flex-col items-center">
              <div className="w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-[0_0_12px_rgba(255,195,47,0.9)]"></div>
              <span className="text-[10px] bg-surface-container px-1 rounded text-on-surface mt-1">Sipho</span>
            </div>

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
            <div className="flex items-start gap-sm pb-sm border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-primary-container/40 flex items-center justify-center mt-1 shrink-0">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-body-md text-on-surface font-medium">Lesedi arrived at Crawford International School</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Today, 07:45 AM • Geofence Safe</p>
              </div>
            </div>

            <div className="flex items-start gap-sm pb-sm border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-primary-container/40 flex items-center justify-center mt-1 shrink-0">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-body-md text-on-surface font-medium">Naledi arrived at Sandton City Office</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Today, 08:15 AM • Geofence Safe</p>
              </div>
            </div>

            <div className="flex items-start gap-sm">
              <div className="w-8 h-8 rounded-full bg-[#38a169]/20 flex items-center justify-center mt-1 shrink-0">
                <span className="material-symbols-outlined text-[#38a169] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-body-md text-on-surface font-medium">Perimeter Armed • Sentinel Home Hub Online</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Today, 06:00 AM • System Armed</p>
              </div>
            </div>
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
