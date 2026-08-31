'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

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

/* ─── Demo fallback data ────────────────────────────────────────── */
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
    name: 'Toyota Fortuner GD-6',
    role: 'Vehicle GPS Tracker',
    status: 'In Transit',
    zone: 'Heading to Campus',
    battery: 100,
    speed: 45,
    address: 'N1 North, Midrand',
    lastSeen: 'Live',
    avatar: null,
    color: '#38a169',
    lat: -26.0200,
    lng: 28.0700,
    device: 'Toyota Fortuner GPS Hardwire',
    isDemo: true,
  },
];

const DEMO_GEOFENCES = [
  { id: 'home', name: 'Home Zone', lat: -26.1076, lng: 28.0567, radius: 180, color: '#38a169' },
  { id: 'school', name: 'School Zone', lat: -26.1022, lng: 28.0412, radius: 140, color: '#ffc32f' },
  { id: 'work', name: 'Corporate Zone', lat: -26.0961, lng: 28.0569, radius: 220, color: '#2c5a85' },
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
  const { user, partnerSession } = useAuth();
  const isPartner = !!user?.isPartnerSession;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const pollTimerRef = useRef(null);

  const [members, setMembers] = useState(DEMO_MEMBERS);
  const [geofences, setGeofences] = useState(DEMO_GEOFENCES);
  const [selectedMember, setSelectedMember] = useState(DEMO_MEMBERS[0]);
  const [showGeofences, setShowGeofences] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapProvider, setMapProvider] = useState('leaflet'); // 'google' | 'mapbox' | 'leaflet'
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

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
              address: d.address || (d.lat && d.lng ? `${d.lat.toFixed(4)}°S, ${d.lng.toFixed(4)}°E` : 'Sandton, JHB'),
              lastSeen: d.lastSeen || 'Live',
              avatar: null,
              color: getDeviceColor(i),
              lat: parseFloat(d.lat) || -26.1076 + (i * 0.006),
              lng: parseFloat(d.lng) || 28.0567 + (i * 0.006),
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
          }
        }
      } catch (err) {
        console.warn('[map] Partner device fetch error:', err);
      }
      setConnectionStatus('demo');
      return;
    }

    /* 2. Test Session Path (Hardcoded 0827675092) */
    if (user.isTestSession) {
      setMembers(DEMO_MEMBERS);
      setConnectionStatus('demo');
      return;
    }

    /* 3. Live Firebase + TrackSolid Path */
    try {
      const token = user.accessToken || user.stsTokenManager?.accessToken;
      if (!token) {
        setConnectionStatus('demo');
        return;
      }

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

      // Process phone GPS sharing
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

      if (allMembers.length > 0) {
        setMembers(allMembers);
        setSelectedMember(allMembers[0]);
        setConnectionStatus('live');
      } else {
        setConnectionStatus('demo');
      }
    } catch (err) {
      console.warn('[map] Failed to fetch device locations:', err);
      setConnectionStatus('demo');
    }
  }, [user, isPartner, partnerSession]);

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
      // ── 1. Try Google Maps if API key configured ──
      if (GOOGLE_MAPS_KEY) {
        try {
          const googleMaps = await loadGoogleMapsScript(GOOGLE_MAPS_KEY);
          if (cancelled || !mapContainerRef.current) return;

          const map = new googleMaps.Map(mapContainerRef.current, {
            center: { lat: -26.1076, lng: 28.0567 },
            zoom: 13,
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
            center: [28.0567, -26.1076],
            zoom: 13,
            attributionControl: false,
          });

          map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

          map.on('load', () => {
            if (!cancelled) {
              mapInstanceRef.current = map;
              mapInstanceRef.current._isMapbox = true;
              setMapProvider('mapbox');
              setMapReady(true);
            }
          });
          return;
        } catch (e) {
          console.warn('[map] Mapbox init failed, falling back to Leaflet:', e);
        }
      }

      // ── 3. Leaflet Fallback (Free CartoDB Dark Tiles) ──
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
          center: [-26.1076, 28.0567],
          zoom: 13,
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

  /* ─── Pan to selected member ────────────────────────────────── */
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !selectedMember?.lat || !selectedMember?.lng) return;

    const map = mapInstanceRef.current;
    if (map._isGoogle) {
      map.panTo({ lat: selectedMember.lat, lng: selectedMember.lng });
      map.setZoom(14);
    } else if (map._isLeaflet) {
      map.setView([selectedMember.lat, selectedMember.lng], 14, { animate: true, duration: 1 });
    } else if (map.flyTo) {
      map.flyTo({
        center: [selectedMember.lng, selectedMember.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedMember, mapReady]);

  /* ─── Fit bounds to all devices ──────────────────────────────── */
  const handleRecenter = () => {
    if (!mapInstanceRef.current || members.length === 0) return;
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

  /* ─── Status badge styling ──────────────────────────────────── */
  const statusColor = connectionStatus === 'partner_live' || connectionStatus === 'live' ? '#38a169' : '#ffc32f';
  const statusText =
    connectionStatus === 'partner_live'
      ? `${members.length} Partner Devices Live`
      : connectionStatus === 'live'
      ? `${members.length} Devices Live`
      : `${members.length} Trackers (Active Demo)`;

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

        <div className="flex items-center gap-2">
          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="glass-panel p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-sm flex items-center justify-center text-on-surface border border-white/10"
            title="Recenter all devices"
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
            <span className="text-xs font-semibold pr-1">Zones</span>
          </button>

          {/* Add Device / Device List */}
          <button
            onClick={() => router.push('/devices')}
            className="glass-panel px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs font-bold text-primary flex items-center gap-1 border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">devices</span>
            Devices
          </button>
        </div>
      </div>

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
