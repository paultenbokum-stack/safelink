'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRefresh, refreshScope } from '@/lib/refresh';
import TelemetryStatus from '@/app/components/TelemetryStatus';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { useLocationSharing } from '@/lib/location-sharing';
import { useTheme } from '@/lib/theme-context';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const REFRESH_INTERVAL_MS = 15000; // Poll device locations every 15 seconds

/* ─── Google Maps Tactical Dark Style ──────────────────────────── */
const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f1923' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1923' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a9ba8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d1d5db' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7280' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#14251e' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38a169' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f1923' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2c3e50' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a252f' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffc32f' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#182635' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a131c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3e5d7a' }],
  },
];

/* ─── Google Maps Clean Light Style ──────────────────────────── */
const GOOGLE_MAPS_LIGHT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#dcfce7' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#15803d' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#fed7aa' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#fdba74' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9a3412' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#bfdbfe' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1d4ed8' }],
  },
];

/* ─── Device Type & Status Helpers ─────────────────────────────── */
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

function formatStatus(status) {
  const map = {
    in_motion: 'In Motion',
    online: 'Online',
    offline: 'Offline',
    armed: 'Armed & Online',
    unknown: 'Awaiting Telemetry',
  };
  return map[status] || status || 'Active';
}

function getDeviceIcon(type) {
  const map = {
    BLE_TAG: 'sensors',
    VEHICLE_GPS: 'directions_car',
    PANIC_FOB: 'key',
    PERSONAL_TRACKER: 'watch',
    HUB: 'hub',
  };
  return map[type] || 'location_on';
}

function getDeviceColor(index) {
  const colors = ['#9fcafb', '#ffc32f', '#38a169', '#2c5a85', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
  return colors[index % colors.length];
}

/* ─── Google Maps Loader ───────────────────────────────────────── */
function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not found'));
    if (window.google && window.google.maps) return resolve(window.google.maps);

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/* ─── Geolocation & Map Centering Helpers ──────────────────────── */
// Default coordinates: Ballito / The Village, KwaZulu-Natal (-29.5282, 31.2111)
export const SHEFFIELD_BALLITO_COORDS = { lat: -29.5282, lng: 31.2111 };

function getInitialMapCenter() {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('last_known_pwa_gps');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.lat && parsed?.lng && !isNaN(parsed.lat) && !isNaN(parsed.lng)) {
          return { lat: parseFloat(parsed.lat), lng: parseFloat(parsed.lng) };
        }
      }
    } catch {}
  }
  return SHEFFIELD_BALLITO_COORDS;
}

function panMapTo(map, lat, lng, zoom = 15) {
  if (!map || lat == null || lng == null) return;
  try {
    if (map._isGoogle) {
      map.panTo({ lat, lng });
      if (zoom) map.setZoom(zoom);
    } else if (map._isLeaflet) {
      map.setView([lat, lng], zoom, { animate: true, duration: 1 });
    } else if (map.flyTo) {
      map.flyTo({ center: [lng, lat], zoom, duration: 1000 });
    }
  } catch (e) {
    console.warn('[map] panMapTo note:', e);
  }
}

/* ─── Page wrapper ───────────────────────────────────────────────── */
export default function MapPage() {
  return (
    <AuthGuard>
      <LiveFamilyMapContent />
    </AuthGuard>
  );
}

function LiveFamilyMapContent() {
  const router = useRouter();
  const { user, partnerSession } = useAuth();
  const { theme } = useTheme();
  const isPartner = !!user?.isPartnerSession;

  const mapContainerRef = useRef(null);
  const controlsRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapInstanceRef = useRef(null);
  const tileLayersRef = useRef([]);
  const markersRef = useRef({});
  const pollTimerRef = useRef(null);
  const initialMapFocusRef = useRef(false);
  const appliedFocusRequest = useRef(0);
  const requestedDevice = useRef(null);

  const [members, setMembers] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const detailsDismissed = useRef(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapProvider, setMapProvider] = useState('leaflet'); // 'google' | 'mapbox' | 'leaflet'
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [mapFocusRequest, setMapFocusRequest] = useState(0);
  const [phoneToggling, setPhoneToggling] = useState(false);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        if (controlsRef.current?.open) {
          controlsRef.current.open = false;
          controlsRef.current.querySelector('summary')?.focus();
        } else setIsFullScreen(false);
      }
    };
    const onPointerDown = event => {
      if (controlsRef.current && !controlsRef.current.contains(event.target)) controlsRef.current.open = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      if (map?._isLeaflet) map.invalidateSize({ pan: false });
      else if (map?._isGoogle) map._google.maps.event.trigger(map, 'resize');
      else map?.resize?.();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [mapReady]);

  useEffect(() => {
    const save = () => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const center = map.getCenter();
      const lat = typeof center.lat === 'function' ? center.lat() : center.lat;
      const lng = typeof center.lng === 'function' ? center.lng() : center.lng;
      try { sessionStorage.setItem('safelink_map_restore', JSON.stringify({ uid: user?.uid, lat, lng, zoom: map.getZoom(), device: selectedMember?.id })); } catch {}
    };
    window.addEventListener('safelink_before_update', save);
    return () => window.removeEventListener('safelink_before_update', save);
  }, [user?.uid, selectedMember?.id]);
  useEffect(() => {
    if (!mapReady) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem('safelink_map_restore') || 'null');
      if (!saved || saved.uid !== user?.uid) return;
      const map = mapInstanceRef.current;
      initialMapFocusRef.current = true;
      if (map?._isLeaflet) map.setView([saved.lat, saved.lng], saved.zoom);
      else if (map?._isGoogle) { map.setCenter({ lat: saved.lat, lng: saved.lng }); map.setZoom(saved.zoom); }
      else map?.jumpTo({ center: [saved.lng, saved.lat], zoom: saved.zoom });
      const member = members.find(item => item.id === saved.device);
      if (member) { setSelectedMember(member); sessionStorage.removeItem('safelink_map_restore'); }
    } catch {}
  }, [mapReady, user?.uid, members]);

  const changeZoom = delta => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() + delta);
  };

  /* ─── Phone GPS Location Sharing Hook ─── */
  const {
    isOptedIn: isPhoneSharing,
    isSharing,
    lastPosition,
    error: phoneSharingError,
    nickname: phoneNickname,
    optIn: optInPhoneSharing,
    optOut: optOutPhoneSharing,
    refreshLocation, checkedAt: phoneCheckedAt, battery: phoneBattery,
  } = useLocationSharing();

  const selectMember = useCallback((member) => {
    setSelectedMember(member);
    setMapFocusRequest((request) => request + 1);
  }, []);

  /* ─── Fetch device locations (Partner vs Standard Firebase) ─── */
  const fetchDeviceLocations = useCallback(async () => {
    if (!user) {
      setConnectionStatus('offline');
      return;
    }

    /* 1. Partner Session Path (Security Brokers / Partner CRM) */
    if (isPartner && partnerSession?.sessionToken) {
      try {
        const res = await fetch('/api/partner/devices', {
          cache: 'no-store', headers: { Authorization: `Bearer ${partnerSession.sessionToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const partnerMembers = data.map((d, i) => ({
              id: d.hashedImei,
              name: d.nickname || `Device ${d.hashedImei.slice(0, 6)}`,
              role: formatDeviceType(d.type),
              status: formatStatus(d.status),
              zone: 'Active Area',
              battery: d.battery ?? null,
              speed: d.speed ?? 0,
              address: d.address || (d.lat && d.lng ? `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}` : 'Awaiting GPS fix'),
              lastSeen: d.lastSeen || null, checkedAt: d.checkedAt || null,
              avatar: null,
              color: getDeviceColor(i),
              lat: d.lat == null ? null : parseFloat(d.lat),
              lng: d.lng == null ? null : parseFloat(d.lng),
              device: `${formatDeviceType(d.type)} • ${d.nickname}`,
              icon: getDeviceIcon(d.type),
              isTag: d.type === 'BLE_TAG',
              isPhone: false,
              isPartner: true,
              isDemo: false,
            }));

            setMembers(partnerMembers);
            setSelectedMember((prev) => {
              if (!prev) return detailsDismissed.current ? null : partnerMembers.find(m => m.id === new URLSearchParams(window.location.search).get('device')) || partnerMembers[0];
              const match = partnerMembers.find((m) => m.id === prev.id);
              return match || partnerMembers[0];
            });
            setConnectionStatus('partner_live');
            return;
          } else {
            setMembers([]);
            setSelectedMember(null);
            setConnectionStatus('partner_live');
            return;
          }
        }
      } catch (err) {
        console.warn('[map] Partner device fetch error:', err);
      }
      setConnectionStatus('offline');
      throw new Error('Device connection failed');
    }

    /* 2. Live Firebase & Test Session Path */
    try {
      let token = null;
      if (user && typeof user.getIdToken === 'function') {
        try { token = await user.getIdToken(); } catch {}
      }
      if (!token) {
        token =
          user?.accessToken ||
          user?.stsTokenManager?.accessToken ||
          (user?.isTestSession ? `test_${user.uid}` : (user?.uid ? `test_${user.uid}` : 'demo-test-token'));
      }

      const [devicesRes, phonesRes] = await Promise.all([
        fetch('/api/devices', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/location/share', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      if (!devicesRes?.ok) throw new Error('Device connection failed');
      let telemetryResolved = false;
      const allMembers = [];

      // Process hardware devices
      if (devicesRes?.ok) {
        const data = await devicesRes.json();
        telemetryResolved = data.tracksolidResolved === true;
        const devices = (data.devices || []).filter((d) => !d.isPhoneDevice);

        if (devices.length > 0) {
          const locationsPromises = devices.map(async (device) => {
            try {
              const locRes = await fetch(`/api/devices/${device.imei}/location`, {
                cache: 'no-store', headers: { Authorization: `Bearer ${token}` },
              });
              if (locRes.ok) return locRes.json();
            } catch (e) {
              console.warn(`Failed to fetch location for ${device.imei}:`, e);
            }
            return null;
          });

          const locations = await Promise.all(locationsPromises);

          devices.forEach((device, i) => {
            const loc = locations[i] || { ...device, gpsTime: device.updatedAt, address: device.lastAddress };
            const hasGps = Number.isFinite(loc?.lat) && Number.isFinite(loc?.lng);
            allMembers.push({
              id: device.imei,
              name: device.nickname || device.deviceName || `Device ${device.imei.slice(-4)}`,
              role: device.model || 'Sentinel Device',
              status: loc?.isOnline ? 'Online' : (hasGps ? 'Offline' : 'Awaiting GPS Fix'),
              zone: '',
              battery: loc?.batteryLevel ?? loc?.tagBattery ?? null,
              speed: loc?.speed || 0,
              address: loc?.address || (hasGps ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Awaiting GPS fix...'),
              lastSeen: loc?.gpsTime || null, checkedAt: locations[i] ? Date.now() : device.checkedAt || null,
              avatar: null,
              color: getDeviceColor(allMembers.length),
              lat: hasGps ? loc.lat : null,
              lng: hasGps ? loc.lng : null,
              device: `${device.model || 'Sentinel'} • ${device.imei.slice(-6)}`,
              isTag: loc?.isTag || false,
              isPhone: false,
              isDemo: false,
            });
          });
        }
      }



      // Process phone GPS sharing from backend
      if (phonesRes?.ok) {
        try {
          const phoneData = await phonesRes.json();
          const phoneLocations = phoneData.locations || [];

          phoneLocations.forEach((phone) => {
            if (Number.isFinite(Number(phone.lat)) && Number.isFinite(Number(phone.lng))) {
              allMembers.push({
                id: phone.id || `phone_${phone.uid}`,
                name: phone.nickname || 'My Phone',
                role: phone.isOwn ? 'My Phone GPS' : 'Family Phone GPS',
                status: 'Live',
                zone: 'Active Device',
                battery: phone.battery ?? null,
                speed: phone.speed || 0,
                address: `${parseFloat(phone.lat).toFixed(4)}, ${parseFloat(phone.lng).toFixed(4)}`,
                lastSeen: phone.gpsTime || null, checkedAt: Date.now(),
                avatar: phone.isOwn ? user?.photoURL || null : null,
                color: '#10b981',
                lat: parseFloat(phone.lat),
                lng: parseFloat(phone.lng),
                accuracy: phone.accuracy || null,
                device: `📱 ${phone.nickname || 'Phone'} • GPS Beacon`,
                isTag: false,
                isPhone: true,
                isDemo: false,
              });
            }
          });

          // Keep every joined family member visible in the map switcher even
          // before they share a coordinate. Consent is still required for a marker.
          (phoneData.familyMembers || []).forEach((member) => {
            if (allMembers.some(item => item.id === member.id)) return;
            allMembers.push({
              id: member.id,
              name: member.nickname || 'Family member',
              role: member.isOwn ? 'My Phone GPS' : 'Family Phone GPS',
              status: member.sharingEnabled && member.visible ? 'Awaiting GPS' : 'GPS Off',
              zone: 'Family member',
              battery: null,
              speed: 0,
              address: member.sharingEnabled && member.visible ? 'Waiting for the first phone location report' : 'Location sharing is off',
              lastSeen: null,
              checkedAt: Date.now(),
              avatar: member.isOwn ? user?.photoURL || null : null,
              color: '#10b981',
              lat: null,
              lng: null,
              device: `📱 ${member.nickname || 'Family member'} • GPS Beacon`,
              isTag: false,
              isPhone: true,
              isDemo: false,
            });
          });
        } catch (e) {
          console.warn('[map] phonesRes parse error:', e);
        }
      }

      // ── Always inject local phone GPS if sharing is enabled (Zero-latency) ──
      let localPhoneGps = lastPosition;
      if (!localPhoneGps && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('last_known_pwa_gps');
          if (raw) localPhoneGps = JSON.parse(raw);
        } catch {}
      }

      const hasConsent =
        isPhoneSharing ||
        (typeof window !== 'undefined' &&
          (localStorage.getItem('popia_gps_consent') === 'granted' ||
            localStorage.getItem('safelink_location_sharing_consent') === 'granted'));

      if (hasConsent && localPhoneGps?.lat && localPhoneGps?.lng) {
        const phoneIdx = allMembers.findIndex((m) => m.id === `phone_${user?.uid || 'me'}`);
        const phoneEntry = {
          id: `phone_${user?.uid || 'me'}`,
          name: user?.displayName || phoneNickname || localPhoneGps.nickname || 'My Phone',
          role: 'Phone GPS (Live)',
          status: 'Live',
          zone: 'Active Device',
          battery: phoneBattery,
          speed: localPhoneGps.speed ? Math.round(localPhoneGps.speed) : 0,
          address: `${parseFloat(localPhoneGps.lat).toFixed(4)}, ${parseFloat(localPhoneGps.lng).toFixed(4)}`,
          lastSeen: localPhoneGps.timestamp || null, checkedAt: phoneCheckedAt,
          avatar: user?.photoURL || null,
          color: '#10b981',
          lat: parseFloat(localPhoneGps.lat),
          lng: parseFloat(localPhoneGps.lng),
          accuracy: localPhoneGps.accuracy || null,
          device: `📱 ${user?.displayName || phoneNickname || 'Phone'} • High-Precision GPS`,
          isTag: false,
          isPhone: true,
          isDemo: false,
        };

        if (phoneIdx >= 0) {
          allMembers[phoneIdx] = phoneEntry;
        } else {
          allMembers.unshift(phoneEntry);
        }
      }

      if (allMembers.length > 0) {
        setMembers(allMembers);
        setSelectedMember((prev) => {
          if (!prev) return detailsDismissed.current ? null : allMembers.find(m => m.id === new URLSearchParams(window.location.search).get('device')) || allMembers[0];
          const match = allMembers.find((m) => m.id === prev.id);
          return match || allMembers[0];
        });
        setConnectionStatus(telemetryResolved ? 'live' : 'offline');
      } else {
        setMembers([]);
        setSelectedMember(null);
        setConnectionStatus(telemetryResolved ? 'live' : 'offline');
      }
    } catch (err) {
      console.warn('[map] Failed to fetch device locations:', err);
      setConnectionStatus('offline');
      throw err;
    }
  }, [user, isPartner, partnerSession, isPhoneSharing, lastPosition, phoneNickname, phoneCheckedAt, phoneBattery]);

  /* ─── Fetch Geofences ───────────────────────────────────────── */
  useRefresh('map', fetchDeviceLocations);
  async function refreshSelected() {
    if (selectedMember?.isPhone && selectedMember.id === `phone_${user.uid}` && isPhoneSharing) return refreshLocation();
    if (!selectedMember || selectedMember.isPartner || selectedMember.isPhone) return refreshScope('map');
    const token = await user.getIdToken();
    const response = await fetch(`/api/devices/${selectedMember.id}/location`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Telemetry unavailable');
    const data = await response.json();
    const update = member => member.id === selectedMember.id ? { ...member, checkedAt: Date.now(), lastSeen: data.gpsTime, battery: data.batteryLevel ?? data.tagBattery, lat: data.lat ?? member.lat, lng: data.lng ?? member.lng, address: data.address || member.address, status: data.isOnline ? 'Online' : 'Offline' } : member;
    setMembers(current => current.map(update));
    setSelectedMember(current => current ? update(current) : current);
  }

  const fetchGeofences = useCallback(async () => {
    if (!user || user.isTestSession || isPartner) return;
    try {
      const token = user.accessToken || user.stsTokenManager?.accessToken;
      if (!token) return;

      const res = await fetch('/api/geofences', {
        cache: 'no-store', headers: { Authorization: `Bearer ${token}` },
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
  }, [user, isPartner]);

  /* ─── Initialize Map (Google Maps -> Mapbox -> Leaflet Fallback) ── */
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      const initCenter = getInitialMapCenter();

      // Helper to trigger instant live GPS acquisition on map load
      const requestInstantGps = () => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              const liveLat = pos.coords.latitude;
              const liveLng = pos.coords.longitude;
              localStorage.setItem(
                'last_known_pwa_gps',
                JSON.stringify({
                  lat: liveLat,
                  lng: liveLng,
                  accuracy: pos.coords.accuracy,
                  speed: pos.coords.speed,
                  heading: pos.coords.heading,
                  altitude: pos.coords.altitude,
                  updatedAt: new Date().toISOString(),
                })
              );
              // GPS refresh must never move the map after the user begins panning.
              refreshScope('map').catch(() => {});
            },
            (err) => console.warn('[map] Initial live GPS query note:', err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
          );
        }
      };

      const isLightMode = (typeof document !== 'undefined' && document.documentElement.classList.contains('light')) || theme === 'light';

      // ── 1. Try Google Maps if API key configured ──
      if (GOOGLE_MAPS_KEY) {
        try {
          const googleMaps = await loadGoogleMapsScript(GOOGLE_MAPS_KEY);
          if (cancelled || !mapContainerRef.current) return;

          const map = new googleMaps.Map(mapContainerRef.current, {
            center: initCenter,
            zoom: 15,
            gestureHandling: 'greedy',
            draggable: true,
            styles: isLightMode ? GOOGLE_MAPS_LIGHT_STYLE : GOOGLE_MAPS_DARK_STYLE,
            disableDefaultUI: true,
            zoomControl: false,
            backgroundColor: isLightMode ? '#f8fafc' : '#0f1923',
          });

          mapInstanceRef.current = map;
          mapInstanceRef.current._isGoogle = true;
          mapInstanceRef.current._google = window.google;
          setMapProvider('google');
          setMapReady(true);
          requestInstantGps();
          return;
        } catch (e) {
          console.warn('[map] Google Maps initialization failed, falling back:', e);
        }
      }

      // ── 2. Try Mapbox if token configured ──
      if (MAPBOX_TOKEN) {
        try {
          const mapboxgl = (await import('mapbox-gl')).default;
          await import('mapbox-gl/dist/mapbox-gl.css');

          if (cancelled || !mapContainerRef.current) return;

          mapboxgl.accessToken = MAPBOX_TOKEN;

          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: isLightMode ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11',
            center: [initCenter.lng, initCenter.lat],
            zoom: 15,
            attributionControl: false,
            cooperativeGestures: false,
          });

          map.dragPan.enable();
          map.touchZoomRotate.enable();
          map.scrollZoom.enable();



          map.on('load', () => {
            if (!cancelled) {
              mapInstanceRef.current = map;
              mapInstanceRef.current._isMapbox = true;
              setMapProvider('mapbox');
              setMapReady(true);
              requestInstantGps();
            }
          });
          return;
        } catch (e) {
          console.warn('[map] Mapbox init failed, falling back to Leaflet:', e);
        }
      }

      // ── 3. Leaflet Fallback (Free Tactical Radar Canvas Tiles) ──
      try {
        const L = (await import('leaflet')).default;

        if (cancelled || !mapContainerRef.current) return;

        // Ensure Leaflet CSS is in head
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        await new Promise((r) => setTimeout(r, 150));

        const map = L.map(mapContainerRef.current, {
          center: [initCenter.lat, initCenter.lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          touchZoom: true,
          scrollWheelZoom: true,
          tap: true,
        });

        // ESRI Canvas tiles (World Light Gray vs World Dark Gray)
        const baseTileUrl = isLightMode
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        const refTileUrl = isLightMode
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
          : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

        const baseLayer = L.tileLayer(baseTileUrl, {
          maxZoom: 16,
          attribution: '&copy; Esri, DeLorme, NAVTEQ',
        }).addTo(map);

        const refLayer = L.tileLayer(refTileUrl, {
          maxZoom: 16,
        }).addTo(map);

        tileLayersRef.current = [baseLayer, refLayer];



        setTimeout(() => {
          try { map.invalidateSize(); } catch {}
        }, 300);

        mapInstanceRef.current = map;
        mapInstanceRef.current._isLeaflet = true;
        mapInstanceRef.current._L = L;
        setMapProvider('leaflet');
        setMapReady(true);
        requestInstantGps();
      } catch (e) {
        console.error('[map] Leaflet init failed:', e);
        setMapReady(false);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        try {
          if (mapInstanceRef.current.remove) {
            mapInstanceRef.current.remove();
          }
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  /* ─── Dynamically Switch Map Styles & Tiles when Theme changes ─── */
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const isLightMode = theme === 'light';

    if (map._isLeaflet && map._L) {
      const L = map._L;
      // Remove existing tile layers
      if (tileLayersRef.current && tileLayersRef.current.length > 0) {
        tileLayersRef.current.forEach((layer) => {
          try { map.removeLayer(layer); } catch {}
        });
      }

      const baseTileUrl = isLightMode
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      const refTileUrl = isLightMode
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

      const baseLayer = L.tileLayer(baseTileUrl, {
        maxZoom: 16,
        attribution: '&copy; Esri, DeLorme, NAVTEQ',
      }).addTo(map);

      const refLayer = L.tileLayer(refTileUrl, {
        maxZoom: 16,
      }).addTo(map);

      try { baseLayer.bringToBack(); } catch {}
      tileLayersRef.current = [baseLayer, refLayer];
    } else if (map._isMapbox) {
      try {
        map.setStyle(isLightMode ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11');
      } catch (e) {
        console.warn('Failed to switch Mapbox theme style:', e);
      }
    } else if (map._isGoogle) {
      try {
        map.setOptions({
          styles: isLightMode ? GOOGLE_MAPS_LIGHT_STYLE : GOOGLE_MAPS_DARK_STYLE,
          backgroundColor: isLightMode ? '#f8fafc' : '#0f1923',
        });
      } catch (e) {
        console.warn('Failed to switch Google Maps theme style:', e);
      }
    }
  }, [theme, mapReady]);

  /* ─── Render Markers and Geofences across Google / Mapbox / Leaflet ── */
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const isGoogle = !!map._isGoogle;
    const isLeaflet = !!map._isLeaflet;

    // Clear existing markers & shapes
    Object.values(markersRef.current).forEach((m) => {
      try {
        if (m.setMap) m.setMap(null); // Google Maps
        else if (m.remove) m.remove(); // Leaflet / Mapbox
      } catch {}
    });
    markersRef.current = {};

    // ── 1. Add Device & Member Markers ──
    members.forEach((member) => {
      if (!Number.isFinite(member.lat) || !Number.isFinite(member.lng)) return;


      const isSelected = selectedMember?.id === member.id;
      const initial = member.name.charAt(0).toUpperCase();

      const markerHtml = `
        <div style="position:relative;cursor:pointer;display:flex;flex-direction:column;align-items:center;">
          <!-- Animated Radar Glow Ring -->
          <div style="
            position:absolute;top:0;left:50%;transform:translateX(-50%);
            width:52px;height:52px;border-radius:50%;
            background:${member.color}25;
            box-shadow:0 0 16px ${member.color}70;
            border:1.5px solid ${member.color}80;
            animation:${isSelected ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'};
            pointer-events:none;
          "></div>

          <!-- Main Pin Avatar / Icon -->
          <div style="
            width:42px;height:42px;border-radius:50%;
            border:${isSelected ? '3px solid #ffc32f' : `2.5px solid ${member.color}`};
            overflow:hidden;background:${theme === 'light' ? '#ffffff' : '#0f1923'};
            display:flex;align-items:center;justify-content:center;
            box-shadow:${theme === 'light' ? '0 4px 12px rgba(15,23,42,0.18)' : '0 4px 12px rgba(0,0,0,0.6)'};
            z-index:2;position:relative;
          ">
            ${member.avatar
              ? `<img src="${member.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
              : member.isPhone
              ? `<span style="font-size:18px;">📱</span>`
              : member.icon === 'directions_car'
              ? `<span style="font-size:18px;">🚗</span>`
              : member.icon === 'watch'
              ? `<span style="font-size:18px;">⌚</span>`
              : member.icon === 'key'
              ? `<span style="font-size:18px;">🔑</span>`
              : `<div style="color:${member.color};font-weight:900;font-size:16px;">${initial}</div>`
            }
          </div>

          <!-- Label Tag -->
          <div style="
            margin-top:4px;
            white-space:nowrap;
            background:${theme === 'light' ? 'rgba(255,255,255,0.96)' : 'rgba(15,25,35,0.92)'};
            border:1px solid ${theme === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.18)'};
            padding:2px 8px;border-radius:6px;
            font-size:11px;font-weight:700;color:${theme === 'light' ? '#0f172a' : '#f0f0f0'};
            box-shadow:${theme === 'light' ? '0 2px 8px rgba(15,23,42,0.12)' : '0 2px 6px rgba(0,0,0,0.5)'};
            display:flex;align-items:center;gap:4px;
            backdrop-filter:blur(4px);
            z-index:3;
          ">
            <span style="width:6px;height:6px;border-radius:50%;background:${member.color};display:inline-block;"></span>
            <span>${member.name.split(' ')[0]}</span>
            ${member.battery != null ? `<span style="font-size:9px;color:${theme === 'light' ? '#d97706' : '#ffc32f'};margin-left:2px;">${member.battery}%</span>` : ''}
          </div>
        </div>
      `;

      if (isGoogle) {
        const google = map._google;
        // Custom Google Maps HTML Overlay
        class HTMLMarkerOverlay extends google.maps.OverlayView {
          constructor(latLng, html, onClick) {
            super();
            this.latLng = latLng;
            this.html = html;
            this.onClick = onClick;
            this.div = null;
          }
          onAdd() {
            this.div = document.createElement('div');
            this.div.style.position = 'absolute';
            this.div.style.cursor = 'pointer';
            this.div.innerHTML = this.html;
            if (this.onClick) this.div.addEventListener('click', this.onClick);
            const panes = this.getPanes();
            panes.overlayMouseTarget.appendChild(this.div);
          }
          draw() {
            const overlayProjection = this.getProjection();
            if (!overlayProjection || !this.div) return;
            const point = overlayProjection.fromLatLngToDivPixel(this.latLng);
            if (point) {
              this.div.style.left = point.x - 30 + 'px';
              this.div.style.top = point.y - 26 + 'px';
            }
          }
          onRemove() {
            if (this.div && this.div.parentNode) {
              this.div.parentNode.removeChild(this.div);
              this.div = null;
            }
          }
        }

        const latLng = new google.maps.LatLng(member.lat, member.lng);
        const overlay = new HTMLMarkerOverlay(latLng, markerHtml, () => selectMember(member));
        overlay.setMap(map);
        markersRef.current[member.id] = overlay;

        // Draw accuracy circle for phone GPS
        if (member.isPhone && member.accuracy && member.accuracy > 0) {
          const accCircle = new google.maps.Circle({
            strokeColor: '#10b981',
            strokeOpacity: 0.6,
            strokeWeight: 1.5,
            fillColor: '#10b981',
            fillOpacity: 0.12,
            map: map,
            center: { lat: member.lat, lng: member.lng },
            radius: Math.min(Math.max(member.accuracy, 10), 200),
          });
          markersRef.current[`acc-${member.id}`] = accCircle;
        }
      } else if (isLeaflet) {
        const L = map._L;
        const icon = L.divIcon({
          html: markerHtml,
          className: 'safelink-radar-marker',
          iconSize: [60, 70],
          iconAnchor: [30, 26],
        });
        const marker = L.marker([member.lat, member.lng], { icon }).addTo(map);
        marker.on('click', () => selectMember(member));
        markersRef.current[member.id] = marker;

        // Draw accuracy circle for phone GPS
        if (member.isPhone && member.accuracy && member.accuracy > 0) {
          const accCircle = L.circle([member.lat, member.lng], {
            radius: Math.min(Math.max(member.accuracy, 10), 200),
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.12,
            weight: 1.5,
            opacity: 0.6,
          }).addTo(map);
          markersRef.current[`acc-${member.id}`] = accCircle;
        }
      } else {
        // Mapbox GL
        const el = document.createElement('div');
        el.className = 'safelink-radar-marker';
        el.innerHTML = markerHtml;
        el.addEventListener('click', () => selectMember(member));

        try {
          import('mapbox-gl').then(({ default: mgl }) => {
            const marker = new mgl.Marker({ element: el, anchor: 'center' })
              .setLngLat([member.lng, member.lat])
              .addTo(map);
            markersRef.current[member.id] = marker;
          });
        } catch (e) {
          console.warn('Failed to add Mapbox marker:', e);
        }
      }
    });

    // ── 2. Add Geofence Zones ──
    if (showGeofences) {
      geofences.forEach((fence) => {
        if (isGoogle) {
          const google = map._google;
          const circle = new google.maps.Circle({
            strokeColor: fence.color,
            strokeOpacity: 0.65,
            strokeWeight: 2,
            fillColor: fence.color,
            fillOpacity: 0.12,
            map: map,
            center: { lat: fence.lat, lng: fence.lng },
            radius: fence.radius || 200,
          });
          markersRef.current[`geofence-${fence.id}`] = circle;
        } else if (isLeaflet) {
          const L = map._L;
          const circle = L.circle([fence.lat, fence.lng], {
            radius: fence.radius || 200,
            color: fence.color,
            fillColor: fence.color,
            fillOpacity: 0.12,
            weight: 2,
            opacity: 0.65,
          }).addTo(map);

          markersRef.current[`geofence-${fence.id}`] = circle;
        } else {
          // Mapbox
          const sourceId = `geofence-${fence.id}`;
          const layerFillId = `geofence-fill-${fence.id}`;
          const layerLineId = `geofence-line-${fence.id}`;

          if (map.getLayer(layerFillId)) map.removeLayer(layerFillId);
          if (map.getLayer(layerLineId)) map.removeLayer(layerLineId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);

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
            data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } },
          });

          map.addLayer({
            id: layerFillId,
            type: 'fill',
            source: sourceId,
            paint: { 'fill-color': fence.color, 'fill-opacity': 0.12 },
          });

          map.addLayer({
            id: layerLineId,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': fence.color, 'line-width': 2, 'line-opacity': 0.65 },
          });
        }
      });
    }
  }, [mapReady, members, geofences, showGeofences, selectedMember, selectMember, theme]);

  /* ─── Polling effect ────────────────────────────────────────── */
  useEffect(() => {
    refreshScope('map').catch(() => {});
    fetchGeofences();

    pollTimerRef.current = setInterval(() => { if (!document.hidden) refreshScope('map').catch(() => {}); }, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [fetchDeviceLocations, fetchGeofences]);

  /* ─── Listen for Real-Time Phone GPS Broadcasts ─────────────── */
  useEffect(() => {
    const handlePhoneLocationBroadcast = (e) => {
      const coords = e.detail;
      if (coords?.lat && coords?.lng) {
        refreshScope('map').catch(() => {});
      }
    };
    window.addEventListener('safelink_phone_location_updated', handlePhoneLocationBroadcast);
    return () => window.removeEventListener('safelink_phone_location_updated', handlePhoneLocationBroadcast);
  }, [fetchDeviceLocations]);

  /* ─── Pan only for the first load or an intentional device selection. ─── */
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !Number.isFinite(selectedMember?.lat) || !Number.isFinite(selectedMember?.lng)) return;
    if (initialMapFocusRef.current && appliedFocusRequest.current === mapFocusRequest) return;
    panMapTo(mapInstanceRef.current, selectedMember.lat, selectedMember.lng, 15);
    initialMapFocusRef.current = true;
    appliedFocusRequest.current = mapFocusRequest;
  }, [mapReady, mapFocusRequest, selectedMember?.id, selectedMember?.lat, selectedMember?.lng]);

  /* ─── Locate Phone Position Directly with High Precision ─── */
  const handleLocatePhone = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        localStorage.setItem(
          'last_known_pwa_gps',
          JSON.stringify({
            lat,
            lng,
            accuracy,
            speed: pos.coords.speed,
            updatedAt: new Date().toISOString(),
          })
        );

        panMapTo(mapInstanceRef.current, lat, lng, 16);
        window.dispatchEvent(
          new CustomEvent('safelink_phone_location_updated', {
            detail: { lat, lng, accuracy },
          })
        );
        refreshScope('map').catch(() => {});
      },
      (err) => {
        console.warn('[map] Locate Phone error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [fetchDeviceLocations]);

  /* ─── Fit bounds to all devices or center on phone GPS ────────── */
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (members.length === 0) {
      handleLocatePhone();
      return;
    }
    const map = mapInstanceRef.current;
    const locatedMembers = members.filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (!locatedMembers.length) return;

    if (map._isGoogle) {
      const google = map._google;
      const bounds = new google.maps.LatLngBounds();
      locatedMembers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      map.fitBounds(bounds, 60);
    } else if (map._isLeaflet) {
      const L = map._L;
      const bounds = L.latLngBounds(locatedMembers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (map.fitBounds) {
      const lngs = locatedMembers.map((m) => m.lng);
      const lats = locatedMembers.map((m) => m.lat);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 60, maxZoom: 15 }
      );
    }
  };

  /* ─── Toggle Phone GPS Sharing on Radar ─── */
  const handleTogglePhoneSharing = async () => {
    setPhoneToggling(true);
    if (isBroadcasting) {
      await optOutPhoneSharing();
    } else {
      await optInPhoneSharing();
    }
    // Immediate refresh
    setTimeout(() => {
      refreshScope('map').catch(() => {});
    }, 600);
    setPhoneToggling(false);
  };

  /* ─── Status badge styling ──────────────────────────────────── */
  const isConsentGranted =
    typeof window !== 'undefined' &&
    (localStorage.getItem('popia_gps_consent') === 'granted' ||
      localStorage.getItem('safelink_location_sharing_consent') === 'granted');
  const isBroadcasting = isPhoneSharing || isConsentGranted;

  const statusColor = connectionStatus === 'offline' ? '#ef4444' : connectionStatus === 'connecting' ? '#FFC32F' : '#38a169';
  const statusText = connectionStatus === 'connecting' ? 'Connecting…' : connectionStatus === 'offline' ? 'Connection issue' : `Live · ${members.length} device${members.length === 1 ? '' : 's'}`;

  return (
    <div className={`bg-background text-on-background font-body-md w-full overflow-hidden flex flex-col ${isFullScreen ? 'fixed inset-0 z-[70] h-dvh' : 'relative h-dvh'}`}>
      {!isFullScreen && <Header title="Live tracking" showNotification={true} />}

      {/* Map Container — ALWAYS in DOM */}
      <div className={`absolute inset-0 z-0 ${isFullScreen ? '' : 'pt-16 pb-20'}`}>
        <div ref={mapContainerRef} className={`w-full h-full touch-none transition-colors duration-300 ${theme === 'light' ? 'bg-[#f1f5f9]' : 'bg-[#0a0f14]'}`} />
      </div>

      {(connectionStatus === 'connecting' || connectionStatus === 'offline') && (
        <div className={`absolute ${isFullScreen ? 'top-0' : 'top-16'} left-0 right-0 z-40 px-4 py-2 text-center text-xs font-bold shadow-lg ${connectionStatus === 'offline' ? 'bg-red-900 text-red-100' : 'bg-amber-950 text-amber-100'}`}>
          {connectionStatus === 'offline' ? 'Connection issue — retrying' : 'Connecting to Safelink...'}
        </div>
      )}

      {/* Compact toolbar: full labels live in a keyboard-accessible disclosure. */}
      <div className={`absolute left-4 right-4 z-40 flex items-start justify-between gap-3 ${isFullScreen ? 'top-12' : 'top-28'}`}>
        <details ref={controlsRef} className="relative min-w-0">
          <summary className="glass-panel min-h-11 px-3 rounded-xl flex items-center gap-2 cursor-pointer list-none border border-white/15 shadow-lg text-sm font-bold text-on-surface [&::-webkit-details-marker]:hidden">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
            Map tools
            <span className="material-symbols-outlined text-xl" aria-hidden="true">expand_more</span>
          </summary>
          <div className="absolute left-0 top-full mt-2 w-[min(17rem,calc(100vw-2rem))] max-h-[calc(100dvh-15rem)] overflow-y-auto rounded-2xl bg-surface-container border border-white/15 p-2 shadow-xl text-on-surface">
            <button onClick={() => { if (members[0]) selectMember(selectedMember || members[0]); controlsRef.current.open = false; }} className="w-full min-h-11 flex items-center gap-3 px-3 rounded-xl hover:bg-white/10 text-left text-sm">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />{statusText}
            </button>
            <button onClick={handleLocatePhone} disabled={!mapReady} className="w-full min-h-11 flex items-center gap-3 px-3 rounded-xl hover:bg-white/10 text-left text-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">my_location</span>Locate my phone
            </button>
            <button onClick={handleRecenter} disabled={!mapReady} className="w-full min-h-11 flex items-center gap-3 px-3 rounded-xl hover:bg-white/10 text-left text-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">center_focus_strong</span>Fit all devices
            </button>
            <button onClick={() => setShowGeofences(value => !value)} aria-pressed={showGeofences} disabled={!mapReady} className="w-full min-h-11 flex items-center gap-3 px-3 rounded-xl hover:bg-white/10 text-left text-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">share_location</span>Safe zones: {showGeofences ? 'On' : 'Off'}
            </button>
            <button onClick={handleTogglePhoneSharing} disabled={phoneToggling || connectionStatus === 'connecting'} aria-pressed={isBroadcasting} className="w-full min-h-11 flex items-center gap-3 px-3 rounded-xl hover:bg-white/10 text-left text-sm disabled:opacity-50">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">satellite_alt</span>{phoneToggling ? 'Updating…' : isBroadcasting ? 'Stop sharing phone' : 'Share Phone'}
            </button>
            <button onClick={() => router.push('/devices')} className="w-full min-h-11 flex items-center gap-3 px-3 rounded-xl hover:bg-white/10 text-left text-sm">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">devices</span>Manage devices
            </button>
          </div>
        </details>
        <button type="button" onClick={() => setIsFullScreen(value => !value)} aria-label={isFullScreen ? 'Exit full-screen map' : 'View full-screen map'} aria-pressed={isFullScreen} title={isFullScreen ? 'Exit full-screen map (Esc)' : 'View full-screen map'} className="glass-panel w-11 h-11 shrink-0 rounded-xl border border-white/15 shadow-lg flex items-center justify-center text-on-surface">
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">{isFullScreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </button>
      </div>

      <div role="group" aria-label="Map zoom" className="absolute right-4 z-30 rounded-xl overflow-hidden bg-surface-container text-on-surface border border-white/20 shadow-lg" style={{ bottom: `calc(${isFullScreen ? '24px' : '104px'} + env(safe-area-inset-bottom))` }}>
        <button type="button" aria-label="Zoom in" disabled={!mapReady} onClick={() => changeZoom(1)} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 disabled:opacity-50 border-b border-white/15"><span className="material-symbols-outlined text-2xl" aria-hidden="true">add</span></button>
        <button type="button" aria-label="Zoom out" disabled={!mapReady} onClick={() => changeZoom(-1)} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 disabled:opacity-50"><span className="material-symbols-outlined text-2xl" aria-hidden="true">remove</span></button>
      </div>

      {/* GPS Permission Error Notice */}
      {phoneSharingError && (
        <div className="absolute top-44 left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto bg-red-500/20 border border-red-500/50 backdrop-blur-md rounded-xl p-2.5 text-xs text-red-200 flex items-center gap-2 shadow-xl">
          <span className="material-symbols-outlined text-sm shrink-0">warning</span>
          <span className="flex-1">{phoneSharingError}</span>
        </div>
      )}

      {/* Radar Scanning Empty State Banner when no members/devices are active */}
      {members.length === 0 && connectionStatus !== 'connecting' && (
        <div className={`absolute ${isFullScreen ? 'bottom-6' : 'bottom-24'} left-4 right-20 z-20 max-w-md mx-auto pointer-events-auto animate-fadeIn`}>
          <div className="glass-panel p-4 rounded-2xl border border-secondary/40 bg-surface-container-high/95 backdrop-blur-xl shadow-2xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-2xl animate-pulse">radar</span>
              <span className="font-headline-md text-xs font-bold uppercase tracking-wider">No linked devices</span>
            </div>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              No active GPS beacons or Sentinel devices detected. Tap <strong className="text-secondary">&quot;Share Phone&quot;</strong> under Map tools or pair your Sentinel hardware to track on the radar.
            </p>
          </div>
        </div>
      )}

      {/* Selected device details. Closing it returns the full map area. */}
      {selectedMember && (
        <div className={`absolute ${isFullScreen ? 'bottom-0' : 'bottom-20'} left-0 right-0 z-30 max-w-2xl mx-auto pointer-events-auto p-gutter`}>
          <div className="glass-panel shadow-2xl border border-white/15 backdrop-blur-xl bg-surface-container-high/90 rounded-2xl p-sm sm:p-md max-h-[55dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => { detailsDismissed.current = true; setSelectedMember(null); }}
              aria-label="Close tracker details"
              title="Close tracker details"
              className="w-full flex justify-center items-center py-1 cursor-pointer group select-none"
            >
              <div className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/10 group-hover:bg-secondary/30 transition-all border border-white/10 shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-secondary transition-transform duration-200">
                  keyboard_arrow_down
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface uppercase tracking-wider">
                  Minimize
                </span>
              </div>
            </button>

            {/* Header info */}
            <div className="flex items-start justify-between">
              <div
                className="flex items-center gap-sm cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-secondary p-0.5 relative shrink-0 bg-surface-container-low flex items-center justify-center">
                  {selectedMember.avatar ? (
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center font-black text-base"
                      style={{ color: selectedMember.color, backgroundColor: `${selectedMember.color}25` }}
                    >
                      {selectedMember.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="break-words min-w-0 font-headline-md text-base md:text-lg font-bold text-on-surface leading-tight">
                      {selectedMember.name}
                    </h3>
                    <span className="bg-[#38a169]/20 text-[#38a169] border border-[#38a169]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedMember.status}
                    </span>
                    {selectedMember.isTag && (
                      <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        BLE TAG
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-primary">pin_drop</span>
                    {selectedMember.address}
                  </p>
                </div>
              </div>

            </div>
            <TelemetryStatus name={selectedMember.name} checkedAt={selectedMember.checkedAt} reportedAt={selectedMember.lastSeen} battery={selectedMember.battery} onRefresh={refreshSelected} />

            {/* Quick member carousel and actions */}
              <div className="animate-fadeIn">
                {/* Quick Member / Device Switcher Carousel */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2.5 mt-2 border-t border-white/10">
                  {members.slice(0, 6).map((m) => {
                    const active = m.id === selectedMember.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => selectMember(m)}
                        className={`p-1.5 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          active
                            ? 'bg-secondary/20 border border-secondary/40 text-secondary'
                            : 'hover:bg-white/5 text-on-surface-variant'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ color: m.color, backgroundColor: `${m.color}25` }}
                        >
                          {m.name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-semibold truncate max-w-[65px]">{m.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tactical Actions */}
                <div className="grid grid-cols-2 gap-sm mt-3 pt-2">
                  <button
                    onClick={() => router.push('/devices')}
                    className="glass-panel py-2 rounded-xl text-on-surface font-label-md text-xs flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all border-white/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">sensors</span>
                    Device Telemetry
                  </button>
                  {Number.isFinite(selectedMember.lat) && Number.isFinite(selectedMember.lng) ? (
                    <button
                      onClick={() => router.push(`/sos?lat=${selectedMember.lat}&lng=${selectedMember.lng}&target=${encodeURIComponent(selectedMember.name)}`)}
                      className="bg-error hover:bg-error-container text-white py-2 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_12px_rgba(229,62,62,0.4)] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">emergency</span>
                      Dispatch to Location
                    </button>
                  ) : (
                    <button type="button" disabled className="glass-panel py-2 rounded-xl text-on-surface-variant text-xs font-semibold cursor-default">
                      Location sharing is off
                    </button>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}

      {!isFullScreen && <BottomNav />}
    </div>
  );
}
