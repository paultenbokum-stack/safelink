'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PRODUCT_CATEGORIES, formatZAR, VAT_RATE } from '@/lib/products';

export default function MasterProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/cream/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Could not load products catalogue');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.id) {
      alert('Product Name and ID are required.');
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const action = isNewProduct ? 'create' : 'update';
      const res = await fetch('/api/cream/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          product: {
            ...editingProduct,
            costPrice: parseFloat(editingProduct.costPrice) || 0,
            sellingPrice: parseFloat(editingProduct.sellingPrice) || 0,
          },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save');
      setEditingProduct(null);
      setIsNewProduct(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async (product) => {
    const nextStatus = product.status === 'active' ? 'archived' : 'active';
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/cream/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'archive',
          id: product.id,
          status: nextStatus,
        }),
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filtered = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.range?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-[#03070f] text-on-background min-h-screen font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0d091a] via-[#100c24] to-[#0d091a] border-b border-purple-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/cream" className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 hover:bg-purple-500/20 transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">Master Product Catalogue</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">CREAM Admin</span>
            </div>
            <p className="text-xs text-slate-400">Sentinel hardware master records — pricing and specifications propagate to all security companies</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingProduct({
                id: `sentinel-${Date.now().toString(36)}`,
                name: '',
                range: 'Sentinel',
                category: 'Asset Trackers',
                badge: '',
                costPrice: 0,
                sellingPrice: 0,
                desc: '',
                specs: [''],
                status: 'active',
              });
              setIsNewProduct(true);
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add_box</span>
            Add Sentinel Product
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search products by name, SKU or range..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {PRODUCT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-[#0b101b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Product</th>
                  <th className="p-4">Range & Category</th>
                  <th className="p-4 text-right">Cost Price (Ex)</th>
                  <th className="p-4 text-right">Selling Price (Ex)</th>
                  <th className="p-4 text-right">Selling Price (Inc)</th>
                  <th className="p-4 text-right">Markup %</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-slate-500">
                      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Loading master products catalogue...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-slate-500">
                      No products found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(product => {
                    const cost = Number(product.costPrice) || 0;
                    const selling = Number(product.sellingPrice) || 0;
                    const sellingExVat = selling / (1 + VAT_RATE);
                    const markupPct = cost > 0 ? (((sellingExVat - cost) / cost) * 100).toFixed(1) : '—';

                    return (
                      <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-white">{product.name}</div>
                          <div className="text-xs text-slate-400 font-mono">ID: {product.id}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 mr-2">
                            {product.range || 'Sentinel'}
                          </span>
                          <span className="text-xs text-slate-400">{product.category}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-300">
                          {formatZAR(cost)}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-300">
                          {formatZAR(sellingExVat)}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-400">
                          {formatZAR(selling)}
                        </td>
                        <td className="p-4 text-right font-mono text-xs">
                          <span className={cost > 0 && Number(markupPct) > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                            {cost > 0 ? `${markupPct}%` : '—'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            product.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}>
                            {product.status === 'active' ? 'Active' : 'Archived'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct({ ...product });
                              setIsNewProduct(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Edit Product"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleArchive(product)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title={product.status === 'active' ? 'Archive Product' : 'Activate Product'}
                          >
                            <span className="material-symbols-outlined text-base">
                              {product.status === 'active' ? 'archive' : 'unarchive'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit / Add Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-purple-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">
                {isNewProduct ? 'Add New Master Product' : `Edit ${editingProduct.name}`}
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Product ID / SKU</label>
                  <input
                    type="text"
                    required
                    disabled={!isNewProduct}
                    value={editingProduct.id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Range</label>
                  <input
                    type="text"
                    value={editingProduct.range || 'Sentinel'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, range: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Asset Trackers'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {PRODUCT_CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cost Price (Ex VAT, ZAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.costPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Selling Price (Incl VAT, ZAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.sellingPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editingProduct.desc || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, desc: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Platform Subscription & Monitoring Terms</label>
                <input
                  type="text"
                  value={editingProduct.platform || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, platform: e.target.value })}
                  placeholder="e.g. Platform subscription included for 36 months..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
