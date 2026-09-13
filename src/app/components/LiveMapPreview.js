'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_CENTER = { lat: -29.5282, lng: 31.2111 };

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('safelink-google-maps');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = 'safelink-google-maps';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function LiveMapPreview({ members, onOpen }) {
  const containerRef = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;
    let markers = [];
    loadGoogleMaps(apiKey).then((maps) => {
      if (cancelled || !maps || !containerRef.current) return;
      const map = new maps.Map(containerRef.current, {
        center: DEFAULT_CENTER, zoom: 14, disableDefaultUI: true,
        gestureHandling: 'none', clickableIcons: false,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
      });
      const bounds = new maps.LatLngBounds();
      markers = members.map((member, index) => {
        const position = { lat: Number(member.lat), lng: Number(member.lng) };
        bounds.extend(position);
        return new maps.Marker({
          map, position, title: member.name,
          label: { text: member.isPhone ? '●' : String(index + 1), color: '#ffffff', fontWeight: '700' },
          icon: { path: maps.SymbolPath.CIRCLE, fillColor: member.isPhone ? '#10b981' : '#b86c05', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3, scale: member.isPhone ? 11 : 12 },
        });
      });
      if (members.length === 1) { map.setCenter(bounds.getCenter()); map.setZoom(15); }
      else if (members.length > 1) map.fitBounds(bounds, 28);
    }).catch(() => {});
    return () => { cancelled = true; markers.forEach(marker => marker.setMap(null)); };
  }, [apiKey, members]);

  return (
    <div className="relative h-48 w-full bg-surface-container-high overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" aria-label="Live family map preview" />
      {!apiKey && <div className="absolute inset-0 map-bg opacity-90" aria-hidden="true" />}
      {members.length === 0 && <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center"><div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/50 flex items-center justify-center mb-2"><span className="material-symbols-outlined text-secondary text-xl">radar</span></div><p className="text-xs text-on-surface font-semibold">Awaiting a shared location</p><p className="text-[11px] text-on-surface-variant max-w-xs">Open Live Map to share a phone location or pair a Sentinel device.</p></div>}
      <button type="button" onClick={onOpen} aria-label="Open live family map" className="absolute inset-0 z-10 cursor-pointer" />
      <div className="absolute top-2 left-2 z-20 pointer-events-none rounded-full bg-surface-container-high/90 backdrop-blur px-2.5 py-1 text-[10px] text-on-surface font-semibold border border-white/15"><span className="inline-block w-2 h-2 rounded-full bg-[#38a169] mr-1.5" />Live family map</div>
      <div className="absolute bottom-2 right-2 z-20 pointer-events-none bg-surface-container-highest/90 px-2.5 py-1 rounded-lg text-[11px] text-on-surface flex items-center gap-1 backdrop-blur-md"><span className="material-symbols-outlined text-[14px] text-secondary">explore</span>Tap to open live tracking</div>
    </div>
  );
}
