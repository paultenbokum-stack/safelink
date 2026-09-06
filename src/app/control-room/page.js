'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ControlRoomPage() {
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' | 'cameras' | 'aura' | 'fleet'
  const [companyId, setCompanyId] = useState('help24_security');
  const [company, setCompany] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingAura, setTestingAura] = useState(false);

  // New Camera Form Modal State
  const [showAddCamModal, setShowAddCamModal] = useState(false);
  const [newCam, setNewCam] = useState({
    name: '',
    brand: 'Hikvision',
    ipOrHost: '',
    port: 554,
    channel: 1,
    streamUrl: '',
    apiKey: '',
  });

  // Fetch company settings & incidents
  const fetchData = async () => {
    try {
      const [compRes, incRes] = await Promise.all([
        fetch(`/api/control-room/company?companyId=${companyId}`),
        fetch(`/api/control-room/incidents?companyId=${companyId}`),
      ]);
      const compData = await compRes.json();
      const incData = await incRes.json();
      setCompany(compData.company || null);
      setIncidents(incData.incidents || []);
    } catch (e) {
      console.error('Error loading control room data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [companyId]);

  // Toggle Aura Integration
  const handleToggleAura = async () => {
    if (!company) return;
    const newStatus = !company.aura?.enabled;
    const updatedCompany = {
      ...company,
      aura: {
        ...company.aura,
        enabled: newStatus,
      },
    };
    setCompany(updatedCompany);

    try {
      await fetch('/api/control-room/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          aura: updatedCompany.aura,
        }),
      });
    } catch (e) {
      console.error('Error saving Aura toggle:', e);
    }
  };

  // Save Aura API Settings
  const handleSaveAuraSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/control-room/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          aura: company.aura,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Aura integration credentials saved successfully.');
      }
    } catch (e) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Test Aura Connection
  const handleTestAura = async () => {
    setTestingAura(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/control-room/aura-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          clientId: company.aura?.clientId,
          clientSecret: company.aura?.clientSecret,
          environment: company.aura?.environment,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ success: false, error: e.message });
    } finally {
      setTestingAura(false);
    }
  };

  // Add Camera Handler
  const handleAddCamera = async (e) => {
    e.preventDefault();
    if (!newCam.name.trim()) return;

    const cameraItem = {
      id: `cam_${Date.now()}`,
      name: newCam.name.trim(),
      brand: newCam.brand,
      ipOrHost: newCam.ipOrHost.trim(),
      port: parseInt(newCam.port) || 554,
      channel: parseInt(newCam.channel) || 1,
      streamUrl: newCam.streamUrl.trim() || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      apiKey: newCam.apiKey.trim(),
      status: 'online',
    };

    const updatedCameras = [...(company.cameras || []), cameraItem];
    setCompany({ ...company, cameras: updatedCameras });
    setShowAddCamModal(false);
    setNewCam({ name: '', brand: 'Hikvision', ipOrHost: '', port: 554, channel: 1, streamUrl: '', apiKey: '' });

    try {
      await fetch('/api/control-room/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          cameras: updatedCameras,
        }),
      });
    } catch (e) {
      console.error('Error saving camera:', e);
    }
  };

  // Delete Camera
  const handleDeleteCamera = async (camId) => {
    if (!confirm('Remove this camera feed?')) return;
    const updatedCameras = (company.cameras || []).filter((c) => c.id !== camId);
    setCompany({ ...company, cameras: updatedCameras });

    try {
      await fetch('/api/control-room/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          cameras: updatedCameras,
        }),
      });
    } catch (e) {
      console.error('Error removing camera:', e);
    }
  };

  // Update Incident Status
  const handleUpdateIncident = async (incidentId, status) => {
    try {
      await fetch('/api/control-room/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, status }),
      });
      fetchData();
    } catch (e) {
      console.error('Error updating incident:', e);
    }
  };

  return (
    <div className="bg-[#040d16] text-on-background min-h-screen flex flex-col font-sans selection:bg-secondary/30 selection:text-secondary">
      {/* Control Room Top Banner */}
      <header className="bg-[#07131f] border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#e53e3e]/20 border border-[#e53e3e]/40 flex items-center justify-center text-[#e53e3e]">
            <span className="material-symbols-outlined text-2xl font-bold">shield</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-lg font-bold text-white tracking-wide">
                SafeLink Control Room
              </h1>
              <span className="text-[10px] uppercase font-bold bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded">
                BETA Live Command
              </span>
            </div>
            <p className="text-xs text-on-surface-variant flex items-center gap-2">
              <span>Tenant:</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="bg-[#0c1c2b] text-white border border-white/20 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none focus:border-secondary cursor-pointer"
              >
                <option value="help24_security">Help24 Security Command</option>
                <option value="global_security">Global Security Consulting</option>
                <option value="fidelity_adt">Fidelity ADT Dispatch</option>
              </select>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Aura Global Status Pill */}
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            company?.aura?.enabled
              ? 'bg-[#38a169]/15 border-[#38a169]/40 text-[#38a169]'
              : 'bg-white/5 border-white/15 text-on-surface-variant'
          }`}>
            <span className={`w-2 h-2 rounded-full ${company?.aura?.enabled ? 'bg-[#38a169] animate-pulse' : 'bg-gray-500'}`} />
            <span>Aura Dispatch: {company?.aura?.enabled ? 'ACTIVE' : 'OFFLINE / INTERNAL'}</span>
          </div>

          <Link
            href="/cream"
            className="px-3 py-1.5 rounded-xl bg-purple-900/30 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            CREAM Master
          </Link>

          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant hover:text-white hover:bg-white/10 text-xs font-semibold transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            App
          </Link>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#07131f]/60 border-b border-white/10 px-6 flex gap-6 text-sm">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`py-3.5 border-b-2 font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'incidents'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">emergency</span>
          Live Incident Triage
          {incidents.filter((i) => i.status === 'dispatching' || i.status === 'dispatched').length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#e53e3e] text-white text-[11px] font-bold flex items-center justify-center animate-pulse">
              {incidents.filter((i) => i.status === 'dispatching' || i.status === 'dispatched').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cameras')}
          className={`py-3.5 border-b-2 font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'cameras'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">videocam</span>
          Community Cameras ({company?.cameras?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('aura')}
          className={`py-3.5 border-b-2 font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'aura'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">settings_remote</span>
          Aura Dispatch Integration
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`py-3.5 border-b-2 font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'fleet'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">local_police</span>
          Patrol Fleet & Geofences
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ── TAB 1: INCIDENTS TRIAGE ── */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Active Emergency Dispatch Queue</h2>
                <p className="text-xs text-on-surface-variant">Real-time incoming SOS alerts, GPS coordinates, and response unit routing.</p>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-on-surface flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh Feed
              </button>
            </div>

            {incidents.length === 0 ? (
              <div className="bg-[#091724] border border-white/10 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#38a169]/10 border border-[#38a169]/30 text-[#38a169] flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <h3 className="text-sm font-bold text-white">All Clear • No Active Incidents</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Emergency signals from the PWA SOS button, Sentinel hardware panic tags, or geofence breaches will appear here instantly with live telemetry.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`bg-[#091724] border rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden ${
                      inc.status === 'dispatching' || inc.status === 'dispatched'
                        ? 'border-[#e53e3e]/50 ring-1 ring-[#e53e3e]/30'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Status Pill */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          inc.type === 'medical' ? 'bg-[#ffb3ad]/20 text-[#ffb3ad]' : 'bg-[#e53e3e]/20 text-[#e53e3e]'
                        }`}>
                          <span className="material-symbols-outlined text-xl">
                            {inc.type === 'medical' ? 'medical_services' : 'emergency'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white capitalize">
                            {inc.type?.replace('_', ' ')} Incident
                          </h4>
                          <p className="text-[11px] text-on-surface-variant">
                            {inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString() : 'Just now'} • Ref #{inc.id.substring(0, 7)}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        inc.status === 'resolved'
                          ? 'bg-[#38a169]/15 text-[#38a169] border-[#38a169]/30'
                          : inc.status === 'cancelled'
                          ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          : 'bg-[#e53e3e]/20 text-[#e53e3e] border-[#e53e3e]/40 animate-pulse'
                      }`}>
                        {inc.status}
                      </span>
                    </div>

                    {/* Caller Details & GPS */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#05101a] p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-on-surface-variant block text-[10px] uppercase font-semibold">Caller / Subscriber</span>
                        <span className="font-bold text-white">{inc.contactName || 'Member'}</span>
                        <span className="text-[11px] text-secondary block">{inc.contactPhone || 'No phone'}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block text-[10px] uppercase font-semibold">Coordinates</span>
                        <span className="font-mono text-white font-semibold">
                          {inc.lat ? `${inc.lat.toFixed(4)}, ${inc.lng?.toFixed(4)}` : 'GPS Acquired'}
                        </span>
                        <a
                          href={`https://maps.google.com/?q=${inc.lat},${inc.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-secondary hover:underline flex items-center gap-1 text-[10px] font-bold mt-0.5"
                        >
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          Open in Google Maps
                        </a>
                      </div>
                    </div>

                    {/* Aura Callout Metadata */}
                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">alt_route</span>
                        <span>Routing: <strong className="text-white">{inc.dispatchMethod || 'Aura v2'}</strong></span>
                      </div>
                      {inc.auraCalloutId && (
                        <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          Aura ID #{inc.auraCalloutId}
                        </span>
                      )}
                      <div>
                        <span>ETA: <strong className="text-secondary">{inc.eta || 'Calculating...'}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {inc.status !== 'resolved' && inc.status !== 'cancelled' ? (
                        <>
                          <button
                            onClick={() => handleUpdateIncident(inc.id, 'on_scene')}
                            className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Mark On Scene
                          </button>
                          <button
                            onClick={() => handleUpdateIncident(inc.id, 'resolved')}
                            className="flex-1 bg-[#38a169] hover:bg-[#38a169]/90 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleUpdateIncident(inc.id, 'cancelled')}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-on-surface-variant rounded-xl text-xs font-semibold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center text-xs text-on-surface-variant py-1">
                          Incident closed and archived in audit log.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: COMMUNITY CAMERAS ── */}
        {activeTab === 'cameras' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Community & Substation Camera Feeds</h2>
                <p className="text-xs text-on-surface-variant">Live surveillance streams for Hikvision, Dahua, and EZVIZ IP cameras.</p>
              </div>
              <button
                onClick={() => setShowAddCamModal(true)}
                className="bg-secondary hover:bg-secondary/90 text-on-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Community Camera
              </button>
            </div>

            {/* Camera Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(company?.cameras || []).map((cam) => (
                <div key={cam.id} className="bg-[#091724] border border-white/10 rounded-2xl overflow-hidden shadow-lg space-y-3">
                  {/* Stream Preview Container */}
                  <div className="relative aspect-video bg-black flex items-center justify-center group">
                    <video
                      src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white">
                      <span className="w-2 h-2 rounded-full bg-[#38a169] animate-ping" />
                      LIVE
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-secondary border border-secondary/30">
                      {cam.brand}
                    </div>
                  </div>

                  {/* Camera Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{cam.name}</h4>
                        <p className="text-xs text-on-surface-variant font-mono">
                          {cam.ipOrHost}:{cam.port} • CH {cam.channel}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCamera(cam.id)}
                        className="text-gray-500 hover:text-error transition-colors p-1 cursor-pointer"
                        title="Remove camera"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-on-surface-variant">
                      <span>Protocol: RTSP / WebRTC</span>
                      <span className="text-[#38a169] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">signal_cellular_alt</span>
                        Good
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Supported Brands Info Banner */}
            <div className="bg-[#091724] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-2xl">sensors</span>
                <div>
                  <h4 className="font-bold text-white">Supported Camera Standards</h4>
                  <p className="text-on-surface-variant">Hikvision ISAPI / RTSP (Port 554), Dahua DSS / ONVIF (Port 37777), EZVIZ Open Platform Cloud</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">Hikvision</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">Dahua</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">EZVIZ</span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: AURA INTEGRATION & API KEYS ── */}
        {activeTab === 'aura' && (
          <div className="space-y-6">
            <div className="bg-[#091724] border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Header & Master Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Aura SOS Panic API Integration</h2>
                    <span className="text-[11px] bg-secondary/15 text-secondary font-bold px-2 py-0.5 rounded border border-secondary/30">
                      v2 Spec
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Connect directly to the Aura nationwide armed response & medical dispatch network (docs.aurasos.com).
                  </p>
                </div>

                {/* Per-Company Toggle Switch */}
                <div className="flex items-center gap-3 bg-[#05101a] p-2.5 rounded-xl border border-white/10">
                  <span className="text-xs font-bold text-white">Aura Integration:</span>
                  <button
                    onClick={handleToggleAura}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      company?.aura?.enabled ? 'bg-[#38a169]' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        company?.aura?.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold uppercase ${company?.aura?.enabled ? 'text-[#38a169]' : 'text-gray-400'}`}>
                    {company?.aura?.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Form Settings */}
              <form onSubmit={handleSaveAuraSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Environment
                    </label>
                    <select
                      value={company?.aura?.environment || 'staging'}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          aura: { ...company.aura, environment: e.target.value },
                        })
                      }
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-secondary focus:outline-none"
                    >
                      <option value="staging">Staging / Sandbox (staging-panic.aura.services)</option>
                      <option value="production">Production Live (panic.aura.services)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Aura Client ID
                    </label>
                    <input
                      type="text"
                      value={company?.aura?.clientId || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          aura: { ...company.aura, clientId: e.target.value },
                        })
                      }
                      placeholder="e.g. aura_client_991823"
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-secondary focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Aura Client Secret
                    </label>
                    <input
                      type="password"
                      value={company?.aura?.clientSecret || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          aura: { ...company.aura, clientSecret: e.target.value },
                        })
                      }
                      placeholder="Enter client secret"
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-secondary focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Default Customer ID (Sandbox Test)
                    </label>
                    <input
                      type="text"
                      value={company?.aura?.defaultCustomerId || '1'}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          aura: { ...company.aura, defaultCustomerId: e.target.value },
                        })
                      }
                      placeholder="1"
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-secondary focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-secondary hover:bg-secondary/90 text-on-secondary px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {saving ? 'Saving...' : 'Save Aura Credentials'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestAura}
                    disabled={testingAura}
                    className="bg-white/10 hover:bg-white/15 text-white border border-white/15 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">wifi_tethering</span>
                    {testingAura ? 'Testing OAuth Handshake...' : 'Test Aura Connection'}
                  </button>
                </div>
              </form>

              {/* Test Result Display */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1 ${
                    testResult.success
                      ? 'bg-[#38a169]/10 border-[#38a169]/40 text-[#38a169]'
                      : 'bg-[#e53e3e]/10 border-[#e53e3e]/40 text-[#ffb3ad]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-base">
                      {testResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span>{testResult.success ? 'Aura Handshake Verified' : 'Handshake Failed'}</span>
                  </div>
                  <p>{testResult.message || testResult.error}</p>
                  {testResult.latencyMs && (
                    <p className="text-[11px] text-on-surface-variant font-mono">
                      Target: {testResult.baseUrl} • Latency: {testResult.latencyMs}ms
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: PATROL FLEET & GEOFENCES ── */}
        {activeTab === 'fleet' && (
          <div className="bg-[#091724] border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Patrol Vehicle Telemetry & Tactical Grid</h2>
            <p className="text-xs text-on-surface-variant">Live positioning of armed response patrol vehicles and active estate perimeters.</p>
            <div className="aspect-[21/9] bg-[#05101a] border border-white/10 rounded-xl flex items-center justify-center text-center p-6 relative overflow-hidden">
              <div className="space-y-2">
                <span className="material-symbols-outlined text-4xl text-secondary animate-pulse">radar</span>
                <p className="text-sm font-bold text-white">Tactical Fleet Telemetry Active</p>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  Integrated with TrackSolid EMEA and Aura Responder Simulator. 3 Patrol units patrolling Johannesburg Sector 4.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Camera Modal */}
      {showAddCamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#091724] border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 text-on-surface shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Community Camera Feed</h3>
              <button
                onClick={() => setShowAddCamModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddCamera} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Camera Name / Location</label>
                <input
                  type="text"
                  value={newCam.name}
                  onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                  placeholder="e.g. Community Main Gate"
                  className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Brand / System</label>
                  <select
                    value={newCam.brand}
                    onChange={(e) => {
                      const brand = e.target.value;
                      const port = brand === 'Hikvision' ? 554 : brand === 'Dahua' ? 37777 : 443;
                      setNewCam({ ...newCam, brand, port });
                    }}
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary"
                  >
                    <option value="Hikvision">Hikvision</option>
                    <option value="Dahua">Dahua</option>
                    <option value="EZVIZ">EZVIZ</option>
                    <option value="Generic RTSP">Generic RTSP / ONVIF</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">IP Address / Host</label>
                  <input
                    type="text"
                    value={newCam.ipOrHost}
                    onChange={(e) => setNewCam({ ...newCam, ipOrHost: e.target.value })}
                    placeholder="196.25.1.10"
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Port</label>
                  <input
                    type="number"
                    value={newCam.port}
                    onChange={(e) => setNewCam({ ...newCam, port: e.target.value })}
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Channel</label>
                  <input
                    type="number"
                    value={newCam.channel}
                    onChange={(e) => setNewCam({ ...newCam, channel: e.target.value })}
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Live Stream URL (HLS / WebRTC / M3U8)</label>
                <input
                  type="text"
                  value={newCam.streamUrl}
                  onChange={(e) => setNewCam({ ...newCam, streamUrl: e.target.value })}
                  placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                  className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Save Camera Feed
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCamModal(false)}
                  className="px-4 bg-white/5 hover:bg-white/10 text-on-surface-variant rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
