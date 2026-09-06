'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { useLocationSharing } from '@/lib/location-sharing';

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
    stylers: [{ color: '#0f172a' }],
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
// Default coordinates: Sheffield Beach / Ballito, KwaZulu-Natal (-29.4925, 31.2312)
export const SHEFFIELD_BALLITO_COORDS = { lat: -29.4925, lng: 31.2312 };

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
  const isPartner = !!user?.isPartnerSession;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const pollTimerRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapProvider, setMapProvider] = useState('leaflet'); // 'google' | 'mapbox' | 'leaflet'
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [phoneToggling, setPhoneToggling] = useState(false);

  /* ─── Phone GPS Location Sharing Hook ─── */
  const {
    isOptedIn: isPhoneSharing,
    error: phoneSharingError,
    nickname: phoneNickname,
    optIn: optInPhoneSharing,
    optOut: optOutPhoneSharing,
  } = useLocationSharing();

  /* ─── Fetch device locations (Partner vs Standard Firebase) ─── */
  const fetchDeviceLocations = useCallback(async () => {
    if (!user) return;

    /* 1. Partner Session Path (Security Brokers / Partner CRM) */
    if (isPartner && partnerSession?.sessionToken) {
      try {
        const res = await fetch('/api/partner/devices', {
          headers: { Authorization: `Bearer ${partnerSession.sessionToken}` },
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
              battery: d.battery != null ? d.battery : 100,
              speed: d.status === 'in_motion' ? 45 : 0,
              address: d.address || (d.lat && d.lng ? `${d.lat.toFixed(4)}°S, ${d.lng.toFixed(4)}°E` : 'Ballito, KZN'),
              lastSeen: d.lastSeen || 'Live',
              avatar: null,
              color: getDeviceColor(i),
              lat: parseFloat(d.lat) || SHEFFIELD_BALLITO_COORDS.lat + (i * 0.006),
              lng: parseFloat(d.lng) || SHEFFIELD_BALLITO_COORDS.lng + (i * 0.006),
              device: `${formatDeviceType(d.type)} • ${d.nickname}`,
              icon: getDeviceIcon(d.type),
              isTag: d.type === 'BLE_TAG',
              isPhone: false,
              isPartner: true,
              isDemo: false,
            }));

            setMembers(partnerMembers);
            setSelectedMember((prev) => {
              if (!prev) return partnerMembers[0];
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
      setMembers([]);
      setConnectionStatus('live');
      return;
    }

    /* 2. Live Firebase & Test Session Path */
    try {
      const token =
        user?.accessToken ||
        user?.stsTokenManager?.accessToken ||
        (user?.isTestSession ? `test_${user.uid}` : (user?.uid ? `test_${user.uid}` : 'demo-test-token'));

      const [devicesRes, phonesRes] = await Promise.all([
        fetch('/api/devices', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/location/share', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      const allMembers = [];

      // Process hardware devices
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
            const hasGps = loc?.lat && loc?.lng;
            allMembers.push({
              id: device.imei,
              name: device.nickname || device.deviceName || `Device ${device.imei.slice(-4)}`,
              role: device.model || 'Sentinel Device',
              status: loc?.isOnline ? 'Online' : (hasGps ? 'Offline' : 'Awaiting GPS Fix'),
              zone: '',
              battery: loc?.batteryLevel || null,
              speed: loc?.speed || 0,
              address: loc?.address || (hasGps ? `${loc.lat.toFixed(4)}°S, ${loc.lng.toFixed(4)}°E` : 'Awaiting GPS fix...'),
              lastSeen: loc?.gpsTime || 'Connected',
              avatar: null,
              color: getDeviceColor(allMembers.length),
              lat: hasGps ? loc.lat : (SHEFFIELD_BALLITO_COORDS.lat + (i * 0.004)),
              lng: hasGps ? loc.lng : (SHEFFIELD_BALLITO_COORDS.lng + (i * 0.004)),
              device: `${device.model || 'Sentinel'} • ${device.imei.slice(-6)}`,
              isTag: loc?.isTag || false,
              isPhone: false,
              isDemo: false,
            });
          });
        }
      }

      // Merge locally linked Sentinel devices if not yet in backend response
      try {
        const cached = localStorage.getItem('safelink_user_devices');
        if (cached) {
          const localDevs = JSON.parse(cached);
          if (Array.isArray(localDevs)) {
            localDevs.forEach((ld, idx) => {
              if (ld.imei && !allMembers.some((m) => m.id === ld.imei)) {
                allMembers.push({
                  id: ld.imei,
                  name: ld.name || `Device ${ld.imei.slice(-4)}`,
                  role: ld.category || 'Sentinel Tracker',
                  status: 'Connecting...',
                  zone: '',
                  battery: null,
                  speed: 0,
                  address: 'Awaiting first GPS fix...',
                  lastSeen: 'Just linked',
                  avatar: null,
                  color: getDeviceColor(allMembers.length),
                  lat: SHEFFIELD_BALLITO_COORDS.lat + ((allMembers.length + 1) * 0.004),
                  lng: SHEFFIELD_BALLITO_COORDS.lng + ((allMembers.length + 1) * 0.004),
                  device: `Sentinel • ${ld.imei.slice(-6)}`,
                  isTag: false,
                  isPhone: false,
                  isDemo: false,
                });
              }
            });
          }
        }
      } catch {}

      // Process phone GPS sharing from backend
      if (phonesRes?.ok) {
        try {
          const phoneData = await phonesRes.json();
          const phoneLocations = phoneData.locations || [];

          phoneLocations.forEach((phone) => {
            if (phone.lat && phone.lng) {
              allMembers.push({
                id: phone.id || `phone_${phone.uid}`,
                name: phone.nickname || 'My Phone',
                role: 'Phone GPS (Live)',
                status: 'Live',
                zone: 'Active Device',
                battery: null,
                speed: phone.speed || 0,
                address: `${parseFloat(phone.lat).toFixed(4)}°S, ${parseFloat(phone.lng).toFixed(4)}°E`,
                lastSeen: phone.gpsTime || phone.updatedAt || 'Just now',
                avatar: user?.photoURL || null,
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
        const phoneIdx = allMembers.findIndex((m) => m.isPhone || m.id.startsWith('phone_'));
        const phoneEntry = {
          id: `phone_${user?.uid || 'me'}`,
          name: user?.displayName || phoneNickname || localPhoneGps.nickname || 'My Phone',
          role: 'Phone GPS (Live)',
          status: 'Live',
          zone: 'Active Device',
          battery: null,
          speed: localPhoneGps.speed ? Math.round(localPhoneGps.speed) : 0,
          address: `${parseFloat(localPhoneGps.lat).toFixed(4)}°S, ${parseFloat(localPhoneGps.lng).toFixed(4)}°E`,
          lastSeen: 'Just now',
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
          if (!prev) return allMembers[0];
          const match = allMembers.find((m) => m.id === prev.id);
          return match || allMembers[0];
        });
        setConnectionStatus('live');
      } else {
        setMembers([]);
        setSelectedMember(null);
        setConnectionStatus('live');
      }
    } catch (err) {
      console.warn('[map] Failed to fetch device locations:', err);
      setMembers([]);
      setConnectionStatus('live');
    }
  }, [user, isPartner, partnerSession, isPhoneSharing, lastPosition, phoneNickname]);

  /* ─── Fetch Geofences ───────────────────────────────────────── */
  const fetchGeofences = useCallback(async () => {
    if (!user || user.isTestSession || isPartner) return;
    try {
      const token = user.accessToken || user.stsTokenManager?.accessToken;
      if (!token) return;

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
              if (mapInstanceRef.current) {
                panMapTo(mapInstanceRef.current, liveLat, liveLng, 15);
              }
              fetchDeviceLocations();
            },
            (err) => console.warn('[map] Initial live GPS query note:', err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
          );
        }
      };

      // ── 1. Try Google Maps if API key configured ──
      if (GOOGLE_MAPS_KEY) {
        try {
          const googleMaps = await loadGoogleMapsScript(GOOGLE_MAPS_KEY);
          if (cancelled || !mapContainerRef.current) return;

          const map = new googleMaps.Map(mapContainerRef.current, {
            center: initCenter,
            zoom: 15,
            styles: GOOGLE_MAPS_DARK_STYLE,
            disableDefaultUI: true,
            zoomControl: true,
            backgroundColor: '#0f1923',
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
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [initCenter.lng, initCenter.lat],
            zoom: 15,
            attributionControl: false,
          });

          map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

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

      // ── 3. Leaflet Fallback (Free Tactical Dark Radar Tiles) ──
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
        });

        // ESRI World Dark Gray Canvas tiles (Zero watermarks, 100% free, dark tactical radar theme)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 16,
          attribution: '&copy; Esri, DeLorme, NAVTEQ',
        }).addTo(map);

        // Add reference labels (streets, city names)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 16,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

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
      if (!member.lat || !member.lng) return;

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
            overflow:hidden;background:#0f1923;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 12px rgba(0,0,0,0.6);
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
            background:rgba(15,25,35,0.92);
            border:1px solid rgba(255,255,255,0.18);
            padding:2px 8px;border-radius:6px;
            font-size:11px;font-weight:700;color:#f0f0f0;
            box-shadow:0 2px 6px rgba(0,0,0,0.5);
            display:flex;align-items:center;gap:4px;
            backdrop-filter:blur(4px);
            z-index:3;
          ">
            <span style="width:6px;height:6px;border-radius:50%;background:${member.color};display:inline-block;"></span>
            <span>${member.name.split(' ')[0]}</span>
            ${member.battery != null ? `<span style="font-size:9px;color:#ffc32f;margin-left:2px;">${member.battery}%</span>` : ''}
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
        const overlay = new HTMLMarkerOverlay(latLng, markerHtml, () => setSelectedMember(member));
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
        marker.on('click', () => setSelectedMember(member));
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
        el.addEventListener('click', () => setSelectedMember(member));

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
  }, [mapReady, members, geofences, showGeofences, selectedMember]);

  /* ─── Polling effect ────────────────────────────────────────── */
  useEffect(() => {
    fetchDeviceLocations();
    fetchGeofences();

    pollTimerRef.current = setInterval(fetchDeviceLocations, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [fetchDeviceLocations, fetchGeofences]);

  /* ─── Listen for Real-Time Phone GPS Broadcasts ─────────────── */
  useEffect(() => {
    const handlePhoneLocationBroadcast = (e) => {
      const coords = e.detail;
      if (coords?.lat && coords?.lng) {
        fetchDeviceLocations();
      }
    };
    window.addEventListener('safelink_phone_location_updated', handlePhoneLocationBroadcast);
    return () => window.removeEventListener('safelink_phone_location_updated', handlePhoneLocationBroadcast);
  }, [fetchDeviceLocations]);

  /* ─── Pan to selected member ────────────────────────────────── */
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !selectedMember?.lat || !selectedMember?.lng) return;

    panMapTo(mapInstanceRef.current, selectedMember.lat, selectedMember.lng, 15);
  }, [selectedMember, mapReady]);

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
        fetchDeviceLocations();
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

    if (map._isGoogle) {
      const google = map._google;
      const bounds = new google.maps.LatLngBounds();
      members.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      map.fitBounds(bounds, 60);
    } else if (map._isLeaflet) {
      const L = map._L;
      const bounds = L.latLngBounds(members.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (map.fitBounds) {
      const lngs = members.map((m) => m.lng);
      const lats = members.map((m) => m.lat);
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('popia_gps_consent');
        localStorage.removeItem('safelink_location_sharing_consent');
        localStorage.removeItem('last_known_pwa_gps');
      }
    } else {
      await optInPhoneSharing();
      if (typeof window !== 'undefined') {
        localStorage.setItem('popia_gps_consent', 'granted');
        localStorage.setItem('safelink_location_sharing_consent', 'granted');
      }
    }
    // Immediate refresh
    setTimeout(() => {
      fetchDeviceLocations();
    }, 600);
    setPhoneToggling(false);
  };

  /* ─── Status badge styling ──────────────────────────────────── */
  const isConsentGranted =
    typeof window !== 'undefined' &&
    (localStorage.getItem('popia_gps_consent') === 'granted' ||
      localStorage.getItem('safelink_location_sharing_consent') === 'granted');
  const isBroadcasting = isPhoneSharing || isConsentGranted;

  const statusColor = '#38a169';
  const statusText =
    connectionStatus === 'partner_live'
      ? `${members.length} Partner Device${members.length !== 1 ? 's' : ''} Live`
      : `${members.length} Active Device${members.length !== 1 ? 's' : ''} & Beacon${members.length !== 1 ? 's' : ''}`;

  return (
    <div className="bg-background text-on-background font-body-md h-screen w-screen overflow-hidden flex flex-col relative">
      <Header title="Live Radar & GPS" showNotification={true} />

      {/* Map Container — ALWAYS in DOM */}
      <div className="absolute inset-0 z-0 pt-16 pb-20">
        <div ref={mapContainerRef} className="w-full h-full bg-[#0a0f14]" />
      </div>

      {/* Map Control Floating Top Bar */}
      <div className="absolute top-20 left-4 right-4 z-30 max-w-2xl mx-auto flex items-center justify-between pointer-events-auto">
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
          <span className="font-label-sm text-xs font-bold text-on-surface">{statusText}</span>
          <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">
            [{mapProvider === 'google' ? 'Google Maps' : mapProvider === 'mapbox' ? 'Mapbox' : 'Radar'}]
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Locate My Phone GPS Button */}
          <button
            onClick={handleLocatePhone}
            className="glass-panel p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-sm flex items-center justify-center text-secondary border border-secondary/40 shadow-lg cursor-pointer"
            title="Locate my exact phone GPS position"
          >
            <span className="material-symbols-outlined text-[18px]">my_location</span>
          </button>

          {/* Recenter All Button */}
          <button
            onClick={handleRecenter}
            className="glass-panel p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-sm flex items-center justify-center text-on-surface border border-white/10 shadow-lg cursor-pointer"
            title="Recenter devices and phone"
          >
            <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
          </button>

          {/* Toggle Geofence Safe Zones */}
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`glass-panel p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-sm flex items-center gap-1.5 border border-white/10 ${
              showGeofences ? 'text-secondary border-secondary/40' : 'text-on-surface-variant'
            }`}
            title="Toggle Safe Zones"
          >
            <span className="material-symbols-outlined text-[18px]">share_location</span>
            <span className="text-xs font-semibold pr-1 hidden sm:inline">Zones</span>
          </button>

          {/* Share Phone GPS Switch */}
          <button
            onClick={handleTogglePhoneSharing}
            disabled={phoneToggling}
            className={`glass-panel px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 border shadow-lg cursor-pointer ${
              isBroadcasting
                ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-on-surface border-white/10'
            } ${phoneToggling ? 'opacity-50 cursor-wait' : ''}`}
            title={isBroadcasting ? 'Phone GPS is broadcasting live to radar' : 'Broadcast this phone GPS to radar'}
          >
            <span className={`w-2 h-2 rounded-full ${isBroadcasting ? 'bg-emerald-400 animate-ping' : 'bg-on-surface-variant'}`} />
            <span className="material-symbols-outlined text-[16px]">
              {isBroadcasting ? 'satellite_alt' : 'smartphone'}
            </span>
            <span className="hidden xs:inline">{isBroadcasting ? 'Phone Live' : 'Share Phone'}</span>
          </button>

          {/* Add Device / Device List */}
          <button
            onClick={() => router.push('/devices')}
            className="glass-panel px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs font-bold text-primary flex items-center gap-1 border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">devices</span>
            <span className="hidden sm:inline">Devices</span>
          </button>
        </div>
      </div>

      {/* GPS Permission Error Notice */}
      {phoneSharingError && (
        <div className="absolute top-32 left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto bg-red-500/20 border border-red-500/50 backdrop-blur-md rounded-xl p-2.5 text-xs text-red-200 flex items-center gap-2 shadow-xl">
          <span className="material-symbols-outlined text-sm shrink-0">warning</span>
          <span className="flex-1">{phoneSharingError}</span>
        </div>
      )}

      {/* Radar Scanning Empty State Banner when no members/devices are active */}
      {members.length === 0 && (
        <div className="absolute bottom-24 left-4 right-4 z-20 max-w-md mx-auto pointer-events-auto animate-fadeIn">
          <div className="glass-panel p-4 rounded-2xl border border-secondary/40 bg-surface-container-high/95 backdrop-blur-xl shadow-2xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-2xl animate-pulse">radar</span>
              <span className="font-headline-md text-xs font-bold uppercase tracking-wider">Radar Online • Clean Slate</span>
            </div>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              No active GPS beacons or Sentinel devices detected. Tap <strong className="text-secondary">&quot;Share Phone&quot;</strong> in the top controls or pair your Sentinel hardware to track on the radar.
            </p>
          </div>
        </div>
      )}

      {/* Selected Device Drawer with Pull Tab */}
      {selectedMember && (
        <div className="absolute bottom-20 left-0 right-0 z-30 p-gutter max-w-2xl mx-auto pointer-events-auto">
          <div className="glass-panel rounded-2xl p-sm sm:p-md shadow-2xl border border-white/15 backdrop-blur-xl bg-surface-container-high/90 transition-all duration-300">
            {/* Pull Tab / Collapse Handle at Top */}
            <div
              onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
              className="w-full flex justify-center items-center py-1 -mt-1 mb-1 cursor-pointer group select-none"
              title={isDrawerCollapsed ? 'Expand tracker details' : 'Collapse tracker details'}
            >
              <div className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/10 group-hover:bg-secondary/30 transition-all border border-white/10 shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-secondary transition-transform duration-200">
                  {isDrawerCollapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface uppercase tracking-wider">
                  {isDrawerCollapsed ? 'Expand Details' : 'Minimize'}
                </span>
              </div>
            </div>

            {/* Header info (Always Visible) */}
            <div className="flex items-start justify-between">
              <div
                className="flex items-center gap-sm cursor-pointer"
                onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
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
                    <h3 className="font-headline-md text-base md:text-lg font-bold text-on-surface leading-tight">
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

              <div className="flex flex-col items-end shrink-0 pl-2">
                {selectedMember.battery !== null && (
                  <div className="flex items-center gap-1 text-secondary text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">battery_5_bar</span>
                    {selectedMember.battery}%
                  </div>
                )}
                {selectedMember.speed > 0 && (
                  <span className="text-[10px] text-on-surface-variant font-mono">{selectedMember.speed} km/h</span>
                )}
                <span className="text-[10px] text-on-surface-variant/80">{selectedMember.lastSeen}</span>
              </div>
            </div>

            {/* Expandable Section: Quick Member Carousel & Actions */}
            {!isDrawerCollapsed && (
              <div className="animate-fadeIn">
                {/* Quick Member / Device Switcher Carousel */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2.5 mt-2 border-t border-white/10">
                  {members.slice(0, 6).map((m) => {
                    const active = m.id === selectedMember.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
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
                  <button
                    onClick={() => router.push(`/sos?lat=${selectedMember.lat}&lng=${selectedMember.lng}&target=${encodeURIComponent(selectedMember.name)}`)}
                    className="bg-error hover:bg-error-container text-white py-2 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_12px_rgba(229,62,62,0.4)] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">emergency</span>
                    Dispatch to Location
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
