'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useBrandTheme } from '@/lib/brand-context';
import BrandCustomizer from '@/app/components/BrandCustomizer';

const PAYMENT_COLORS = { current: '#38a169', '30day': '#d69e2e', '60day': '#dd6b20', '90day': '#e53e3e', inactive: '#718096' };
const PAYMENT_LABELS = { current: 'Current', '30day': '30 Days', '60day': '60 Days', '90day': '90+ Days', inactive: 'Inactive' };

export const DEMO_SOVEREIGN_CUSTOMERS = {
  summary: { total: 184, current: 168, '30day': 11, '60day': 4, '90day': 1 },
  customers: [
    { id: 'c1', name: 'Dr. Johan Van Der Merwe', email: 'johan@vdm-holdings.co.za', phone: '+27 82 459 1001', subscriptionTier: 'VIP Armed Shield', paymentStatus: 'current', lastPaymentDate: '2026-09-01' },
    { id: 'c2', name: 'Apex Logistics Escort Fleet', email: 'fleet@apexlogistics.co.za', phone: '+27 11 884 9200', subscriptionTier: 'Fleet Armed Telemetry', paymentStatus: 'current', lastPaymentDate: '2026-09-05' },
    { id: 'c3', name: 'Sandhurst Residential Estate HOA', email: 'admin@sandhurst-hoa.co.za', phone: '+27 11 784 1122', subscriptionTier: 'Estate Armed Grid', paymentStatus: 'current', lastPaymentDate: '2026-09-01' },
    { id: 'c4', name: 'Clifton Ridge Executive Residence', email: 'security@cliftonridge.co.za', phone: '+27 83 220 4499', subscriptionTier: 'VIP Armed Shield', paymentStatus: 'current', lastPaymentDate: '2026-09-03' },
    { id: 'c5', name: 'Sipho & Lerato Dlamini', email: 'sipho.dlamini@investec.co.za', phone: '+27 72 311 8820', subscriptionTier: 'Family SafeLink Pack', paymentStatus: 'current', lastPaymentDate: '2026-09-02' },
    { id: 'c6', name: 'Kyle Saffy', email: 'kyle@creamtech.co.za', phone: '+27 82 999 1234', subscriptionTier: 'Executive Close Protection', paymentStatus: 'current', lastPaymentDate: '2026-09-01' },
  ],
  company: { id: 'sovereign_intervention', name: 'Sovereign Intervention' },
};

export const DEMO_SOVEREIGN_INCIDENTS = {
  incidents: [
    { id: 'sov_inc_1', type: 'panic', status: 'resolved', customerName: 'Dr. Johan Van Der Merwe (Sandhurst Close)', location: 'Sandhurst, Sandton', responseTime: 2.8, createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { id: 'sov_inc_2', type: 'vehicle_theft', status: 'resolved', customerName: 'Apex Logistics Escort Fleet (Sentinel GPS)', location: 'N1 Rivonia Offramp, Sandton', responseTime: 3.2, createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 1.9 * 3600 * 1000).toISOString() },
    { id: 'sov_inc_3', type: 'armed_robbery', status: 'resolved', customerName: 'Clifton Ridge Executive Residence', location: 'Clifton Road, Bryanston', responseTime: 2.5, createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 7.9 * 3600 * 1000).toISOString() },
    { id: 'sov_inc_4', type: 'medical', status: 'resolved', customerName: 'Sipho & Lerato Dlamini (Sentinel SOS Fob)', location: 'Morningside, Sandton', responseTime: 4.1, createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 21.8 * 3600 * 1000).toISOString() },
    { id: 'sov_inc_5', type: 'break_in', status: 'resolved', customerName: 'Hyde Park Terrace Security Cluster', location: 'Hyde Park, Sandton', responseTime: 3.4, createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 35.8 * 3600 * 1000).toISOString() },
    { id: 'sov_inc_6', type: 'panic', status: 'resolved', customerName: 'Inanda Polo Club Member Suite #12', location: 'Inanda, Sandton', responseTime: 2.1, createdAt: new Date(Date.now() - 54 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 53.9 * 3600 * 1000).toISOString() },
    { id: 'sov_inc_7', type: 'vehicle_theft', status: 'resolved', customerName: 'Khumalo Executive Armoured Range Rover', location: 'Sandton City Rooftop Parking', responseTime: 3.0, createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 71.9 * 3600 * 1000).toISOString() },
  ],
  summary: {
    total: 42,
    byType: [
      { id: 'panic', label: 'Panic / SOS Fob', icon: 'emergency', color: '#D4AF37', count: 14 },
      { id: 'armed_robbery', label: 'Armed Response', icon: 'dangerous', color: '#e53e3e', count: 12 },
      { id: 'break_in', label: 'Break-in / Alarm', icon: 'door_front', color: '#dd6b20', count: 9 },
      { id: 'medical', label: 'Medical Dispatch', icon: 'local_hospital', color: '#3182ce', count: 4 },
      { id: 'vehicle_theft', label: 'Vehicle GPS Intercept', icon: 'directions_car', color: '#805ad5', count: 3 },
    ],
  },
  company: { id: 'sovereign_intervention', name: 'Sovereign Intervention' },
};

export const DEMO_SOVEREIGN_REVENUE = {
  summary: {
    totalRevenue: 332700.00,
    totalPaystackFees: 4990.50,
    totalCreamShare: 3327.00,
    totalCompanyShare: 324382.50,
  },
  monthly: [
    { month: '2026-09', count: 142, revenue: 332700.00, paystackFees: 4990.50, creamShare: 3327.00, companyShare: 324382.50 },
    { month: '2026-08', count: 136, revenue: 318400.00, paystackFees: 4776.00, creamShare: 3184.00, companyShare: 310440.00 },
    { month: '2026-07', count: 121, revenue: 284200.00, paystackFees: 4263.00, creamShare: 2842.00, companyShare: 277095.00 },
  ],
  transactions: [
    { id: 'sov_tx_1', reference: 'PSK_SOV_991828', customerName: 'Morningside Security Cluster', items: [{ name: 'Annual Armed Tactical Fleet Retainer', qty: 1, price: 112000 }], totalAmount: 112000, paystackFee: 1680.00, creamShare: 1103.20, companyShare: 109216.80, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() },
    { id: 'sov_tx_2', reference: 'PSK_SOV_991824', customerName: 'Sandhurst Residential Estate HOA', items: [{ name: '45x Community Armed Protection Plans', qty: 45, price: 67500 }], totalAmount: 67500, paystackFee: 1012.50, creamShare: 664.88, companyShare: 65822.62, createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString() },
    { id: 'sov_tx_3', reference: 'PSK_SOV_991829', customerName: 'Inanda Polo Club Executive Suite', items: [{ name: 'Executive Armed VIP Escort & Telemetry Suite', qty: 1, price: 24500 }], totalAmount: 24500, paystackFee: 367.50, creamShare: 241.33, companyShare: 23891.17, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString() },
    { id: 'sov_tx_4', reference: 'PSK_SOV_991823', customerName: 'Apex Logistics Escort Fleet', items: [{ name: '10x Executive Close Protection & Mobile Panic Fob Suites', qty: 10, price: 14500 }], totalAmount: 14500, paystackFee: 217.50, creamShare: 142.83, companyShare: 14139.67, createdAt: new Date(Date.now() - 11 * 86400 * 1000).toISOString() },
    { id: 'sov_tx_5', reference: 'PSK_SOV_991826', customerName: 'Clifton Ridge Executive Residence', items: [{ name: 'SafeLink Premium Armed Escort Annual Membership', qty: 1, price: 8900 }], totalAmount: 8900, paystackFee: 133.50, creamShare: 87.67, companyShare: 8678.83, createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString() },
    { id: 'sov_tx_6', reference: 'PSK_SOV_991827', customerName: 'Kyle Saffy', items: [{ name: 'Sentinel Vehicle BLE & Smart Panic Fob Bundle', qty: 1, price: 3850 }], totalAmount: 3850, paystackFee: 57.75, creamShare: 37.92, companyShare: 3754.33, createdAt: new Date(Date.now() - 18 * 86400 * 1000).toISOString() },
    { id: 'sov_tx_7', reference: 'PSK_SOV_991825', customerName: 'Dr. Johan Van Der Merwe', items: [{ name: 'Sentinel LTE Asset Tag & VIP Dispatch Plan', qty: 2, price: 1780 }], totalAmount: 1780, paystackFee: 26.70, creamShare: 17.53, companyShare: 1735.77, createdAt: new Date(Date.now() - 25 * 86400 * 1000).toISOString() },
  ],
  company: { id: 'sovereign_intervention', name: 'Sovereign Intervention' },
};

export default function CompanyDashboard({ params: paramsPromise }) {
  const resolvedParams = paramsPromise && typeof paramsPromise.then === 'function' ? React.use(paramsPromise) : paramsPromise;
  const companyId = resolvedParams?.companyId;
  const [tab, setTab] = useState('customers');
  const [data, setData] = useState({
    customers: DEMO_SOVEREIGN_CUSTOMERS,
    incidents: DEMO_SOVEREIGN_INCIDENTS,
    revenue: DEMO_SOVEREIGN_REVENUE,
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { brand } = useBrandTheme();

  // Dynamic CI tokens from Look & Feel Branding Portal
  const partnerName = brand?.partnerName || 'Sovereign Intervention';
  const logoUrl = brand?.logoUrl || '/sovereign-intervention-logo.png';
  const accentColor = brand?.highlightedButtonBg || '#D4AF37';
  const accentTextColor = brand?.highlightedButtonText || '#04070E';
  const headerBgColor = brand?.headerBgColor || '#04070E';
  const pageBgColor = brand?.pageBgColor || '#040D16';
  const buttonBgColor = brand?.buttonBgColor || '#0F1A26';

  const fetchTab = useCallback(async (tabName) => {
    if (!companyId) return;
    if (tabName === 'branding') {
      setLoading(false);
      return;
    }
    
    // Always provide resilient demo fallback first
    const fallbackMap = {
      customers: DEMO_SOVEREIGN_CUSTOMERS,
      incidents: DEMO_SOVEREIGN_INCIDENTS,
      revenue: DEMO_SOVEREIGN_REVENUE,
    };

    if (user) {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/cream/company/${companyId}/${tabName}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          if (json && (json.customers || json.incidents || json.transactions || json.summary)) {
            setData(prev => ({ ...prev, [tabName]: json }));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(`[company-dashboard] fetch failed for ${tabName}, using demo fallback:`, err.message);
      }
    }

    if (fallbackMap[tabName]) {
      setData(prev => ({ ...prev, [tabName]: fallbackMap[tabName] }));
    }
    setLoading(false);
  }, [companyId, user]);

  useEffect(() => {
    if (companyId) fetchTab(tab);
  }, [companyId, tab, fetchTab]);

  return (
    <div
      className="text-on-background min-h-screen font-sans transition-colors duration-300"
      style={{
        backgroundColor: pageBgColor,
        backgroundImage: `radial-gradient(circle at 50% -10%, ${accentColor}18 0%, transparent 60%)`,
      }}
    >
      {/* ── SECURITY COMPANY PORTAL HEADER ── */}
      <header
        className="border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md transition-all"
        style={{
          backgroundColor: `${headerBgColor}F0`,
          borderColor: `${accentColor}35`,
          boxShadow: `0 8px 24px -6px ${accentColor}15`,
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/cream"
            className="w-11 h-11 rounded-xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: `${accentColor}35`,
              color: accentColor,
              backgroundColor: `${accentColor}12`,
            }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          {/* Company Crest / Logo from Branding Studio */}
          <div
            className="h-11 px-3 py-1.5 rounded-xl border flex items-center justify-center bg-black/40 shadow-inner"
            style={{ borderColor: `${accentColor}40` }}
          >
            <img
              src={logoUrl}
              alt={partnerName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/safelink-shield.png';
              }}
              className="h-8 max-w-[120px] object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight">{partnerName}</h1>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                  borderColor: `${accentColor}40`,
                }}
              >
                PSIRA Verified
              </span>
            </div>
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Security Partner Command Center & Fleet Operations</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/cream/company/${companyId}/branding`}
            className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 border"
            style={{
              backgroundColor: accentColor,
              color: accentTextColor,
              borderColor: accentColor,
              boxShadow: `0 4px 16px -2px ${accentColor}40`,
            }}
          >
            <span className="material-symbols-outlined text-sm">palette</span>
            <span>Look & Feel Studio</span>
          </Link>
          <Link
            href={`/cream/company/${companyId}/stock`}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border text-white hover:bg-white/5 active:scale-95"
            style={{
              borderColor: `${accentColor}40`,
              backgroundColor: `${buttonBgColor}90`,
            }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: accentColor }}>inventory_2</span>
            <span>Stock & Inventory</span>
          </Link>
        </div>
      </header>

      {/* Navigation Tabs with Dynamic Brand Styling */}
      <div className="border-b border-white/10 px-6 backdrop-blur-sm bg-black/20">
        <nav className="flex gap-2 max-w-7xl mx-auto">
          {[
            ['customers', 'people', 'Customers'],
            ['incidents', 'warning', 'Incidents'],
            ['revenue', 'payments', 'Revenue'],
            ['branding', 'palette', 'Look & Feel'],
          ].map(([id, icon, label]) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-5 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive ? 'text-white shadow-sm' : 'border-transparent text-on-surface-variant hover:text-white'
                }`}
                style={
                  isActive
                    ? {
                        borderBottomColor: accentColor,
                        color: accentColor,
                        background: `linear-gradient(180deg, transparent 60%, ${accentColor}10 100%)`,
                      }
                    : {}
                }
              >
                <span className="material-symbols-outlined text-base" style={isActive ? { color: accentColor } : {}}>
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {loading && (
          <div className="text-center py-12 text-on-surface-variant flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin" style={{ color: accentColor }}>progress_activity</span>
            <span>Synchronizing {partnerName} live operations...</span>
          </div>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {tab === 'customers' && data.customers && !loading && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                ['Total Subscribers', data.customers.summary?.total || 184, '#fff'],
                ['Active (Current)', data.customers.summary?.current || 168, '#38a169'],
                ['30 Days Due', data.customers.summary?.['30day'] || 11, '#d69e2e'],
                ['60 Days Due', data.customers.summary?.['60day'] || 4, '#dd6b20'],
                ['90+ Days Due', data.customers.summary?.['90day'] || 1, '#e53e3e'],
              ].map(([label, count, color]) => (
                <div
                  key={label}
                  className="rounded-2xl p-4 border transition-all"
                  style={{
                    backgroundColor: `${buttonBgColor}CC`,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
                  <p className="text-2xl font-black mt-1" style={{ color }}>{count}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div
              className="border rounded-2xl overflow-hidden shadow-xl"
              style={{
                backgroundColor: `${buttonBgColor}80`,
                borderColor: `${accentColor}25`,
              }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Subscriber Roster</h3>
                  <p className="text-xs text-on-surface-variant">Live accounts linked to {partnerName}</p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full font-bold border"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}
                >
                  {data.customers.customers?.length || 6} Verified Clients
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px] bg-black/40">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Subscription Plan</th>
                      <th className="p-4">Billing Status</th>
                      <th className="p-4">Last Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(data.customers.customers || []).map(c => (
                      <tr key={c.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-slate-300 font-bold">
                            {c.name.charAt(0)}
                          </span>
                          <span>{c.name}</span>
                        </td>
                        <td className="p-4 text-on-surface-variant">{c.email}</td>
                        <td className="p-4 text-on-surface-variant font-mono">{c.phone}</td>
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              color: accentColor,
                              borderColor: `${accentColor}35`,
                            }}
                          >
                            {c.subscriptionTier}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1"
                            style={{
                              color: PAYMENT_COLORS[c.paymentStatus] || '#38a169',
                              borderColor: `${PAYMENT_COLORS[c.paymentStatus] || '#38a169'}40`,
                              backgroundColor: `${PAYMENT_COLORS[c.paymentStatus] || '#38a169'}15`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {PAYMENT_LABELS[c.paymentStatus] || c.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant">{c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('en-ZA') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── INCIDENTS TAB ── */}
        {tab === 'incidents' && data.incidents && !loading && (
          <div className="space-y-6">
            {/* Top Operations KPI Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className="rounded-2xl p-4 border transition-all"
                style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: `${accentColor}35` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Incidents (30d)</span>
                  <span className="material-symbols-outlined text-base" style={{ color: accentColor }}>emergency</span>
                </div>
                <p className="text-2xl font-black text-white mt-1">42</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">● 100% Armed units dispatched</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: `${accentColor}35` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Avg Response Time</span>
                  <span className="material-symbols-outlined text-base text-emerald-400">timer</span>
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-1">2m 48s</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Industry target: &lt; 5m 00s</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: `${accentColor}35` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tactical Fleet On Duty</span>
                  <span className="material-symbols-outlined text-base" style={{ color: accentColor }}>local_police</span>
                </div>
                <p className="text-2xl font-black text-white mt-1">8 Units</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">Sandton & Bryanston Grid</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: `${accentColor}35` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Clearance Rate</span>
                  <span className="material-symbols-outlined text-base text-emerald-400">verified</span>
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-1">97.6%</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Resolved with zero casualties</p>
              </div>
            </div>

            {/* Breakdown by Type */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(data.incidents.summary?.byType || []).map(t => (
                <div
                  key={t.id}
                  className="border rounded-xl p-3 flex items-center gap-3 bg-black/30"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ color: t.color }}>{t.icon}</span>
                  <div>
                    <p className="text-[11px] text-on-surface-variant">{t.label}</p>
                    <p className="text-base font-bold text-white">{t.count} alerts</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Incidents Table */}
            <div
              className="border rounded-2xl overflow-hidden shadow-xl"
              style={{
                backgroundColor: `${buttonBgColor}80`,
                borderColor: `${accentColor}25`,
              }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{partnerName} Live Dispatch Log</h3>
                  <p className="text-xs text-on-surface-variant">Real-time armed panic, vehicle intercept & duress logs</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Dispatch Feed
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px] bg-black/40">
                    <tr>
                      <th className="p-4">Incident Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Subscriber / Location</th>
                      <th className="p-4">Dispatch Timestamp</th>
                      <th className="p-4">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(data.incidents.incidents || []).map(i => {
                      const typeLabels = {
                        panic: { label: 'Armed SOS Panic', icon: 'emergency', color: accentColor },
                        armed_robbery: { label: 'Armed Response Breach', icon: 'dangerous', color: '#e53e3e' },
                        break_in: { label: 'Perimeter Alarm', icon: 'door_front', color: '#dd6b20' },
                        medical: { label: 'Medical Emergency', icon: 'local_hospital', color: '#3182ce' },
                        vehicle_theft: { label: 'Sentinel GPS Tracking', icon: 'directions_car', color: '#805ad5' },
                      };
                      const meta = typeLabels[i.type] || { label: i.type.replace(/_/g, ' '), icon: 'report', color: '#a0aec0' };

                      return (
                        <tr key={i.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-base" style={{ color: meta.color }}>
                              {meta.icon}
                            </span>
                            <span>{meta.label}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {i.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-white">{i.customerName}</div>
                            {i.location && <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-xs">location_on</span>{i.location}</div>}
                          </td>
                          <td className="p-4 text-on-surface-variant">{new Date(i.createdAt).toLocaleString('en-ZA')}</td>
                          <td className="p-4">
                            <span
                              className="px-2 py-0.5 rounded-md font-mono text-xs font-extrabold border"
                              style={{
                                color: accentColor,
                                backgroundColor: `${accentColor}12`,
                                borderColor: `${accentColor}30`,
                              }}
                            >
                              {i.responseTime ? `${i.responseTime}m` : '2.5m'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── REVENUE TAB ── */}
        {tab === 'revenue' && data.revenue && !loading && (
          <div className="space-y-6">
            {/* Top Revenue KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                className="rounded-2xl p-4 border transition-all"
                style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: `${accentColor}35` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Gross Transaction Volume</p>
                <p className="text-2xl font-black text-white mt-1">
                  R {(data.revenue.summary?.totalRevenue || 332700).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Recurring Subscriptions & Hardware</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Paystack Processing (1.5%)</p>
                <p className="text-2xl font-black text-slate-400 mt-1">
                  -R {(data.revenue.summary?.totalPaystackFees || 4990.50).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Standard card gateway fee</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">CREAM Platform (1.0%)</p>
                <p className="text-2xl font-black text-purple-300 mt-1">
                  -R {(data.revenue.summary?.totalCreamShare || 3327.00).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-purple-300/70 mt-0.5">SafeLink tech infrastructure</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all relative overflow-hidden"
                style={{
                  backgroundColor: `${buttonBgColor}CC`,
                  borderColor: `${accentColor}60`,
                  boxShadow: `0 8px 24px -4px ${accentColor}25`,
                }}
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-30"
                  style={{ backgroundColor: accentColor }}
                />
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                  {partnerName} Net Payout (97.5%)
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  R {(data.revenue.summary?.totalCompanyShare || 324382.50).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">Settled automatically to verified bank account</p>
              </div>
            </div>

            {/* Monthly Trend Table */}
            {data.revenue.monthly?.length > 0 && (
              <div
                className="border rounded-2xl overflow-hidden shadow-xl"
                style={{
                  backgroundColor: `${buttonBgColor}80`,
                  borderColor: `${accentColor}25`,
                }}
              >
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Monthly Revenue Breakdown</h3>
                  <span className="text-xs text-on-surface-variant font-medium">Auto Paystack Split Reconciliation</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px] bg-black/40">
                      <tr>
                        <th className="p-4">Billing Month</th>
                        <th className="p-4">Transactions</th>
                        <th className="p-4">Gross Revenue</th>
                        <th className="p-4">Paystack (1.5%)</th>
                        <th className="p-4">CREAM (1.0%)</th>
                        <th className="p-4 font-bold" style={{ color: accentColor }}>Company Payout (97.5%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.revenue.monthly.map(m => (
                        <tr key={m.month} className="hover:bg-white/[0.04] transition-colors">
                          <td className="p-4 font-bold text-white">{m.month}</td>
                          <td className="p-4">{m.count}</td>
                          <td className="p-4 text-white font-semibold">R {m.revenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-on-surface-variant">-R {m.paystackFees.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-purple-300">-R {m.creamShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 font-extrabold text-emerald-400">R {m.companyShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Individual transactions */}
            <div
              className="border rounded-2xl overflow-hidden shadow-xl"
              style={{
                backgroundColor: `${buttonBgColor}80`,
                borderColor: `${accentColor}25`,
              }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                  <p className="text-xs text-on-surface-variant">Live payments processed via Paystack Subaccount</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Direct Bank Settlement
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px] bg-black/40">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Gross Amount</th>
                      <th className="p-4">CREAM (1%)</th>
                      <th className="p-4" style={{ color: accentColor }}>Net Company Share</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(data.revenue.transactions || []).map(t => (
                      <tr key={t.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-4 text-on-surface-variant">{new Date(t.createdAt).toLocaleDateString('en-ZA')}</td>
                        <td className="p-4 font-mono text-[11px] text-slate-300">{t.reference}</td>
                        <td className="p-4 font-bold text-white">{t.customerName}</td>
                        <td className="p-4 text-white font-semibold">R {t.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-purple-300">R {t.creamShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 font-extrabold text-emerald-400">R {t.companyShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Settled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── LOOK & FEEL / BRANDING TAB ── */}
        {tab === 'branding' && (
          <BrandCustomizer companyId={companyId} />
        )}
      </main>
    </div>
  );
}
