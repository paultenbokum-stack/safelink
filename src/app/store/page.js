'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import { SENTINEL_PRODUCTS, PRODUCT_CATEGORIES, formatZAR, getMargin, getMarginPct } from '@/lib/products';

/* ─── Helper: badge colour ─── */
function badgeColour(badge) {
  const map = {
    'Best Seller': 'bg-secondary text-on-secondary',
    'Vehicle Ready': 'bg-primary/20 text-primary border border-primary/30',
    'Wallet Slim': 'bg-white/10 text-on-surface border border-white/20',
    'Entry Level': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'Extended Life': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    'People & Bags': 'bg-blue-400/20 text-blue-300 border border-blue-400/30',
    Cylindrical: 'bg-orange-400/20 text-orange-300 border border-orange-400/30',
    'Key Finder': 'bg-teal-400/20 text-teal-300 border border-teal-400/30',
  };
  return map[badge] ?? 'bg-secondary/20 text-secondary border border-secondary/30';
}

/* ─── Product Detail Modal ─── */
function ProductModal({ product, onClose, onAddToCart }) {
  if (!product) return null;
  return (
    <div
      className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-2xl bg-[#0c1d2a] border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up md:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image */}
        <div className="relative bg-[#0a1825] flex items-center justify-center h-56 md:h-64 border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5" />
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-auto max-w-full object-contain p-6 drop-shadow-2xl"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColour(product.badge)}`}>
            {product.badge}
          </span>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-0.5">{product.range} RANGE</p>
              <h2 className="text-2xl font-bold text-on-surface">{product.name}</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{product.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-secondary">{formatZAR(product.sellingPrice)}</p>
              <p className="text-[10px] text-on-surface-variant">incl. VAT</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-on-surface-variant leading-relaxed">{product.desc}</p>

          {/* Platform */}
          <div className="glass-panel rounded-xl p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">cloud_done</span>
            <p className="text-xs text-on-surface-variant">{product.platform}</p>
          </div>

          {/* Specs grid */}
          <div>
            <p className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">Specifications</p>
            <div className="grid grid-cols-2 gap-1.5">
              {product.specs.map((spec) => (
                <div key={spec} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                  <span className="material-symbols-outlined text-secondary text-[14px]">check_circle</span>
                  <span className="text-xs text-on-surface">{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Use cases */}
          <div>
            <p className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">Ideal For</p>
            <div className="flex flex-wrap gap-1.5">
              {product.useCases.map((u) => (
                <span key={u} className="text-[11px] bg-primary/15 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                  {u}
                </span>
              ))}
            </div>
          </div>

          {/* Connectivity */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">bluetooth</span>
            <p className="text-xs text-on-surface-variant">{product.connectivity}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={() => { onAddToCart(product); onClose(); }}
            className="flex-1 bg-secondary text-on-secondary font-bold text-sm py-3 rounded-xl hover:bg-secondary-fixed active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,195,47,0.3)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            Add to Cart — {formatZAR(product.sellingPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Product Card ─── */
function ProductCard({ product, onAddToCart, onViewDetail }) {
  return (
    <article
      className="glass-card rounded-2xl overflow-hidden flex flex-col group relative border border-white/10 hover:border-secondary/40 transition-all duration-300 shadow-md hover:shadow-[0_8px_32px_rgba(255,195,47,0.08)] cursor-pointer"
      onClick={() => onViewDetail(product)}
    >
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColour(product.badge)}`}>
            {product.badge}
          </span>
        </div>
      )}

      {/* Image */}
      <div className="bg-[#0a1825] flex items-center justify-center h-44 relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/3 to-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-auto max-w-full object-contain p-4 drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-0.5">{product.range}</span>
        <h4 className="font-bold text-base text-on-surface mb-1">{product.name}</h4>
        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 flex-1">{product.desc}</p>

        {/* Key specs pills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.specs.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] bg-white/5 text-on-surface-variant px-2 py-0.5 rounded-full border border-white/10">
              {s}
            </span>
          ))}
        </div>

        {/* Price + Add button */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5">
          <div>
            <p className="text-xl font-bold text-secondary">{formatZAR(product.sellingPrice)}</p>
            <p className="text-[10px] text-on-surface-variant">incl. VAT</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="py-2 px-3 rounded-xl border border-secondary text-secondary text-xs font-bold hover:bg-secondary hover:text-on-secondary transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Cart Drawer ─── */
function CartDrawer({ cart, onClose, onUpdateQty, totalAmount, totalCount, onCheckout }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface-container-high h-full p-6 flex flex-col justify-between shadow-2xl border-l border-white/10 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">shopping_bag</span>
              <h3 className="text-lg font-bold text-on-surface">Your Cart ({totalCount})</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-on-surface-variant text-5xl">shopping_cart</span>
                <p className="text-on-surface-variant text-sm mt-3">Your cart is empty.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="glass-panel p-3 rounded-xl flex items-center gap-3">
                  <div className="w-14 h-14 bg-[#0a1825] rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
                    <p className="text-xs text-secondary font-bold">{formatZAR(item.sellingPrice)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-sm font-bold text-on-surface hover:bg-white/10 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-on-surface w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-sm font-bold text-on-surface hover:bg-white/10 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Subtotal ({totalCount} item{totalCount !== 1 ? 's' : ''})</span>
              <span className="text-2xl font-bold text-secondary">{formatZAR(totalAmount)}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">All prices include VAT. Delivery calculated at checkout.</p>
            <button
              onClick={onCheckout}
              className="w-full bg-secondary text-on-secondary font-bold text-sm py-3.5 rounded-xl hover:bg-secondary-fixed active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,195,47,0.3)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              Secure Checkout — {formatZAR(totalAmount)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Store Page ─── */
export default function StorePage() {
  return (
    <AuthGuard>
      <StoreContent />
    </AuthGuard>
  );
}

function StoreContent() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [addedId, setAddedId] = useState(null);

  const filtered =
    selectedCategory === 'All'
      ? SENTINEL_PRODUCTS
      : SENTINEL_PRODUCTS.filter((p) => p.category === selectedCategory);

  const featured = SENTINEL_PRODUCTS.find((p) => p.id === 'aura-cube');

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const updateQty = (id, delta) =>
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );

  const totalAmount = cart.reduce((acc, i) => acc + i.sellingPrice * i.qty, 0);
  const totalCount = cart.reduce((acc, i) => acc + i.qty, 0);

  const handleCheckout = () => {
    if (!cart.length) return;
    sessionStorage.setItem('safelink_cart', JSON.stringify(cart));
    router.push('/store/checkout');
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-32 antialiased">
      {/* ── Top Bar ── */}
      <header className="fixed top-0 w-full z-40 bg-[#041522]/90 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors text-secondary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-secondary leading-tight">SafeLink Store</h1>
            <p className="text-[10px] text-on-surface-variant">Sentinel IoT × AURA Range</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Admin link */}
          <button
            onClick={() => router.push('/store/admin')}
            className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
            title="Product Admin"
          >
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </button>
          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/5 text-on-surface hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {totalCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white animate-bounce">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="pt-20 pb-32 px-4 max-w-7xl mx-auto space-y-8">

        {/* ── Hero Banner ── */}
        <section className="glass-card rounded-2xl p-5 md:p-8 flex flex-col md:flex-row gap-6 items-center relative overflow-hidden border-secondary/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5" />
          <div className="flex-1 space-y-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-secondary/20 text-secondary border border-secondary/30 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Sentinel IoT — AURA Range
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">
              Global BLE Asset<br className="hidden md:block" /> Tracking — No SIM Required
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md">
              The Sentinel AURA range leverages a crowdsourced Bluetooth network to track people, assets, and vehicles worldwide. Platform access included with every device.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">bolt</span>
                <span className="text-xs text-on-surface-variant">No SIM costs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">public</span>
                <span className="text-xs text-on-surface-variant">Global coverage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">cloud_done</span>
                <span className="text-xs text-on-surface-variant">Platform included</span>
              </div>
            </div>
            <button
              onClick={() => onViewDetail && onViewDetail(featured)}
              className="mt-1 inline-flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary-fixed transition-colors active:scale-95 shadow-[0_0_15px_rgba(255,195,47,0.3)] cursor-pointer"
              onClick={() => setModalProduct(featured)}
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Explore Products
            </button>
          </div>
          <div className="w-full md:w-64 h-44 relative z-10 flex items-center justify-center">
            <img
              src={featured.image}
              alt="Sentinel Cube"
              className="h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </section>

        {/* ── Category Filter ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'glass-panel text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="text-on-surface-variant text-xs ml-auto pl-2 whitespace-nowrap flex-shrink-0">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Product Grid ── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface">
              {selectedCategory === 'All' ? 'All Products' : selectedCategory}
            </h3>
            <p className="text-xs text-on-surface-variant">Tap any product for details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((product) => (
              <div key={product.id} className="relative">
                {/* Added to cart flash */}
                {addedId === product.id && (
                  <div className="absolute inset-0 z-20 rounded-2xl bg-secondary/20 border-2 border-secondary animate-pulse pointer-events-none flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-4xl">check_circle</span>
                  </div>
                )}
                <ProductCard
                  product={product}
                  onAddToCart={addToCart}
                  onViewDetail={setModalProduct}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Platform Note ── */}
        <section className="glass-panel rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary text-[22px] flex-shrink-0 mt-0.5">info</span>
          <div>
            <p className="text-xs font-semibold text-on-surface mb-0.5">Platform Renewal</p>
            <p className="text-xs text-on-surface-variant">
              All AURA products include a platform subscription for the period specified per model.
              Renewal is required after the initial included period. Platform Access plans available separately.
            </p>
          </div>
        </section>
      </main>

      {/* ── Product Detail Modal ── */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          totalAmount={totalAmount}
          totalCount={totalCount}
          onCheckout={handleCheckout}
        />
      )}

      <BottomNav />
    </div>
  );
}
