'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

const DEMO_DEVICES = [
  {
    id: 'dev-1',
    name: "Lesedi's School Bag",
    category: 'BLE Tag',
    imei: '84930284593',
    icon: 'backpack',
    status: 'Online',
    statusColor: '#38a169',
    battery: 87,
    lastPing: '2 mins ago',
    location: 'Crawford College, Benmore',
  },
  {
    id: 'dev-2',
    name: 'Toyota Fortuner GD-6',
    category: 'Vehicle GPS Hardwire',
    imei: '99401284511',
    icon: 'directions_car',
    status: 'In Motion',
    statusColor: '#ffc32f',
    battery: 100,
    lastPing: 'Just now • 45 km/h',
    location: 'N1 North Highway, Midrand',
  },
  {
    id: 'dev-3',
    name: 'Sentinel Home Base Hub',
    category: 'IoT Security Hub',
    imei: '77123984501',
    icon: 'hub',
    status: 'Armed & Online',
    statusColor: '#38a169',
    battery: 100,
    lastPing: 'Live Telemetry',
    location: '42 Sandhurst Dr, Sandton',
  },
  {
    id: 'dev-4',
    name: 'Thabo Emergency Panic FOB',
    category: 'Personal BLE FOB',
    imei: '33491200941',
    icon: 'key',
    status: 'Standby Ready',
    statusColor: '#9fcafb',
    battery: 94,
    lastPing: '15 mins ago',
    location: 'Carried by Thabo',
  },
];

export default function DevicesPage() {
  return (
    <AuthGuard>
      <DevicesContent />
    </AuthGuard>
  );
}

function DevicesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [devices, setDevices] = useState(DEMO_DEVICES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceImei, setNewDeviceImei] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Fetch devices from API on mount
  useEffect(() => {
    async function fetchDevices() {
      if (!user) return;
      try {
        const token = user.accessToken || user.stsTokenManager?.accessToken;
        if (!token || user.isTestSession) {
          setLoading(false);
          return;
        }
        const res = await fetch('/api/devices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const devs = (data.devices || []).filter((d) => !d.isPhoneDevice);
          if (devs.length > 0) {
            setDevices(devs.map((d) => ({
              id: d.id || d.imei,
              name: d.nickname || d.deviceName || `Device ${(d.imei || '').slice(-4)}`,
              category: d.model || 'Sentinel Tracker',
              imei: d.imei_plain || d.imei || 'Unknown',
              icon: d.deviceType === 'phone' ? 'phone_android' : 'sensors',
              status: d.status === 'active' ? 'Online' : 'Offline',
              statusColor: d.status === 'active' ? '#38a169' : '#a0aec0',
              battery: d.batteryLevel || null,
              lastPing: d.updatedAt || 'Unknown',
              location: d.lastAddress || 'Locating...',
            })));
            setIsLive(true);
          }
        }
      } catch (e) {
        console.warn('[devices] Failed to fetch:', e);
      }
      setLoading(false);
    }
    fetchDevices();
  }, [user]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!newDeviceName.trim()) {
      setAddError('Please enter a device name.');
      return;
    }

    const cleanImei = newDeviceImei.replace(/\D/g, '');
    if (cleanImei.length !== 15) {
      setAddError('IMEI must be exactly 15 digits. Check the label on your Sentinel device.');
      return;
    }

    setAdding(true);

    try {
      const token = user?.accessToken || user?.stsTokenManager?.accessToken;

      if (token && !user?.isTestSession) {
        // Live API bind
        const res = await fetch('/api/devices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imei: cleanImei, nickname: newDeviceName.trim() }),
        });

        if (!res.ok) {
          const err = await res.json();
          setAddError(err.error || 'Failed to bind device. Please check the IMEI and try again.');
          setAdding(false);
          return;
        }
      }

      // Add to local state
      const newDev = {
        id: `dev-${Date.now()}`,
        name: newDeviceName.trim(),
        category: 'Sentinel Tracker',
        imei: cleanImei,
        icon: 'sensors',
        status: 'Connecting...',
        statusColor: '#ffc32f',
        battery: null,
        lastPing: 'Just now',
        location: 'Awaiting first GPS fix...',
      };
      setDevices((prev) => [newDev, ...prev]);
      setNewDeviceName('');
      setNewDeviceImei('');
      setShowAddModal(false);
    } catch (err) {
      setAddError('Network error. Please check your connection and try again.');
    }
    setAdding(false);
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      <Header title="My Devices & Tags" showNotification={true} />

      <main className="pt-20 pb-32 px-gutter max-w-4xl mx-auto space-y-lg">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div className="space-y-1">
            <h2 className="font-headline-lg-mobile text-2xl md:text-3xl font-bold text-on-surface">
              Active Hardware & Telemetry
            </h2>
            <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
              Real-time monitoring, ping logs, and battery diagnostics for all linked Sentinel devices.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-secondary text-on-secondary px-md py-2.5 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(247,187,35,0.25)] hover:bg-secondary-fixed transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Pair New Device
          </button>
        </div>

        {/* BLE & GPS Trackers Grid (from Stitch track_devices/code.html) */}
        <section className="space-y-md">
          <h3 className="font-label-md text-xs font-bold text-primary uppercase tracking-wider border-b border-white/10 pb-xs">
            Active Sentinel Trackers ({devices.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {devices.map((device) => (
              <div
                key={device.id}
                className="glass-card rounded-2xl p-md relative overflow-hidden group border border-white/10 hover:border-primary/40 transition-all shadow-lg"
              >
                <div className="flex justify-between items-start mb-sm">
                  <div className="flex items-center gap-sm">
                    <div className="bg-primary-container/40 p-sm rounded-xl flex items-center justify-center text-primary border border-primary/20">
                      <span className="material-symbols-outlined text-2xl">{device.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-md text-base font-bold text-on-surface">{device.name}</h4>
                      <p className="font-label-sm text-xs text-on-surface-variant">IMEI: {device.imei}</p>
                    </div>
                  </div>
                  <span
                    className="border px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold flex items-center gap-1"
                    style={{
                      backgroundColor: `${device.statusColor}15`,
                      color: device.statusColor,
                      borderColor: `${device.statusColor}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: device.statusColor }}
                    ></span>
                    {device.status}
                  </span>
                </div>

                {/* Diagnostics Bento Box */}
                <div className="grid grid-cols-2 gap-sm mb-md bg-surface-container-low p-sm rounded-xl border border-white/5">
                  <div>
                    <p className="font-label-sm text-[11px] text-on-surface-variant">Battery Level</p>
                    <div className="flex items-center gap-1 text-on-surface mt-0.5">
                      <span className="material-symbols-outlined text-secondary text-sm">battery_5_bar</span>
                      <span className="font-label-md text-xs font-bold">{device.battery}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-label-sm text-[11px] text-on-surface-variant">Last Telemetry Ping</p>
                    <p className="font-label-md text-xs font-semibold text-on-surface mt-0.5">{device.lastPing}</p>
                  </div>
                </div>

                {/* Map Mini Viewport Container */}
                <div
                  onClick={() => router.push('/map')}
                  className="w-full h-24 rounded-xl overflow-hidden border border-white/5 relative map-bg cursor-pointer group/map"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container/90 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">pin_drop</span>
                      {device.location}
                    </span>
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(159,202,251,0.8)] border-2 border-surface animate-ping"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-sm pt-sm border-t border-white/5">
                  <button
                    onClick={() => alert(`Triggering 120dB acoustic ring on ${device.name}...`)}
                    className="py-1.5 rounded-lg glass-panel hover:bg-white/10 text-on-surface font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">volume_up</span>
                    Ring Tag
                  </button>
                  <button
                    onClick={() => router.push('/map')}
                    className="py-1.5 rounded-lg bg-primary-container/30 hover:bg-primary-container/50 text-primary font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all border border-primary/30"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    Live Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-gutter">
          <div className="glass-panel w-full max-w-md rounded-2xl p-lg bg-surface-container-high border border-white/15 shadow-2xl">
            <div className="flex justify-between items-center mb-md border-b border-white/10 pb-sm">
              <h3 className="font-headline-md text-lg font-bold text-secondary">Pair New Sentinel Hardware</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-md">
              <div>
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1">
                  Device Friendly Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BMW X5 Key FOB / Kids Watch"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl p-sm text-on-surface text-sm focus:border-secondary outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1">
                  Device IMEI / Serial Barcode
                </label>
                <input
                  type="text"
                  placeholder="e.g. 84930284593XXXX (15 digits)"
                  value={newDeviceImei}
                  onChange={(e) => setNewDeviceImei(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl p-sm text-on-surface text-sm focus:border-secondary outline-none font-mono"
                  required
                  maxLength={15}
                />
                <p className="text-[10px] text-on-surface-variant mt-1">Find the 15-digit IMEI on the label of your Sentinel device</p>
              </div>

              {addError && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-2.5 rounded-xl text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {addError}
                </div>
              )}

              <div className="pt-sm flex gap-sm">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 glass-panel py-2.5 rounded-xl font-label-md text-xs font-semibold text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-xl font-label-md text-xs font-bold hover:bg-secondary-fixed shadow-[0_0_12px_rgba(247,187,35,0.3)] cursor-pointer"
                >
                  Link Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
