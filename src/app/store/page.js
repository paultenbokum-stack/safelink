'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import {
  SENTINEL_PRODUCTS,
  PRODUCT_CATEGORIES,
  MAX_ORDER_QUANTITY,
  VAT_RATE,
  formatZAR,
  getLinePriceBreakdown,
  getNextPriceTier,
  getPriceTier,
  getUnitPriceExVat,
  roundCurrency,
} from '@/lib/products';

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

function ProductVisual({ product, priority = false, compact = false }) {
  const studioTreatment = 'studio-image-mask !p-0 scale-[1.03] group-hover:scale-[1.08]';

  return (
    <>
      <div className="absolute inset-0 product-stage-grid" />
      <div className="absolute left-1/2 top-1/2 h-[78%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
      <div className="absolute left-1/2 top-1/2 h-[54%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/15 shadow-[0_0_55px_rgba(247,187,35,0.12)]" />
      <div className="absolute inset-x-8 bottom-3 h-8 rounded-[100%] bg-black/35 blur-xl" />
      <Image
        src={product.image}
        alt={product.name}
        width={640}
        height={480}
        priority={priority}
        className={`relative z-[1] h-full w-full object-contain drop-shadow-[0_22px_22px_rgba(0,0,0,0.42)] transition-transform duration-700 group-hover:scale-[1.06] ${compact ? 'p-2' : 'p-5 md:p-7'} ${studioTreatment}`}
      />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#071724]/80 to-transparent pointer-events-none" />
    </>
  );
}

function QuantityPriceControl({ product, value, onChange, label, compact = false }) {
  const apply = (next) => onChange(Math.max(1, Math.min(MAX_ORDER_QUANTITY, Number.parseInt(next, 10) || 1)));
  const pricing = getLinePriceBreakdown(product, value);
  const sampleRate = getUnitPriceExVat(product, 1);
  const volumeSaving = roundCurrency((sampleRate - pricing.unitPriceExVat) * value);
  const progress = ((value - 1) / (MAX_ORDER_QUANTITY - 1)) * 100;

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/15 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => apply(value - 1)}
          disabled={value <= 1}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-on-surface-variant transition-colors hover:border-secondary/40 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
        <label className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-x-0 top-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Quantity</span>
          <input
            type="number"
            min="1"
            max={MAX_ORDER_QUANTITY}
            step="1"
            value={value}
            onChange={(event) => apply(event.target.value)}
            className="h-11 w-full rounded-xl border border-secondary/25 bg-secondary/10 px-3 pt-3 text-center text-lg font-bold text-secondary outline-none transition-colors focus:border-secondary"
            aria-label={label}
          />
        </label>
        <button
          type="button"
          onClick={() => apply(value + 1)}
          disabled={value >= MAX_ORDER_QUANTITY}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-on-surface-variant transition-colors hover:border-secondary/40 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>

      <div className="mt-4 px-1">
        <input
          type="range"
          min="1"
          max={MAX_ORDER_QUANTITY}
          step="1"
          value={value}
          onChange={(event) => apply(event.target.value)}
          className="quantity-slider w-full"
          style={{ '--slider-progress': `${progress}%` }}
          aria-label={`${label} slider`}
          aria-valuetext={`${value} units at ${formatZAR(pricing.unitPriceExVat)} per unit excluding VAT`}
        />
        <div className="mt-1.5 flex justify-between text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant">
          <span>1 unit</span>
          <span>1,000 max</span>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-2" aria-live="polite">
          <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Current unit rate</p>
            <p className="mt-0.5 text-xl font-bold text-secondary">{formatZAR(pricing.unitPriceExVat)}</p>
            <p className="text-[9px] text-on-surface-variant">each, ex VAT</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Order total</p>
            <p className="mt-0.5 text-xl font-bold text-on-surface">{formatZAR(pricing.totalInclVat)}</p>
            <p className="text-[9px] text-on-surface-variant">including VAT</p>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[10px]">
            <span className="text-on-surface-variant">Volume saving vs 1-unit rate</span>
            <span className={`font-bold ${volumeSaving > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>{formatZAR(volumeSaving)} ex VAT</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceTierTable({ product, quantity, onSelect }) {
  const activeTier = getPriceTier(product, quantity);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="grid grid-cols-2 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        <span>Quantity</span>
        <span className="text-right">Unit price ex VAT</span>
      </div>
      {product.priceTiers.map((tier) => {
        const isActive = tier.minQty === activeTier.minQty;
        return (
          <button
            type="button"
            key={tier.minQty}
            onClick={() => onSelect?.(tier.minQty)}
            className={`grid w-full grid-cols-2 px-3 py-2 text-xs border-t border-white/5 transition-colors ${
              isActive ? 'bg-secondary/15 text-secondary' : 'text-on-surface-variant hover:bg-white/5'
            }`}
            aria-pressed={isActive}
          >
            <span className="text-left font-semibold">{tier.label}</span>
            <span className="text-right font-bold">{formatZAR(tier.unitPriceExVat)}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProductModal({ product, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const pricing = getLinePriceBreakdown(product, quantity);
  const nextTier = getNextPriceTier(product, quantity);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div
        className="w-full md:max-w-3xl max-h-[94dvh] bg-[#0c1d2a] border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="group product-stage relative flex h-56 shrink-0 items-center justify-center overflow-hidden border-b border-white/10 md:h-72">
          <ProductVisual product={product} />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-colors"
            aria-label="Close product details"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColour(product.badge)}`}>
            {product.badge}
          </span>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto">
          <div className="grid md:grid-cols-[1fr_260px] gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-secondary font-bold uppercase tracking-widest">{product.range} range</p>
                <h2 id="product-modal-title" className="text-2xl font-bold text-on-surface">{product.name}</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{product.category}</p>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{product.desc}</p>
              <div className="glass-panel rounded-xl p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">cloud_done</span>
                <p className="text-xs text-on-surface-variant">{product.platform}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">Brochure specifications</p>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {product.specs.map((spec) => (
                    <div key={spec} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5">
                      <span className="material-symbols-outlined text-secondary text-[14px]">check_circle</span>
                      <span className="text-xs text-on-surface">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">bluetooth</span>
                <p className="text-xs text-on-surface-variant">{product.connectivity}</p>
              </div>
            </div>

            <aside className="space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Build your order</p>
                <QuantityPriceControl product={product} value={quantity} onChange={setQuantity} label={`${product.name} quantity`} />
              </div>
              {nextTier ? (
                <p className="text-[11px] text-primary">
                  Add {nextTier.minQty - quantity} more to unlock {formatZAR(nextTier.unitPriceExVat)} per unit.
                </p>
              ) : (
                <p className="text-[11px] text-primary">Best available volume rate applied.</p>
              )}
              <PriceTierTable product={product} quantity={quantity} onSelect={setQuantity} />
            </aside>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => { onAddToCart(product, quantity); onClose(); }}
            className="w-full bg-secondary text-on-secondary font-bold text-sm py-3 rounded-xl hover:bg-secondary-fixed active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,195,47,0.3)]"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            Add {quantity.toLocaleString('en-ZA')} to cart - {formatZAR(pricing.totalInclVat)} incl. VAT
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onViewDetail }) {
  const samplePrice = getUnitPriceExVat(product, 1);

  return (
    <article
      className="glass-card rounded-2xl overflow-hidden flex flex-col group relative border border-white/10 hover:border-secondary/40 transition-all duration-300 shadow-md hover:shadow-[0_8px_32px_rgba(255,195,47,0.08)] cursor-pointer"
      onClick={() => onViewDetail(product)}
    >
      <div className="absolute top-2.5 left-2.5 z-10">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColour(product.badge)}`}>{product.badge}</span>
      </div>
      <div className="product-stage relative flex h-52 items-center justify-center overflow-hidden border-b border-white/10">
        <ProductVisual product={product} />
        <span className="absolute bottom-3 left-3 z-10 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">Sentinel · {product.range}</span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">{product.range}</span>
        <h3 className="font-bold text-base text-on-surface mb-1">{product.name}</h3>
        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 flex-1">{product.desc}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {product.specs.slice(0, 3).map((spec) => (
            <span key={spec} className="text-[10px] bg-white/5 text-on-surface-variant px-2 py-0.5 rounded-full border border-white/10">{spec}</span>
          ))}
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 mb-3">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">1-9 units</p>
            <p className="text-xl font-bold text-secondary">{formatZAR(samplePrice)}</p>
          </div>
          <p className="text-[10px] text-on-surface-variant">per unit, excluding VAT</p>
        </div>
        <div className="mt-auto">
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onViewDetail(product); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary/50 bg-secondary/10 px-3 py-2.5 text-xs font-bold text-secondary transition-all hover:border-secondary hover:bg-secondary hover:text-on-secondary"
          >
            <span className="material-symbols-outlined text-[17px]">tune</span>
            Choose quantity &amp; see live price
          </button>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({ cart, onClose, onUpdateQty, subtotalExVat, vat, totalInclVat, totalCount, onCheckout }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-surface-container-high h-full p-5 md:p-6 flex flex-col shadow-2xl border-l border-white/10" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">shopping_bag</span>
            <h2 className="text-lg font-bold text-on-surface">Your cart ({totalCount.toLocaleString('en-ZA')})</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-on-surface-variant" aria-label="Close cart">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">shopping_cart</span>
              <p className="text-on-surface-variant text-sm mt-3">Your cart is empty.</p>
            </div>
          ) : cart.map((item) => {
            const pricing = getLinePriceBreakdown(item, item.qty);
            const nextTier = getNextPriceTier(item, item.qty);
            return (
              <div key={item.id} className="glass-panel p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="product-stage group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    <ProductVisual product={item} compact />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
                    <p className="text-xs text-secondary font-bold">{formatZAR(pricing.unitPriceExVat)} <span className="font-normal text-on-surface-variant">ex VAT / unit</span></p>
                    <p className="text-[10px] text-primary">{pricing.tier.label} unit tier</p>
                  </div>
                  <p className="text-sm font-bold text-on-surface text-right">{formatZAR(pricing.totalInclVat)}<span className="block text-[9px] font-normal text-on-surface-variant">incl. VAT</span></p>
                </div>
                <div className="mt-3">
                  <QuantityPriceControl product={item} value={item.qty} onChange={(quantity) => onUpdateQty(item.id, quantity)} label={`${item.name} cart quantity`} compact />
                  <div className="mt-2 flex justify-between gap-3 px-1">
                    <span className="text-[10px] text-primary">{pricing.tier.label} unit price applied</span>
                    {nextTier ? (
                      <button type="button" onClick={() => onUpdateQty(item.id, nextTier.minQty)} className="text-[10px] text-primary text-right hover:text-secondary">
                        Jump to {nextTier.minQty.toLocaleString('en-ZA')} for {formatZAR(nextTier.unitPriceExVat)} each
                      </button>
                    ) : (
                      <span className="text-[10px] text-primary text-right">Best rate applied</span>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => onUpdateQty(item.id, 0)} className="mt-2 text-[10px] text-on-surface-variant hover:text-error">Remove</button>
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-2 shrink-0">
            <div className="flex justify-between text-xs text-on-surface-variant"><span>Subtotal ex VAT</span><span>{formatZAR(subtotalExVat)}</span></div>
            <div className="flex justify-between text-xs text-on-surface-variant"><span>VAT (15%)</span><span>{formatZAR(vat)}</span></div>
            <div className="flex justify-between items-end pt-2 border-t border-white/10">
              <span className="text-sm text-on-surface-variant">Total incl. VAT</span>
              <span className="text-2xl font-bold text-secondary">{formatZAR(totalInclVat)}</span>
            </div>
            <p className="text-[10px] text-on-surface-variant">Volume rates update automatically at 10, 100, 500 and 1,000 units per product.</p>
            <button type="button" onClick={onCheckout} className="w-full bg-secondary text-on-secondary font-bold text-sm py-3.5 rounded-xl hover:bg-secondary-fixed active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,195,47,0.3)]">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              Secure checkout - {formatZAR(totalInclVat)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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

  const filtered = selectedCategory === 'All'
    ? SENTINEL_PRODUCTS
    : SENTINEL_PRODUCTS.filter((product) => product.category === selectedCategory);
  const featured = SENTINEL_PRODUCTS.find((product) => product.id === 'aura-cube');

  const addToCart = (product, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, qty: Math.min(MAX_ORDER_QUANTITY, item.qty + quantity) } : item);
      return [...current, { ...product, qty: Math.min(MAX_ORDER_QUANTITY, Math.max(1, quantity)) }];
    });
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1000);
  };

  const updateQty = (id, quantity) => setCart((current) => (
    quantity <= 0
      ? current.filter((item) => item.id !== id)
      : current.map((item) => item.id === id ? { ...item, qty: Math.min(MAX_ORDER_QUANTITY, Math.max(1, quantity)) } : item)
  ));

  const subtotalExVat = roundCurrency(cart.reduce((sum, item) => sum + getLinePriceBreakdown(item, item.qty).subtotalExVat, 0));
  const vat = roundCurrency(subtotalExVat * VAT_RATE);
  const totalInclVat = roundCurrency(subtotalExVat + vat);
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = () => {
    if (!cart.length) return;
    sessionStorage.setItem('safelink_cart', JSON.stringify(cart));
    router.push('/store/checkout');
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-32 antialiased">
      <header className="fixed top-0 w-full z-40 bg-[#041522]/90 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 text-secondary" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-secondary leading-tight">SafeLink Store</h1>
            <p className="text-[10px] text-on-surface-variant">Sentinel IoT x AURA range</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push('/store/admin')} className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface" title="Product admin" aria-label="Open product admin">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </button>
          <button type="button" onClick={() => setCartOpen(true)} className="relative p-2 rounded-full hover:bg-white/5 text-on-surface hover:text-secondary" aria-label="Open cart">
            <span className="material-symbols-outlined">shopping_cart</span>
            {totalCount > 0 && (
              <span className="absolute top-0 right-0 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-error text-[9px] font-bold text-white">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="pt-20 pb-32 px-4 max-w-7xl mx-auto space-y-8">
        <section className="glass-card rounded-2xl p-5 md:p-8 flex flex-col md:flex-row gap-6 items-center relative overflow-hidden border-secondary/20 group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5" />
          <div className="flex-1 space-y-3 relative z-10">
            <span className="inline-flex text-[10px] font-bold bg-secondary/20 text-secondary border border-secondary/30 px-2.5 py-0.5 rounded-full uppercase tracking-widest">Eight brochure-matched devices</span>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight">Global BLE asset tracking.<br className="hidden md:block" /> Better rates at scale.</h2>
            <p className="text-sm text-on-surface-variant max-w-xl">Choose from the Sentinel AURA devices listed in the supplied catalogue. Unit pricing updates automatically as each product reaches 10, 100, 500 and 1,000 units.</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              {[
                ['bolt', 'No SIM costs'],
                ['public', 'Global coverage'],
                ['price_check', 'Automatic volume rates'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[16px]">{icon}</span>
                  <span className="text-xs text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setModalProduct(featured)} className="mt-1 inline-flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary-fixed active:scale-95 shadow-[0_0_15px_rgba(255,195,47,0.3)]">
              <span className="material-symbols-outlined text-[18px]">calculate</span>
              Try volume pricing
            </button>
          </div>
          <div className="product-stage group relative z-10 flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 md:w-80">
            <ProductVisual product={featured} priority />
          </div>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
          <p className="text-xs text-on-surface-variant leading-relaxed"><strong className="text-on-surface">How pricing works:</strong> product rates are shown excluding VAT exactly as listed in the reseller sheet. The cart adds South African VAT at 15% and shows the final VAT-inclusive total before checkout.</p>
        </section>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRODUCT_CATEGORIES.map((category) => (
            <button type="button" key={category} onClick={() => setSelectedCategory(category)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === category ? 'bg-secondary text-on-secondary shadow-sm' : 'glass-panel text-on-surface-variant hover:text-on-surface'}`}>
              {category}
            </button>
          ))}
          <span className="text-on-surface-variant text-xs ml-auto pl-2 whitespace-nowrap shrink-0">{filtered.length} product{filtered.length === 1 ? '' : 's'}</span>
        </div>

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">{selectedCategory === 'All' ? 'Sentinel AURA products' : selectedCategory}</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Only models with both a supplied brochure and matching workbook entry are shown.</p>
            </div>
            <p className="hidden sm:block text-xs text-on-surface-variant">Choose a product to slide through live volume pricing</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((product) => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-20 rounded-2xl bg-secondary/20 border-2 border-secondary pointer-events-none flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-4xl">check_circle</span>
                  </div>
                )}
                <ProductCard product={product} onViewDetail={setModalProduct} />
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">cloud_done</span>
          <div>
            <p className="text-xs font-semibold text-on-surface mb-0.5">Platform access included</p>
            <p className="text-xs text-on-surface-variant">Every listed AURA product includes platform access for the model-specific period shown in its details. Renewal is required after that included period.</p>
          </div>
        </section>
      </main>

      {modalProduct && <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} onAddToCart={addToCart} />}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          subtotalExVat={subtotalExVat}
          vat={vat}
          totalInclVat={totalInclVat}
          totalCount={totalCount}
          onCheckout={handleCheckout}
        />
      )}
      <BottomNav />
    </div>
  );
}
