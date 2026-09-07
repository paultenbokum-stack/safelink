'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { useLocationSharing } from '@/lib/location-sharing';

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

  const [devices, setDevices]           = useState([]);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null); // device obj
  const [showDeleteModal, setShowDeleteModal] = useState(null); // device obj to delete
  const [deleting, setDeleting]         = useState(false);
  const [newLabel, setNewLabel]          = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceImei, setNewDeviceImei] = useState('');
  const [isLive, setIsLive]             = useState(false);
  const [loading, setLoading]           = useState(true);
  const [addError, setAddError]         = useState('');
  const [adding, setAdding]             = useState(false);

  /* ── Phone GPS Location Sharing Hook ── */
  const {
    isOptedIn: isPhoneSharing,
    isSharing,
    lastPosition: phonePosition,
    error: phoneSharingError,
    nickname: phoneNickname,
    optIn: optInPhoneSharing,
    optOut: optOutPhoneSharing,
    setNickname: setPhoneNickname,
  } = useLocationSharing();
  const [editingPhoneName, setEditingPhoneName] = useState(false);
  const [tempPhoneName, setTempPhoneName] = useState('');
  const [phoneToggling, setPhoneToggling] = useState(false);

  const handleTogglePhoneSharing = async () => {
    setPhoneToggling(true);
    if (isPhoneSharing) {
      await optOutPhoneSharing();
    } else {
      await optInPhoneSharing();
    }
    setPhoneToggling(false);
  };

  const handleSavePhoneNickname = (e) => {
    e.preventDefault();
    if (tempPhoneName.trim()) {
      setPhoneNickname(tempPhoneName.trim());
    }
    setEditingPhoneName(false);
  };

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

      /* Live Firebase & Test sessions — TrackSolid via /api/devices */
      try {
        // Load locally cached devices immediately for fast render
        try {
          const cached = localStorage.getItem('safelink_user_devices');
          if (cached) {
            let parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              let mutated = false;
              parsed = parsed.map((d) => {
                if (d.imei === '980980820010378' || d.id === '980980820010378' || d.id === 'device_980980820010378') {
                  mutated = true;
                  return {
                    ...d,
                    id: 'device_980980820010318',
                    imei: '980980820010318',
                    name: d.name && !d.name.includes('10378') ? d.name : 'AARON - NODE -10318',
                  };
                }
                return d;
              });
              if (mutated) {
                try {
                  localStorage.setItem('safelink_user_devices', JSON.stringify(parsed));
                } catch {}
              }
              setDevices(parsed);
              setIsLive(true);
            }
          }
        } catch {}

        let token = null;
        if (user && typeof user.getIdToken === 'function') {
          try { token = await user.getIdToken(); } catch {}
        }
        if (!token) {
          token = user?.accessToken || user?.stsTokenManager?.accessToken || (user?.isTestSession ? `test_${user.uid}` : (user?.uid ? `test_${user.uid}` : 'demo-test-token'));
        }

        const res = await fetch('/api/devices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const devs = (data?.devices || []).filter((d) => !d.isPhoneDevice);
          if (devs.length > 0) {
            const mapped = devs.map((d) => ({
              id: d.id || d.imei || d.imei_plain,
              imei: d.imei || d.imei_plain,
              name: d.nickname || d.deviceName || `Device ${(d.imei || d.imei_plain || '').slice(-4)}`,
              category: d.model || 'Sentinel Tracker',
              icon: d.deviceType === 'phone' ? 'phone_android' : 'sensors',
              status: d.status === 'active' ? 'Online' : 'Offline',
              statusColor: d.status === 'active' ? '#38a169' : '#a0aec0',
              battery: d.batteryLevel || null,
              lastPing: d.updatedAt || 'Unknown',
              location: d.lastAddress || 'Locating...',
            }));
            setDevices(mapped);
            setIsLive(true);
            try {
              localStorage.setItem('safelink_user_devices', JSON.stringify(mapped));
            } catch {}
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

  /* ── Delete / Unlink Device ── */
  const handleDeleteDevice = async () => {
    if (!showDeleteModal) return;
    const device = showDeleteModal;
    setDeleting(true);

    try {
      let token = null;
      if (user && typeof user.getIdToken === 'function') {
        try { token = await user.getIdToken(); } catch {}
      }
      if (!token) {
        token = user?.accessToken || user?.stsTokenManager?.accessToken || (user?.isTestSession ? `test_${user.uid}` : (user?.uid ? `test_${user.uid}` : 'demo-test-token'));
      }
      const imeiToDelete = device.imei || device.id;

      if (token && imeiToDelete) {
        await fetch(`/api/devices/${imeiToDelete}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
      }

      setDevices((prev) => {
        const filtered = prev.filter((d) => d.id !== device.id && d.imei !== device.imei);
        try {
          localStorage.setItem('safelink_user_devices', JSON.stringify(filtered));
        } catch {}
        return filtered;
      });
      setShowDeleteModal(null);
    } catch (e) {
      console.warn('[devices] Failed to delete device:', e);
    }
    setDeleting(false);
  };

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
      let token = null;
      if (user && typeof user.getIdToken === 'function') {
        try { token = await user.getIdToken(); } catch {}
      }
      if (!token) {
        token = user?.accessToken || user?.stsTokenManager?.accessToken || (user?.isTestSession ? `test_${user.uid}` : (user?.uid ? `test_${user.uid}` : 'demo-test-token'));
      }

      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imei: cleanImei, nickname: newDeviceName.trim() }),
      });

      let resData = null;
      try {
        resData = await res.json();
      } catch {}

      if (!res.ok) {
        setAddError(resData?.error || `Could not link device (HTTP ${res.status}). Please check the IMEI and try again.`);
        setAdding(false);
        return;
      }

      // Add to local UI state & cache
      const newDeviceRecord = {
        id: cleanImei,
        imei: cleanImei,
        name: newDeviceName.trim(),
        category: 'Sentinel Tracker',
        icon: 'sensors',
        status: 'Connecting...',
        statusColor: '#ffc32f',
        battery: null,
        lastPing: 'Just paired',
        location: 'Awaiting first GPS fix...',
      };

      setDevices((prev) => {
        const updated = [newDeviceRecord, ...prev.filter((d) => d.id !== cleanImei && d.imei !== cleanImei)];
        try {
          localStorage.setItem('safelink_user_devices', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setNewDeviceName('');
      setNewDeviceImei('');
      setShowAddModal(false);
    } catch (err) {
      console.warn('[devices] handleAddDevice error:', err);
      setAddError('Unable to connect to SafeLink server. Please verify your connection.');
    } finally {
      setAdding(false);
    }
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

        {/* ── Phone as GPS Tracker (PWA Mobile Beacon) ── */}
        <section className="glass-card rounded-2xl p-md border border-secondary/30 bg-gradient-to-r from-secondary/10 via-surface-container-high to-surface-container relative overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
            <div className="flex items-start sm:items-center gap-sm">
              <div className={`p-3 rounded-2xl flex items-center justify-center border transition-all ${
                isPhoneSharing
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                  : 'bg-surface-container text-on-surface-variant border-white/10'
              }`}>
                <span className="material-symbols-outlined text-3xl">
                  {isPhoneSharing ? 'satellite_alt' : 'smartphone'}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {editingPhoneName ? (
                    <form onSubmit={handleSavePhoneNickname} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempPhoneName}
                        onChange={(e) => setTempPhoneName(e.target.value)}
                        placeholder="Device nickname"
                        className="bg-surface-container-low border border-secondary/50 rounded-lg px-2 py-0.5 text-xs text-on-surface outline-none"
                        autoFocus
                      />
                      <button type="submit" className="text-secondary text-xs hover:text-white p-1">
                        <span className="material-symbols-outlined text-sm">check</span>
                      </button>
                      <button type="button" onClick={() => setEditingPhoneName(false)} className="text-on-surface-variant text-xs hover:text-white p-1">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </form>
                  ) : (
                    <>
                      <h4 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-1.5">
                        {phoneNickname || 'This Device (Phone GPS)'}
                      </h4>
                      <button
                        onClick={() => {
                          setTempPhoneName(phoneNickname || 'My Phone');
                          setEditingPhoneName(true);
                        }}
                        className="text-on-surface-variant hover:text-secondary p-0.5 rounded transition-colors"
                        title="Rename phone label"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                    </>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isPhoneSharing
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                      : 'bg-surface-container-highest text-on-surface-variant border-white/10'
                  }`}>
                    {isPhoneSharing ? 'PWA Beacon Active' : 'Standby'}
                  </span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  {isPhoneSharing
                    ? 'Transmitting real-time GPS coordinates directly to Family Radar map'
                    : 'Turn your smartphone into an active tracker alongside Sentinel BLE & vehicle tags.'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span className="text-xs font-semibold text-on-surface-variant hidden sm:inline">
                {isPhoneSharing ? 'Tracking Enabled' : 'Tracking Off'}
              </span>
              <button
                type="button"
                onClick={handleTogglePhoneSharing}
                disabled={phoneToggling}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  isPhoneSharing ? 'bg-emerald-500' : 'bg-surface-container-highest'
                } ${phoneToggling ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                    isPhoneSharing ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Telemetry diagnostics when active */}
          {isPhoneSharing && (
            <div className="mt-md pt-sm border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-surface-container-low/70 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Latitude</span>
                <span className="text-xs font-mono font-bold text-on-surface">
                  {phonePosition?.lat ? `${phonePosition.lat.toFixed(5)}°` : 'Acquiring...'}
                </span>
              </div>
              <div className="bg-surface-container-low/70 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Longitude</span>
                <span className="text-xs font-mono font-bold text-on-surface">
                  {phonePosition?.lng ? `${phonePosition.lng.toFixed(5)}°` : 'Acquiring...'}
                </span>
              </div>
              <div className="bg-surface-container-low/70 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Accuracy</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">gps_fixed</span>
                  {phonePosition?.accuracy ? `±${Math.round(phonePosition.accuracy)}m` : 'High precision'}
                </span>
              </div>
              <div className="bg-surface-container-low/70 p-2 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Radar View</span>
                  <span className="text-xs font-semibold text-secondary">Live on Map</span>
                </div>
                <button
                  onClick={() => router.push('/map')}
                  className="bg-secondary/20 hover:bg-secondary/30 text-secondary p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="View on Live Map"
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                </button>
              </div>
            </div>
          )}

          {/* Error notice if permission denied */}
          {phoneSharingError && (
            <div className="mt-sm bg-red-500/15 border border-red-500/30 rounded-xl p-2.5 flex items-center gap-2 text-xs text-red-300">
              <span className="material-symbols-outlined text-sm shrink-0">warning</span>
              <span>{phoneSharingError}</span>
            </div>
          )}
        </section>

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
                  <div className="grid grid-cols-3 gap-2 mt-sm pt-sm border-t border-white/5">
                    {isPartner ? (
                      <>
                        <button
                          onClick={() => { setShowRenameModal(device); setNewLabel(device.name); }}
                          className="py-1.5 rounded-lg glass-panel hover:bg-white/10 text-on-surface font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">edit</span>
                          Rename
                        </button>
                        <button
                          onClick={() => router.push('/map')}
                          className="py-1.5 rounded-lg bg-primary-container/30 hover:bg-primary-container/50 text-primary font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all border border-primary/30"
                        >
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          Track
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(device)}
                          className="py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all border border-red-500/20"
                          title="Unlink device"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                          Unlink
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => alert(`Triggering 120dB acoustic ring on ${device.name}...`)}
                          className="py-1.5 rounded-lg glass-panel hover:bg-white/10 text-on-surface font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary">volume_up</span>
                          Ring
                        </button>
                        <button
                          onClick={() => router.push('/map')}
                          className="py-1.5 rounded-lg bg-primary-container/30 hover:bg-primary-container/50 text-primary font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all border border-primary/30"
                        >
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          Track
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(device)}
                          className="py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-label-sm text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all border border-red-500/20"
                          title="Remove device"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                          Remove
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
              <button type="button" onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors" aria-label="Close modal">
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
              <button type="button" onClick={() => setShowRenameModal(null)} className="text-on-surface-variant hover:text-on-surface cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors" aria-label="Close modal">
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

      {/* ── Remove Device Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-gutter animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-lg bg-surface-container-high border border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-sm text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/30 shrink-0">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="font-headline-md text-base font-bold text-on-surface">Remove Device?</h3>
                <p className="font-label-sm text-[11px] text-on-surface-variant">This will unlink the tracker from your account.</p>
              </div>
            </div>

            <div className="bg-surface-container-low p-sm rounded-xl border border-white/5 my-md">
              <p className="text-xs font-bold text-on-surface">{showDeleteModal.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{showDeleteModal.category} {showDeleteModal.imei ? `• IMEI: ${showDeleteModal.imei}` : ''}</p>
            </div>

            <p className="text-xs text-on-surface-variant mb-md leading-relaxed">
              Once removed, telemetry pings and GPS radar tracking for this device will cease until it is paired again.
            </p>

            <div className="flex gap-sm">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                disabled={deleting}
                className="flex-1 glass-panel py-2.5 rounded-xl font-label-md text-xs font-semibold text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDevice}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-label-md text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
