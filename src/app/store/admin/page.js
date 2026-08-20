'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SENTINEL_PRODUCTS, formatZAR } from '@/lib/products';

/* ─── Simple passphrase guard (same as /admin) ─── */
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS ?? 'sbsecurity2024';

/* ─── Editable product row ─── */
function ProductRow({ product, overrides, onChange }) {
  const cost = overrides?.costPrice ?? product.costPrice;
  const sell = overrides?.sellingPrice ?? product.sellingPrice;
  const margin = sell - cost;
  const marginPct = sell > 0 ? ((margin / sell) * 100).toFixed(1) : 0;
  const isModified =
    overrides?.costPrice !== undefined || overrides?.sellingPrice !== undefined;

  return (
    <div className={`rounded-xl border transition-all ${isModified ? 'border-secondary/40 bg-secondary/5' : 'border-white/10 bg-white/5'} p-4`}>
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-[#0a1825] rounded-lg flex items-center justify-center flex-shrink-0">
          <img src={product.image} alt={product.name} className="w-10 h-10 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-on-surface">{product.name}</h4>
            {isModified && (
              <span className="text-[10px] bg-secondary/20 text-secondary border border-secondary/30 px-1.5 py-0.5 rounded-full">
                Modified
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant">{product.category} · REF {product.ref}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-secondary">{formatZAR(sell)}</p>
          <p className="text-[10px] text-on-surface-variant">selling price</p>
        </div>
      </div>

      {/* Price fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cost Price */}
        <div>
          <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
            Cost Price (Ex VAT)
          </label>
          <div className="flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus-within:border-primary/60 transition-colors">
            <span className="text-on-surface-variant text-sm">R</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => onChange(product.id, 'costPrice', parseFloat(e.target.value) || 0)}
              className="bg-transparent text-sm font-semibold text-on-surface flex-1 outline-none w-full"
            />
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">Default: {formatZAR(product.costPrice)}</p>
        </div>

        {/* RRP (read-only) */}
        <div>
          <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
            RRP (Incl VAT) — Locked
          </label>
          <div className="flex items-center gap-1.5 bg-black/10 border border-white/5 rounded-lg px-3 py-2 opacity-60">
            <span className="text-on-surface-variant text-sm">R</span>
            <input
              type="number"
              value={product.rrp}
              readOnly
              className="bg-transparent text-sm font-semibold text-on-surface-variant flex-1 outline-none cursor-not-allowed w-full"
            />
          </div>
          <p className="text-[10px] text-on-surface-variant mt-1">Set by Sentinel IoT</p>
        </div>

        {/* Selling Price (MAP) */}
        <div>
          <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
            Selling Price (MAP Incl VAT)
          </label>
          <div className="flex items-center gap-1.5 bg-black/20 border border-white/10 rounded-lg px-3 py-2 focus-within:border-secondary/60 transition-colors">
            <span className="text-secondary text-sm font-bold">R</span>
            <input
              type="number"
              step="1"
              min="0"
              value={sell}
              onChange={(e) => onChange(product.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
              className="bg-transparent text-sm font-bold text-secondary flex-1 outline-none w-full"
            />
          </div>
          {sell < product.costPrice && (
            <p className="text-[10px] text-error mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">warning</span>
              Below cost price!
            </p>
          )}
          {sell > product.rrp && (
            <p className="text-[10px] text-error mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">warning</span>
              Above RRP!
            </p>
          )}
        </div>
      </div>

      {/* Margin summary */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Gross Margin</p>
            <p className={`text-base font-bold ${margin < 0 ? 'text-error' : 'text-green-400'}`}>
              {formatZAR(margin)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Margin %</p>
            <p className={`text-base font-bold ${Number(marginPct) < 10 ? 'text-error' : Number(marginPct) < 20 ? 'text-yellow-400' : 'text-green-400'}`}>
              {marginPct}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">vs MAP</p>
            <p className="text-sm font-semibold text-on-surface-variant">
              {formatZAR(sell)} / {formatZAR(product.sellingPrice)}
            </p>
          </div>
        </div>
        {/* Margin bar */}
        <div className="hidden sm:block w-32">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${Number(marginPct) < 10 ? 'bg-error' : Number(marginPct) < 20 ? 'bg-yellow-400' : 'bg-green-400'}`}
              style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
            />
          </div>
          <p className="text-[9px] text-on-surface-variant text-right mt-0.5">{marginPct}% margin</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Summary totals ─── */
function PricingSummary({ overrides }) {
  const products = SENTINEL_PRODUCTS.map((p) => ({
    ...p,
    effectiveCost: overrides[p.id]?.costPrice ?? p.costPrice,
    effectiveSell: overrides[p.id]?.sellingPrice ?? p.sellingPrice,
  }));

  const avgMargin =
    products.reduce((acc, p) => {
      const m = p.effectiveSell - p.effectiveCost;
      return acc + (p.effectiveSell > 0 ? (m / p.effectiveSell) * 100 : 0);
    }, 0) / products.length;

  const lowest = [...products].sort((a, b) => {
    const ma = (a.effectiveSell - a.effectiveCost) / a.effectiveSell;
    const mb = (b.effectiveSell - b.effectiveCost) / b.effectiveSell;
    return ma - mb;
  })[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Products', value: products.length, icon: 'inventory_2', colour: 'text-primary' },
        { label: 'Avg Margin', value: `${avgMargin.toFixed(1)}%`, icon: 'trending_up', colour: avgMargin < 15 ? 'text-error' : 'text-green-400' },
        { label: 'Lowest Margin', value: lowest.name, icon: 'arrow_downward', colour: 'text-yellow-400', sub: `${(((lowest.effectiveSell - lowest.effectiveCost) / lowest.effectiveSell) * 100).toFixed(1)}%` },
        { label: 'Modified', value: Object.keys(overrides).length, icon: 'edit', colour: 'text-secondary' },
      ].map((s) => (
        <div key={s.label} className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`material-symbols-outlined text-[18px] ${s.colour}`}>{s.icon}</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</span>
          </div>
          <p className={`text-xl font-bold ${s.colour}`}>{s.value}</p>
          {s.sub && <p className="text-xs text-on-surface-variant">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/* ─── Admin Page ─── */
export default function ProductAdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [passError, setPassError] = useState('');

  // Price overrides keyed by product id: { costPrice, sellingPrice }
  const [overrides, setOverrides] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved overrides from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('safelink_product_overrides');
      if (stored) setOverrides(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = () => {
    if (pass === ADMIN_PASS) {
      setAuthed(true);
      setPassError('');
    } else {
      setPassError('Incorrect passphrase.');
    }
  };

  const handleChange = (productId, field, value) => {
    setOverrides((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? {}),
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const handleReset = (productId) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage (Firestore integration can be added here)
    localStorage.setItem('safelink_product_overrides', JSON.stringify(overrides));
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetAll = () => {
    if (window.confirm('Reset ALL products to default pricing?')) {
      setOverrides({});
      localStorage.removeItem('safelink_product_overrides');
    }
  };

  /* ── Login Gate ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm glass-card rounded-2xl p-8 border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-secondary text-2xl">admin_panel_settings</span>
            </div>
            <h1 className="text-xl font-bold text-on-surface">Product Admin</h1>
            <p className="text-sm text-on-surface-variant">Manage Sentinel product pricing</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Admin passphrase"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary/60 transition-colors"
            />
            {passError && <p className="text-xs text-error">{passError}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-secondary text-on-secondary font-bold text-sm py-3 rounded-xl hover:bg-secondary-fixed transition-colors active:scale-95 cursor-pointer"
            >
              Unlock
            </button>
            <button
              onClick={() => router.push('/store')}
              className="w-full text-xs text-on-surface-variant hover:text-on-surface transition-colors py-2 cursor-pointer"
            >
              ← Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background pb-20 antialiased">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-[#041522]/90 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/store')} className="p-2 rounded-full hover:bg-white/5 text-secondary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-on-surface">Product Pricing Admin</h1>
            <p className="text-[10px] text-on-surface-variant">Sentinel AURA Range — {SENTINEL_PRODUCTS.length} Products</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAll}
            className="text-xs text-on-surface-variant hover:text-error transition-colors px-2 py-1 rounded-lg hover:bg-error/10 cursor-pointer"
          >
            Reset All
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-secondary text-on-secondary font-bold text-sm px-4 py-2 rounded-xl hover:bg-secondary-fixed active:scale-95 transition-all cursor-pointer disabled:opacity-70"
          >
            {saving ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : saved ? (
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <section>
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Overview</h2>
          <PricingSummary overrides={overrides} />
        </section>

        {/* Info box */}
        <div className="glass-panel rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">info</span>
          <div className="text-xs text-on-surface-variant space-y-1">
            <p><strong className="text-on-surface">Cost Price</strong> = Price Ex VAT from the Reseller Pricing Schedule (what SafeLink pays).</p>
            <p><strong className="text-on-surface">Selling Price</strong> = MAP Incl VAT — what customers see on the store. Must not exceed RRP.</p>
            <p><strong className="text-on-surface">Margin</strong> = Selling Price − Cost Price. Changes here update the live store immediately on save.</p>
          </div>
        </div>

        {/* Pricing table header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Product Pricing</h2>
            <p className="text-xs text-on-surface-variant">All amounts in ZAR. Hover fields to edit.</p>
          </div>

          {/* Column labels (desktop) */}
          <div className="hidden sm:grid grid-cols-3 gap-3 px-4 mb-2">
            {['Product', 'Cost Price (Ex VAT)', 'RRP (Incl VAT)', 'Selling Price (MAP)'].map((h) => (
              <span key={h} className={`text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ${h === 'Product' ? 'col-span-1' : ''}`}>
                {h}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {SENTINEL_PRODUCTS.map((product) => (
              <div key={product.id} className="relative group">
                <ProductRow
                  product={product}
                  overrides={overrides[product.id]}
                  onChange={handleChange}
                />
                {overrides[product.id] && (
                  <button
                    onClick={() => handleReset(product.id)}
                    className="absolute top-3 right-3 text-[10px] text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">restart_alt</span> Reset
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save confirmation */}
        {saved && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg animate-fade-in">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Pricing saved successfully
          </div>
        )}
      </main>
    </div>
  );
}
