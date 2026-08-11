'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { sentinelProducts } from '@/lib/mock-data';

const CATEGORY_COLORS = {
  'Aura Hub':  '#2c5a85',
  'Portable':  '#805ad5',
  'Sensors':   '#38a169',
  'Cameras':   '#dd6b20',
};

const CATEGORY_ICONS = {
  'Aura Hub': '🏠',
  'Portable': '🔑',
  'Sensors':  '📡',
  'Cameras':  '📷',
};

export default function StorePage() {
  return (
    <AuthGuard>
      <StoreContent />
    </AuthGuard>
  );
}

function StoreContent() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [cart, setCart]     = useState([]);
  const [added, setAdded]   = useState(null); // track last-added for feedback

  const categories = ['All', ...Array.from(new Set(sentinelProducts.map(p => p.category)))];

  const filtered = filter === 'All'
    ? sentinelProducts
    : sentinelProducts.filter(p => p.category === filter);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 1500);
  };

  const goToCheckout = () => {
    if (cart.length === 0) return;
    // Store cart in sessionStorage for checkout page
    sessionStorage.setItem('safelink_cart', JSON.stringify(cart));
    router.push('/store/checkout');
  };

  return (
    <div className="store-page">
      {/* Sticky Header */}
      <div className="store-header">
        <div className="store-header-top">
          <div>
            <h1 className="store-title">SafeLink Store</h1>
            <p className="store-sub">Sentinel Security Devices</p>
          </div>
          <button className="cart-icon-btn" onClick={goToCheckout}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && <div className="cart-badge">{cartCount}</div>}
          </button>
        </div>

        {/* Category filters */}
        <div className="filter-row">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-pill ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
              style={filter === cat && cat !== 'All' ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
            >
              {cat !== 'All' && CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-list">
        {filtered.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={addToCart}
            addedFeedback={added === product.id}
            cartQty={cart.find(i => i.id === product.id)?.qty || 0}
          />
        ))}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-footer-inner">
            <div>
              <div className="cart-footer-count">{cartCount} item{cartCount > 1 ? 's' : ''}</div>
              <div className="cart-footer-total">R{cartTotal.toLocaleString()}</div>
            </div>
            <button className="checkout-btn" onClick={goToCheckout}>
              Checkout →
            </button>
          </div>
        </div>
      )}

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        .store-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          padding-bottom: ${cart.length > 0 ? 150 : 90}px;
        }
        .store-header {
          position: sticky; top: 0; z-index: 20;
          background: rgba(15, 25, 35, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 20px 20px 0;
        }
        .store-header-top {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 16px;
        }
        .store-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .store-sub   { margin: 4px 0 0; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }

        .cart-icon-btn {
          position: relative; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 10px;
          color: var(--text-primary); cursor: pointer;
        }
        .cart-badge {
          position: absolute; top: -6px; right: -6px;
          background: var(--accent); color: #000;
          width: 18px; height: 18px; border-radius: 50%;
          font-size: 11px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }

        .filter-row {
          display: flex; gap: 8px; overflow-x: auto;
          padding-bottom: 16px; scrollbar-width: none;
        }
        .filter-row::-webkit-scrollbar { display: none; }
        .filter-pill {
          padding: 7px 14px; border-radius: 20px; white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.15);
          background: transparent; color: var(--text-secondary);
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill.active {
          background: var(--primary); border-color: var(--primary); color: #fff;
        }

        .product-list {
          display: flex; flex-direction: column; gap: 20px;
          padding: 20px;
        }

        /* Cart footer */
        .cart-footer {
          position: fixed; bottom: 70px; left: 0; right: 0;
          padding: 0 16px; z-index: 30;
        }
        .cart-footer-inner {
          background: var(--primary);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 16px;
          padding: 14px 18px;
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        .cart-footer-count { font-size: 12px; color: rgba(255,255,255,0.7); }
        .cart-footer-total { font-size: 20px; font-weight: 800; }
        .checkout-btn {
          background: var(--accent); color: #000;
          border: none; border-radius: 10px;
          padding: 10px 20px; font-size: 14px; font-weight: 800;
          cursor: pointer; transition: opacity 0.2s;
        }
        .checkout-btn:active { opacity: 0.8; }
      `}} />
    </div>
  );
}

function ProductCard({ product, onAdd, addedFeedback, cartQty }) {
  const accentColor = CATEGORY_COLORS[product.category] || '#2c5a85';

  return (
    <div className="product-card" style={{ borderTop: `3px solid ${accentColor}` }}>
      {/* Product image area */}
      <div className="product-img-area" style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)` }}>
        <span className="product-emoji">{CATEGORY_ICONS[product.category] || '📦'}</span>
        {product.badge && (
          <div className="product-badge" style={{ background: accentColor }}>
            {product.badge}
          </div>
        )}
        {cartQty > 0 && (
          <div className="cart-qty-chip">×{cartQty} in cart</div>
        )}
      </div>

      {/* Details */}
      <div className="product-body">
        <div className="product-cat">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-tagline">{product.tagline}</p>

        <div className="product-pricing">
          <span className="product-price">R{product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="product-original">R{product.originalPrice.toLocaleString()}</span>
          )}
        </div>

        <p className="product-desc">{product.description}</p>

        <div className="product-features">
          {product.features.map((f, i) => (
            <div key={i} className="feature-tag">
              <span style={{ color: accentColor }}>✓</span> {f}
            </div>
          ))}
        </div>

        <div className="product-meta">
          <span>🚚 {product.deliveryDays}</span>
          {product.imeiRequired && <span>📶 IMEI tracked</span>}
        </div>

        <button
          className="add-btn"
          onClick={() => onAdd(product)}
          style={{ background: addedFeedback ? '#38a169' : accentColor }}
        >
          {addedFeedback ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .product-card {
          background: rgba(22, 34, 49, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          overflow: hidden;
        }
        .product-img-area {
          height: 140px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .product-emoji { font-size: 52px; }
        .product-badge {
          position: absolute; top: 12px; left: 12px;
          padding: 4px 10px; border-radius: 10px;
          font-size: 11px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .cart-qty-chip {
          position: absolute; top: 12px; right: 12px;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 4px 10px; border-radius: 10px;
          font-size: 11px; font-weight: 700; color: var(--accent);
        }
        .product-body { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .product-cat { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
        .product-name { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.3px; }
        .product-tagline { margin: 0; font-size: 13px; color: var(--text-secondary); font-style: italic; }
        .product-pricing { display: flex; align-items: baseline; gap: 10px; }
        .product-price { font-size: 28px; font-weight: 800; color: var(--accent); }
        .product-original { font-size: 15px; color: var(--text-secondary); text-decoration: line-through; }
        .product-desc { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        .product-features { display: flex; flex-direction: column; gap: 5px; }
        .feature-tag { font-size: 13px; color: #ddd; display: flex; align-items: center; gap: 6px; }
        .product-meta { display: flex; gap: 14px; font-size: 12px; color: var(--text-secondary); flex-wrap: wrap; }
        .add-btn {
          width: 100%; padding: 14px;
          border: none; border-radius: 12px;
          color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: background 0.3s, transform 0.1s;
          margin-top: 4px;
        }
        .add-btn:active { transform: scale(0.98); }
      `}} />
    </div>
  );
}
