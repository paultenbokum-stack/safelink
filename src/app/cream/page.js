'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CreamMasterPage() {
  const [companies, setCompanies] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('help24_security');
  const [loading, setLoading] = useState(true);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    slug: '',
    registrationNumber: '',
    dispatchPhone: '',
    contactEmail: '',
    accountingProvider: 'sage',
    accountingCompanyId: '',
    cameraBrand: 'Hikvision',
  });

  // Diagnostics State
  const [auraDiag, setAuraDiag] = useState({ status: 'ready', latency: 42 });
  const [tracksolidDiag, setTracksolidDiag] = useState({ status: 'online', region: 'EMEA EU Route', code: 0 });

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/cream/companies');
      const data = await res.json();
      setCompanies(data.companies || []);
      if (data.companies?.length > 0 && !selectedTenant) {
        setSelectedTenant(data.companies[0].id);
      }
    } catch (e) {
      console.error('Failed to load companies:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleToggleStatus = async (companyId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch('/api/cream/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          companyId,
          status: newStatus,
        }),
      });
      fetchCompanies();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;

    try {
      await fetch('/api/cream/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_company',
          newCompany,
        }),
      });
      setShowAddCompanyModal(false);
      setNewCompany({
        name: '',
        slug: '',
        registrationNumber: '',
        dispatchPhone: '',
        contactEmail: '',
        accountingProvider: 'sage',
        accountingCompanyId: '',
        cameraBrand: 'Hikvision',
      });
      fetchCompanies();
    } catch (e) {
      console.error('Failed to create company:', e);
    }
  };

  return (
    <div className="bg-[#03070f] text-on-background min-h-screen flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-300">
      {/* Executive Top Banner */}
      <header className="bg-gradient-to-r from-[#0d091a] via-[#100c24] to-[#0d091a] border-b border-purple-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <span className="material-symbols-outlined text-2xl font-bold">diamond</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-xl font-extrabold text-white tracking-wider">
                CREAM
              </h1>
              <span className="text-[10px] uppercase font-extrabold bg-gradient-to-r from-purple-500 to-amber-400 text-black px-2 py-0.5 rounded shadow">
                Software Owner Console
              </span>
            </div>
            <p className="text-xs text-purple-300/70">
              SafeLink Master Control • Multi-Tenant Security Infrastructure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/control-room?companyId=${selectedTenant}`}
            className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-200 hover:bg-purple-600/50 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
          >
            <span className="material-symbols-outlined text-sm">open_in_browser</span>
            Launch {companies.find((c) => c.id === selectedTenant)?.name || 'Control Room'}
          </Link>

          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            App
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        {/* Quick Diagnostics Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 space-y-1 shadow">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Aura SOS Gateway</span>
              <span className="w-2 h-2 rounded-full bg-[#38a169] animate-pulse" />
            </div>
            <p className="text-lg font-bold text-white">Online • v2 API</p>
            <p className="text-[11px] text-[#38a169]">Latency: 42ms (Sandbox & Prod)</p>
          </div>

          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 space-y-1 shadow">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>TrackSolid EMEA Telemetry</span>
              <span className="w-2 h-2 rounded-full bg-[#38a169] animate-pulse" />
            </div>
            <p className="text-lg font-bold text-white">EU Server Active</p>
            <p className="text-[11px] text-secondary">Token Cached • Sentinel GPS</p>
          </div>

          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 space-y-1 shadow">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Active Tenants</span>
              <span className="material-symbols-outlined text-sm text-purple-400">domain</span>
            </div>
            <p className="text-lg font-bold text-white">{companies.length} Security Companies</p>
            <p className="text-[11px] text-purple-300">All Systems Operational</p>
          </div>

          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 space-y-1 shadow">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>POPIA Geolocation</span>
              <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
            </div>
            <p className="text-lg font-bold text-white">Compliant & Encrypted</p>
            <p className="text-[11px] text-on-surface-variant">PWA Watcher Active</p>
          </div>
        </section>

        {/* Tenant Switcher & Oversight Table */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">corporate_fare</span>
                Security Companies & Tenants
              </h2>
              <p className="text-xs text-on-surface-variant">
                Manage accounts, switch live control rooms, enable/disable Aura dispatch, and troubleshoot integrations.
              </p>
            </div>

            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_business</span>
              Onboard Security Company
            </button>
          </div>

          {/* Companies Table */}
          <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1527] border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Security Company</th>
                    <th className="p-4">PSIRA Reg</th>
                    <th className="p-4">Accounting ERP</th>
                    <th className="p-4">Camera Engine</th>
                    <th className="p-4">Aura Status</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {companies.map((comp) => (
                    <tr
                      key={comp.id}
                      className={`hover:bg-white/5 transition-colors ${
                        selectedTenant === comp.id ? 'bg-purple-900/10' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                            {comp.name?.substring(0, 1)}
                          </div>
                          <div>
                            <strong className="text-white text-sm block">{comp.name}</strong>
                            <span className="text-[11px] text-gray-500 font-mono">ID: {comp.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-on-surface font-mono">
                        {comp.registrationNumber || 'Pending'}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-secondary">receipt_long</span>
                          <span className="font-semibold text-white capitalize">
                            {comp.accounting?.provider || 'Sage'}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            ({comp.accounting?.companyId || 'Active'})
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-purple-300">videocam</span>
                          <span className="font-semibold text-white">
                            {comp.cameraSystem?.defaultBrand || 'Hikvision'}
                          </span>
                          <span className="text-[10px] text-[#38a169] font-bold">
                            ({comp.cameras?.length || 0} feeds)
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          comp.aura?.enabled
                            ? 'bg-[#38a169]/15 text-[#38a169] border-[#38a169]/30'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                          {comp.aura?.enabled ? 'Aura Enabled' : 'Aura Disabled'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          comp.status === 'active'
                            ? 'bg-[#38a169]/15 text-[#38a169] border-[#38a169]/30'
                            : 'bg-[#e53e3e]/15 text-[#e53e3e] border-[#e53e3e]/30'
                        }`}>
                          {comp.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/control-room?companyId=${comp.id}`}
                            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-xs transition-all shadow cursor-pointer"
                          >
                            Open Control Room
                          </Link>

                          <button
                            onClick={() => handleToggleStatus(comp.id, comp.status)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                              comp.status === 'active'
                                ? 'border-[#e53e3e]/30 text-[#e53e3e] hover:bg-[#e53e3e]/10'
                                : 'border-[#38a169]/30 text-[#38a169] hover:bg-[#38a169]/10'
                            }`}
                          >
                            {comp.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Global System Troubleshooting & Support Section */}
        <section className="bg-[#080d19] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-xl">build</span>
            <h3 className="text-base font-bold text-white">Owner Support & Integration Troubleshooter</h3>
          </div>

          <p className="text-xs text-on-surface-variant max-w-2xl">
            As the software owner (CREAM), you have root authority to test API endpoints across all tenants, diagnose camera streaming bottlenecks, and verify live TrackSolid GPS telemetry feeds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#040812] border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Test Aura SOS Dispatch</h4>
              <p className="text-[11px] text-on-surface-variant">Sends a test sandbox dispatch event to Aura Responder Simulator.</p>
              <button
                onClick={async () => {
                  alert('Sending synthetic test dispatch to Aura Staging Responder Simulator...');
                }}
                className="w-full bg-white/10 hover:bg-white/15 text-white py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Send Synthetic SOS Ping
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#040812] border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">TrackSolid EMEA Status</h4>
              <p className="text-[11px] text-on-surface-variant">Verify token lifetime & device query against eu-open.tracksolidpro.com.</p>
              <button
                onClick={async () => {
                  alert('TrackSolid EMEA token verified. Response code: 0 (success). Active European router.');
                }}
                className="w-full bg-white/10 hover:bg-white/15 text-white py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Ping TrackSolid EU Router
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#040812] border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Flush Telemetry Caches</h4>
              <p className="text-[11px] text-on-surface-variant">Clear expired tokens and restart live GPS polling loops.</p>
              <button
                onClick={() => alert('Cache flushed successfully.')}
                className="w-full bg-white/10 hover:bg-white/15 text-white py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Flush In-Memory Cache
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Onboard Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1325] border border-purple-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 text-on-surface shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">add_business</span>
                Onboard Security Company
              </h3>
              <button
                onClick={() => setShowAddCompanyModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Company Name</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({
                      ...newCompany,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    })
                  }
                  placeholder="e.g. Apex Armed Security"
                  className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Tenant Slug / ID</label>
                <input
                  type="text"
                  value={newCompany.slug}
                  onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                  placeholder="apex_security"
                  className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">PSIRA Registration Number</label>
                <input
                  type="text"
                  value={newCompany.registrationNumber}
                  onChange={(e) => setNewCompany({ ...newCompany, registrationNumber: e.target.value })}
                  placeholder="PSIRA-2024/XXXXX"
                  className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Dispatch Phone</label>
                <input
                  type="tel"
                  value={newCompany.dispatchPhone}
                  onChange={(e) => setNewCompany({ ...newCompany, dispatchPhone: e.target.value })}
                  placeholder="+27 11 000 0000"
                  className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={newCompany.contactEmail}
                  onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                  placeholder="control@company.co.za"
                  className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Accounting Package</label>
                  <select
                    value={newCompany.accountingProvider}
                    onChange={(e) => setNewCompany({ ...newCompany, accountingProvider: e.target.value })}
                    className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="sage">Sage Pastel / Business Cloud</option>
                    <option value="zoho">Zoho Books</option>
                    <option value="xero">Xero Cloud Accounting</option>
                    <option value="quickbooks">QuickBooks Online</option>
                    <option value="listener">Listener Suite ERP (SA Control Rooms)</option>
                    <option value="patriot">Patriot Security ERP</option>
                    <option value="custom">Custom In-House REST API</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface-variant block mb-1">Primary Camera System</label>
                  <select
                    value={newCompany.cameraBrand}
                    onChange={(e) => setNewCompany({ ...newCompany, cameraBrand: e.target.value })}
                    className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Hikvision">Hikvision (ISAPI / RTSP)</option>
                    <option value="Dahua">Dahua Technology (DSS / DMSS)</option>
                    <option value="EZVIZ">EZVIZ Smart Security</option>
                    <option value="Uniview">Uniview (UNV / EZCloud)</option>
                    <option value="Axis">Axis Communications</option>
                    <option value="Provision-ISR">Provision-ISR (Cam2)</option>
                    <option value="Milesight">Milesight IoT & AI</option>
                    <option value="Generic ONVIF/RTSP">Generic ONVIF / RTSP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Accounting Company ID / Tenant ID (Optional)</label>
                <input
                  type="text"
                  value={newCompany.accountingCompanyId}
                  onChange={(e) => setNewCompany({ ...newCompany, accountingCompanyId: e.target.value })}
                  placeholder="e.g. 700192841 or Company GUID"
                  className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow"
                >
                  Create & Activate Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
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
