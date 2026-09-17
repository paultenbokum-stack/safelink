'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useBrandTheme, getBrandPreset } from '@/lib/brand-context';
import { useTheme } from '@/lib/theme-context';

const DEFAULT_SENTINEL_PRODUCTS = [
  { id: 'sentinel-sos-fob', name: 'Sentinel LTE SOS Panic Fob', range: 'Core', category: 'Personal Panic', costPrice: 450, sellingPrice: 890, desc: 'Waterproof multi-network GPS panic fob with haptic confirmation', badge: 'Best Seller', enabled: true, locked: true },
  { id: 'sentinel-asset-tag', name: 'Sentinel GPS Asset & Vehicle Beacon', range: 'Vehicle', category: 'GPS Tracking', costPrice: 780, sellingPrice: 1450, desc: 'Hardwired / magnetic rechargeable asset tracker with live telematics', badge: 'Fleet Favorite', enabled: true, locked: true },
  { id: 'sentinel-vehicle-ble', name: 'Sentinel BLE Smart Gateway', range: 'Vehicle', category: 'Bluetooth Telemetry', costPrice: 290, sellingPrice: 590, desc: 'Vehicle proximity sensor and auto-arming duress receiver', badge: 'Standard', enabled: true, locked: true },
  { id: 'sentinel-pet-collar', name: 'Sentinel Pet & K9 Security Collar', range: 'Specialty', category: 'K9 Tracking', costPrice: 380, sellingPrice: 750, desc: 'Lightweight waterproof K9 tracking beacon with virtual geofence', badge: 'K9 Unit', enabled: true, locked: true },
];

export const getCustomProductsForCompany = (cid, pName) => {
  const name = pName || cid?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Partner';
  const sku = (cid || 'SEC').toUpperCase().slice(0, 3);
  return [
    { id: `${cid}_prod_1`, name: `${name} Tactical Perimeter Beam Sensor`, sku: `${sku}-BEAM-01`, category: 'Perimeter Security', costPrice: 1200, sellingPrice: 2450, stockQty: 35, locked: false },
    { id: `${cid}_prod_2`, name: `${name} Rapid Response Mobile Panic Receiver`, sku: `${sku}-RX-02`, category: 'Control Room Hardware', costPrice: 850, sellingPrice: 1650, stockQty: 42, locked: false },
    { id: `${cid}_prod_3`, name: `${name} Armoured Vehicle Dashcam & Telematics`, sku: `${sku}-DASH-09`, category: 'Fleet Hardware', costPrice: 2200, sellingPrice: 3800, stockQty: 18, locked: false },
  ];
};

export default function CompanyStockPage({ params: paramsPromise }) {
  const resolvedParams = paramsPromise && typeof paramsPromise.then === 'function' ? React.use(paramsPromise) : paramsPromise;
  const companyId = resolvedParams?.companyId;
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

  // Dynamic branding CI tokens + Theme-aware palettes
  const partnerName = effectiveBrand?.partnerName || preset.partnerName;
  const logoUrl = effectiveBrand?.logoUrl || preset.logoUrl;
  const accentColor = effectiveBrand?.highlightedButtonBg || preset.highlightedButtonBg || '#D4AF37';
  const accentTextColor = effectiveBrand?.highlightedButtonText || preset.highlightedButtonText || '#04070E';
  const headerBgColor = isDark ? (effectiveBrand?.headerBgColor || preset.headerBgColor || '#04070E') : '#FFFFFF';
  const pageBgColor = isDark ? (effectiveBrand?.pageBgColor || preset.pageBgColor || '#040D16') : '#F8FAFC';
  const buttonBgColor = isDark ? (effectiveBrand?.buttonBgColor || preset.buttonBgColor || '#0F1A26') : '#FFFFFF';

  const [loading, setLoading] = useState(false);
  const [sentinelProducts, setSentinelProducts] = useState(DEFAULT_SENTINEL_PRODUCTS);
  const [customProducts, setCustomProducts] = useState(() => getCustomProductsForCompany(companyId, partnerName));
  const [sales, setSales] = useState({ sentinelSold: 48, customSold: 22 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '', category: 'Security Hardware', costPrice: '', sellingPrice: '', stockQty: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setCompanyId(companyId);

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('safelink_brand_' + companyId);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.partnerName) setCompanyBrand(parsed);
        }
      } catch {}
    }

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
      .catch(err => console.warn('[company-stock] Error fetching company branding:', err));

    const handleBrandOverride = (e) => {
      if (e.detail) setCompanyBrand(e.detail);
    };
    window.addEventListener('safelink_brand_updated', handleBrandOverride);
    return () => window.removeEventListener('safelink_brand_updated', handleBrandOverride);
  }, [companyId, setCompanyId]);

  useEffect(() => {
    if (companyId) {
      setCustomProducts(getCustomProductsForCompany(companyId, partnerName));
    }
  }, [companyId, partnerName]);

  const fetchStock = useCallback(async () => {
    if (!companyId) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/cream/company/${companyId}/stock`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        if (json.sentinelProducts?.length) setSentinelProducts(json.sentinelProducts);
        if (json.customProducts?.length) setCustomProducts(json.customProducts);
        if (json.sales) setSales(json.sales);
      }
    } catch (err) {
      console.warn('Live stock fetch failed, using rich demo catalogue:', err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, user]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const toggleSentinel = async (productId, enabled) => {
    setSentinelProducts(prev => prev.map(p => p.id === productId ? { ...p, enabled } : p));
    try {
      if (user) {
        const token = await user.getIdToken();
        await fetch(`/api/cream/company/${companyId}/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'toggle_sentinel', productId, enabled }),
        });
      }
    } catch (err) { console.error('Toggle failed:', err); }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;
    setSaving(true);
    const addedItem = {
      id: `custom_${Date.now()}`,
      ...newProduct,
      costPrice: Number(newProduct.costPrice) || 0,
      sellingPrice: Number(newProduct.sellingPrice) || 0,
      stockQty: Number(newProduct.stockQty) || 0,
      locked: false,
    };
    setCustomProducts(prev => [...prev, addedItem]);
    try {
      if (user) {
        const token = await user.getIdToken();
        await fetch(`/api/cream/company/${companyId}/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'create_custom', product: addedItem }),
        });
      }
    } catch (err) { console.error('Create product failed:', err); }
    finally {
      setSaving(false);
      setShowAddModal(false);
      setNewProduct({ name: '', sku: '', description: '', category: 'Security Hardware', costPrice: '', sellingPrice: '', stockQty: '' });
    }
  };

  const deleteCustom = async (productId) => {
    if (!confirm('Remove this product from inventory?')) return;
    setCustomProducts(prev => prev.filter(p => p.id !== productId));
    try {
      if (user) {
        const token = await user.getIdToken();
        await fetch(`/api/cream/company/${companyId}/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'delete_custom', productId }),
        });
      }
    } catch (err) { console.error('Delete failed:', err); }
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}
      style={{
        backgroundColor: pageBgColor,
        backgroundImage: `radial-gradient(circle at 50% -10%, ${accentColor}${isDark ? '18' : '10'} 0%, transparent 60%)`,
      }}
    >
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
            href={`/cream/company/${companyId}`}
            className="w-11 h-11 rounded-xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: isDark ? `${accentColor}35` : '#CBD5E1',
              color: accentColor,
              backgroundColor: isDark ? `${accentColor}12` : `${accentColor}10`,
            }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          {/* Emblem */}
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
            <h1 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {partnerName} — Stock & Hardware
            </h1>
            <p className={`text-xs ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>
              Sentinel IoT products & company proprietary hardware catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
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

          <span
            className="px-3 py-2 rounded-xl font-bold border"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}35`,
              color: isDark ? accentColor : '#92400E',
            }}
          >
            Sentinel Sold: {sales.sentinelSold || 48}
          </span>
          <span
            className="px-3 py-2 rounded-xl font-bold border"
            style={{
              backgroundColor: 'rgba(56,161,105,0.15)',
              borderColor: 'rgba(56,161,105,0.35)',
              color: '#38a169',
            }}
          >
            Custom Sold: {sales.customSold || 22}
          </span>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {loading && (
          <div className="text-center py-6 text-on-surface-variant flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin" style={{ color: accentColor }}>progress_activity</span>
            <span>Synchronizing hardware inventory...</span>
          </div>
        )}

        {/* ── SENTINEL PRODUCTS SECTION ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span className="material-symbols-outlined text-lg" style={{ color: accentColor }}>diamond</span>
                <span>Sentinel IoT Ecosystem Products</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>
                Central SafeLink catalogue. Toggle which hardware devices {partnerName} distributes to subscribers.
              </p>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${isDark ? 'text-slate-400 border-white/10 bg-white/5' : 'text-slate-600 border-slate-200 bg-slate-100'}`}>
              Standardized Hardware Pricing
            </span>
          </div>

          <div
            className="border rounded-2xl overflow-hidden shadow-xl"
            style={{
              backgroundColor: isDark ? `${buttonBgColor}80` : '#FFFFFF',
              borderColor: isDark ? `${accentColor}25` : '#E2E8F0',
              boxShadow: isDark ? undefined : '0 4px 20px -2px rgba(0,0,0,0.05)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b uppercase tracking-wider text-[10px] ${isDark ? 'border-white/10 text-on-surface-variant bg-black/40' : 'border-slate-200 text-slate-600 bg-slate-100/90'}`}>
                  <tr>
                    <th className="p-4 w-20">Enabled</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Range</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Wholesale Cost</th>
                    <th className="p-4">Subscriber Price</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
                  {sentinelProducts.map(p => (
                    <tr key={p.id} className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} transition-colors`}>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => toggleSentinel(p.id, !p.enabled)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${p.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${p.enabled ? 'left-5' : 'left-1'}`} />
                        </button>
                      </td>
                      <td className="p-4">
                        <div className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span>{p.name}</span>
                          {p.badge && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border"
                              style={{
                                backgroundColor: `${accentColor}15`,
                                color: isDark ? accentColor : '#92400E',
                                borderColor: `${accentColor}35`,
                              }}
                            >
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>{p.desc}</p>
                      </td>
                      <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{p.range}</td>
                      <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{p.category}</td>
                      <td className={`p-4 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>R {p.costPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 font-mono font-bold text-emerald-500">R {p.sellingPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── CUSTOM HARDWARE & SECURITY PRODUCTS ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span className="material-symbols-outlined text-lg" style={{ color: accentColor }}>shield</span>
                <span>{partnerName} Custom Hardware & Devices</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>
                Custom security hardware, beams, alarms, gate links & CCTV items sold by {partnerName}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 border"
              style={{
                backgroundColor: accentColor,
                color: accentTextColor,
                borderColor: accentColor,
                boxShadow: `0 4px 16px -2px ${accentColor}40`,
              }}
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Add Custom Product</span>
            </button>
          </div>

          <div
            className="border rounded-2xl overflow-hidden shadow-xl"
            style={{
              backgroundColor: isDark ? `${buttonBgColor}80` : '#FFFFFF',
              borderColor: isDark ? `${accentColor}25` : '#E2E8F0',
              boxShadow: isDark ? undefined : '0 4px 20px -2px rgba(0,0,0,0.05)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b uppercase tracking-wider text-[10px] ${isDark ? 'border-white/10 text-on-surface-variant bg-black/40' : 'border-slate-200 text-slate-600 bg-slate-100/90'}`}>
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">SKU Code</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Cost Price</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Stock Units</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'divide-y divide-white/5' : 'divide-y divide-slate-100'}>
                  {customProducts.map(p => (
                    <tr key={p.id} className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} transition-colors`}>
                      <td className={`p-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</td>
                      <td className={`p-4 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p.sku || '—'}</td>
                      <td className={`p-4 ${isDark ? 'text-on-surface-variant' : 'text-slate-600'}`}>{p.category}</td>
                      <td className={`p-4 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>R {p.costPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 font-mono font-bold text-emerald-500">R {p.sellingPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-slate-100 text-slate-800'}`}>
                          {p.stockQty || 0} in stock
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => deleteCustom(p.id)}
                          className="text-xs text-rose-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className={`p-8 text-center ${isDark ? 'text-on-surface-variant' : 'text-slate-500'}`}>
                        No custom hardware products created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal for adding custom products */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl transition-all"
              style={{
                backgroundColor: isDark ? headerBgColor : '#FFFFFF',
                borderColor: isDark ? `${accentColor}40` : '#E2E8F0',
              }}
            >
              <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Custom Security Hardware</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddCustom} className="space-y-4 text-xs">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${partnerName} Tactical Perimeter Beam`}
                    value={newProduct.name}
                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-black/50 border-white/10 text-white focus:border-amber-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>SKU Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SOV-BEAM-02"
                      value={newProduct.sku}
                      onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-black/50 border-white/10 text-white focus:border-amber-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                    />
                  </div>
                  <div>
                    <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Category</label>
                    <input
                      type="text"
                      placeholder="Perimeter Security"
                      value={newProduct.category}
                      onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-black/50 border-white/10 text-white focus:border-amber-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cost (ZAR)</label>
                    <input
                      type="number"
                      required
                      placeholder="1200"
                      value={newProduct.costPrice}
                      onChange={e => setNewProduct(prev => ({ ...prev, costPrice: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-black/50 border-white/10 text-white focus:border-amber-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                    />
                  </div>
                  <div>
                    <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Selling (ZAR)</label>
                    <input
                      type="number"
                      required
                      placeholder="2450"
                      value={newProduct.sellingPrice}
                      onChange={e => setNewProduct(prev => ({ ...prev, sellingPrice: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-black/50 border-white/10 text-white focus:border-amber-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                    />
                  </div>
                  <div>
                    <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Stock Qty</label>
                    <input
                      type="number"
                      required
                      placeholder="25"
                      value={newProduct.stockQty}
                      onChange={e => setNewProduct(prev => ({ ...prev, stockQty: e.target.value }))}
                      className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-black/50 border-white/10 text-white focus:border-amber-400' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                    />
                  </div>
                </div>

                <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`px-4 py-2 rounded-xl border ${isDark ? 'border-white/10 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl font-bold transition-all"
                    style={{
                      backgroundColor: accentColor,
                      color: accentTextColor,
                    }}
                  >
                    {saving ? 'Adding...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
