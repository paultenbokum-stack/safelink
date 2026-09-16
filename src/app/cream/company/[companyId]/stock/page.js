'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function CompanyStockPage({ params: paramsPromise }) {
  const [params, setParams] = useState(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sentinelProducts, setSentinelProducts] = useState([]);
  const [customProducts, setCustomProducts] = useState([]);
  const [sales, setSales] = useState({});
  const [companyName, setCompanyName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '', category: 'Security Hardware', costPrice: '', sellingPrice: '', stockQty: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { paramsPromise.then?.(setParams) ?? setParams(paramsPromise); }, [paramsPromise]);
  const companyId = params?.companyId;

  const [errorMsg, setErrorMsg] = useState('');

  const fetchStock = useCallback(async () => {
    if (!companyId) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/cream/company/${companyId}/stock`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to load stock data.');
      }
      const json = await res.json();
      setSentinelProducts(json.sentinelProducts || []);
      setCustomProducts(json.customProducts || []);
      setSales(json.sales || {});
      setCompanyName(json.company?.name || companyId);
    } catch (err) {
      console.error('Failed to load stock:', err);
      setErrorMsg(err.message || 'Failed to load stock catalogue.');
    } finally {
      setLoading(false);
    }
  }, [companyId, user]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const toggleSentinel = async (productId, enabled) => {
    try {
      const token = await user.getIdToken();
      await fetch(`/api/cream/company/${companyId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggle_sentinel', productId, enabled }),
      });
      setSentinelProducts(prev => prev.map(p => p.id === productId ? { ...p, enabled } : p));
    } catch (err) { console.error('Toggle failed:', err); }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/cream/company/${companyId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'create_custom', product: { ...newProduct, costPrice: Number(newProduct.costPrice) || 0, sellingPrice: Number(newProduct.sellingPrice) || 0, stockQty: Number(newProduct.stockQty) || 0 } }),
      });
      setShowAddModal(false);
      setNewProduct({ name: '', sku: '', description: '', category: 'Security Hardware', costPrice: '', sellingPrice: '', stockQty: '' });
      fetchStock();
    } catch (err) { console.error('Create product failed:', err); }
    finally { setSaving(false); }
  };

  const deleteCustom = async (productId) => {
    if (!confirm('Remove this product from inventory?')) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/cream/company/${companyId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete_custom', productId }),
      });
      setCustomProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) { console.error('Delete failed:', err); }
  };

  return (
    <div className="bg-[#03070f] text-on-background min-h-screen font-sans">
      <header className="bg-gradient-to-r from-[#0d091a] via-[#100c24] to-[#0d091a] border-b border-purple-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href={`/cream/company/${companyId}`} className="w-11 h-11 rounded-full flex items-center justify-center text-purple-300 hover:bg-white/5">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">{companyName} — Stock & Inventory</h1>
            <p className="text-xs text-purple-300/70">Sentinel products are controlled centrally by CREAM</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-purple-600/20 border border-purple-400/30 text-purple-200 px-3 py-1.5 rounded-lg font-semibold">Sentinel Sold: {sales.sentinelSold || 0}</span>
          <span className="bg-secondary/20 border border-secondary/30 text-secondary px-3 py-1.5 rounded-lg font-semibold">Custom Sold: {sales.customSold || 0}</span>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {!user && !loading && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">lock</span>
              <span>Please sign in with your CREAM administrator account to configure device inventory.</span>
            </div>
            <Link href="/login" className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs transition-all">Sign In</Link>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {loading && <div className="text-center py-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span> Loading…</div>}

        {/* ── SENTINEL PRODUCTS (CREAM-controlled) ── */}
        {!loading && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400">diamond</span>
                  Sentinel IoT Products
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Product details and pricing are set by CREAM. Toggle which products this company sells.</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase">Read-Only Pricing</span>
            </div>

            <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0d1527] border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Enabled</th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Range</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Cost Price</th>
                      <th className="p-4 text-right">Selling Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sentinelProducts.map(p => (
                      <tr key={p.id} className={`transition-colors ${p.enabled ? 'hover:bg-white/5' : 'opacity-50'}`}>
                        <td className="p-4">
                          <button onClick={() => toggleSentinel(p.id, !p.enabled)} className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${p.enabled ? 'bg-[#38a169]' : 'bg-white/20'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${p.enabled ? 'left-5.5' : 'left-0.5'}`} />
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/5" />}
                            <div>
                              <strong className="text-white text-sm block">{p.name}</strong>
                              {p.badge && <span className="text-[10px] text-secondary">{p.badge}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-on-surface-variant">{p.range}</td>
                        <td className="p-4 text-on-surface-variant">{p.category}</td>
                        <td className="p-4 text-right text-on-surface-variant font-mono">R{(p.costPrice || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-white font-mono font-semibold">R{(p.sellingPrice || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── CUSTOM PRODUCTS ── */}
        {!loading && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">category</span>
                  Custom Hardware & Products
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Non-Sentinel products this company sells (cameras, alarms, fencing, etc.)</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-sm">add_circle</span> Add Product
              </button>
            </div>

            <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0d1527] border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Cost</th>
                      <th className="p-4 text-right">Selling</th>
                      <th className="p-4 text-right">Stock</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customProducts.map(p => (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="p-4 font-semibold text-white">{p.name}</td>
                        <td className="p-4 text-on-surface-variant font-mono">{p.sku || '—'}</td>
                        <td className="p-4 text-on-surface-variant">{p.category}</td>
                        <td className="p-4 text-right text-on-surface-variant font-mono">R{(p.costPrice || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right text-white font-mono font-semibold">R{(p.sellingPrice || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right">{p.stockQty}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => deleteCustom(p.id)} className="px-2 py-1 rounded-lg border border-[#e53e3e]/30 text-[#e53e3e] hover:bg-[#e53e3e]/10 text-[10px] font-semibold cursor-pointer">Remove</button>
                        </td>
                      </tr>
                    ))}
                    {(!customProducts.length) && <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">No custom products added yet. Click "Add Product" to start.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Add Custom Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1325] border border-purple-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><span className="material-symbols-outlined text-secondary">add_circle</span> Add Custom Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleAddCustom} className="space-y-3 text-xs">
              {[
                ['Product Name', 'name', 'text', 'e.g. Paradox SP7000 Alarm Panel'],
                ['SKU / Code', 'sku', 'text', 'e.g. PAR-SP7000'],
                ['Description', 'description', 'text', 'Brief product description'],
              ].map(([label, field, type, placeholder]) => (
                <div key={field}>
                  <label className="font-bold text-on-surface-variant block mb-1">{label}</label>
                  <input type={type} value={newProduct[field]} onChange={e => setNewProduct(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400" required={field === 'name'} />
                </div>
              ))}
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Category</label>
                <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400">
                  {['Security Hardware', 'Alarm Systems', 'CCTV & Cameras', 'Electric Fencing', 'Access Control', 'Fire Equipment', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['Cost Price (R)', 'costPrice', '0.00'], ['Selling Price (R)', 'sellingPrice', '0.00'], ['Stock Qty', 'stockQty', '0']].map(([label, field, placeholder]) => (
                  <div key={field}>
                    <label className="font-bold text-on-surface-variant block mb-1">{label}</label>
                    <input type="number" step="0.01" min="0" value={newProduct[field]} onChange={e => setNewProduct(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} className="w-full bg-[#050b17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 font-mono" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-50">{saving ? 'Saving…' : 'Add to Inventory'}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 bg-white/5 hover:bg-white/10 text-on-surface-variant rounded-xl cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
