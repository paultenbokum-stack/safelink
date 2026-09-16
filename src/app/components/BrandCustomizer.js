'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SOVEREIGN_DEFAULT_BRAND, useBrandTheme } from '@/lib/brand-context';

const PRESET_HEADER_IMAGES = [
  { id: 'none', label: 'None', url: '' },
  { id: 'carbon', label: 'Tactical Carbon', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80' },
  { id: 'grid', label: 'Security Mesh', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
  { id: 'night', label: 'Night Watch', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80' },
];

const PRESET_PAGE_IMAGES = [
  { id: 'none', label: 'None', url: '' },
  { id: 'contour', label: 'Topographic Security Grid', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  { id: 'dark_mesh', label: 'Dark Carbon Weave', url: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?auto=format&fit=crop&w=1200&q=80' },
  { id: 'obsidian', label: 'Obsidian Fiber', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80' },
];

const PRESET_LOGOS = [
  { id: 'sovereign', label: 'Sovereign Gold Emblem', url: '/sovereign-intervention-logo.png' },
  { id: 'safelink', label: 'SafeLink Shield', url: '/safelink-shield.png' },
  { id: 'sb', label: 'Security Brokers', url: '/presentation/security-brokers-logo.png' },
];

export default function BrandCustomizer({ companyId = 'sovereign_intervention', initialBranding = null, onSaved = null }) {
  const { refreshBrand } = useBrandTheme();
  const [loading, setLoading] = useState(!initialBranding);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState('');

  // Scraper State
  const [scrapeUrl, setScrapeUrl] = useState(companyId === 'sovereign_intervention' ? 'https://sovereignintervention.co.za' : '');
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scrapeError, setScrapeError] = useState('');
  
  // Customization state matching Guestwave specs
  const [branding, setBranding] = useState(() => initialBranding || { ...SOVEREIGN_DEFAULT_BRAND, companyId });

  const handleScrapeWebsite = async () => {
    if (!scrapeUrl) {
      setScrapeError('Please enter a website URL to scrape.');
      return;
    }
    setScraping(true);
    setScrapeError('');
    setScrapeResult(null);
    try {
      const res = await fetch('/api/cream/scrape-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: scrapeUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to ingest website branding.');
      }
      
      const newBranding = {
        ...branding,
        ...data.branding,
        companyId,
      };

      setBranding(newBranding);
      setScrapeResult({
        name: data.extracted.partnerName,
        font: data.extracted.detectedFont,
        colors: data.extracted.detectedColors,
        logo: data.branding.logoUrl,
        phones: data.extracted.phones,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('safelink_brand_updated', { detail: newBranding }));
      }
    } catch (err) {
      setScrapeError(err.message || 'Scraping failed.');
    } finally {
      setScraping(false);
    }
  };

  // Load from API if no initial branding
  useEffect(() => {
    if (!initialBranding && companyId) {
      setLoading(true);
      fetch(`/api/cream/company/${companyId}/branding`)
        .then(res => res.json())
        .then(data => {
          if (data.branding) setBranding(data.branding);
        })
        .catch(err => console.error('Failed to load branding:', err))
        .finally(() => setLoading(false));
    }
  }, [companyId, initialBranding]);

  const updateField = (field, value) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveToast('');
    try {
      const res = await fetch(`/api/cream/company/${companyId}/branding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save branding');

      // Notify any live client views in the same browser window
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('safelink_brand_updated', { detail: branding }));
      }
      refreshBrand?.();
      onSaved?.(branding);
      setSaveToast('✓ Published live to client mobile devices!');
      setTimeout(() => setSaveToast(''), 4000);
    } catch (err) {
      alert('Error saving branding: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to Sovereign Intervention standard brand defaults?')) {
      const resetBrand = { ...SOVEREIGN_DEFAULT_BRAND, companyId };
      setBranding(resetBrand);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('safelink_brand_updated', { detail: resetBrand }));
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-purple-400">progress_activity</span>
        <p className="text-xs">Loading White-Label Customization Studio…</p>
      </div>
    );
  }

  // Resolve font style for preview
  const fontStyle = branding.fontFamily === 'classic'
    ? '"Cinzel", serif'
    : branding.fontFamily === 'simple'
      ? '"Space Grotesk", sans-serif'
      : '"Inter", sans-serif';

  return (
    <div className="space-y-8">
      {/* Top Banner / Tenant Indicator */}
      <div className="bg-gradient-to-r from-[#0d091a] via-[#15102a] to-[#0d091a] border border-purple-500/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">White-Label Security Engine Active</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {branding.partnerName || 'Security Partner'} Look & Feel Studio
          </h2>
          <p className="text-xs text-purple-200/70">
            Configure partner CI, button types, opacity, typography and header images. Changes propagate instantly to subscriber devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-on-surface-variant transition-all"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">publish</span>
            {saving ? 'Saving…' : 'Save & Publish'}
          </button>
          <Link
            href={`/dashboard?companyId=${companyId}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Live Mobile App
          </Link>
        </div>
      </div>

      {/* Auto-Ingest from Security Website Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-purple-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <span className="material-symbols-outlined text-xl">travel_explore</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Instant Website CI Ingestor</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI Auto-Detection
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant">
                Enter the security partner&apos;s website URL to automatically extract their logo, brand colors, typography/font, and header styling.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">link</span>
              <input
                type="url"
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                placeholder="https://sovereignintervention.co.za"
                className="w-full bg-[#04070e] border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <button
              onClick={handleScrapeWebsite}
              disabled={scraping}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${scraping ? 'animate-spin' : ''}`}>
                {scraping ? 'progress_activity' : 'bolt'}
              </span>
              {scraping ? 'Ingesting…' : 'Ingest CI & Apply'}
            </button>
          </div>
        </div>

        {scrapeError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{scrapeError}</span>
          </div>
        )}

        {scrapeResult && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Successfully ingested CI from {scrapeUrl}!</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-semibold">
                Company: <strong className="text-white">{scrapeResult.name}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-semibold">
                Font: <strong className="text-amber-300 capitalize">{scrapeResult.font}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-semibold flex items-center gap-1.5">
                Colors:
                {scrapeResult.colors.slice(0, 3).map(c => (
                  <span key={c} className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: c }} />
                    <span className="font-mono text-[10px]">{c}</span>
                  </span>
                ))}
              </span>
              {scrapeResult.phones?.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-semibold">
                  Phone: <strong className="text-white">{scrapeResult.phones[0]}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {saveToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Studio Grid: Left Config Form / Right Mobile Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT COLUMN: Guestwave-Style Styling Controls ── */}
        <div className="lg:col-span-7 bg-[#0b0f19] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 text-[#f1f5f9]">

          {/* 1. LOGO */}
          <section className="space-y-3 pb-6 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Logo</h3>
              <p className="text-xs text-on-surface-variant">Your brand mark, shown in the header</p>
            </div>

            <div className="bg-[#04070e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="w-32 h-14 bg-black/60 rounded-lg flex items-center justify-center p-2 border border-white/5 overflow-hidden">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-on-surface-variant italic">No Logo</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select Brand Logo"
                  value={PRESET_LOGOS.some(p => p.url === branding.logoUrl) ? branding.logoUrl : 'custom'}
                  onChange={e => {
                    if (e.target.value !== 'custom') updateField('logoUrl', e.target.value);
                  }}
                  className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  {PRESET_LOGOS.map(p => (
                    <option key={p.id} value={p.url} className="bg-gray-900">{p.label}</option>
                  ))}
                  <option value="custom" className="bg-gray-900">Custom URL…</option>
                </select>
                <button
                  onClick={() => {
                    const next = prompt('Enter image URL for logo:', branding.logoUrl || '');
                    if (next !== null) updateField('logoUrl', next);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all"
                >
                  Replace
                </button>
                <button
                  onClick={() => updateField('logoUrl', '')}
                  className="px-3 py-1.5 rounded-lg text-amber-400 hover:text-amber-300 text-xs font-semibold transition-all"
                >
                  Remove
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={branding.showLogoInHeader !== false}
                onChange={e => updateField('showLogoInHeader', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-white/10 border-white/20 focus:ring-amber-400"
              />
              <span className="text-xs font-medium text-slate-300">Show the logo in the guest header</span>
            </label>
          </section>


          {/* 2. HEADER */}
          <section className="space-y-4 pb-6 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Header</h3>
              <p className="text-xs text-on-surface-variant">The top bar — table label, logo, venue name</p>
            </div>

            {/* Background Colour */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Background Colour
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {['#04070E', '#0A1128', '#1C1917', '#86989C'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField('headerBgColor', c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${branding.headerBgColor === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.headerBgColor }} />
                  <input
                    type="text"
                    value={branding.headerBgColor || ''}
                    onChange={e => updateField('headerBgColor', e.target.value)}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#04070E"
                  />
                </div>
              </div>
            </div>

            {/* Background Image - Optional */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Background Image - Optional
              </label>
              <div className="bg-[#04070e] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="h-12 w-32 bg-black/60 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                  {branding.headerBgImage ? (
                    <img src={branding.headerBgImage} alt="Header Bg" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No image set</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Select Header Image Preset"
                    value={PRESET_HEADER_IMAGES.some(p => p.url === branding.headerBgImage) ? branding.headerBgImage : 'custom'}
                    onChange={e => {
                      if (e.target.value !== 'custom') updateField('headerBgImage', e.target.value);
                    }}
                    className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    {PRESET_HEADER_IMAGES.map(p => (
                      <option key={p.id} value={p.url} className="bg-gray-900">{p.label}</option>
                    ))}
                    <option value="custom" className="bg-gray-900">Custom URL…</option>
                  </select>
                  <button
                    onClick={() => {
                      const next = prompt('Enter background image URL for header:', branding.headerBgImage || '');
                      if (next !== null) updateField('headerBgImage', next);
                    }}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => updateField('headerBgImage', '')}
                    className="px-2 py-1 text-amber-400 hover:text-amber-300 text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Sits behind the header. The logo gets a rounded plate in the header colour so it stays legible.
              </p>
            </div>

            {/* Text Colour */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Text Colour
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => updateField('headerTextAuto', true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${branding.headerTextAuto ? 'border-amber-400 bg-amber-400/10 text-amber-300 ring-2 ring-amber-400/20' : 'border-white/20 bg-white/5 text-slate-300'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  Auto
                </button>
                {['#D4AF37', '#FFFFFF', '#04070E', '#86989C'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      updateField('headerTextAuto', false);
                      updateField('headerTextColor', c);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${!branding.headerTextAuto && branding.headerTextColor === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.headerTextColor }} />
                  <input
                    type="text"
                    value={branding.headerTextColor || ''}
                    onChange={e => {
                      updateField('headerTextAuto', false);
                      updateField('headerTextColor', e.target.value);
                    }}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#D4AF37"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Auto picks black or white for best contrast with the header.</p>
            </div>
          </section>


          {/* 3. PAGE */}
          <section className="space-y-4 pb-6 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Page</h3>
              <p className="text-xs text-on-surface-variant">The body below the header — where the buttons sit</p>
            </div>

            {/* Background Colour */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Background Colour
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {['#040D16', '#0B0F17', '#121212', '#F2EDE4'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField('pageBgColor', c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${branding.pageBgColor === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.pageBgColor }} />
                  <input
                    type="text"
                    value={branding.pageBgColor || ''}
                    onChange={e => updateField('pageBgColor', e.target.value)}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#040D16"
                  />
                </div>
              </div>
            </div>

            {/* Background Image - Optional */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Background Image - Optional
              </label>
              <div className="bg-[#04070e] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-4">
                <div className="h-12 w-32 bg-black/60 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                  {branding.pageBgImage ? (
                    <img src={branding.pageBgImage} alt="Page Bg" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No image set</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Select Page Background Image Preset"
                    value={PRESET_PAGE_IMAGES.some(p => p.url === branding.pageBgImage) ? branding.pageBgImage : 'custom'}
                    onChange={e => {
                      if (e.target.value !== 'custom') updateField('pageBgImage', e.target.value);
                    }}
                    className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    {PRESET_PAGE_IMAGES.map(p => (
                      <option key={p.id} value={p.url} className="bg-gray-900">{p.label}</option>
                    ))}
                    <option value="custom" className="bg-gray-900">Custom URL…</option>
                  </select>
                  <button
                    onClick={() => {
                      const next = prompt('Enter background image URL for body:', branding.pageBgImage || '');
                      if (next !== null) updateField('pageBgImage', next);
                    }}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => updateField('pageBgImage', '')}
                    className="px-2 py-1 text-amber-400 hover:text-amber-300 text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Text Colour */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Text Colour
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {['#06222A', '#3A2A20', '#D4AF37', '#F8FAFC'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField('pageTextColor', c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${branding.pageTextColor === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.pageTextColor }} />
                  <input
                    type="text"
                    value={branding.pageTextColor || ''}
                    onChange={e => updateField('pageTextColor', e.target.value)}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#F8FAFC"
                  />
                </div>
              </div>
            </div>

            {/* FONT */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Font
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'modern', label: 'Modern', sub: 'Inter', fontClass: 'font-sans' },
                  { id: 'classic', label: 'Classic', sub: 'Cinzel', fontClass: 'font-serif' },
                  { id: 'simple', label: 'Simple', sub: 'Space Grotesk', fontClass: 'font-mono' },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateField('fontFamily', f.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${branding.fontFamily === f.id ? 'border-amber-400 bg-amber-400/10 text-amber-300 ring-2 ring-amber-400/30' : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/30'}`}
                  >
                    <span className={`text-2xl font-bold block mb-1 ${f.fontClass}`}>Ag</span>
                    <span className="text-xs font-semibold block">{f.label}</span>
                    <span className="text-[10px] text-slate-400 block">{f.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>


          {/* 4. HIGHLIGHTED BUTTON */}
          <section className="space-y-4 pb-6 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Highlighted button</h3>
              <p className="text-xs text-on-surface-variant">The first, primary action button (SOS / Panic trigger)</p>
            </div>

            {/* Colour */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Colour
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {['#D4AF37', '#E53E3E', '#FF5722', '#6C5CE7', '#626060'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField('highlightedButtonBg', c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${branding.highlightedButtonBg === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.highlightedButtonBg }} />
                  <input
                    type="text"
                    value={branding.highlightedButtonBg || ''}
                    onChange={e => updateField('highlightedButtonBg', e.target.value)}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#D4AF37"
                  />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Text
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => updateField('highlightedButtonAuto', true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${branding.highlightedButtonAuto ? 'border-amber-400 bg-amber-400/10 text-amber-300 ring-2 ring-amber-400/20' : 'border-white/20 bg-white/5 text-slate-300'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  Auto
                </button>
                {['#04070E', '#FFFFFF', '#D4AF37'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      updateField('highlightedButtonAuto', false);
                      updateField('highlightedButtonText', c);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${!branding.highlightedButtonAuto && branding.highlightedButtonText === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.highlightedButtonText }} />
                  <input
                    type="text"
                    value={branding.highlightedButtonText || ''}
                    onChange={e => {
                      updateField('highlightedButtonAuto', false);
                      updateField('highlightedButtonText', e.target.value);
                    }}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#04070E"
                  />
                </div>
              </div>
            </div>
          </section>


          {/* 5. BUTTONS (Standard Action Buttons) */}
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Buttons</h3>
              <p className="text-xs text-on-surface-variant">The other, non-highlighted action buttons (Armed, Medical, Fire, Towing)</p>
            </div>

            {/* Colour */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Colour
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {['#0F1A26', '#040D16', '#1E293B', '#86989C', '#F2EDE4'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField('buttonBgColor', c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${branding.buttonBgColor === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.buttonBgColor }} />
                  <input
                    type="text"
                    value={branding.buttonBgColor || ''}
                    onChange={e => updateField('buttonBgColor', e.target.value)}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#0F1A26"
                  />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Text
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {['#D4AF37', '#F8FAFC', '#040D16', '#F8FBFC'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField('buttonTextColor', c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border transition-all ${branding.buttonTextColor === c ? 'border-amber-400 scale-110 shadow-md ring-2 ring-amber-400/30' : 'border-white/20 hover:scale-105'}`}
                  />
                ))}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1">
                  <span className="w-5 h-5 rounded-md border border-white/20 shrink-0" style={{ backgroundColor: branding.buttonTextColor }} />
                  <input
                    type="text"
                    value={branding.buttonTextColor || ''}
                    onChange={e => updateField('buttonTextColor', e.target.value)}
                    className="w-20 bg-transparent text-xs font-mono text-white outline-none"
                    placeholder="#D4AF37"
                  />
                </div>
              </div>
            </div>

            {/* OPACITY SLIDER */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Opacity
                </label>
                <span className="text-xs font-bold font-mono text-amber-400">
                  {branding.buttonOpacity ?? 75}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={branding.buttonOpacity ?? 75}
                onChange={e => updateField('buttonOpacity', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <p className="text-[11px] text-slate-400">
                Lower opacity lets a background image show through the buttons.
              </p>
            </div>
          </section>

          {/* Footer note */}
          <div className="pt-4 border-t border-white/10 text-xs text-slate-500">
            Linked tenant: <span className="font-semibold text-slate-300">{branding.partnerName}</span>. Link subscriber profiles to this security partner in CREAM management.
          </div>
        </div>


        {/* ── RIGHT COLUMN: Live Interactive Phone Simulator ── */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-amber-400">smartphone</span>
              Live Subscriber Mobile Preview
            </span>
            <span className="text-[11px] text-slate-400 font-mono">390 × 844 px</span>
          </div>

          {/* Realistic Phone Bezel Frame */}
          <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[360px] aspect-[9/18.5] bg-[#020408] rounded-[48px] p-3 shadow-2xl ring-1 ring-white/20 border-4 border-[#1f2937] overflow-hidden flex flex-col">
            
            {/* Speaker & Dynamic Island Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-white/10 ml-auto mr-3"></div>
            </div>

            {/* Inner Mobile Screen */}
            <div
              className="w-full h-full rounded-[38px] overflow-y-auto overflow-x-hidden flex flex-col relative text-slate-100"
              style={{
                backgroundColor: branding.pageBgColor || '#040D16',
                backgroundImage: branding.pageBgImage ? `url("${branding.pageBgImage}")` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: fontStyle,
                color: branding.pageTextColor || '#F8FAFC',
              }}
            >
              {/* Mobile Status Bar */}
              <div className="pt-2 px-6 flex justify-between items-center text-[10px] font-bold text-slate-400 z-30 shrink-0">
                <span>09:41</span>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">signal_cellular_alt</span>
                  <span className="material-symbols-outlined text-xs">wifi</span>
                  <span className="material-symbols-outlined text-xs">battery_full</span>
                </div>
              </div>

              {/* Mobile Header */}
              <div
                className="px-4 py-3 border-b border-white/10 flex items-center justify-between relative shrink-0 shadow-sm"
                style={{
                  backgroundColor: branding.headerBgColor || '#04070E',
                  backgroundImage: branding.headerBgImage ? `url("${branding.headerBgImage}")` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="flex items-center gap-2.5">
                  {branding.showLogoInHeader !== false && branding.logoUrl ? (
                    <div
                      className="w-9 h-9 rounded-xl p-1 flex items-center justify-center border border-white/10 shadow-sm"
                      style={{ backgroundColor: branding.headerBgColor || '#04070E' }}
                    >
                      <img src={branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <span className="material-symbols-outlined text-sm">shield</span>
                    </div>
                  )}
                  <div>
                    <h4
                      className="text-xs font-bold leading-tight truncate"
                      style={{
                        color: branding.headerTextAuto ? (branding.headerBgColor === '#FFFFFF' ? '#000000' : '#FFFFFF') : (branding.headerTextColor || '#D4AF37')
                      }}
                    >
                      {branding.shortName || branding.partnerName || 'SafeLink'}
                    </h4>
                    <p className="text-[10px] opacity-70 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Protected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base opacity-70">notifications</span>
                  <span className="material-symbols-outlined text-base opacity-70">menu</span>
                </div>
              </div>

              {/* Mobile App Body Content */}
              <div className="p-4 space-y-5 flex-1 pb-16">
                
                {/* Greeting & Armed Status */}
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Subscriber</span>
                    <h3 className="text-base font-extrabold leading-none">Hi Kyle</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Active Armed Circle
                  </span>
                </div>

                {/* Highlighted SOS Primary Button */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div
                    className="w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-xl"
                    style={{
                      backgroundColor: branding.highlightedButtonBg || '#D4AF37',
                      color: branding.highlightedButtonAuto ? '#000000' : (branding.highlightedButtonText || '#04070E'),
                      boxShadow: `0 0 30px ${(branding.highlightedButtonBg || '#D4AF37')}60`,
                    }}
                  >
                    <span className="material-symbols-outlined text-4xl mb-0.5">emergency</span>
                    <span className="text-xl font-extrabold tracking-wider">SOS</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-2">
                    Hold for Armed Dispatch
                  </span>
                </div>

                {/* Action Buttons Grid with Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-75">
                    <span>Quick Services</span>
                    <span className="text-amber-400">All (6)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: 'security', label: 'Armed' },
                      { icon: 'medical_services', label: 'Medical' },
                      { icon: 'local_fire_department', label: 'Fire' },
                      { icon: 'rv_hookup', label: 'Towing' },
                      { icon: 'build', label: 'Tech' },
                      { icon: 'notifications_active', label: 'Test' },
                    ].map(btn => (
                      <div
                        key={btn.label}
                        className="rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/10 backdrop-blur-sm transition-all"
                        style={{
                          backgroundColor: branding.buttonBgColor || '#0F1A26',
                          opacity: (branding.buttonOpacity ?? 75) / 100,
                          color: branding.buttonTextColor || '#D4AF37',
                        }}
                      >
                        <span className="material-symbols-outlined text-xl">{btn.icon}</span>
                        <span className="text-[10px] font-bold tracking-tight">{btn.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* White-Label Network Card */}
                <div className="rounded-xl p-3 border border-white/10 bg-black/40 backdrop-blur-md space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Security Provider</span>
                    <span className="text-[10px] text-emerald-400 font-bold">● PSIRA Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {branding.logoUrl && (
                      <img src={branding.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                    )}
                    <span className="text-xs font-bold text-white">
                      {branding.partnerName || 'Sovereign Intervention'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Mobile Bottom Navigation Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/80 backdrop-blur-md border-t border-white/10 px-6 flex justify-between items-center text-slate-400">
                <span className="material-symbols-outlined text-lg text-amber-400">home</span>
                <span className="material-symbols-outlined text-lg">map</span>
                <span className="material-symbols-outlined text-lg">devices</span>
                <span className="material-symbols-outlined text-lg">person</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Preview updates live as you edit. Click <span className="text-amber-400 font-semibold">Save & Publish</span> to apply to all live devices.
          </p>
        </div>

      </div>
    </div>
  );
}
