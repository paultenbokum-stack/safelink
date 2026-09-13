'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export const SA_ACCOUNTING_PACKAGES = [
  {
    id: 'sage',
    name: 'Sage Business Cloud / Pastel Evolution',
    shortName: 'Sage Pastel',
    desc: 'Dominant ERP for South African armed response & security firms',
    badge: 'SA Standard',
    icon: 'account_balance',
    keyPlaceholder: 'e.g. sage_live_key_99812948a9e',
    companyPlaceholder: 'e.g. ZA-PASTEL-0014',
  },
  {
    id: 'zoho',
    name: 'Zoho Books API',
    shortName: 'Zoho Books',
    desc: 'Cloud invoicing with automated recurring billing, webhooks & payment links',
    badge: 'Fast Setup',
    icon: 'payments',
    keyPlaceholder: 'e.g. 1000.89a8f237ba429c91...',
    companyPlaceholder: 'e.g. 700192841 (Organization ID)',
  },
  {
    id: 'xero',
    name: 'Xero Accounting',
    shortName: 'Xero',
    desc: 'Popular cloud platform with deep bank feeds, automated reconciliation & invoicing',
    badge: 'Cloud Sync',
    icon: 'sync_alt',
    keyPlaceholder: 'e.g. xero_oauth2_bearer_token...',
    companyPlaceholder: 'e.g. 29a8f20b-1182-4192-88...',
  },
  {
    id: 'quickbooks',
    name: 'Intuit QuickBooks Online',
    shortName: 'QuickBooks',
    desc: 'Standard business bookkeeping, automated receipts & client invoicing',
    badge: 'Enterprise',
    icon: 'calculate',
    keyPlaceholder: 'e.g. qbo_access_token_8812...',
    companyPlaceholder: 'e.g. 91303512941 (Realm ID)',
  },
  {
    id: 'listener',
    name: 'Listener Security Control Room ERP',
    shortName: 'Listener ERP',
    desc: 'South African specialized control room monitoring & dispatch billing platform',
    badge: 'Security Specific',
    icon: 'shield',
    keyPlaceholder: 'e.g. listener_sec_api_v4_token',
    companyPlaceholder: 'e.g. LST-HQ-JHB-01',
  },
  {
    id: 'patriot',
    name: 'Patriot Alarm Monitoring & Billing',
    shortName: 'Patriot Systems',
    desc: 'Global central station alarm monitoring and automated subscriber billing',
    badge: 'Central Station',
    icon: 'emergency',
    keyPlaceholder: 'e.g. patriot_rest_client_secret',
    companyPlaceholder: 'e.g. PTR-ZONE-ZA-4',
  },
  {
    id: 'custom_api',
    name: 'Custom Webhook / REST API',
    shortName: 'Custom API',
    desc: 'Direct webhook or REST integration with your proprietary client database',
    badge: 'Custom',
    icon: 'code',
    keyPlaceholder: 'e.g. Bearer your_custom_auth_token',
    companyPlaceholder: 'e.g. https://api.yourcompany.co.za/clients',
  },
];

export const SA_CAMERA_BRANDS = [
  { id: 'Hikvision', name: 'Hikvision (ISAPI / RTSP / Hik-Partner Pro)', defaultPort: 554, protocol: 'RTSP (H.264/H.265)' },
  { id: 'Dahua', name: 'Dahua Technology (DSS / ONVIF / DoLynk Cloud)', defaultPort: 37777, protocol: 'ONVIF / DSS' },
  { id: 'EZVIZ', name: 'EZVIZ (Open Platform Cloud API)', defaultPort: 443, protocol: 'HTTPS Cloud API' },
  { id: 'Uniview', name: 'Uniview UNV (EZCloud / RTSP)', defaultPort: 554, protocol: 'RTSP / EZCloud' },
  { id: 'Axis', name: 'Axis Communications (VAPIX / RTSP)', defaultPort: 554, protocol: 'VAPIX / RTSP' },
  { id: 'Provision-ISR', name: 'Provision-ISR (Cam2 / RTSP)', defaultPort: 554, protocol: 'RTSP / Cam2' },
  { id: 'Milesight', name: 'Milesight IoT (M-VMS / RTSP)', defaultPort: 554, protocol: 'RTSP / M-VMS' },
  { id: 'Generic RTSP', name: 'Generic ONVIF Profile S / RTSP', defaultPort: 554, protocol: 'RTSP Stream' },
];

export default function ControlRoomPage() {
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' | 'cameras' | 'aura' | 'fleet' | 'accounting'
  const [companyId, setCompanyId] = useState('safelink_default');
  const [company, setCompany] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingAura, setTestingAura] = useState(false);

  // Accounting Package State
  const [savingAccounting, setSavingAccounting] = useState(false);
  const [testingAccounting, setTestingAccounting] = useState(false);
  const [accountingTestResult, setAccountingTestResult] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Camera System Integration State
  const [savingCameraSystem, setSavingCameraSystem] = useState(false);

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
  const fetchData = useCallback(async () => {
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
  }, [companyId]);

  useEffect(() => {
    const initial = setTimeout(fetchData, 0);
    const interval = setInterval(fetchData, 15000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [fetchData]);

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

  // Save Accounting Settings
  const handleSaveAccounting = async (e) => {
    e.preventDefault();
    setSavingAccounting(true);
    try {
      const res = await fetch('/api/control-room/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          accounting: company?.accounting,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Accounting & ERP credentials saved successfully.');
      }
    } catch (e) {
      alert('Failed to save accounting settings.');
    } finally {
      setSavingAccounting(false);
    }
  };

  // Test Accounting Connection
  const handleTestAccounting = async () => {
    setTestingAccounting(true);
    setAccountingTestResult(null);
    try {
      const res = await fetch('/api/control-room/accounting-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          provider: company?.accounting?.provider || 'sage',
          apiKey: company?.accounting?.apiKey,
          clientId: company?.accounting?.clientId,
          companyIdParam: company?.accounting?.companyId,
          environment: company?.accounting?.environment || 'production',
          endpoint: company?.accounting?.endpoint,
        }),
      });
      const data = await res.json();
      setAccountingTestResult(data);
    } catch (e) {
      setAccountingTestResult({ success: false, error: e.message });
    } finally {
      setTestingAccounting(false);
    }
  };

  // Save Camera System Integration Settings
  const handleSaveCameraSystem = async (e) => {
    e.preventDefault();
    setSavingCameraSystem(true);
    try {
      const res = await fetch('/api/control-room/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          cameraSystem: company?.cameraSystem,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Camera system integration settings saved successfully.');
      }
    } catch (e) {
      alert('Failed to save camera system settings.');
    } finally {
      setSavingCameraSystem(false);
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
                <option value="safelink_default">SafeLink Default Network</option>
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

        <button
          onClick={() => setActiveTab('accounting')}
          className={`py-3.5 border-b-2 font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'accounting'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">receipt_long</span>
          Accounting & ERP
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary/15 text-secondary border border-secondary/30">
            {company?.accounting?.provider
              ? (SA_ACCOUNTING_PACKAGES.find((p) => p.id === company.accounting.provider)?.shortName || company.accounting.provider).toUpperCase()
              : 'SAGE PASTEL'}
          </span>
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
            {/* Primary Camera Engine & Gateway Settings */}
            <div className="bg-[#091724] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary border border-secondary/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">videocam</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Control Room Camera Ecosystem
                      <span className="text-[10px] bg-[#38a169]/20 text-[#38a169] border border-[#38a169]/30 px-2 py-0.5 rounded font-bold uppercase">
                        {company?.cameraSystem?.status || 'CONNECTED'}
                      </span>
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Configure your primary surveillance hardware brand, cloud gateway API keys, and local NVR bridge.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCameraSystem}
                  disabled={savingCameraSystem}
                  className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">{savingCameraSystem ? 'hourglass_top' : 'save'}</span>
                  {savingCameraSystem ? 'Saving...' : 'Save Camera Settings'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Primary System Brand (SA Standard)
                  </label>
                  <select
                    value={company?.cameraSystem?.defaultBrand || 'Hikvision'}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        cameraSystem: { ...company?.cameraSystem, defaultBrand: e.target.value },
                      })
                    }
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none cursor-pointer"
                  >
                    {SA_CAMERA_BRANDS.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Cloud Partner API Key / Token
                  </label>
                  <input
                    type="password"
                    value={company?.cameraSystem?.cloudApiKey || ''}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        cameraSystem: { ...company?.cameraSystem, cloudApiKey: e.target.value },
                      })
                    }
                    placeholder="e.g. hik_partner_pro_key_••••••••"
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    RTSP / WebRTC Gateway Bridge
                  </label>
                  <input
                    type="text"
                    value={company?.cameraSystem?.gatewayUrl || 'rtsp-gateway.safelink.co.za:8554'}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        cameraSystem: { ...company?.cameraSystem, gatewayUrl: e.target.value },
                      })
                    }
                    placeholder="e.g. gateway.local:8554"
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Community & Substation Camera Feeds</h2>
                <p className="text-xs text-on-surface-variant">Live surveillance streams for Hikvision, Dahua, EZVIZ, and ONVIF IP cameras.</p>
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
                  <h4 className="font-bold text-white">Supported SA Camera Standards</h4>
                  <p className="text-on-surface-variant">Hikvision ISAPI (Port 554), Dahua DSS / ONVIF (Port 37777), EZVIZ Open Cloud, Uniview UNV, Axis, Provision-ISR, Milesight</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">Hikvision</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">Dahua</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">EZVIZ</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">Uniview</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">Axis</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white font-semibold">Provision-ISR</span>
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

        {/* ── TAB 5: ACCOUNTING & ERP PACKAGES ── */}
        {activeTab === 'accounting' && (
          <div className="space-y-6">
            <div className="bg-[#091724] border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Accounting & ERP Billing Integration</h2>
                    <span className="text-[11px] bg-[#38a169]/15 text-[#38a169] font-bold px-2 py-0.5 rounded border border-[#38a169]/30 uppercase">
                      {company?.accounting?.status || 'CONFIGURED'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Connect your accounting software to synchronize subscriber accounts, authorize active Sentinel GPS tags, and issue recurring invoices.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Last Synced:</span>
                  <span className="text-xs font-mono text-secondary">
                    {company?.accounting?.lastSync ? new Date(company.accounting.lastSync).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Package Selector Cards */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-3">
                  Select Accounting Package / ERP System
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SA_ACCOUNTING_PACKAGES.map((pkg) => {
                    const isSelected = (company?.accounting?.provider || 'sage') === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() =>
                          setCompany({
                            ...company,
                            accounting: { ...company?.accounting, provider: pkg.id },
                          })
                        }
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-secondary/15 border-secondary text-white shadow-lg ring-1 ring-secondary/50'
                            : 'bg-[#05101a] border-white/10 text-on-surface hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-secondary' : 'text-on-surface-variant'}`}>
                              {pkg.icon}
                            </span>
                            <h4 className="text-xs font-bold">{pkg.name}</h4>
                          </div>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-secondary text-black' : 'bg-white/5 text-on-surface-variant'
                          }`}>
                            {pkg.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          {pkg.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accounting Credentials Form */}
              <form onSubmit={handleSaveAccounting} className="space-y-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Environment Mode
                    </label>
                    <select
                      value={company?.accounting?.environment || 'production'}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          accounting: { ...company?.accounting, environment: e.target.value },
                        })
                      }
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none cursor-pointer"
                    >
                      <option value="production">Production (Live Invoicing)</option>
                      <option value="sandbox">Sandbox / Staging Testing</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Company ID / Branch Code / Realm ID
                    </label>
                    <input
                      type="text"
                      value={company?.accounting?.companyId || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          accounting: { ...company?.accounting, companyId: e.target.value },
                        })
                      }
                      placeholder={
                        SA_ACCOUNTING_PACKAGES.find((p) => p.id === (company?.accounting?.provider || 'sage'))?.companyPlaceholder ||
                        'e.g. ZA-SEC-001'
                      }
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-on-surface-variant uppercase tracking-wider block">
                        API Key / Access Token
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[11px] text-secondary hover:underline cursor-pointer"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={company?.accounting?.apiKey || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          accounting: { ...company?.accounting, apiKey: e.target.value },
                        })
                      }
                      placeholder={
                        SA_ACCOUNTING_PACKAGES.find((p) => p.id === (company?.accounting?.provider || 'sage'))?.keyPlaceholder ||
                        'e.g. your_api_key_••••••••'
                      }
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Custom Webhook / REST Endpoint (Optional)
                    </label>
                    <input
                      type="text"
                      value={company?.accounting?.endpoint || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          accounting: { ...company?.accounting, endpoint: e.target.value },
                        })
                      }
                      placeholder="https://api.yourcompany.co.za/clients/webhook"
                      className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-secondary focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between p-3.5 bg-[#05101a] rounded-xl border border-white/10 text-xs">
                  <div>
                    <h5 className="font-bold text-white">Automated Subscriber Sync</h5>
                    <p className="text-on-surface-variant text-[11px]">
                      Automatically poll and verify active paying clients every 6 hours to authorize Sentinel tracking beacons.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={company?.accounting?.autoSyncClients ?? true}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        accounting: { ...company?.accounting, autoSyncClients: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-secondary cursor-pointer"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingAccounting}
                    className="bg-secondary hover:bg-secondary/90 text-on-secondary px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">{savingAccounting ? 'hourglass_top' : 'save'}</span>
                    {savingAccounting ? 'Saving...' : 'Save Accounting Credentials'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestAccounting}
                    disabled={testingAccounting}
                    className="bg-white/10 hover:bg-white/15 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">wifi_tethering</span>
                    {testingAccounting ? 'Testing Connection & Sync...' : 'Test Connection & Sync Clients'}
                  </button>
                </div>
              </form>

              {/* Diagnostic Test Result */}
              {accountingTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                    accountingTestResult.success
                      ? 'bg-[#38a169]/10 border-[#38a169]/40 text-[#38a169]'
                      : 'bg-[#e53e3e]/10 border-[#e53e3e]/40 text-[#ffb3ad]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-base">
                      {accountingTestResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span>{accountingTestResult.success ? 'Accounting Integration Verified' : 'Connection Test Failed'}</span>
                  </div>
                  <p>{accountingTestResult.message || accountingTestResult.error}</p>
                  {accountingTestResult.latencyMs && (
                    <p className="text-[11px] text-on-surface-variant font-mono">
                      Provider: {accountingTestResult.provider} • Mode: {accountingTestResult.environment} • Latency: {accountingTestResult.latencyMs}ms • Active Clients Synced: {accountingTestResult.clientCount}
                    </p>
                  )}
                </div>
              )}
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
                  <label className="font-bold text-on-surface-variant block mb-1">Brand / System (SA Standards)</label>
                  <select
                    value={newCam.brand}
                    onChange={(e) => {
                      const brandName = e.target.value;
                      const matched = SA_CAMERA_BRANDS.find((b) => b.id === brandName);
                      setNewCam({
                        ...newCam,
                        brand: brandName,
                        port: matched ? matched.defaultPort : 554,
                      });
                    }}
                    className="w-full bg-[#05101a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    {SA_CAMERA_BRANDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
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
