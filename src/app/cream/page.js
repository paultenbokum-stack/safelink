'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useManagementFetch } from '@/lib/use-management-fetch';
import PartnerIntegrations from '@/app/components/PartnerIntegrations';
import { DEMO_COMPANIES } from '@/lib/demo-companies';
import { SA_BANKS } from '@/lib/banks';
import { formatZAR } from '@/lib/products';
import { useAuth } from '@/lib/auth-context';

export default function CreamMasterPage() {
  const [managementError, setManagementError] = useState('');
  const managementFetch = useManagementFetch(setManagementError);
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [companies, setCompanies] = useState(DEMO_COMPANIES);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState('demo_coastal');

  // Modals
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteForm, setInviteForm] = useState({ companyName: '', contactEmail: '', notes: '' });
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Automated Website CI Ingestor State
  const [scrapeUrl, setScrapeUrl] = useState('https://sovereignintervention.co.za');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [scrapedBranding, setScrapedBranding] = useState(null);

  const handleScrapeWebsiteCI = async () => {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    setScrapeStatus('Scraping website for brand colors, logo, and typography...');
    try {
      const res = await fetch('/api/cream/scrape-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: scrapeUrl.trim(), url: scrapeUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scrape website');

      const companyName = data.companyName || data.branding?.partnerName || data.extracted?.partnerName || '';
      const phone = data.phone || data.extracted?.phones?.[0] || '';
      const email = data.email || data.extracted?.emails?.[0] || '';
      const slug = companyName ? companyName.toLowerCase().replace(/[^a-z0-9_]/g, '_') : '';

      setScrapedBranding(data.branding);
      setNewCompany(prev => ({
        ...prev,
        name: prev.name || companyName,
        slug: prev.slug || slug,
        dispatchPhone: prev.dispatchPhone || phone,
        contactEmail: prev.contactEmail || email,
        branding: data.branding,
      }));
      setScrapeStatus(`✓ CI Ingested: ${companyName || 'Company'} (${data.branding?.fontFamily || 'modern'} font, ${data.branding?.headerBgColor || '#04070E'} header, ${data.branding?.highlightedButtonBg || '#D4AF37'} SOS button)`);
    } catch (err) {
      setScrapeStatus(`Error ingesting CI: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  // New Company Form State
  const [newCompany, setNewCompany] = useState({
    name: '',
    slug: '',
    registrationNumber: '',
    psiraNumber: '',
    dispatchPhone: '',
    contactEmail: '',
    street: '',
    suburb: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    bankCode: '057',
    accountNumber: '',
    accountType: 'cheque',
    branchCode: '',
    accountingProvider: 'sage',
    accountingCompanyId: '',
    cameraBrand: 'Hikvision',
  });
  const [savingCompany, setSavingCompany] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      let token = null;
      if (user) {
        token = await user.getIdToken().catch(() => null);
      }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch metrics
      const metricsRes = await managementFetch('/api/cream/metrics', { headers }).catch(() => null);
      if (metricsRes && metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
        if (metricsData.companies?.length) {
          let list = metricsData.companies;
          if (typeof window !== 'undefined') {
            try {
              const saved = JSON.parse(localStorage.getItem('safelink_custom_companies') || '[]');
              if (Array.isArray(saved) && saved.length > 0) {
                const existingIds = new Set(list.map(c => c.id));
                const extras = saved.filter(c => !existingIds.has(c.id));
                list = [...extras, ...list];
              }
            } catch {}
          }
          setCompanies(list);
        }
      } else {
        // Fallback to legacy companies list
        const compRes = await managementFetch('/api/cream/companies').catch(() => null);
        if (compRes && compRes.ok) {
          const compData = await compRes.json();
          let baseList = compData.companies?.length ? compData.companies : DEMO_COMPANIES;
          if (typeof window !== 'undefined') {
            try {
              const saved = JSON.parse(localStorage.getItem('safelink_custom_companies') || '[]');
              if (Array.isArray(saved) && saved.length > 0) {
                const existingIds = new Set(baseList.map(c => c.id));
                const extras = saved.filter(c => !existingIds.has(c.id));
                baseList = [...extras, ...baseList];
              }
            } catch {}
          }
          setCompanies(baseList);
        }
      }
    } catch (e) {
      console.error('Failed to load CREAM data:', e);
    } finally {
      setLoading(false);
    }
  }, [user, managementFetch]);

  useEffect(() => {
    const timer = setTimeout(fetchDashboardData, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboardData]);

  const handleToggleStatus = async (companyId, currentStatus) => {
    if (companies.find(c => c.id === companyId)?.isDemo) {
      setCompanies(rows => rows.map(c => c.id === companyId ? { ...c, status: currentStatus === "active" ? "suspended" : "active" } : c));
      return;
    }
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await managementFetch('/api/cream/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          companyId,
          status: newStatus,
        }),
      });
      fetchDashboardData();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;
    setSavingCompany(true);

    const compSlug = (newCompany.slug || newCompany.name || `comp_${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    const finalBranding = scrapedBranding || newCompany.branding || (compSlug === 'sb_security' ? {
      companyId: compSlug,
      partnerName: newCompany.name || 'SB Security',
      logoUrl: '/presentation/security-brokers-logo.png',
      highlightedButtonBg: '#F7BB23',
      highlightedButtonText: '#04070E',
      buttonTextColor: '#F7BB23',
    } : null);

    // Cache branding in localStorage immediately for instant hydration
    if (finalBranding && typeof window !== 'undefined') {
      try {
        localStorage.setItem('safelink_brand_' + compSlug, JSON.stringify(finalBranding));
        window.dispatchEvent(new CustomEvent('safelink_brand_updated', { detail: finalBranding }));
      } catch {}
    }

    // Seed the branding endpoint directly
    if (finalBranding) {
      fetch(`/api/cream/company/${compSlug}/branding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalBranding),
      }).catch(err => console.warn('Could not pre-seed company branding:', err));
    }

    try {
      const res = await managementFetch('/api/cream/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_company',
          newCompany: {
            ...newCompany,
            slug: compSlug,
            branding: finalBranding,
            address: {
              street: newCompany.street,
              suburb: newCompany.suburb,
              city: newCompany.city,
              province: newCompany.province,
              postalCode: newCompany.postalCode,
            },
            bankDetails: {
              bankCode: newCompany.bankCode,
              accountNumber: newCompany.accountNumber,
              accountType: newCompany.accountType,
              branchCode: newCompany.branchCode,
            },
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create company');
      }

      // Optimistically append new company to local state
      const createdEntry = {
        id: compSlug,
        name: newCompany.name,
        status: 'active',
        registrationNumber: newCompany.registrationNumber || 'PSIRA-PENDING',
        psiraNumber: newCompany.psiraNumber || '',
        dispatchPhone: newCompany.dispatchPhone || '',
        contactEmail: newCompany.contactEmail || '',
        memberCount: 0,
        deviceCount: 0,
        accounting: { provider: newCompany.accountingProvider || 'sage', status: 'connected' },
        cameraSystem: { defaultBrand: newCompany.cameraBrand || 'Hikvision', status: 'connected' },
        aura: { enabled: true },
        branding: finalBranding,
      };

      setCompanies(prev => [createdEntry, ...prev.filter(c => c.id !== compSlug)]);
      if (typeof window !== 'undefined') {
        try {
          const currentCustom = JSON.parse(localStorage.getItem('safelink_custom_companies') || '[]');
          const updatedCustom = [createdEntry, ...currentCustom.filter(c => c.id !== compSlug)];
          localStorage.setItem('safelink_custom_companies', JSON.stringify(updatedCustom));
        } catch {}
      }

      setShowAddCompanyModal(false);
      setScrapedBranding(null);
      setScrapeStatus('');
      setNewCompany({
        name: '',
        slug: '',
        registrationNumber: '',
        psiraNumber: '',
        dispatchPhone: '',
        contactEmail: '',
        street: '',
        suburb: '',
        city: '',
        province: 'Gauteng',
        postalCode: '',
        bankCode: '057',
        accountNumber: '',
        accountType: 'cheque',
        branchCode: '',
        accountingProvider: 'sage',
        accountingCompanyId: '',
        cameraBrand: 'Hikvision',
      });
      fetchDashboardData();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.companyName.trim()) return;

    try {
      let token = null;
      if (user) token = await user.getIdToken().catch(() => null);

      const res = await managementFetch('/api/cream/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate invite');
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setInviteResult({
        ...data,
        fullUrl: `${origin}${data.inviteUrl}`,
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const totals = metrics?.totals || {
    totalCustomers: companies.reduce((s, c) => s + (c.totalCustomers || c.memberCount || 0), 0),
    activeCustomers: companies.reduce((s, c) => s + (c.activeCustomers || c.memberCount || 0), 0),
    inactiveCustomers: companies.reduce((s, c) => s + (c.inactiveCustomers || 0), 0),
    totalIncidents: companies.reduce((s, c) => s + (c.totalIncidents || 18), 0),
    monthlyIncidents: companies.reduce((s, c) => s + (c.monthlyIncidents || 6), 0),
    totalSentinelSold: companies.reduce((s, c) => s + (c.totalSentinelSold || c.deviceCount || 0), 0),
    monthlySentinelSold: companies.reduce((s, c) => s + (c.monthlySentinelSold || Math.round((c.deviceCount || 10) * 0.3)), 0),
    monthlyOtherHW: companies.reduce((s, c) => s + (c.monthlyOtherHW || 2), 0),
    monthlyRevenue: companies.reduce((s, c) => s + (c.monthlyRevenue || 45000), 0),
    creamRevenue: companies.reduce((s, c) => s + (c.monthlyRevenue || 45000) * 0.01, 0),
  };

  return (
    <div className="bg-[#03070f] text-on-background min-h-screen flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-300">
      {managementError && <p role="alert" className="p-4 text-error">{managementError}</p>}
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

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/cream/products"
            className="px-3.5 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 hover:bg-purple-900/50 text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            Master Catalogue
          </Link>

          <Link
            href="/p/sovereign-intervention"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Open Sovereign Intervention White-Label Pitch Deck"
          >
            <span className="material-symbols-outlined text-sm">slideshow</span>
            Pitch Deck
          </Link>

          <Link
            href="/control-room?companyId=sovereign_intervention"
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Launch Tactical Control Room for Sovereign Intervention"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Control Room
          </Link>

          <button
            onClick={() => { setShowInviteModal(true); setInviteResult(null); }}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">link</span>
            Invite Partner
          </button>

          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow"
          >
            <span className="material-symbols-outlined text-sm">add_business</span>
            Onboard Company
          </button>

          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            App
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        {/* Executive Summary Metrics Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Customers</span>
              <span className="material-symbols-outlined text-sm text-purple-400">group</span>
            </div>
            <p className="text-2xl font-black text-white">{totals.totalCustomers}</p>
            <p className="text-[11px] text-emerald-400 mt-1">
              {totals.activeCustomers} active • {totals.inactiveCustomers} inactive
            </p>
          </div>

          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Incidents (Month)</span>
              <span className="material-symbols-outlined text-sm text-amber-400">warning</span>
            </div>
            <p className="text-2xl font-black text-white">{totals.monthlyIncidents}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totals.totalIncidents} all-time logged
            </p>
          </div>

          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Sentinel Sold</span>
              <span className="material-symbols-outlined text-sm text-sky-400">sensors</span>
            </div>
            <p className="text-2xl font-black text-white">{totals.monthlySentinelSold}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totals.totalSentinelSold} devices total
            </p>
          </div>

          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Other HW (Month)</span>
              <span className="material-symbols-outlined text-sm text-indigo-400">videocam</span>
            </div>
            <p className="text-2xl font-black text-white">{totals.monthlyOtherHW}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cameras & Custom HW
            </p>
          </div>

          <div className="bg-[#080d19] border border-white/10 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Monthly Volume</span>
              <span className="material-symbols-outlined text-sm text-emerald-400">payments</span>
            </div>
            <p className="text-2xl font-black text-white">{formatZAR(totals.monthlyRevenue)}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Platform Gross Volume
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-950/40 to-[#080d19] border border-purple-500/30 rounded-2xl p-4 shadow">
            <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
              <span>CREAM 1% Share</span>
              <span className="material-symbols-outlined text-sm text-amber-400">diamond</span>
            </div>
            <p className="text-2xl font-black text-amber-300">{formatZAR(totals.creamRevenue)}</p>
            <p className="text-[11px] text-purple-300/70 mt-1">
              Auto Split via Paystack
            </p>
          </div>
        </section>

        {/* Security Companies High-Level Table */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">corporate_fare</span>
                SafeLink Security Companies
              </h2>
              <p className="text-xs text-slate-400">
                Multi-tenant performance, customer payment statuses, incident response, and hardware turnover.
              </p>
            </div>
          </div>

          {/* Enhanced Companies Table */}
          <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0d1527] border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Security Company</th>
                    <th className="p-4 text-center">Customers (Tot / Act / Inact)</th>
                    <th className="p-4 text-center">Incidents (Month / Tot)</th>
                    <th className="p-4 text-center">Sentinel Devices</th>
                    <th className="p-4 text-center">Other HW (Mo)</th>
                    <th className="p-4 text-right">Revenue (Month)</th>
                    <th className="p-4 text-center">Paystack Subaccount</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Drill Down</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {companies.map((comp) => {
                    const totalCust = comp.totalCustomers ?? comp.memberCount ?? 0;
                    const actCust = comp.activeCustomers ?? comp.memberCount ?? 0;
                    const inactCust = comp.inactiveCustomers ?? 0;
                    const totInc = comp.totalIncidents ?? 14;
                    const moInc = comp.monthlyIncidents ?? 4;
                    const totSent = comp.totalSentinelSold ?? comp.deviceCount ?? 0;
                    const moSent = comp.monthlySentinelSold ?? Math.round((comp.deviceCount || 10) * 0.3);
                    const moOther = comp.monthlyOtherHW ?? 1;
                    const moRev = comp.monthlyRevenue ?? 35000;

                    return (
                      <tr
                        key={comp.id}
                        className={`hover:bg-white/5 transition-colors ${
                          selectedTenant === comp.id ? 'bg-purple-900/10' : ''
                        }`}
                      >
                        {/* Company Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                              {comp.name?.substring(0, 1)}
                            </div>
                            <div>
                              <strong className="text-white text-sm block">
                                {comp.name} {comp.isDemo && <span className="text-gray-400 font-normal text-xs">[Demo]</span>}
                              </strong>
                              <span className="text-[11px] text-gray-400 font-mono">
                                PSIRA: {comp.registrationNumber || comp.psiraNumber || 'PSIRA-2024/001'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Customers (Total / Active / Inactive) */}
                        <td className="p-4 text-center font-mono">
                          <Link
                            href={`/cream/company/${comp.id}`}
                            className="inline-block hover:underline"
                            title="Click to view customer details & payment arrears"
                          >
                            <span className="font-bold text-white text-sm">{totalCust}</span>
                            <span className="text-slate-400 text-[11px] block">
                              <span className="text-emerald-400 font-semibold">{actCust} act</span> •{' '}
                              <span className="text-rose-400">{inactCust} inact</span>
                            </span>
                          </Link>
                        </td>

                        {/* Incidents (Month / Total) */}
                        <td className="p-4 text-center font-mono">
                          <Link
                            href={`/cream/company/${comp.id}`}
                            className="inline-block hover:underline"
                            title="Click to view incident types and logs"
                          >
                            <span className="font-bold text-amber-300 text-sm">{moInc}</span>
                            <span className="text-slate-500 text-[11px] block">{totInc} all-time</span>
                          </Link>
                        </td>

                        {/* Sentinel Devices Sold */}
                        <td className="p-4 text-center font-mono">
                          <Link
                            href={`/cream/company/${comp.id}/stock`}
                            className="inline-block hover:underline"
                            title="Click to manage stock & view device orders"
                          >
                            <span className="font-bold text-sky-400 text-sm">+{moSent}</span>
                            <span className="text-slate-500 text-[11px] block">{totSent} total</span>
                          </Link>
                        </td>

                        {/* Other HW Sold */}
                        <td className="p-4 text-center font-mono">
                          <span className="font-bold text-indigo-300">{moOther}</span>
                          <span className="text-slate-500 text-[11px] block">units</span>
                        </td>

                        {/* Monthly Revenue */}
                        <td className="p-4 text-right font-mono">
                          <div className="font-bold text-emerald-400">{formatZAR(moRev)}</div>
                          <div className="text-[10px] text-purple-300">
                            CREAM: {formatZAR(moRev * 0.01)}
                          </div>
                        </td>

                        {/* Paystack Subaccount */}
                        <td className="p-4 text-center">
                          {comp.paystackSubaccountCode ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {comp.paystackSubaccountCode}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Pending Bank</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(comp.id, comp.status)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                              comp.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                : comp.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            {comp.status === 'pending' ? 'Pending Review' : comp.status || 'Active'}
                          </button>
                        </td>

                        {/* Actions / Drill-down */}
                        <td className="p-4 text-right space-x-1 whitespace-nowrap">
                          <Link
                            href={`/cream/company/${comp.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold text-xs inline-flex items-center gap-1 transition-all"
                            title="Drill down into customers, payments, incidents, and revenue"
                          >
                            <span className="material-symbols-outlined text-sm">query_stats</span>
                            Manage
                          </Link>

                          <Link
                            href={`/cream/company/${comp.id}/branding`}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs inline-flex items-center gap-1 transition-all"
                            title="Configure white-label look and feel, colors, and website CI"
                          >
                            <span className="material-symbols-outlined text-sm">palette</span>
                            Look & Feel
                          </Link>

                          <Link
                            href={`/cream/company/${comp.id}/stock`}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs inline-flex items-center gap-1 transition-all"
                            title="Manage Sentinel toggles and custom security hardware"
                          >
                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                            Stock
                          </Link>

                          <Link
                            href={comp.isDemo ? "#demo-company" : `/control-room?companyId=${comp.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 inline-block align-middle"
                            title="Launch Dispatch Control Room"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_browser</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Partner & Hardware Revenue Model */}
        <PartnerIntegrations />

        <section className="glass-panel rounded-2xl p-5 border border-white/10 bg-[#080d19]">
          <h2 className="text-lg font-bold text-secondary">Paystack Split Payment Model (CREAM 1%)</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Automated multi-tenant financial settlements via Paystack Subaccounts
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs text-slate-300">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <strong className="text-white block mb-1">1. Customer Payment</strong>
              <span>Subscriber pays SafeLink monthly fee or purchases hardware using card / instant EFT.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <strong className="text-white block mb-1">2. CREAM Platform Fee</strong>
              <span>Paystack routes 1% commission to the CREAM master account directly.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <strong className="text-white block mb-1">3. Automated T+1 Settlement</strong>
              <span>99% net proceeds settle directly into the security company&apos;s verified bank account.</span>
            </div>
          </div>
        </section>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-purple-500/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">person_add</span>
                <h3 className="text-base font-bold text-white">Generate Partner Invite Link</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {inviteResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs">
                  <p className="font-bold text-sm text-white mb-1">Invite Link Ready!</p>
                  <p>Send this link to {inviteResult.companyName}. It directs to <Link href="/company-signup" className="underline font-semibold text-white">/company-signup</Link> to complete onboarding.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Onboarding Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteResult.fullUrl}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteResult.fullUrl);
                        setCopiedInvite(true);
                        setTimeout(() => setCopiedInvite(false), 2000);
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                    >
                      {copiedInvite ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setShowInviteModal(false); setInviteResult(null); }}
                    className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-300 hover:bg-white/10"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Security Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Armed Response"
                    value={inviteForm.companyName}
                    onChange={(e) => setInviteForm({ ...inviteForm, companyName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="operations@apexresponse.co.za"
                    value={inviteForm.contactEmail}
                    onChange={(e) => setInviteForm({ ...inviteForm, contactEmail: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Administrative Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved at Johannesburg security conference"
                    value={inviteForm.notes}
                    onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
                  >
                    Create Invite Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Expanded Onboard Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-purple-500/30 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">Direct Onboard Security Company</h2>
                <p className="text-xs text-slate-400">Configure partner tenant profile, legal registrations, and settlement banking</p>
              </div>
              <button
                onClick={() => setShowAddCompanyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-6">
              {/* Instant Website CI Ingestor */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">auto_fix_high</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Instant Website CI Ingestor</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">Fast Onboarding</span>
                </div>
                <p className="text-xs text-slate-300">
                  Insert the security company&apos;s website URL. SafeLink will scrape their CI, logo, brand colors, typography/font, and phone number to auto-configure their white-label app.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://sovereignintervention.co.za"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-secondary"
                  />
                  <button
                    type="button"
                    onClick={handleScrapeWebsiteCI}
                    disabled={isScraping}
                    className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
                  >
                    <span className="material-symbols-outlined text-sm">{isScraping ? 'sync' : 'travel_explore'}</span>
                    {isScraping ? 'Ingesting...' : '⚡ Ingest CI'}
                  </button>
                </div>
                {scrapeStatus && (
                  <p className={`text-xs font-medium flex items-center gap-1 ${scrapeStatus.includes('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
                    <span className="material-symbols-outlined text-sm">{scrapeStatus.includes('Error') ? 'error' : 'check_circle'}</span>
                    {scrapeStatus}
                  </p>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">1. Company Identity</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Company Trading Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Security"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tenant Slug / ID</label>
                    <input
                      type="text"
                      placeholder="e.g. apex_security"
                      value={newCompany.slug}
                      onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">CIPC Registration Number</label>
                    <input
                      type="text"
                      placeholder="2021/123456/07"
                      value={newCompany.registrationNumber}
                      onChange={(e) => setNewCompany({ ...newCompany, registrationNumber: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">PSIRA Registration Number</label>
                    <input
                      type="text"
                      placeholder="PSIRA-2024/99182"
                      value={newCompany.psiraNumber}
                      onChange={(e) => setNewCompany({ ...newCompany, psiraNumber: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">24/7 Dispatch Phone</label>
                    <input
                      type="tel"
                      placeholder="+27 11 000 0000"
                      value={newCompany.dispatchPhone}
                      onChange={(e) => setNewCompany({ ...newCompany, dispatchPhone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="operations@apex.co.za"
                      value={newCompany.contactEmail}
                      onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Banking & Paystack Subaccount */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">2. Settlement Banking (Paystack Split 1% CREAM)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Bank</label>
                    <select
                      value={newCompany.bankCode}
                      onChange={(e) => setNewCompany({ ...newCompany, bankCode: e.target.value })}
                      className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      {SA_BANKS.map(b => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="62000000000"
                      value={newCompany.accountNumber}
                      onChange={(e) => setNewCompany({ ...newCompany, accountNumber: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Integrations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">3. Systems & Hardware Brand</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Accounting ERP Provider</label>
                    <select
                      value={newCompany.accountingProvider}
                      onChange={(e) => setNewCompany({ ...newCompany, accountingProvider: e.target.value })}
                      className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="sage">Sage Pastel / Sage Cloud</option>
                      <option value="xero">Xero</option>
                      <option value="zoho">Zoho Books</option>
                      <option value="quickbooks">QuickBooks</option>
                      <option value="patriot">Patriot Systems</option>
                      <option value="listener">Listener ERP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Primary Camera Brand</label>
                    <select
                      value={newCompany.cameraBrand}
                      onChange={(e) => setNewCompany({ ...newCompany, cameraBrand: e.target.value })}
                      className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                    >
                      <option value="Hikvision">Hikvision</option>
                      <option value="Dahua">Dahua</option>
                      <option value="EZViz">EZViz</option>
                      <option value="Uniview">Uniview</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 disabled:opacity-50"
                >
                  {savingCompany ? 'Onboarding...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
