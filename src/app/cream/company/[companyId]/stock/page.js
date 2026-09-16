'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useBrandTheme } from '@/lib/brand-context';

const DEFAULT_SENTINEL_PRODUCTS = [
  { id: 'sentinel-sos-fob', name: 'Sentinel LTE SOS Panic Fob', range: 'Core', category: 'Personal Panic', costPrice: 450, sellingPrice: 890, desc: 'Waterproof multi-network GPS panic fob with haptic confirmation', badge: 'Best Seller', enabled: true, locked: true },
  { id: 'sentinel-asset-tag', name: 'Sentinel GPS Asset & Vehicle Beacon', range: 'Vehicle', category: 'GPS Tracking', costPrice: 780, sellingPrice: 1450, desc: 'Hardwired / magnetic rechargeable asset tracker with live telematics', badge: 'Fleet Favorite', enabled: true, locked: true },
  { id: 'sentinel-vehicle-ble', name: 'Sentinel BLE Smart Gateway', range: 'Vehicle', category: 'Bluetooth Telemetry', costPrice: 290, sellingPrice: 590, desc: 'Vehicle proximity sensor and auto-arming duress receiver', badge: 'Standard', enabled: true, locked: true },
  { id: 'sentinel-pet-collar', name: 'Sentinel Pet & K9 Security Collar', range: 'Specialty', category: 'K9 Tracking', costPrice: 380, sellingPrice: 750, desc: 'Lightweight waterproof K9 tracking beacon with virtual geofence', badge: 'K9 Unit', enabled: true, locked: true },
];

const DEFAULT_CUSTOM_PRODUCTS = [
  { id: 'sov_prod_1', name: 'Sovereign Tactical Perimeter Beam Sensor', sku: 'SOV-BEAM-01', category: 'Perimeter Security', costPrice: 1200, sellingPrice: 2450, stockQty: 35, locked: false },
  { id: 'sov_prod_2', name: 'Sovereign Rapid Response Mobile Panic Receiver', sku: 'SOV-RX-02', category: 'Control Room Hardware', costPrice: 850, sellingPrice: 1650, stockQty: 42, locked: false },
  { id: 'sov_prod_3', name: 'Sovereign Armoured Vehicle Dashcam & Telematics', sku: 'SOV-DASH-09', category: 'Fleet Hardware', costPrice: 2200, sellingPrice: 3800, stockQty: 18, locked: false },
];

export default function CompanyStockPage({ params: paramsPromise }) {
  const resolvedParams = paramsPromise && typeof paramsPromise.then === 'function' ? React.use(paramsPromise) : paramsPromise;
  const companyId = resolvedParams?.companyId;
  const { user } = useAuth();
  const { brand } = useBrandTheme();

  // Dynamic branding CI tokens
  const partnerName = brand?.partnerName || 'Sovereign Intervention';
  const logoUrl = brand?.logoUrl || '/sovereign-intervention-logo.png';
  const accentColor = brand?.highlightedButtonBg || '#D4AF37';
  const accentTextColor = brand?.highlightedButtonText || '#04070E';
  const headerBgColor = brand?.headerBgColor || '#04070E';
  const pageBgColor = brand?.pageBgColor || '#040D16';
  const buttonBgColor = brand?.buttonBgColor || '#0F1A26';

  const [loading, setLoading] = useState(false);
  const [sentinelProducts, setSentinelProducts] = useState(DEFAULT_SENTINEL_PRODUCTS);
  const [customProducts, setCustomProducts] = useState(DEFAULT_CUSTOM_PRODUCTS);
  const [sales, setSales] = useState({ sentinelSold: 48, customSold: 22 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '', category: 'Security Hardware', costPrice: '', sellingPrice: '', stockQty: '' });
  const [saving, setSaving] = useState(false);

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
      className="text-on-background min-h-screen font-sans transition-colors duration-300"
      style={{
        backgroundColor: pageBgColor,
        backgroundImage: `radial-gradient(circle at 50% -10%, ${accentColor}18 0%, transparent 60%)`,
      }}
    >
      <header
        className="border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md"
        style={{
          backgroundColor: `${headerBgColor}F0`,
          borderColor: `${accentColor}35`,
          boxShadow: `0 8px 24px -6px ${accentColor}15`,
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/cream/company/${companyId}`}
            className="w-11 h-11 rounded-xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: `${accentColor}35`,
              color: accentColor,
              backgroundColor: `${accentColor}12`,
            }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>

          {/* Emblem */}
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
            <h1 className="text-lg font-black text-white tracking-tight">{partnerName} — Stock & Hardware</h1>
            <p className="text-xs text-on-surface-variant">Sentinel IoT products & company proprietary hardware catalog</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span
            className="px-3 py-1.5 rounded-xl font-bold border"
            style={{
              backgroundColor: `${accentColor}15`,
              borderColor: `${accentColor}35`,
              color: accentColor,
            }}
          >
            Sentinel Sold: {sales.sentinelSold || 48}
          </span>
          <span
            className="px-3 py-1.5 rounded-xl font-bold border"
            style={{
              backgroundColor: 'rgba(56,161,105,0.15)',
              borderColor: 'rgba(56,161,105,0.35)',
              color: '#38a169',
            }}
          >
            Custom Hardware Sold: {sales.customSold || 22}
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
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: accentColor }}>diamond</span>
                <span>Sentinel IoT Ecosystem Products</span>
              </h2>
              <p className="text-xs text-on-surface-variant">Central SafeLink catalogue. Toggle which hardware devices {partnerName} distributes to subscribers.</p>
            </div>
            <span className="text-[11px] font-bold text-slate-400 px-3 py-1 rounded-full border border-white/10 bg-white/5">
              Standardized Hardware Pricing
            </span>
          </div>

          <div
            className="border rounded-2xl overflow-hidden shadow-xl"
            style={{
              backgroundColor: `${buttonBgColor}80`,
              borderColor: `${accentColor}25`,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px] bg-black/40">
                  <tr>
                    <th className="p-4 w-20">Enabled</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Range</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Wholesale Cost</th>
                    <th className="p-4">Subscriber Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sentinelProducts.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => toggleSentinel(p.id, !p.enabled)}
                          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${p.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${p.enabled ? 'left-5' : 'left-1'}`} />
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{p.name}</span>
                          {p.badge && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border"
                              style={{
                                backgroundColor: `${accentColor}15`,
                                color: accentColor,
                                borderColor: `${accentColor}35`,
                              }}
                            >
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{p.desc}</p>
                      </td>
                      <td className="p-4 text-on-surface-variant">{p.range}</td>
                      <td className="p-4 text-on-surface-variant">{p.category}</td>
                      <td className="p-4 font-mono text-slate-300">R {p.costPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">R {p.sellingPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
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
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: accentColor }}>shield</span>
                <span>{partnerName} Custom Hardware & Devices</span>
              </h2>
              <p className="text-xs text-on-surface-variant">Custom security hardware, beams, alarms, gate links & CCTV items sold by {partnerName}.</p>
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
              backgroundColor: `${buttonBgColor}80`,
              borderColor: `${accentColor}25`,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px] bg-black/40">
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
                <tbody className="divide-y divide-white/5">
                  {customProducts.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-4 font-bold text-white">{p.name}</td>
                      <td className="p-4 font-mono text-slate-300">{p.sku || '—'}</td>
                      <td className="p-4 text-on-surface-variant">{p.category}</td>
                      <td className="p-4 font-mono text-slate-300">R {p.costPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">R {p.sellingPrice?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white">
                          {p.stockQty || 0} in stock
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => deleteCustom(p.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 transition-colors p-1"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-on-surface-variant">
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
              className="w-full max-w-lg rounded-2xl border p-6 space-y-4 shadow-2xl"
              style={{
                backgroundColor: headerBgColor,
                borderColor: `${accentColor}40`,
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white">Add Custom Security Hardware</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddCustom} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sovereign Tactical Perimeter Beam"
                    value={newProduct.name}
                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">SKU Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SOV-BEAM-02"
                      value={newProduct.sku}
                      onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="Perimeter Security"
                      value={newProduct.category}
                      onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Cost (ZAR)</label>
                    <input
                      type="number"
                      required
                      placeholder="1200"
                      value={newProduct.costPrice}
                      onChange={e => setNewProduct(prev => ({ ...prev, costPrice: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Selling (ZAR)</label>
                    <input
                      type="number"
                      required
                      placeholder="2450"
                      value={newProduct.sellingPrice}
                      onChange={e => setNewProduct(prev => ({ ...prev, sellingPrice: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Stock Qty</label>
                    <input
                      type="number"
                      required
                      placeholder="25"
                      value={newProduct.stockQty}
                      onChange={e => setNewProduct(prev => ({ ...prev, stockQty: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white"
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
