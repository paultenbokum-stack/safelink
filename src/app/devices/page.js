'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

/* ─── Device type helpers ────────────────────────────────────────── */
function formatDeviceType(type) {
  const map = {
    BLE_TAG: 'BLE Tag',
    VEHICLE_GPS: 'Vehicle GPS',
    PANIC_FOB: 'Panic FOB',
    PERSONAL_TRACKER: 'Personal Tracker',
    HUB: 'IoT Hub',
  };
  return map[type] || 'Sentinel Device';
}

function deviceTypeIcon(type) {
  const map = {
    BLE_TAG: 'sensors',
    VEHICLE_GPS: 'directions_car',
    PANIC_FOB: 'key',
    PERSONAL_TRACKER: 'watch',
    HUB: 'hub',
  };
  return map[type] || 'sensors';
}

function formatStatus(status) {
  const map = {
    in_motion: 'In Motion',
    online: 'Online',
    offline: 'Offline',
    armed: 'Armed & Online',
    unknown: 'Awaiting Telemetry',
  };
  return map[status] || status || 'Unknown';
}

function statusColor(status) {
  const map = {
    in_motion: '#ffc32f',
    online: '#38a169',
    offline: '#a0aec0',
    armed: '#38a169',
    unknown: '#9fcafb',
  };
  return map[status] || '#9fcafb';
}

function formatRelativeTime(ts) {
  if (!ts) return 'Unknown';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

/* ─── Demo data (test session) ───────────────────────────────────── */
const DEMO_DEVICES = [
  {
    id: 'dev-1',
    name: "Lesedi's School Bag",
    category: 'BLE Tag',
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
    category: 'Vehicle GPS',
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
    category: 'IoT Hub',
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
    category: 'Panic FOB',
    icon: 'key',
    status: 'Standby Ready',
    statusColor: '#9fcafb',
    battery: 94,
    lastPing: '15 mins ago',
    location: 'Carried by Thabo',
  },
];

/* ─── Page wrapper ───────────────────────────────────────────────── */
export default function DevicesPage() {
  return (
    <AuthGuard>
      <DevicesContent />
    </AuthGuard>
  );
}

/* ─── Main content ───────────────────────────────────────────────── */
function DevicesContent() {
  const router = useRouter();
  const { user, partnerSession } = useAuth();
  const isPartner = !!user?.isPartnerSession;

  const [devices, setDevices]         = useState(isPartner ? [] : DEMO_DEVICES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null); // device obj
  const [newLabel, setNewLabel]        = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceImei, setNewDeviceImei] = useState('');
  const [isLive, setIsLive]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [addError, setAddError]       = useState('');
  const [adding, setAdding]           = useState(false);

  /* ── Fetch devices ── */
  useEffect(() => {
    async function fetchDevices() {
      if (!user) return;

      /* Partner session — use /api/partner/devices */
      if (isPartner && partnerSession?.sessionToken) {
        try {
          const res = await fetch('/api/partner/devices', {
            headers: { Authorization: `Bearer ${partnerSession.sessionToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setDevices(data.map((d) => ({
                id: d.hashedImei,
                name: d.nickname || `Device ${d.hashedImei.slice(0, 6)}`,
                category: formatDeviceType(d.type),
                icon: deviceTypeIcon(d.type),
                // ⚠️ No IMEI exposed — only hashed ref for rename calls
                hashedImei: d.hashedImei,
                status: formatStatus(d.status),
                statusColor: statusColor(d.status),
                battery: d.battery,
                lastPing: formatRelativeTime(d.lastSeen),
                location: d.address || (d.lat && d.lng
                  ? `${d.lat.toFixed(4)}°S, ${d.lng.toFixed(4)}°E`
                  : 'Locating...'),
                lat: d.lat,
                lng: d.lng,
              })));
              setIsLive(true);
            }
          }
        } catch (e) {
          console.warn('[devices] Partner fetch error:', e);
        }
        setLoading(false);
        return;
      }

      /* Test session — use demo data */
      if (user.isTestSession) {
        setLoading(false);
        return;
      }

      /* Live Firebase session — TrackSolid via /api/devices */
      try {
        const token = user.accessToken || user.stsTokenManager?.accessToken;
        if (!token) { setLoading(false); return; }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPartner]);

  /* ── Add device (test/Firebase sessions only) ── */
  const handleAddDevice = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!newDeviceName.trim()) {
      setAddError('Please enter a label for this device (e.g. "Kyle\'s Car").');
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
        const res = await fetch('/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imei: cleanImei, nickname: newDeviceName.trim() }),
        });
        if (!res.ok) {
          const err = await res.json();
          setAddError(err.error || 'Failed to bind device. Please check the IMEI and try again.');
          setAdding(false);
          return;
        }
      }

      // Add to local UI state — no IMEI stored in state
      setDevices((prev) => [{
        id: `dev-${Date.now()}`,
        name: newDeviceName.trim(),
        category: 'Sentinel Tracker',
        icon: 'sensors',
        status: 'Connecting...',
        statusColor: '#ffc32f',
        battery: null,
        lastPing: 'Just paired',
        location: 'Awaiting first GPS fix...',
      }, ...prev]);

      setNewDeviceName('');
      setNewDeviceImei('');
      setShowAddModal(false);
    } catch {
      setAddError('Network error. Please check your connection and try again.');
    }
    setAdding(false);
  };

  /* ── Rename device label (partner sessions) ── */
  const handleRenameDevice = async (e) => {
    e.preventDefault();
    if (!newLabel.trim() || !showRenameModal) return;

    const device = showRenameModal;

    // Optimistic UI update
    setDevices((prev) => prev.map((d) =>
      d.id === device.id ? { ...d, name: newLabel.trim() } : d
    ));

    // Persist via API (hashed IMEI only)
    if (isPartner && partnerSession?.sessionToken && device.hashedImei) {
      try {
        await fetch('/api/partner/devices', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${partnerSession.sessionToken}`,
          },
          body: JSON.stringify({ hashedImei: device.hashedImei, nickname: newLabel.trim() }),
        });
      } catch (e) {
        console.warn('[devices] Rename persist error:', e);
      }
    }

    setShowRenameModal(null);
    setNewLabel('');
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      <Header title="My Devices & Tags" showNotification={true} />

      <main className="pt-20 pb-32 px-gutter max-w-4xl mx-auto space-y-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div className="space-y-1">
            <h2 className="font-headline-lg-mobile text-2xl md:text-3xl font-bold text-on-surface">
              Active Hardware & Telemetry
            </h2>
            <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
              {isPartner
                ? `${devices.length} device${devices.length !== 1 ? 's' : ''} registered via ${partnerSession?.partnerName || 'your security partner'}`
                : 'Real-time monitoring, ping logs, and battery diagnostics for all linked Sentinel devices.'}
            </p>
          </div>

          {/* Only show "Pair New Device" for non-partner sessions */}
          {!isPartner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-secondary text-on-secondary px-md py-2.5 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(247,187,35,0.25)] hover:bg-secondary-fixed transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Pair New Device
            </button>
          )}
        </div>

        {/* POPIA note for partner sessions */}
        {isPartner && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <span className="material-symbols-outlined text-emerald-400 text-base">privacy_tip</span>
            <p className="text-[11px] text-emerald-300">
              Device identifiers are managed by {partnerSession?.partnerName}. SafeLink stores only your chosen labels — no IMEI or personal data.
            </p>
          </div>
        )}

        {/* Live indicator */}
        {isLive && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live telemetry from TrackSolid platform
          </div>
        )}

        {/* Device Grid */}
        <section className="space-y-md">
          <h3 className="font-label-md text-xs font-bold text-primary uppercase tracking-wider border-b border-white/10 pb-xs">
            {isPartner ? `Registered Devices (${devices.length})` : `Active Sentinel Trackers (${devices.length})`}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant gap-2">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">sensors_off</span>
              <p className="text-on-surface-variant text-sm">
                {isPartner
                  ? `No devices registered under your ${partnerSession?.partnerName || 'partner'} account yet. Contact your security company to have your devices linked.`
                  : 'No devices paired yet. Tap "Pair New Device" to link a Sentinel tracker.'}
              </p>
            </div>
          ) : (
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
                        <h4 className="font-headline-md text-base font-bold text-on-surface leading-tight">
                          {device.name}
                        </h4>
                        <p className="font-label-sm text-xs text-on-surface-variant">{device.category}</p>
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
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: device.statusColor }} />
                      {device.status}
                    </span>
                  </div>

                  {/* Diagnostics */}
                  <div className="grid grid-cols-2 gap-sm mb-md bg-surface-container-low p-sm rounded-xl border border-white/5">
                    <div>
                      <p className="font-label-sm text-[11px] text-on-surface-variant">Battery Level</p>
                      <div className="flex items-center gap-1 text-on-surface mt-0.5">
                        <span className="material-symbols-outlined text-secondary text-sm">battery_5_bar</span>
                        <span className="font-label-md text-xs font-bold">
                          {device.battery != null ? `${device.battery}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-label-sm text-[11px] text-on-surface-variant">Last Telemetry Ping</p>
                      <p className="font-label-md text-xs font-semibold text-on-surface mt-0.5">{device.lastPing}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div
                    onClick={() => router.push('/map')}
                    className="w-full h-24 rounded-xl overflow-hidden border border-white/5 relative map-bg cursor-pointer"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container/90 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">pin_drop</span>
                        {device.location}
                      </span>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(159,202,251,0.8)] border-2 border-surface animate-ping" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-sm pt-sm border-t border-white/5">
                    {isPartner ? (
                      <>
                        <button
                          onClick={() => { setShowRenameModal(device); setNewLabel(device.name); }}
                          className="py-1.5 rounded-lg glass-panel hover:bg-white/10 text-on-surface font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">edit</span>
                          Rename Label
                        </button>
                        <button
                          onClick={() => router.push('/map')}
                          className="py-1.5 rounded-lg bg-primary-container/30 hover:bg-primary-container/50 text-primary font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all border border-primary/30"
                        >
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          Live Track
                        </button>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Add Device Modal (non-partner sessions) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-gutter">
          <div className="glass-panel w-full max-w-md rounded-2xl p-lg bg-surface-container-high border border-white/15 shadow-2xl">
            <div className="flex justify-between items-center mb-md border-b border-white/10 pb-sm">
              <h3 className="font-headline-md text-lg font-bold text-secondary">Pair New Sentinel Device</h3>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="space-y-md">
              <div>
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1">
                  Device Label
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Kyle&apos;s Car" or "Kids Watch"'
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl p-sm text-on-surface text-sm focus:border-secondary outline-none"
                  required
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  This is what appears on the map and in dispatch. Use a descriptive object name.
                </p>
              </div>

              <div>
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1">
                  Device IMEI (15 digits)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="849302845931234"
                  value={newDeviceImei}
                  onChange={(e) => setNewDeviceImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl p-sm text-on-surface text-sm focus:border-secondary outline-none font-mono tracking-widest"
                  required
                  maxLength={15}
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Find the IMEI on the device label. It&apos;s sent to the tracking platform only — never stored in SafeLink.
                </p>
              </div>

              {addError && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-2.5 rounded-xl text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {addError}
                </div>
              )}

              <div className="pt-sm flex gap-sm">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass-panel py-2.5 rounded-xl font-label-md text-xs font-semibold text-on-surface">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-xl font-label-md text-xs font-bold hover:bg-secondary-fixed shadow-[0_0_12px_rgba(247,187,35,0.3)] cursor-pointer disabled:opacity-60"
                >
                  {adding ? 'Linking...' : 'Link Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Rename Label Modal (partner sessions) ── */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-gutter">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-lg bg-surface-container-high border border-white/15 shadow-2xl">
            <div className="flex justify-between items-center mb-md border-b border-white/10 pb-sm">
              <h3 className="font-headline-md text-base font-bold text-secondary">Rename Device Label</h3>
              <button onClick={() => setShowRenameModal(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRenameDevice} className="space-y-md">
              <div>
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block mb-1">
                  Label
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder='e.g. "Office Vehicle" or "German Shepherd Rex"'
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl p-sm text-on-surface text-sm focus:border-secondary outline-none"
                  maxLength={50}
                  required
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Dispatch teams see this label alongside the live location. No personal data — describe the object only.
                </p>
              </div>

              <div className="flex gap-sm">
                <button type="button" onClick={() => setShowRenameModal(null)} className="flex-1 glass-panel py-2.5 rounded-xl font-label-md text-xs font-semibold text-on-surface">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-xl font-label-md text-xs font-bold hover:bg-secondary-fixed shadow-[0_0_12px_rgba(247,187,35,0.3)] cursor-pointer">
                  Save Label
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
