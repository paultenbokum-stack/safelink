'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useBrandTheme, getBrandPreset } from '@/lib/brand-context';
import { useTheme } from '@/lib/theme-context';
import BrandCustomizer from '@/app/components/BrandCustomizer';
import GodsEyeSurveillance from '@/app/components/GodsEyeSurveillance';

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

export function getCompanyDemoData(cid, pName) {
  if (!cid || cid === 'sovereign_intervention') {
    return {
      customers: DEMO_SOVEREIGN_CUSTOMERS,
      incidents: DEMO_SOVEREIGN_INCIDENTS,
      revenue: DEMO_SOVEREIGN_REVENUE,
    };
  }

  const name = pName || cid.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const prefix = cid.toUpperCase().slice(0, 3);

  return {
    customers: {
      summary: { total: 184, current: 168, '30day': 11, '60day': 4, '90day': 1 },
      customers: [
        { id: `${cid}_c1`, name: 'Dr. Johan Van Der Merwe', email: 'johan@vdm-holdings.co.za', phone: '+27 82 459 1001', subscriptionTier: `${name} Armed Shield`, paymentStatus: 'current', lastPaymentDate: '2026-09-01' },
        { id: `${cid}_c2`, name: 'Apex Logistics Escort Fleet', email: 'fleet@apexlogistics.co.za', phone: '+27 11 884 9200', subscriptionTier: `${name} Tactical Telemetry`, paymentStatus: 'current', lastPaymentDate: '2026-09-05' },
        { id: `${cid}_c3`, name: 'Sandhurst Residential Estate HOA', email: 'admin@sandhurst-hoa.co.za', phone: '+27 11 784 1122', subscriptionTier: `${name} Estate Armed Grid`, paymentStatus: 'current', lastPaymentDate: '2026-09-01' },
        { id: `${cid}_c4`, name: 'Clifton Ridge Executive Residence', email: 'security@cliftonridge.co.za', phone: '+27 83 220 4499', subscriptionTier: `${name} Armed Shield`, paymentStatus: 'current', lastPaymentDate: '2026-09-03' },
        { id: `${cid}_c5`, name: 'Sipho & Lerato Dlamini', email: 'sipho.dlamini@investec.co.za', phone: '+27 72 311 8820', subscriptionTier: 'Family SafeLink Pack', paymentStatus: 'current', lastPaymentDate: '2026-09-02' },
        { id: `${cid}_c6`, name: 'Kyle Saffy', email: 'kyle@creamtech.co.za', phone: '+27 82 999 1234', subscriptionTier: `${name} Close Protection`, paymentStatus: 'current', lastPaymentDate: '2026-09-01' },
      ],
      company: { id: cid, name },
    },
    incidents: {
      incidents: [
        { id: `${cid}_inc_1`, type: 'panic', status: 'resolved', customerName: 'Dr. Johan Van Der Merwe (Sandhurst Close)', location: 'Sandhurst, Sandton', responseTime: 2.8, createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
        { id: `${cid}_inc_2`, type: 'vehicle_theft', status: 'resolved', customerName: 'Apex Logistics Escort Fleet (Sentinel GPS)', location: 'N1 Rivonia Offramp, Sandton', responseTime: 3.2, createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 1.9 * 3600 * 1000).toISOString() },
        { id: `${cid}_inc_3`, type: 'armed_robbery', status: 'resolved', customerName: 'Clifton Ridge Executive Residence', location: 'Clifton Road, Bryanston', responseTime: 2.5, createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 7.9 * 3600 * 1000).toISOString() },
        { id: `${cid}_inc_4`, type: 'medical', status: 'resolved', customerName: 'Sipho & Lerato Dlamini (Sentinel SOS Fob)', location: 'Morningside, Sandton', responseTime: 4.1, createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 21.8 * 3600 * 1000).toISOString() },
        { id: `${cid}_inc_5`, type: 'break_in', status: 'resolved', customerName: 'Hyde Park Terrace Security Cluster', location: 'Hyde Park, Sandton', responseTime: 3.4, createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 35.8 * 3600 * 1000).toISOString() },
        { id: `${cid}_inc_6`, type: 'panic', status: 'resolved', customerName: 'Inanda Polo Club Member Suite #12', location: 'Inanda, Sandton', responseTime: 2.1, createdAt: new Date(Date.now() - 54 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 53.9 * 3600 * 1000).toISOString() },
      ],
      summary: {
        total: 42,
        byType: [
          { id: 'panic', label: 'Panic / SOS Fob', icon: 'emergency', color: '#F7BB23', count: 14 },
          { id: 'armed_robbery', label: 'Armed Response', icon: 'dangerous', color: '#e53e3e', count: 12 },
          { id: 'break_in', label: 'Break-in / Alarm', icon: 'door_front', color: '#dd6b20', count: 9 },
          { id: 'medical', label: 'Medical Dispatch', icon: 'local_hospital', color: '#3182ce', count: 4 },
          { id: 'vehicle_theft', label: 'Vehicle GPS Intercept', icon: 'directions_car', color: '#805ad5', count: 3 },
        ],
      },
      company: { id: cid, name },
    },
    revenue: {
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
        { id: `${cid}_tx_1`, reference: `PSK_${prefix}_991828`, customerName: 'Morningside Security Cluster', items: [{ name: `Annual Armed Tactical Fleet Retainer (${name})`, qty: 1, price: 112000 }], totalAmount: 112000, paystackFee: 1680.00, creamShare: 1103.20, companyShare: 109216.80, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() },
        { id: `${cid}_tx_2`, reference: `PSK_${prefix}_991824`, customerName: 'Sandhurst Residential Estate HOA', items: [{ name: `45x Community Armed Protection Plans (${name})`, qty: 45, price: 67500 }], totalAmount: 67500, paystackFee: 1012.50, creamShare: 664.88, companyShare: 65822.62, createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString() },
        { id: `${cid}_tx_3`, reference: `PSK_${prefix}_991829`, customerName: 'Inanda Polo Club Executive Suite', items: [{ name: `Executive Armed VIP Escort Suite (${name})`, qty: 1, price: 24500 }], totalAmount: 24500, paystackFee: 367.50, creamShare: 241.33, companyShare: 23891.17, createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString() },
        { id: `${cid}_tx_4`, reference: `PSK_${prefix}_991823`, customerName: 'Apex Logistics Escort Fleet', items: [{ name: `10x Executive Close Protection Fob Suites (${name})`, qty: 10, price: 14500 }], totalAmount: 14500, paystackFee: 217.50, creamShare: 142.83, companyShare: 14139.67, createdAt: new Date(Date.now() - 11 * 86400 * 1000).toISOString() },
      ],
      company: { id: cid, name },
    },
  };
}

export default function CompanyDashboard({ params: paramsPromise }) {
  const resolvedParams = paramsPromise && typeof paramsPromise.then === 'function' ? React.use(paramsPromise) : paramsPromise;
  const companyId = resolvedParams?.companyId;
  const [tab, setTab] = useState('customers');
  const { user } = useAuth();
  const { brand, setCompanyId } = useBrandTheme();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme !== 'light';

  const [companyBrand, setCompanyBrand] = useState(() => {
    if (typeof window !== 'undefined' && companyId) {
      try {
        const cached = localStorage.getItem('safelink_brand_' + companyId);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.partnerName) return parsed;
        }
      } catch {}
    }
    return null;
  });

  const preset = getBrandPreset(companyId);
  const effectiveBrand = (companyBrand?.partnerName ? companyBrand : null)
    || (brand?.companyId === companyId ? brand : null)
    || preset;

  // Dynamic CI tokens from Look & Feel Branding Portal + Theme-aware palettes
  const partnerName = effectiveBrand?.partnerName || preset.partnerName;
  const logoUrl = effectiveBrand?.logoUrl || preset.logoUrl;
  const accentColor = effectiveBrand?.highlightedButtonBg || preset.highlightedButtonBg || '#D4AF37';
  const accentTextColor = effectiveBrand?.highlightedButtonText || preset.highlightedButtonText || '#04070E';
  const headerBgColor = isDark ? (effectiveBrand?.headerBgColor || preset.headerBgColor || '#04070E') : '#FFFFFF';
  const pageBgColor = isDark ? (effectiveBrand?.pageBgColor || preset.pageBgColor || '#040D16') : '#F8FAFC';
  const buttonBgColor = isDark ? (effectiveBrand?.buttonBgColor || preset.buttonBgColor || '#0F1A26') : '#FFFFFF';

  const [data, setData] = useState(() => {
    const initialDemo = getCompanyDemoData(companyId, partnerName);
    return {
      customers: initialDemo.customers,
      incidents: initialDemo.incidents,
      revenue: initialDemo.revenue,
    };
  });
  const [loading, setLoading] = useState(false);

  // Sync companyId and load branding
  useEffect(() => {
    if (!companyId) return;
    setCompanyId(companyId);

    // Immediate check in localStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('safelink_brand_' + companyId);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.partnerName) {
            setCompanyBrand(parsed);
          }
        }
      } catch {}
    }

    // Live API fetch
    fetch(`/api/cream/company/${companyId}/branding`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json?.branding) {
          setCompanyBrand(json.branding);
          try {
            localStorage.setItem('safelink_brand_' + companyId, JSON.stringify(json.branding));
          } catch {}
        }
      })
      .catch(err => console.warn('[company-dashboard] Error fetching company branding:', err));

    const handleBrandOverride = (e) => {
      if (e.detail) {
        setCompanyBrand(e.detail);
      }
    };
    window.addEventListener('safelink_brand_updated', handleBrandOverride);
    return () => window.removeEventListener('safelink_brand_updated', handleBrandOverride);
  }, [companyId, setCompanyId]);

  // Keep demo data in sync with company and partnerName
  useEffect(() => {
    if (companyId) {
      const demo = getCompanyDemoData(companyId, partnerName);
      setData(prev => ({
        customers: (prev.customers?.company?.id === companyId) ? prev.customers : demo.customers,
        incidents: (prev.incidents?.company?.id === companyId) ? prev.incidents : demo.incidents,
        revenue: (prev.revenue?.company?.id === companyId) ? prev.revenue : demo.revenue,
      }));
    }
  }, [companyId, partnerName]);

  // Allow direct deep-linking like ?tab=cctv
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTab = urlParams.get('tab');
      if (queryTab && ['customers', 'incidents', 'revenue', 'cctv', 'branding'].includes(queryTab)) {
        setTab(queryTab);
      }
    }
  }, []);

  const fetchTab = useCallback(async (tabName) => {
    if (!companyId) return;
    if (tabName === 'branding' || tabName === 'cctv') {
      setLoading(false);
      return;
    }
    
    // Always provide resilient demo fallback first
    const demoPayloads = getCompanyDemoData(companyId, partnerName);
    const fallbackMap = {
      customers: demoPayloads.customers,
      incidents: demoPayloads.incidents,
      revenue: demoPayloads.revenue,
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
  }, [companyId, user, partnerName]);

  useEffect(() => {
    if (companyId) fetchTab(tab);
  }, [companyId, tab, fetchTab]);

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}
      style={{
        backgroundColor: pageBgColor,
        backgroundImage: `radial-gradient(circle at 50% -10%, ${accentColor}${isDark ? '18' : '10'} 0%, transparent 60%)`,
      }}
    >
      {/* ── SECURITY COMPANY PORTAL HEADER ── */}
      <header
        className="border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md transition-all"
        style={{
          backgroundColor: isDark ? `${headerBgColor}F0` : '#FFFFFFF0',
          borderColor: isDark ? `${accentColor}35` : '#E2E8F0',
          boxShadow: isDark ? `0 8px 24px -6px ${accentColor}15` : `0 4px 20px -2px rgba(0,0,0,0.06)`,
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/cream"
            className="w-11 h-11 rounded-xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: isDark ? `${accentColor}35` : '#CBD5E1',
              color: accentColor,
              backgroundColor: isDark ? `${accentColor}12` : `${accentColor}10`,
            }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          {/* Company Crest / Logo from Branding Studio */}
          <div
            className={`h-11 px-3 py-1.5 rounded-xl border flex items-center justify-center ${isDark ? 'bg-black/40 shadow-inner' : 'bg-white shadow-sm'}`}
            style={{ borderColor: isDark ? `${accentColor}40` : '#CBD5E1' }}
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
              <h1 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{partnerName}</h1>
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
            <p className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Security Partner Command Center & Fleet Operations</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            style={{
              borderColor: isDark ? `${accentColor}35` : '#CBD5E1',
              backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
              color: isDark ? accentColor : '#0F172A',
            }}
          >
            <span className="material-symbols-outlined text-base">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="hidden sm:inline font-semibold">{isDark ? 'Light' : 'Dark'}</span>
          </button>

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
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border active:scale-95 ${isDark ? 'text-white hover:bg-white/5' : 'text-slate-800 hover:bg-slate-100 bg-white shadow-sm'}`}
            style={{
              borderColor: isDark ? `${accentColor}40` : '#CBD5E1',
              backgroundColor: isDark ? `${buttonBgColor}90` : '#FFFFFF',
            }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: accentColor }}>inventory_2</span>
            <span>Stock & Inventory</span>
          </Link>
        </div>
      </header>

      {/* Navigation Tabs with Dynamic Brand Styling */}
      <div className={`border-b px-6 backdrop-blur-sm ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-white/70'}`}>
        <nav className="flex gap-2 max-w-7xl mx-auto overflow-x-auto scrollbar-none">
          {[
            ['customers', 'people', 'Customers'],
            ['incidents', 'warning', 'Incidents'],
            ['revenue', 'payments', 'Revenue'],
            ['cctv', 'videocam', 'Live CCTV & Feeds'],
            ['branding', 'palette', 'Look & Feel'],
          ].map(([id, icon, label]) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-5 py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? isDark ? 'text-white shadow-sm' : 'text-slate-900 font-extrabold'
                    : isDark ? 'border-transparent text-on-surface-variant hover:text-white' : 'border-transparent text-slate-600 hover:text-slate-950'
                }`}
                style={
                  isActive
                    ? {
                        borderBottomColor: accentColor,
                        color: isDark ? accentColor : '#0F172A',
                        background: `linear-gradient(180deg, transparent 60%, ${accentColor}${isDark ? '10' : '15'} 100%)`,
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

      <main className={`p-4 sm:p-6 mx-auto space-y-6 ${tab === 'cctv' ? 'max-w-[1680px]' : 'max-w-7xl'}`}>
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
                ['Total Subscribers', data.customers.summary?.total || 184, isDark ? '#fff' : '#0F172A'],
                ['Active (Current)', data.customers.summary?.current || 168, '#38a169'],
                ['30 Days Due', data.customers.summary?.['30day'] || 11, '#d69e2e'],
                ['60 Days Due', data.customers.summary?.['60day'] || 4, '#dd6b20'],
                ['90+ Days Due', data.customers.summary?.['90day'] || 1, '#e53e3e'],
              ].map(([label, count, color]) => (
                <div
                  key={label}
                  className="rounded-2xl p-4 border transition-all"
                  style={{
                    backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                  }}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>{label}</p>
                  <p className="text-2xl font-black mt-1" style={{ color }}>{count}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div
              className="border rounded-2xl overflow-hidden shadow-xl"
              style={{
                backgroundColor: isDark ? `${buttonBgColor}80` : '#FFFFFF',
                borderColor: isDark ? `${accentColor}25` : '#E2E8F0',
                boxShadow: isDark ? undefined : '0 4px 20px -2px rgba(0,0,0,0.05)',
              }}
            >
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200 bg-slate-50/70'}`}>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Active Subscriber Roster</h3>
                  <p className={`text-xs ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Live accounts linked to {partnerName}</p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full font-bold border"
                  style={{
                    backgroundColor: `${accentColor}15`,
                    color: isDark ? accentColor : '#92400E',
                    borderColor: `${accentColor}30`,
                  }}
                >
                  {data.customers.customers?.length || 6} Verified Clients
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b uppercase tracking-wider text-[10px] ${isDark ? 'border-white/10 text-on-surface-variant bg-black/40' : 'border-slate-200 text-slate-600 bg-slate-100/90'}`}>
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Subscription Plan</th>
                      <th className="p-4">Billing Status</th>
                      <th className="p-4">Last Payment</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
                    {(data.customers.customers || []).map(c => (
                      <tr key={c.id} className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} transition-colors`}>
                        <td className={`p-4 font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                            {c.name.charAt(0)}
                          </span>
                          <span>{c.name}</span>
                        </td>
                        <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{c.email}</td>
                        <td className={`p-4 font-mono ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{c.phone}</td>
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              color: isDark ? accentColor : '#92400E',
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
                        <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('en-ZA') : '—'}</td>
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
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? `${accentColor}35` : '#E2E8F0',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Total Incidents (30d)</span>
                  <span className="material-symbols-outlined text-base" style={{ color: accentColor }}>emergency</span>
                </div>
                <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>42</p>
                <p className="text-[11px] text-emerald-500 mt-0.5 font-medium">● 100% Armed units dispatched</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? `${accentColor}35` : '#E2E8F0',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Avg Response Time</span>
                  <span className="material-symbols-outlined text-base text-emerald-500">timer</span>
                </div>
                <p className="text-2xl font-black text-emerald-500 mt-1">2m 48s</p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Industry target: &lt; 5m 00s</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? `${accentColor}35` : '#E2E8F0',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Tactical Fleet On Duty</span>
                  <span className="material-symbols-outlined text-base" style={{ color: accentColor }}>local_police</span>
                </div>
                <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>8 Units</p>
                <p className="text-[11px] text-emerald-500 mt-0.5 font-medium">Sandton & Bryanston Grid</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? `${accentColor}35` : '#E2E8F0',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Clearance Rate</span>
                  <span className="material-symbols-outlined text-base text-emerald-500">verified</span>
                </div>
                <p className="text-2xl font-black text-emerald-500 mt-1">97.6%</p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Resolved with zero casualties</p>
              </div>
            </div>

            {/* Breakdown by Type */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(data.incidents.summary?.byType || []).map(t => (
                <div
                  key={t.id}
                  className={`border rounded-xl p-3 flex items-center gap-3 ${isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ color: t.color }}>{t.icon}</span>
                  <div>
                    <p className={`text-[11px] ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>{t.label}</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.count} alerts</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Incidents Table */}
            <div
              className="border rounded-2xl overflow-hidden shadow-xl"
              style={{
                backgroundColor: isDark ? `${buttonBgColor}80` : '#FFFFFF',
                borderColor: isDark ? `${accentColor}25` : '#E2E8F0',
                boxShadow: isDark ? undefined : '0 4px 20px -2px rgba(0,0,0,0.05)',
              }}
            >
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200 bg-slate-50/70'}`}>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{partnerName} Live Dispatch Log</h3>
                  <p className={`text-xs ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Real-time armed panic, vehicle intercept & duress logs</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Dispatch Feed
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b uppercase tracking-wider text-[10px] ${isDark ? 'border-white/10 text-on-surface-variant bg-black/40' : 'border-slate-200 text-slate-600 bg-slate-100/90'}`}>
                    <tr>
                      <th className="p-4">Incident Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Subscriber / Location</th>
                      <th className="p-4">Dispatch Timestamp</th>
                      <th className="p-4">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
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
                        <tr key={i.id} className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} transition-colors`}>
                          <td className={`p-4 font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <span className="material-symbols-outlined text-base" style={{ color: meta.color }}>
                              {meta.icon}
                            </span>
                            <span>{meta.label}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-emerald-500/15 text-emerald-500 border-emerald-500/30 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {i.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{i.customerName}</div>
                            {i.location && (
                              <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {i.location}
                              </div>
                            )}
                          </td>
                          <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{new Date(i.createdAt).toLocaleString('en-ZA')}</td>
                          <td className="p-4">
                            <span
                              className="px-2 py-0.5 rounded-md font-mono text-xs font-extrabold border"
                              style={{
                                color: isDark ? accentColor : '#92400E',
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
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? `${accentColor}35` : '#E2E8F0',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Gross Transaction Volume</p>
                <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  R {(data.revenue.summary?.totalRevenue || 332700).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Recurring Subscriptions & Hardware</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Paystack Processing (1.5%)</p>
                <p className={`text-2xl font-black mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  -R {(data.revenue.summary?.totalPaystackFees || 4990.50).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Standard card gateway fee</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all"
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>CREAM Platform (1.0%)</p>
                <p className={`text-2xl font-black mt-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  -R {(data.revenue.summary?.totalCreamShare || 3327.00).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-purple-300/70' : 'text-purple-600/80'}`}>SafeLink tech infrastructure</p>
              </div>

              <div
                className="rounded-2xl p-4 border transition-all relative overflow-hidden"
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}CC` : '#FFFFFF',
                  borderColor: isDark ? `${accentColor}60` : `${accentColor}50`,
                  boxShadow: isDark ? `0 8px 24px -4px ${accentColor}25` : `0 4px 20px -2px rgba(0,0,0,0.08)`,
                }}
              >
                <div
                  className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${isDark ? 'opacity-30' : 'opacity-15'}`}
                  style={{ backgroundColor: accentColor }}
                />
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? accentColor : '#92400E' }}>
                  {partnerName} Net Payout (97.5%)
                </p>
                <p className="text-2xl font-black text-emerald-500 mt-1">
                  R {(data.revenue.summary?.totalCompanyShare || 324382.50).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Settled automatically to verified bank account</p>
              </div>
            </div>

            {/* Monthly Trend Table */}
            {data.revenue.monthly?.length > 0 && (
              <div
                className="border rounded-2xl overflow-hidden shadow-xl"
                style={{
                  backgroundColor: isDark ? `${buttonBgColor}80` : '#FFFFFF',
                  borderColor: isDark ? `${accentColor}25` : '#E2E8F0',
                  boxShadow: isDark ? undefined : '0 4px 20px -2px rgba(0,0,0,0.05)',
                }}
              >
                <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200 bg-slate-50/70'}`}>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Monthly Revenue Breakdown</h3>
                  <span className={`text-xs font-medium ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Auto Paystack Split Reconciliation</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b uppercase tracking-wider text-[10px] ${isDark ? 'border-white/10 text-on-surface-variant bg-black/40' : 'border-slate-200 text-slate-600 bg-slate-100/90'}`}>
                      <tr>
                        <th className="p-4">Billing Month</th>
                        <th className="p-4">Transactions</th>
                        <th className="p-4">Gross Revenue</th>
                        <th className="p-4">Paystack (1.5%)</th>
                        <th className="p-4">CREAM (1.0%)</th>
                        <th className="p-4 font-bold" style={{ color: isDark ? accentColor : '#92400E' }}>Company Payout (97.5%)</th>
                      </tr>
                    </thead>
                    <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
                      {data.revenue.monthly.map(m => (
                        <tr key={m.month} className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} transition-colors`}>
                          <td className={`p-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.month}</td>
                          <td className={`p-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{m.count}</td>
                          <td className={`p-4 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>R {m.revenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>-R {m.paystackFees.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className={`p-4 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>-R {m.creamShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 font-extrabold text-emerald-500">R {m.companyShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
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
                backgroundColor: isDark ? `${buttonBgColor}80` : '#FFFFFF',
                borderColor: isDark ? `${accentColor}25` : '#E2E8F0',
                boxShadow: isDark ? undefined : '0 4px 20px -2px rgba(0,0,0,0.05)',
              }}
            >
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200 bg-slate-50/70'}`}>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Transactions</h3>
                  <p className={`text-xs ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>Live payments processed via Paystack Subaccount</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  Direct Bank Settlement
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b uppercase tracking-wider text-[10px] ${isDark ? 'border-white/10 text-on-surface-variant bg-black/40' : 'border-slate-200 text-slate-600 bg-slate-100/90'}`}>
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Gross Amount</th>
                      <th className="p-4">CREAM (1%)</th>
                      <th className="p-4" style={{ color: isDark ? accentColor : '#92400E' }}>Net Company Share</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
                    {(data.revenue.transactions || []).map(t => (
                      <tr key={t.id} className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} transition-colors`}>
                        <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{new Date(t.createdAt).toLocaleDateString('en-ZA')}</td>
                        <td className={`p-4 font-mono text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.reference}</td>
                        <td className={`p-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.customerName}</td>
                        <td className={`p-4 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>R {t.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className={`p-4 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>R {t.creamShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 font-extrabold text-emerald-500">R {t.companyShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
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
          <BrandCustomizer
            companyId={companyId}
            onSaved={(b) => {
              setCompanyBrand(b);
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem('safelink_brand_' + companyId, JSON.stringify(b));
                } catch {}
              }
            }}
          />
        )}

        {/* ── LIVE CCTV & GOD'S EYE SURVEILLANCE TAB ── */}
        {tab === 'cctv' && (
          <GodsEyeSurveillance companyId={companyId} brand={effectiveBrand} />
        )}
      </main>
    </div>
  );
}
