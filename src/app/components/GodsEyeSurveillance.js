'use client';

import React, { useState, useEffect, useRef } from 'react';

// 6 Specialized Tactical Camera Feeds tailored to Sovereign Intervention
const CAMERA_FEEDS = [
  {
    id: 'CAM-01',
    code: 'CAM-01-SANDHURST',
    name: 'Sandhurst Estate Main Gate & Guardhouse',
    type: '4K ANPR PTZ Dome',
    location: 'Sandhurst Access North, Sandton',
    gps: '-26.1132° S, 28.0345° E',
    zone: 'Zone A - Main Perimeter Gate',
    status: 'ONLINE',
    sceneType: 'gate',
    fps: 30,
    bitrate: '4.8 Mbps',
    azimuth: 142,
    elevation: -14,
    detections: [
      { id: 'd1', label: 'ANPR: CA 849-210', type: 'vehicle', detail: 'TOYOTA HILUX (WHITE) • SPEED 24 KM/H • STATUS: REGISTERED RESIDENT', box: { x: 34, y: 46, w: 32, h: 28 }, color: '#38a169' },
      { id: 'd2', label: 'OFFICER #02', type: 'guard', detail: 'SOVEREIGN ARMED GUARD • BIO: NOMINAL', box: { x: 16, y: 50, w: 14, h: 30 }, color: '#4299e1' },
      { id: 'd3', label: 'BOOM GATE #1', type: 'infrastructure', detail: 'AUTOMATIC RFID BEACON ENGAGED', box: { x: 68, y: 44, w: 22, h: 20 }, color: '#D4AF37' },
    ],
  },
  {
    id: 'CAM-02',
    code: 'CAM-02-CLIFTON',
    name: 'Clifton Ridge VIP Residence — North Perimeter',
    type: 'Bi-Spectrum Thermal Bullet',
    location: 'Clifton Road Sector 4, Bryanston',
    gps: '-26.0583° S, 28.0211° E',
    zone: 'Zone B - High Security Perimeter',
    status: 'BEAM ARMED',
    sceneType: 'perimeter',
    fps: 25,
    bitrate: '3.6 Mbps',
    azimuth: 85,
    elevation: -8,
    detections: [
      { id: 'd4', label: 'INFRARED TRIPWIRE #04', type: 'tripwire', detail: '10,000V PULSE FENCE: SECURED • BEAM TENSION 100%', box: { x: 12, y: 64, w: 76, h: 3 }, color: '#48bb78', isLine: true },
      { id: 'd5', label: 'MOTION SENSOR #12', type: 'sensor', detail: 'RADAR VELOCITY: 0 M/S (QUIET)', box: { x: 74, y: 32, w: 16, h: 18 }, color: '#D4AF37' },
    ],
  },
  {
    id: 'CAM-03',
    code: 'CAM-03-CBD-VAULT',
    name: 'Sandton CBD Commercial Holding & Armoured Bay',
    type: '360° Panoramic Fisheye',
    location: 'Commerce Square Holding, Sandton CBD',
    gps: '-26.1075° S, 28.0567° E',
    zone: 'Zone C - Armoured Depot Vault',
    status: 'RESTRICTED',
    sceneType: 'vault',
    fps: 30,
    bitrate: '5.4 Mbps',
    azimuth: 310,
    elevation: -42,
    detections: [
      { id: 'd6', label: 'UNIT #AR-04', type: 'vehicle', detail: 'SOVEREIGN ARMOURED MERCEDES SPRINTER • ESCORT STANDBY', box: { x: 26, y: 36, w: 48, h: 38 }, color: '#805ad5' },
      { id: 'd7', label: 'VAULT AIRLOCK #2', type: 'vault', detail: 'BIOMETRIC INTERLOCK ARMED', box: { x: 78, y: 28, w: 16, h: 42 }, color: '#ecc94b' },
    ],
  },
  {
    id: 'CAM-04',
    code: 'CAM-04-NICOL-MESH',
    name: 'William Nicol & Bryanston Public Traffic Mesh',
    type: "God's Eye Municipal Public Mesh",
    location: 'Main & William Nicol Corridors',
    gps: '-26.0491° S, 28.0175° E',
    zone: "God's Eye Mesh Feed #409",
    status: 'MESHED',
    sceneType: 'traffic',
    fps: 30,
    bitrate: '4.2 Mbps',
    azimuth: 180,
    elevation: -22,
    detections: [
      { id: 'd8', label: 'ANPR CHECK', type: 'vehicle', detail: 'BMW X5 (BLACK) • REG: ND 918-204 • STOLEN DB: CLEAR', box: { x: 38, y: 52, w: 26, h: 26 }, color: '#38a169' },
      { id: 'd9', label: 'TRAFFIC DENSITY', type: 'traffic', detail: 'CORRIDOR FLOW: 48 VEHICLES/MIN • NO DISRUPTIONS', box: { x: 18, y: 14, w: 64, h: 18 }, color: '#4299e1' },
    ],
  },
  {
    id: 'CAM-05',
    code: 'CAM-05-INANDA-HELI',
    name: 'Inanda Polo Club — Helipad & Apron',
    type: 'Long-Range Optical PTZ (32x Zoom)',
    location: 'Forrest Rd Helipad #1, Inanda',
    gps: '-26.1240° S, 28.0490° E',
    zone: 'Aviation Zone H-1',
    status: 'CLEAR FOR TOUCHDOWN',
    sceneType: 'helipad',
    fps: 30,
    bitrate: '4.0 Mbps',
    azimuth: 220,
    elevation: -12,
    detections: [
      { id: 'd10', label: 'AIRSPACE RADAR', type: 'aviation', detail: 'ADS-B LOCK: ZERO PROXIMITY CONFLICTS • WIND 08KT 090°', box: { x: 14, y: 14, w: 50, h: 18 }, color: '#e2e8f0' },
      { id: 'd11', label: 'PAD H TOUCHDOWN', type: 'pad', detail: 'VIP ARRIVAL WINDOW: STANDBY 14:00', box: { x: 36, y: 46, w: 28, h: 32 }, color: '#D4AF37' },
    ],
  },
  {
    id: 'CAM-06',
    code: 'CAM-06-RIVONIA-HWY',
    name: 'N1 Rivonia Highway Surveillance Corridor',
    type: 'High-Speed Highway ANPR Gantry',
    location: 'N1 Southbound Gantry, Rivonia',
    gps: '-26.0620° S, 28.0590° E',
    zone: 'Highway Intercept Corridor',
    status: 'ACTIVE ESCORT',
    sceneType: 'highway',
    fps: 30,
    bitrate: '5.1 Mbps',
    azimuth: 195,
    elevation: -28,
    detections: [
      { id: 'd12', label: 'ESCORT CONVOY', type: 'vehicle', detail: 'APEX LOGISTICS CONVOY #02 • SPEED 104 KM/H • GPS LOCKED', box: { x: 30, y: 44, w: 40, h: 34 }, color: '#D4AF37' },
      { id: 'd13', label: 'GANTRY TELEMETRY', type: 'telemetry', detail: 'OPTICAL RECOGNITION 99.8% • SPEED CALIBRATED', box: { x: 62, y: 14, w: 32, h: 18 }, color: '#38a169' },
    ],
  },
];

export default function GodsEyeSurveillance({ companyId, brand }) {
  const accentColor = brand?.highlightedButtonBg || '#D4AF37';
  const buttonBgColor = brand?.buttonBgColor || '#0F1A26';
  const partnerName = brand?.partnerName || 'Sovereign Intervention';

  // Control states
  const [layout, setLayout] = useState('grid'); // 'grid' (2x2), 'wall' (3x2), 'focus' (1 large)
  const [activeShader, setActiveShader] = useState('NORMAL'); // 'NORMAL' | 'NVG' | 'FLIR' | 'CRT'
  const [aiMeshEnabled, setAiMeshEnabled] = useState(true);
  const [selectedCam, setSelectedCam] = useState(CAMERA_FEEDS[0]);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [godsEyeModalOpen, setGodsEyeModalOpen] = useState(false);
  
  // PTZ interactive simulator state for active camera
  const [ptzState, setPtzState] = useState({
    panOffset: 0,
    tiltOffset: 0,
    zoom: 1.0,
    focus: 100,
  });

  // Timecode state
  const [timecode, setTimecode] = useState('');
  const [dispatchAlert, setDispatchAlert] = useState(null);
  const [snapshotTaken, setSnapshotTaken] = useState(null);

  // Live millisecond timecode updater
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      const se = String(now.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds())).padStart(3, '0');
      setTimecode(`${yr}-${mo}-${da} ${hr}:${mi}:${se}.${ms} SAST`);
    };
    update();
    const interval = setInterval(update, 60);
    return () => clearInterval(interval);
  }, []);

  // Dispatch tactical armed unit
  const handleDispatch = (cam) => {
    const unitId = '#AR-04';
    setDispatchAlert({
      camName: cam.name,
      location: cam.location,
      gps: cam.gps,
      unit: unitId,
      eta: '2.4 mins',
      timestamp: new Date().toLocaleTimeString('en-ZA'),
    });
    setTimeout(() => {
      // Auto clear after 8s
      setDispatchAlert(null);
    }, 8000);
  };

  // PTZ Control handlers
  const handlePtz = (direction) => {
    setPtzState(prev => {
      switch (direction) {
        case 'left':
          return { ...prev, panOffset: Math.max(prev.panOffset - 15, -45) };
        case 'right':
          return { ...prev, panOffset: Math.min(prev.panOffset + 15, 45) };
        case 'up':
          return { ...prev, tiltOffset: Math.min(prev.tiltOffset + 10, 30) };
        case 'down':
          return { ...prev, tiltOffset: Math.max(prev.tiltOffset - 10, -30) };
        case 'zoom-in':
          return { ...prev, zoom: Math.min(Number((prev.zoom + 0.5).toFixed(1)), 4.0) };
        case 'zoom-out':
          return { ...prev, zoom: Math.max(Number((prev.zoom - 0.5).toFixed(1)), 1.0) };
        case 'reset':
          return { panOffset: 0, tiltOffset: 0, zoom: 1.0, focus: 100 };
        default:
          return prev;
      }
    });
  };

  // Capture Intel Snapshot
  const handleCaptureSnapshot = (cam) => {
    const snap = {
      camCode: cam.code,
      name: cam.name,
      location: cam.location,
      gps: cam.gps,
      time: timecode,
      shader: activeShader,
      id: `INTEL-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    setSnapshotTaken(snap);
  };

  // Filter styles corresponding to God's Eye View GLSL Sensor Shaders
  const getShaderStyle = () => {
    switch (activeShader) {
      case 'NVG':
        // Tactical Night Vision Goggles (Gen-3 Green Phosphor with high contrast & grain)
        return {
          filter: 'sepia(100%) hue-rotate(85deg) saturate(320%) brightness(1.2) contrast(1.35)',
        };
      case 'FLIR':
        // Ironbow / White-Hot Thermal Heat Signature
        return {
          filter: 'invert(100%) hue-rotate(185deg) saturate(340%) contrast(1.75) brightness(1.1)',
        };
      case 'CRT':
        // High-Contrast Retro Security Command Monitor with phosphor curves
        return {
          filter: 'contrast(1.4) brightness(0.95) saturate(0.85)',
        };
      case 'NORMAL':
      default:
        return {
          filter: 'contrast(1.08) brightness(1.02)',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP CONTROL BAR ── */}
      <div
        className="rounded-2xl p-4 sm:p-5 border shadow-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md transition-all"
        style={{
          backgroundColor: `${buttonBgColor}E6`,
          borderColor: `${accentColor}35`,
          boxShadow: `0 8px 30px -8px ${accentColor}20`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
            style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}
          >
            <span className="material-symbols-outlined text-xl">videocam</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">God&apos;s Eye Tactical CCTV Matrix</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">LIVE MATRIX</span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              {timecode || 'SYNCHRONIZING ATOMIC CLOCK...'} • 6 ACTIVE FEEDS
            </p>
          </div>
        </div>

        {/* Tactical Controls & Shaders */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sensor Shader Modes (From God's Eye View) */}
          <div className="flex items-center rounded-xl p-1 bg-black/60 border border-white/10 text-xs">
            <span className="text-[10px] font-bold text-on-surface-variant px-2 uppercase tracking-wider hidden md:inline">
              Sensor:
            </span>
            {[
              { id: 'NORMAL', label: 'OPTICAL', icon: 'visibility' },
              { id: 'NVG', label: 'NVG (NIGHT)', icon: 'bedtime' },
              { id: 'FLIR', label: 'FLIR (THERMAL)', icon: 'local_fire_department' },
              { id: 'CRT', label: 'CRT MONITOR', icon: 'tv' },
            ].map(s => {
              const active = activeShader === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveShader(s.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                    active ? 'shadow-md scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: s.id === 'NVG' ? '#22c55e' : s.id === 'FLIR' ? '#ef4444' : accentColor,
                          color: '#04070E',
                        }
                      : {}
                  }
                  title={`Toggle ${s.label} Sensor Shader`}
                >
                  <span className="material-symbols-outlined text-xs">{s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* AI Mesh Detection Toggle */}
          <button
            onClick={() => setAiMeshEnabled(!aiMeshEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              aiMeshEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Toggle God's Eye AI Vision Bounding Boxes & Telemetry"
          >
            <span className="material-symbols-outlined text-sm">{aiMeshEnabled ? 'smart_toy' : 'check_box_outline_blank'}</span>
            <span>AI Vision Mesh: {aiMeshEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Layout Switcher */}
          <div className="flex items-center rounded-xl p-1 bg-black/60 border border-white/10 text-xs">
            <button
              onClick={() => setLayout('grid')}
              className={`p-1.5 rounded-lg transition-all ${layout === 'grid' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
              title="2x2 Quad Grid"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              onClick={() => setLayout('wall')}
              className={`p-1.5 rounded-lg transition-all ${layout === 'wall' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
              title="3x2 Command Wall (All 6 Feeds)"
            >
              <span className="material-symbols-outlined text-base">apps</span>
            </button>
            <button
              onClick={() => {
                setLayout('focus');
                if (!selectedCam) setSelectedCam(CAMERA_FEEDS[0]);
              }}
              className={`p-1.5 rounded-lg transition-all ${layout === 'focus' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Focus View with PTZ Control"
            >
              <span className="material-symbols-outlined text-base">fullscreen</span>
            </button>
          </div>

          {/* God's Eye View Repo Showcase Button */}
          <button
            onClick={() => setGodsEyeModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
              borderColor: `${accentColor}40`,
            }}
          >
            <span className="material-symbols-outlined text-sm">public</span>
            <span className="hidden lg:inline">God&apos;s Eye 3D Engine</span>
          </button>
        </div>
      </div>

      {/* ── ARMED DISPATCH ALERT BANNER (IF TRIGGERED) ── */}
      {dispatchAlert && (
        <div
          className="rounded-2xl p-4 border animate-bounce flex items-center justify-between gap-4 shadow-2xl"
          style={{
            backgroundColor: '#ef44441a',
            borderColor: '#ef444466',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-2xl animate-spin">local_police</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  CRITICAL DISPATCH ORDER SENT • UNIT {dispatchAlert.unit}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 font-mono">
                  ETA {dispatchAlert.eta}
                </span>
              </div>
              <p className="text-xs text-white mt-0.5">
                Target: <span className="font-bold">{dispatchAlert.camName}</span> ({dispatchAlert.location}) • GPS: <span className="font-mono">{dispatchAlert.gps}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setDispatchAlert(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-black/40 border border-white/10"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ── CAMERA MATRIX GRID / WALL ── */}
      {layout !== 'focus' ? (
        <div
          className={`grid gap-4 ${
            layout === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {(layout === 'grid' ? CAMERA_FEEDS.slice(0, 4) : CAMERA_FEEDS).map((cam) => (
            <CameraFeedCard
              key={cam.id}
              cam={cam}
              activeShader={activeShader}
              shaderStyle={getShaderStyle()}
              aiMeshEnabled={aiMeshEnabled}
              accentColor={accentColor}
              buttonBgColor={buttonBgColor}
              timecode={timecode}
              onSelect={() => {
                setSelectedCam(cam);
                setFocusModalOpen(true);
              }}
              onDispatch={() => handleDispatch(cam)}
              onSnapshot={() => handleCaptureSnapshot(cam)}
            />
          ))}
        </div>
      ) : (
        /* ── FOCUS MODE: 1 LARGE FEED + SIDEBAR SELECTOR + PTZ JOYSTICK ── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Large Feed (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <CameraFeedCard
              cam={selectedCam}
              activeShader={activeShader}
              shaderStyle={getShaderStyle()}
              aiMeshEnabled={aiMeshEnabled}
              accentColor={accentColor}
              buttonBgColor={buttonBgColor}
              timecode={timecode}
              isLarge
              ptzOffset={ptzState}
              onDispatch={() => handleDispatch(selectedCam)}
              onSnapshot={() => handleCaptureSnapshot(selectedCam)}
            />

            {/* Tactical PTZ Control Deck for Focus Feed */}
            <div
              className="rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 bg-black/40"
              style={{ borderColor: `${accentColor}30` }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg" style={{ color: accentColor }}>settings_remote</span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">PTZ Optical Control Console</h4>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    PAN: {selectedCam.azimuth + ptzState.panOffset}° AZ • TILT: {selectedCam.elevation + ptzState.tiltOffset}° • ZOOM: {ptzState.zoom}x
                  </p>
                </div>
              </div>

              {/* PTZ Joystick Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePtz('left')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Pan Left"
                >
                  <span className="material-symbols-outlined text-sm">arrow_left</span>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handlePtz('up')}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                    title="Tilt Up"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_drop_up</span>
                  </button>
                  <button
                    onClick={() => handlePtz('down')}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                    title="Tilt Down"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </button>
                </div>
                <button
                  onClick={() => handlePtz('right')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Pan Right"
                >
                  <span className="material-symbols-outlined text-sm">arrow_right</span>
                </button>
                <button
                  onClick={() => handlePtz('reset')}
                  className="px-2.5 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-300 border border-white/10 active:scale-95 ml-2"
                  title="Recenter"
                >
                  CENTER
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-on-surface-variant font-mono">OPTICAL ZOOM:</span>
                <button
                  onClick={() => handlePtz('zoom-out')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-sm">zoom_out</span>
                </button>
                <span
                  className="px-3 py-1 rounded-lg font-mono text-xs font-black border"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}
                >
                  {ptzState.zoom}x
                </span>
                <button
                  onClick={() => handlePtz('zoom-in')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-sm">zoom_in</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Camera List (1 col) */}
          <div
            className="rounded-2xl p-4 border space-y-3"
            style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: `${accentColor}25` }}
          >
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Surveillance Roster</h3>
              <span className="text-[10px] text-emerald-400 font-mono">6 ONLINE</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {CAMERA_FEEDS.map((cam) => {
                const isCurrent = selectedCam.id === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setSelectedCam(cam);
                      handlePtz('reset');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-white/5 bg-black/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{cam.code}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: isCurrent ? `${accentColor}25` : 'rgba(255,255,255,0.08)',
                          color: isCurrent ? accentColor : '#94a3b8',
                        }}
                      >
                        {cam.type.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium mt-1 truncate">{cam.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{cam.location}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── FOCUS MODAL (WHEN USER CLICKS ANY CARD IN GRID/WALL) ── */}
      {focusModalOpen && selectedCam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-5xl rounded-3xl border overflow-hidden shadow-2xl flex flex-col max-h-[92vh] bg-slate-950"
            style={{ borderColor: `${accentColor}50` }}
          >
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl" style={{ color: accentColor }}>videocam</span>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedCam.name}</h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {selectedCam.code} • {selectedCam.gps} • {selectedCam.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDispatch(selectedCam)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/50 hover:bg-red-600/50 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">local_police</span>
                  <span>Dispatch Armed Unit</span>
                </button>
                <button
                  onClick={() => setFocusModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <CameraFeedCard
                cam={selectedCam}
                activeShader={activeShader}
                shaderStyle={getShaderStyle()}
                aiMeshEnabled={aiMeshEnabled}
                accentColor={accentColor}
                buttonBgColor={buttonBgColor}
                timecode={timecode}
                isLarge
                ptzOffset={ptzState}
                onDispatch={() => handleDispatch(selectedCam)}
                onSnapshot={() => handleCaptureSnapshot(selectedCam)}
              />

              {/* PTZ and Controls Deck */}
              <div
                className="rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 bg-black/40"
                style={{ borderColor: `${accentColor}25` }}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePtz('left')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_left</span>
                  </button>
                  <button
                    onClick={() => handlePtz('up')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_drop_up</span>
                  </button>
                  <button
                    onClick={() => handlePtz('down')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_drop_down</span>
                  </button>
                  <button
                    onClick={() => handlePtz('right')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_right</span>
                  </button>
                  <button
                    onClick={() => handlePtz('reset')}
                    className="px-3 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white ml-2"
                  >
                    Recenter
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant font-mono">ZOOM:</span>
                  <button
                    onClick={() => handlePtz('zoom-out')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined text-sm">zoom_out</span>
                  </button>
                  <span className="font-mono text-sm font-bold text-white">{ptzState.zoom}x</span>
                  <button
                    onClick={() => handlePtz('zoom-in')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined text-sm">zoom_in</span>
                  </button>
                  <button
                    onClick={() => handleCaptureSnapshot(selectedCam)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/15 text-white hover:bg-white/25 flex items-center gap-1.5 ml-3"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    <span>Capture Snapshot</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SNAPSHOT PREVIEW MODAL ── */}
      {snapshotTaken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-lg rounded-3xl border p-6 bg-slate-950 space-y-4 shadow-2xl"
            style={{ borderColor: `${accentColor}50` }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">verified</span>
                <h3 className="text-sm font-bold text-white">Tactical Intelligence Snapshot Saved</h3>
              </div>
              <button
                onClick={() => setSnapshotTaken(null)}
                className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="rounded-xl border border-white/10 p-4 bg-black/50 space-y-2 font-mono text-xs">
              <p className="text-emerald-400 font-bold">SNAPSHOT ID: {snapshotTaken.id}</p>
              <p className="text-slate-300">CAMERA: {snapshotTaken.name} ({snapshotTaken.camCode})</p>
              <p className="text-slate-300">LOCATION: {snapshotTaken.location}</p>
              <p className="text-slate-300">COORDINATES: {snapshotTaken.gps}</p>
              <p className="text-slate-300">TIMESTAMP: {snapshotTaken.time}</p>
              <p className="text-slate-300">SENSOR MODE: {snapshotTaken.shader}</p>
              <p className="text-[10px] text-on-surface-variant pt-2">
                Digital fingerprint signed and stored in {partnerName} Incident Audit Vault.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSnapshotTaken(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Snapshot ${snapshotTaken.id} exported to PDF / Evidence dossier.`);
                  setSnapshotTaken(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5"
                style={{ backgroundColor: accentColor }}
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GOD'S EYE VIEW OPEN SOURCE INTEGRATION MODAL ── */}
      {godsEyeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-2xl rounded-3xl border p-6 bg-slate-950 space-y-5 shadow-2xl"
            style={{ borderColor: `${accentColor}50` }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40`, color: accentColor }}
                >
                  <span className="material-symbols-outlined">public</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">God&apos;s Eye View Spatial Intelligence</h3>
                  <p className="text-xs text-on-surface-variant">
                    Integrated with <a href="https://github.com/uhrichsam4/gods-eye-view" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">uhrichsam4/gods-eye-view</a> & bilawalsidhu/gods-eye-view
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGodsEyeModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>SafeLink</strong> integrates the architecture of <strong>God&apos;s Eye View</strong> to provide security operations centers with unified 3D spatial intelligence. By combining private perimeter cameras, municipal traffic feeds, and satellite/ADS-B telemetry onto an interactive Cesium globe, dispatchers can view incidents from any vantage point.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-emerald-400 font-bold block">🌐 Photorealistic 3D Tiles</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Google 3D terrain and building meshes give realistic line-of-sight analysis for rooftop and gatehouse cameras.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-amber-400 font-bold block">🛰️ ADS-B & AIS Tracking</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Live flight tracking and tactical escort helicopter monitoring seamlessly integrated into the mission HUD.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-purple-400 font-bold block">⚡ GLSL Sensor Shaders</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Hardware-accelerated post-processing for FLIR Ironbow thermal, NVG green phosphor, and CRT monitor simulations.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-blue-400 font-bold block">🤖 AI Spatial Detection</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Real-time bounding box annotations, license plate recognition, and tripwire trigger alarms.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <a
                href="https://github.com/uhrichsam4/gods-eye-view"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                <span>View GitHub Repository</span>
              </a>
              <button
                onClick={() => setGodsEyeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                style={{ backgroundColor: accentColor }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── INDIVIDUAL CAMERA FEED CARD COMPONENT WITH ANIMATED SIMULATION CANVAS ──
function CameraFeedCard({
  cam,
  activeShader,
  shaderStyle,
  aiMeshEnabled,
  accentColor,
  buttonBgColor,
  timecode,
  isLarge = false,
  ptzOffset = { panOffset: 0, tiltOffset: 0, zoom: 1.0 },
  onSelect,
  onDispatch,
  onSnapshot,
}) {
  const canvasRef = useRef(null);

  // Animated canvas simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Clear background
      ctx.fillStyle = '#060a10';
      ctx.fillRect(0, 0, w, h);

      // Base Scene Rendering depending on cam.sceneType
      drawScene(ctx, w, h, cam.sceneType, frame, ptzOffset);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [cam.sceneType, ptzOffset]);

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all shadow-xl relative group flex flex-col ${
        isLarge ? 'h-[440px] sm:h-[520px]' : 'h-[280px] sm:h-[320px]'
      }`}
      style={{
        backgroundColor: `${buttonBgColor}CC`,
        borderColor: `${accentColor}30`,
      }}
    >
      {/* Feed Canvas Container with Shaders Applied */}
      <div className="relative w-full flex-1 overflow-hidden bg-black select-none cursor-pointer" onClick={onSelect}>
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{
            ...shaderStyle,
            transform: `scale(${ptzOffset.zoom || 1}) translate(${ptzOffset.panOffset || 0}px, ${ptzOffset.tiltOffset || 0}px)`,
          }}
        />

        {/* Scanlines Overlay for CRT mode */}
        {activeShader === 'CRT' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)',
            }}
          />
        )}

        {/* NVG Vignette Overlay for Night Vision mode */}
        {activeShader === 'NVG' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-60 mix-blend-multiply"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,20,5,0.95) 100%)',
            }}
          />
        )}

        {/* FLIR Color Scale Indicator when Thermal is Active */}
        {activeShader === 'FLIR' && (
          <div className="absolute top-12 right-3 pointer-events-none flex flex-col items-center gap-1 z-10 bg-black/60 p-1 rounded border border-white/20">
            <span className="text-[8px] font-mono text-white font-bold">HOT</span>
            <div
              className="w-2.5 h-16 rounded-sm border border-white/40"
              style={{
                background: 'linear-gradient(to bottom, #ffffff, #ffff00, #ff0000, #800080, #000080, #000000)',
              }}
            />
            <span className="text-[8px] font-mono text-white font-bold">COLD</span>
          </div>
        )}

        {/* ── TOP HUD TELEMETRY OVERLAY ── */}
        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/70 text-emerald-400 font-black border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {cam.code}
            </span>
            <span className="px-2 py-0.5 rounded bg-black/70 text-slate-300 font-bold border border-white/10 hidden sm:inline">
              {cam.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] border border-white/10">
              {cam.fps} FPS • {cam.bitrate}
            </span>
            <span className="px-2 py-0.5 rounded bg-red-600/80 text-white font-bold uppercase tracking-wider text-[9px] animate-pulse">
              ● REC
            </span>
          </div>
        </div>

        {/* ── AI MESH BOUNDING BOXES (IF ENABLED) ── */}
        {aiMeshEnabled && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {cam.detections?.map((det) => (
              <div
                key={det.id}
                className="absolute border-2 transition-all animate-pulse"
                style={{
                  left: `${det.box.x}%`,
                  top: `${det.box.y}%`,
                  width: `${det.box.w}%`,
                  height: `${det.box.h}%`,
                  borderColor: det.color,
                  backgroundColor: `${det.color}15`,
                }}
              >
                {/* Tactical Corner brackets */}
                <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: det.color }} />
                <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: det.color }} />
                <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: det.color }} />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: det.color }} />

                {/* Box Tag */}
                <div
                  className="absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-sm text-black"
                  style={{ backgroundColor: det.color }}
                >
                  {det.label}
                </div>

                {/* Box Subtitle */}
                {isLarge && det.detail && (
                  <div className="absolute -bottom-5 left-0 px-1.5 py-0.2 rounded text-[8px] font-mono font-semibold whitespace-nowrap bg-black/80 text-slate-200 border border-white/20">
                    {det.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── BOTTOM HUD TELEMETRY OVERLAY ── */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono pointer-events-none z-10 text-slate-300">
          <div className="bg-black/75 px-2 py-0.5 rounded border border-white/10 flex items-center gap-2">
            <span>{timecode || '2026-09-16 06:30:00.000'}</span>
            <span className="hidden sm:inline text-slate-400">| {cam.gps}</span>
          </div>

          <div className="bg-black/75 px-2 py-0.5 rounded border border-white/10 hidden sm:block">
            <span>AZ: {cam.azimuth + (ptzOffset.panOffset || 0)}° • EL: {cam.elevation + (ptzOffset.tiltOffset || 0)}°</span>
          </div>
        </div>
      </div>

      {/* ── CARD FOOTER WITH NAME & INSTANT ACTIONS ── */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between bg-black/30 gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white truncate">{cam.name}</h4>
          <p className="text-[10px] text-on-surface-variant font-mono truncate">{cam.location}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onSnapshot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnapshot();
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95"
              title="Capture Intel Snapshot"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          )}

          {onDispatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDispatch();
              }}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-500/40 transition-all active:scale-95 flex items-center gap-1"
              title="Dispatch Nearest Armed Response Unit"
            >
              <span className="material-symbols-outlined text-xs">local_police</span>
              <span className="hidden sm:inline">Dispatch</span>
            </button>
          )}

          {onSelect && !isLarge && (
            <button
              onClick={onSelect}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95"
              title="Expand Camera Feed"
            >
              <span className="material-symbols-outlined text-sm">open_in_full</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HIGH-PERFORMANCE CANVAS RENDERER FOR SECURITY SCENES ──
function drawScene(ctx, w, h, sceneType, frame, ptz) {
  // Common tactical grid background
  ctx.save();

  switch (sceneType) {
    case 'gate': {
      // Sandhurst Estate Gate Simulation
      // Sky & Horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      skyGrad.addColorStop(0, '#040812');
      skyGrad.addColorStop(1, '#0d1828');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.5);

      // Distant Estate Trees & Perimeter Wall
      ctx.fillStyle = '#08121f';
      ctx.fillRect(0, h * 0.42, w, h * 0.12);

      // Asphalt Road
      const roadGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
      roadGrad.addColorStop(0, '#151d27');
      roadGrad.addColorStop(1, '#0b0f15');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);

      // Road markings (perspective lines)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5);
      ctx.lineTo(w * 0.2, h);
      ctx.moveTo(w * 0.5, h * 0.5);
      ctx.lineTo(w * 0.8, h);
      ctx.stroke();

      // Guardhouse booth
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.1, h * 0.35, w * 0.18, h * 0.35);
      // Guardhouse window with amber light
      ctx.fillStyle = '#fef08a18';
      ctx.fillRect(w * 0.12, h * 0.38, w * 0.14, h * 0.15);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.12, h * 0.38, w * 0.14, h * 0.15);

      // Moving Vehicle (White Toyota Hilux) approaching
      const carProgress = (frame * 0.8) % (w * 0.8);
      const carX = w * 0.3 + (carProgress * 0.2);
      const carY = h * 0.55 + (carProgress * 0.12);
      const carW = 90;
      const carH = 45;

      // Headlight beams on asphalt
      const beamGrad = ctx.createRadialGradient(carX + carW * 0.8, carY + carH * 0.7, 5, carX + carW * 1.5, carY + carH * 0.7, 80);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(carX + carW, carY + carH * 0.4);
      ctx.lineTo(carX + carW + 120, carY + carH * 0.1);
      ctx.lineTo(carX + carW + 120, carY + carH * 1.1);
      ctx.closePath();
      ctx.fill();

      // Car body
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(carX, carY, carW, carH);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(carX + 15, carY + 8, carW - 30, carH - 20); // cabin glass
      // Wheels
      ctx.fillStyle = '#000';
      ctx.fillRect(carX + 12, carY + carH - 4, 18, 10);
      ctx.fillRect(carX + carW - 30, carY + carH - 4, 18, 10);

      // Boom gate arm
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, h * 0.56);
      ctx.lineTo(w * 0.65, h * 0.56);
      ctx.stroke();

      // Patrolling officer silhouette
      const guardOsc = Math.sin(frame * 0.05) * 12;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(w * 0.22 + guardOsc, h * 0.52, 10, 26); // guard body
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(w * 0.22 + guardOsc + 5, h * 0.50, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'perimeter': {
      // Clifton Ridge VIP North Perimeter (Thermal & Tripwire)
      // Night fence line
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, w, h);

      // High security mesh fence
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, h * 0.2);
        ctx.lineTo(x, h * 0.85);
        ctx.stroke();
      }
      for (let y = h * 0.2; y < h * 0.85; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Concrete perimeter base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

      // Glowing active Infrared Beam pulse
      const pulseAlpha = 0.5 + Math.sin(frame * 0.1) * 0.3;
      ctx.strokeStyle = `rgba(72, 187, 120, ${pulseAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#48bb78';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w, h * 0.65);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Electric fence top strands
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const strandY = h * 0.22 + (i * 12);
        ctx.beginPath();
        ctx.moveTo(0, strandY);
        ctx.lineTo(w, strandY);
        ctx.stroke();
      }
      break;
    }

    case 'vault': {
      // Sandton CBD Commercial Vault holding bay
      ctx.fillStyle = '#080d14';
      ctx.fillRect(0, 0, w, h);

      // Grid floor perspective
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = h * 0.4; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Reinforced Vault Door at rear
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.72, h * 0.22, w * 0.22, h * 0.55);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.72, h * 0.22, w * 0.22, h * 0.55);

      // Heavy Armoured Response Van parked in bay
      const vanX = w * 0.25;
      const vanY = h * 0.42;
      ctx.fillStyle = '#334155';
      ctx.fillRect(vanX, vanY, 140, 70); // body
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(vanX + 15, vanY + 30, 110, 8); // Gold Sovereign stripe
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(vanX + 110, vanY + 12, 25, 20); // windshield
      break;
    }

    case 'traffic': {
      // William Nicol & Bryanston Public Traffic Mesh
      // Road surface
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Lane dividers
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 20]);
      ctx.beginPath();
      ctx.moveTo(w * 0.33, 0);
      ctx.lineTo(w * 0.33, h);
      ctx.moveTo(w * 0.66, 0);
      ctx.lineTo(w * 0.66, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Moving traffic cars
      const car1Y = (frame * 3.5) % (h + 80) - 40;
      const car2Y = (h + 40) - ((frame * 2.8) % (h + 80));
      const car3Y = (frame * 2.2 + 100) % (h + 80) - 40;

      // Lane 1 car
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(w * 0.15, car1Y, 35, 55);
      // Lane 2 car (Southbound)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(w * 0.48, car2Y, 38, 62);
      // Lane 3 car
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(w * 0.78, car3Y, 34, 52);
      break;
    }

    case 'helipad': {
      // Inanda Polo Club — Helipad & Apron
      ctx.fillStyle = '#09111e';
      ctx.fillRect(0, 0, w, h);

      // Helipad Outer Circle
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 75, 0, Math.PI * 2);
      ctx.stroke();

      // Helipad Letter "H"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', w * 0.5, h * 0.5);

      // Green perimeter boundary lights
      const lightPulse = Math.sin(frame * 0.1) > 0;
      ctx.fillStyle = lightPulse ? '#22c55e' : '#15803d';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const lx = w * 0.5 + Math.cos(a) * 95;
        const ly = h * 0.5 + Math.sin(a) * 95;
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'highway':
    default: {
      // N1 Rivonia Highway Surveillance Corridor
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Multi-lane Highway perspective
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(w * 0.45, 0);
      ctx.lineTo(w * 0.55, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Moving convoy
      const convoyY = (frame * 2.5) % (h * 0.8) + (h * 0.2);
      const convoyW = 50 + (convoyY / h) * 60;
      const convoyH = 30 + (convoyY / h) * 35;
      const convoyX = (w * 0.5) - (convoyW * 0.5);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(convoyX, convoyY, convoyW, convoyH);
      ctx.fillStyle = '#ef4444'; // taillights
      ctx.fillRect(convoyX + 4, convoyY + convoyH - 4, 10, 4);
      ctx.fillRect(convoyX + convoyW - 14, convoyY + convoyH - 4, 10, 4);
      break;
    }
  }

  // Camera Crosshair / Reticle in center
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - 15, h * 0.5);
  ctx.lineTo(w * 0.5 + 15, h * 0.5);
  ctx.moveTo(w * 0.5, h * 0.5 - 15);
  ctx.lineTo(w * 0.5, h * 0.5 + 15);
  ctx.stroke();

  ctx.restore();
}
