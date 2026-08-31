'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

/**
 * Mapbox GL JS is loaded dynamically to avoid SSR issues.
 * Falls back to the old CSS-grid map if no Mapbox token is configured.
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const REFRESH_INTERVAL_MS = 15000; // Poll device locations every 15 seconds

/* ─── Demo fallback data (shown when no real devices are bound) ── */
const DEMO_MEMBERS = [
  {
    id: 'demo-1',
    name: 'Thabo Molefe',
    role: 'Admin (Father)',
    status: 'At Home',
    zone: 'Home Safe Zone',
    battery: 92,
    speed: 0,
    address: '42 Sandhurst Dr, Sandton',
    lastSeen: 'Just now',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#9fcafb',
    lat: -26.1076,
    lng: 28.0567,
    device: 'iPhone 15 Pro • BLE Tag #01',
    isDemo: true,
  },
  {
    id: 'demo-2',
    name: 'Lesedi Molefe',
    role: 'Daughter (Grade 8)',
    status: 'At School',
    zone: 'School Safe Zone',
    battery: 87,
    speed: 0,
    address: 'Crawford College, Benmore',
    lastSeen: '2m ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#ffc32f',
    lat: -26.1022,
    lng: 28.0412,
    device: 'Sentinel Smartwatch • GPS Tag #04',
    isDemo: true,
  },
  {
    id: 'demo-3',
    name: 'Naledi Molefe',
    role: 'Mother',
    status: 'At Office',
    zone: 'Work Safe Zone',
    battery: 64,
    speed: 0,
    address: '150 Rivonia Rd, Morningside',
    lastSeen: '5m ago',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    color: '#2c5a85',
    lat: -26.0961,
    lng: 28.0569,
    device: 'Samsung Galaxy S24 • BLE Tag #02',
    isDemo: true,
  },
  {
    id: 'demo-4',
    name: 'Sipho Molefe',
    role: 'Son (University)',
    status: 'In Transit',
    zone: 'Heading to Campus',
    battery: 79,
    speed: 45,
    address: 'N1 North, Midrand',
    lastSeen: 'Live',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#38a169',
    lat: -26.0200,
    lng: 28.0700,
    device: 'Toyota Fortuner GPS Hardwire',
    isDemo: true,
  },
];

const DEMO_GEOFENCES = [
  { id: 'home', name: 'Home Zone', lat: -26.1076, lng: 28.0567, radius: 150, color: '#38a169' },
  { id: 'school', name: 'School Zone', lat: -26.1022, lng: 28.0412, radius: 120, color: '#ffc32f' },
  { id: 'work', name: 'Corporate Zone', lat: -26.0961, lng: 28.0569, radius: 200, color: '#2c5a85' },
];

export default function MapPage() {
  return (
    <AuthGuard>
      <LiveFamilyMapContent />
    </AuthGuard>
  );
}

function LiveFamilyMapContent() {
  const router = useRouter();
  const { user } = useAuth();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const pollTimerRef = useRef(null);

  const [members, setMembers] = useState(DEMO_MEMBERS);
  const [geofences, setGeofences] = useState(DEMO_GEOFENCES);
  const [selectedMember, setSelectedMember] = useState(DEMO_MEMBERS[0]);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  /* ─── Fetch live device locations from API ─────────────────── */
  const fetchDeviceLocations = useCallback(async () => {
    if (!user) return;

    try {
      const token = user.accessToken || user.stsTokenManager?.accessToken;
      if (!token || user.isTestSession) {
        // No real Firebase auth — use demo data
        setConnectionStatus('demo');
        return;
      }

      // Fetch BLE device locations and phone locations in parallel
      const [devicesRes, phonesRes] = await Promise.all([
        fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/location/share', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      const allMembers = [];

      // ── Process BLE/Sentinel device locations ──
      if (devicesRes?.ok) {
        const data = await devicesRes.json();
        const devices = (data.devices || []).filter((d) => !d.isPhoneDevice);

        if (devices.length > 0) {
          const locationsPromises = devices.map(async (device) => {
            try {
              const locRes = await fetch(`/api/devices/${device.imei}/location`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (locRes.ok) return locRes.json();
            } catch (e) {
              console.warn(`Failed to fetch location for ${device.imei}:`, e);
            }
            return null;
          });

          const locations = await Promise.all(locationsPromises);

          devices.forEach((device, i) => {
            const loc = locations[i];
            if (loc?.lat && loc?.lng) {
              allMembers.push({
                id: device.imei,
                name: device.nickname || device.deviceName || `Device ${device.imei.slice(-4)}`,
                role: device.model || 'Sentinel Device',
                status: loc.isOnline ? 'Online' : 'Offline',
                zone: '',
                battery: loc.batteryLevel || null,
                speed: loc.speed || 0,
                address: loc.address || 'Locating...',
                lastSeen: loc.gpsTime || 'Unknown',
                avatar: null,
                color: getDeviceColor(allMembers.length),
                lat: loc.lat,
                lng: loc.lng,
                device: `${device.model || 'Sentinel'} • ${device.imei.slice(-6)}`,
                isTag: loc.isTag || false,
                isPhone: false,
                isDemo: false,
              });
            }
          });
        }
      }

      // ── Process phone-shared locations ──
      if (phonesRes?.ok) {
        const phoneData = await phonesRes.json();
        const phoneLocations = phoneData.locations || [];

        phoneLocations.forEach((phone) => {
          if (phone.lat && phone.lng) {
            allMembers.push({
              id: phone.id || `phone_${phone.uid}`,
              name: phone.nickname || 'Phone',
              role: 'Phone GPS',
              status: 'Live',
              zone: '',
              battery: null,
              speed: phone.speed || 0,
              address: `${phone.lat.toFixed(4)}, ${phone.lng.toFixed(4)}`,
              lastSeen: phone.gpsTime || phone.updatedAt || 'Just now',
              avatar: null,
              color: getDeviceColor(allMembers.length),
              lat: phone.lat,
              lng: phone.lng,
              device: `📱 ${phone.nickname || 'Phone'} • GPS`,
              isTag: false,
              isPhone: true,
              isDemo: false,
            });
          }
        });
      }

      // ── Set state ──
      if (allMembers.length > 0) {
        setMembers(allMembers);
        setSelectedMember(allMembers[0]);
        setIsLiveData(true);
        setConnectionStatus('live');
      } else {
        setConnectionStatus('demo');
      }
    } catch (err) {
      console.warn('[map] Failed to fetch device locations:', err);
      setConnectionStatus('demo');
    }
  }, [user]);

  /* ─── Fetch geofences from API ─────────────────────────────── */
  const fetchGeofences = useCallback(async () => {
    if (!user) return;
    try {
      const token = user.accessToken || user.stsTokenManager?.accessToken;
      if (!token || user.isTestSession) return;

      const res = await fetch('/api/geofences', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.geofences && data.geofences.length > 0) {
          setGeofences(data.geofences.map((f, i) => ({
            id: f.fenceId || f.fence_id || `fence-${i}`,
            name: f.fenceName || f.fence_name || f.name,
            lat: parseFloat(f.lat || f.center_lat),
            lng: parseFloat(f.lng || f.center_lng),
            radius: parseInt(f.radius) || 200,
            color: ['#38a169', '#ffc32f', '#2c5a85', '#ef4444'][i % 4],
          })));
        }
      }
    } catch (err) {
      console.warn('[map] Failed to fetch geofences:', err);
    }
  }, [user]);

  /* ─── Initialize Mapbox ────────────────────────────────────── */
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let mapboxgl;
    let cancelled = false;

    async function initMap() {
      try {
        mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');
      } catch (e) {
        console.error('Failed to load mapbox-gl:', e);
        return;
      }

      if (cancelled || !mapContainerRef.current) return;

      if (!MAPBOX_TOKEN) {
        console.warn('[map] No MAPBOX_TOKEN — running in demo mode with dark background');
        setMapReady(false);
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [28.0567, -26.1076], // Sandton, Johannesburg
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      map.on('load', () => {
        if (!cancelled) {
          mapInstanceRef.current = map;
          setMapReady(true);
        }
      });
    }

    initMap();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  /* ─── Render markers and geofences on map ──────────────────── */
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Add member markers
    members.forEach((member) => {
      if (!member.lat || !member.lng) return;

      const el = document.createElement('div');
      el.className = 'safelink-map-marker';
      el.innerHTML = `
        <div style="
          position: relative;
          cursor: pointer;
        ">
          <div style="
            width: 44px; height: 44px;
            border-radius: 50%;
            border: 3px solid ${member.color};
            overflow: hidden;
            background: #1a1a2e;
            box-shadow: 0 0 12px ${member.color}60;
          ">
            ${member.avatar
              ? `<img src="${member.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${member.color};font-weight:bold;font-size:16px;">${member.name.charAt(0)}</div>`
            }
          </div>
          <div style="
            position: absolute;
            top: 48px; left: 50%; transform: translateX(-50%);
            white-space: nowrap;
            background: rgba(15,25,35,0.95);
            border: 1px solid rgba(255,255,255,0.15);
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #e0e0e0;
          ">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${member.color};margin-right:4px;vertical-align:middle;"></span>
            ${member.name.split(' ')[0]}
          </div>
        </div>
      `;

      el.addEventListener('click', () => setSelectedMember(member));

      const mapboxgl = map._mapboxgl || (window.mapboxgl);
      try {
        // Dynamic import for marker creation
        import('mapbox-gl').then(({ default: mgl }) => {
          const marker = new mgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([member.lng, member.lat])
            .addTo(map);
          markersRef.current[member.id] = marker;
        });
      } catch (e) {
        console.warn('Failed to add marker:', e);
      }
    });

    // Add geofence circles
    if (showGeofences) {
      geofences.forEach((fence) => {
        const sourceId = `geofence-${fence.id}`;
        const layerFillId = `geofence-fill-${fence.id}`;
        const layerLineId = `geofence-line-${fence.id}`;

        // Remove existing layers/sources
        if (map.getLayer(layerFillId)) map.removeLayer(layerFillId);
        if (map.getLayer(layerLineId)) map.removeLayer(layerLineId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        // Create circle GeoJSON
        const points = 64;
        const coords = [];
        const radiusKm = (fence.radius || 200) / 1000;

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusKm / (111.32 * Math.cos((fence.lat * Math.PI) / 180));
          const dy = radiusKm / 110.574;
          coords.push([fence.lng + dx * Math.cos(angle), fence.lat + dy * Math.sin(angle)]);
        }

        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
          },
        });

        map.addLayer({
          id: layerFillId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': fence.color,
            'fill-opacity': 0.1,
          },
        });

        map.addLayer({
          id: layerLineId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': fence.color,
            'line-width': 2,
            'line-opacity': 0.6,
          },
        });
      });
    }
  }, [mapReady, members, geofences, showGeofences]);

  /* ─── Data polling ──────────────────────────────────────────── */
  useEffect(() => {
    fetchDeviceLocations();
    fetchGeofences();

    pollTimerRef.current = setInterval(fetchDeviceLocations, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [fetchDeviceLocations, fetchGeofences]);

  /* ─── Fly map to selected member ───────────────────────────── */
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && selectedMember?.lat && selectedMember?.lng) {
      mapInstanceRef.current.flyTo({
        center: [selectedMember.lng, selectedMember.lat],
        zoom: 15,
        duration: 1200,
      });
    }
  }, [selectedMember, mapReady]);

  /* ─── Battery icon helper ───────────────────────────────────── */
  const getBatteryIcon = (level) => {
    if (!level) return 'battery_unknown';
    if (level > 80) return 'battery_5_bar';
    if (level > 60) return 'battery_4_bar';
    if (level > 40) return 'battery_3_bar';
    if (level > 20) return 'battery_2_bar';
    return 'battery_1_bar';
  };

  const statusColor = connectionStatus === 'live' ? '#38a169' : '#ffc32f';
  const statusText =
    connectionStatus === 'live'
      ? `${members.length} Devices Live`
      : `${members.length} Members (Demo)`;

  return (
    <div className="bg-background text-on-background font-body-md h-screen w-screen overflow-hidden flex flex-col relative">
      <Header title="Live Family Radar" showNotification={true} />

      {/* Map Container — Mapbox or fallback */}
      <div className="absolute inset-0 z-0 pt-16 pb-20">
        {MAPBOX_TOKEN ? (
          <div ref={mapContainerRef} className="w-full h-full" />
        ) : (
          /* Fallback: CSS grid map background with positioned pins */
          <div className="w-full h-full map-bg relative">
            {/* Geofence circles */}
            {showGeofences && geofences.map((fence) => (
              <div
                key={fence.id}
                className="absolute rounded-full border-2 flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: `${30 + (fence.lat + 26.11) * -800}%`,
                  left: `${50 + (fence.lng - 28.055) * 800}%`,
                  width: `${fence.radius}px`,
                  height: `${fence.radius}px`,
                  borderColor: fence.color,
                  backgroundColor: `${fence.color}15`,
                }}
              >
                <span
                  className="font-label-sm text-[11px] uppercase tracking-wider bg-[#0f1923]/90 px-2 py-0.5 rounded backdrop-blur-sm border"
                  style={{ color: fence.color, borderColor: `${fence.color}40` }}
                >
                  {fence.name}
                </span>
              </div>
            ))}

            {/* Member pins */}
            {members.map((member) => {
              const isSelected = selectedMember?.id === member.id;
              // Map real coords to % positions within the view
              const top = `${30 + (member.lat + 26.11) * -800}%`;
              const left = `${50 + (member.lng - 28.055) * 800}%`;

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  style={{ top, left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-300"
                >
                  <div
                    className={`w-14 h-14 rounded-full absolute -top-2 -left-2 ${
                      isSelected ? 'animate-ping opacity-60' : 'opacity-20'
                    }`}
                    style={{ backgroundColor: member.color }}
                  />
                  <div
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 p-0.5 relative z-10 shadow-lg bg-surface transition-transform duration-200 group-hover:scale-110 ${
                      isSelected
                        ? 'border-secondary scale-110 shadow-[0_0_15px_rgba(255,195,47,0.8)]'
                        : 'border-white/30'
                    }`}
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center font-bold text-lg"
                        style={{ color: member.color, backgroundColor: `${member.color}20` }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface-container/95 border border-white/10 px-2 py-0.5 rounded-md text-[11px] font-semibold text-on-surface shadow-md flex items-center gap-1 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.color }} />
                    {member.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Map Control Floating Overlay */}
      <div className="absolute top-20 left-4 right-4 z-30 max-w-2xl mx-auto flex items-center justify-between pointer-events-auto">
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span className="font-label-sm text-xs font-bold text-on-surface">{statusText}</span>
          {connectionStatus === 'demo' && (
            <span className="text-[10px] text-on-surface-variant">(Demo)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`glass-panel p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-sm flex items-center gap-1.5 ${
              showGeofences ? 'text-secondary border-secondary/40' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">share_location</span>
            <span className="text-xs font-semibold pr-1">Zones</span>
          </button>

          <button
            onClick={() => router.push('/devices')}
            className="glass-panel px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs font-bold text-primary flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Add Device
          </button>
        </div>
      </div>

      {/* Bottom Member Details Drawer */}
      {selectedMember && (
        <div className="absolute bottom-20 left-0 right-0 z-30 p-gutter max-w-2xl mx-auto">
          <div className="glass-panel rounded-2xl p-md shadow-2xl border border-white/15 backdrop-blur-xl">
            {/* Selected Member */}
            <div className="flex items-start justify-between mb-sm">
              <div className="flex items-center gap-sm">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-secondary p-0.5 relative shrink-0"
                >
                  {selectedMember.avatar ? (
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center font-bold text-xl"
                      style={{ color: selectedMember.color, backgroundColor: `${selectedMember.color}20` }}
                    >
                      {selectedMember.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline-md text-lg font-bold text-on-surface">{selectedMember.name}</h3>
                    <span className="bg-[#38a169]/20 text-[#38a169] border border-[#38a169]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedMember.status}
                    </span>
                    {selectedMember.isTag && (
                      <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        BLE TAG
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-xs text-on-surface-variant">{selectedMember.address}</p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                {selectedMember.battery !== null && (
                  <div className="flex items-center gap-1 text-secondary text-sm font-bold">
                    <span className="material-symbols-outlined text-[16px]">
                      {getBatteryIcon(selectedMember.battery)}
                    </span>
                    {selectedMember.battery}%
                  </div>
                )}
                <span className="text-[10px] text-on-surface-variant">{selectedMember.speed} km/h</span>
              </div>
            </div>

            {/* Quick Member Switcher */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
              {members.slice(0, 8).map((m) => {
                const active = m.id === selectedMember?.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className={`p-1.5 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      active
                        ? 'bg-secondary/20 border border-secondary/40 text-secondary'
                        : 'hover:bg-white/5 text-on-surface-variant'
                    }`}
                  >
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ color: m.color, backgroundColor: `${m.color}20` }}
                      >
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-[10px] font-semibold truncate max-w-[65px]">{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-sm mt-3 pt-2">
              <button
                onClick={() => alert(`Calling ${selectedMember.name}...`)}
                className="glass-panel py-2 rounded-xl text-on-surface font-label-md text-xs flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all border-white/10"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                Direct Call
              </button>
              <button
                onClick={() => router.push(`/sos?lat=${selectedMember.lat}&lng=${selectedMember.lng}`)}
                className="bg-error hover:bg-error-container text-white py-2 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_12px_rgba(229,62,62,0.4)]"
              >
                <span className="material-symbols-outlined text-[18px]">emergency</span>
                Dispatch to Location
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function getDeviceColor(index) {
  const colors = ['#9fcafb', '#ffc32f', '#2c5a85', '#38a169', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
  return colors[index % colors.length];
}
