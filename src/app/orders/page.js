'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserOrders } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f7bb23', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#4299e1', icon: '✅' },
  shipped:   { label: 'Shipped',   color: '#805ad5', icon: '🚚' },
  delivered: { label: 'Delivered', color: '#38a169', icon: '📦' },
  cancelled: { label: 'Cancelled', color: '#e53e3e', icon: '❌' },
};

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  );
}

function OrdersContent() {
  const { user } = useAuth();
  const router   = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserOrders(user.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1 className="orders-title">My Orders</h1>
        <button className="store-link" onClick={() => router.push('/store')}>+ New Order</button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No orders yet</h2>
          <p>Purchase your first Sentinel device to get started</p>
          <button className="shop-btn" onClick={() => router.push('/store')}>
            Browse Store →
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onClick={() => router.push(`/orders/${order.id}`)} />
          ))}
        </div>
      )}

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        .orders-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          padding-bottom: 90px;
        }
        .orders-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 28px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .orders-title { margin: 0; font-size: 26px; font-weight: 800; }
        .store-link {
          background: var(--primary); border: none; border-radius: 10px;
          color: #fff; font-size: 13px; font-weight: 700; padding: 8px 14px;
          cursor: pointer;
        }
        .loading-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; padding: 60px 20px; color: var(--text-secondary);
        }
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 20px; text-align: center;
        }
        .empty-icon { font-size: 64px; }
        .empty-state h2 { margin: 0; font-size: 22px; }
        .empty-state p  { margin: 0; color: var(--text-secondary); font-size: 14px; }
        .shop-btn {
          background: linear-gradient(135deg, var(--primary), #1a3a5c);
          border: none; border-radius: 12px; color: #fff;
          padding: 13px 24px; font-size: 15px; font-weight: 700;
          cursor: pointer; margin-top: 8px;
        }
        .orders-list { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
        .spinner {
          display: inline-block; width: 28px; height: 28px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent); border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

function OrderCard({ order, onClick }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const itemCount = order.items?.reduce((s, i) => s + i.qty, 0) || 0;
  const dateStr = order.createdAt?.toDate?.()?.toLocaleDateString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) || 'Processing...';

  return (
    <div className="order-card" onClick={onClick}>
      <div className="order-card-top">
        <div>
          <div className="order-id">#{order.id.slice(0, 8).toUpperCase()}</div>
          <div className="order-date">{dateStr}</div>
        </div>
        <div className="status-badge" style={{ backgroundColor: `${status.color}22`, color: status.color, border: `1px solid ${status.color}44` }}>
          {status.icon} {status.label}
        </div>
      </div>

      <div className="order-ref">
        Ref: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{order.referralCode}</span>
      </div>

      <div className="order-card-bottom">
        <span className="order-items">{itemCount} device{itemCount !== 1 ? 's' : ''}</span>
        <span className="order-total">R{order.total?.toLocaleString()}</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .order-card {
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 16px;
          cursor: pointer; transition: background 0.2s;
          display: flex; flex-direction: column; gap: 10px;
        }
        .order-card:active { background: rgba(44,90,133,0.2); }
        .order-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .order-id   { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
        .order-date { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .status-badge {
          padding: 5px 10px; border-radius: 20px;
          font-size: 12px; font-weight: 700;
        }
        .order-ref  { font-size: 12px; color: var(--text-secondary); }
        .order-card-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06); }
        .order-items { font-size: 13px; color: var(--text-secondary); }
        .order-total { font-size: 18px; font-weight: 800; color: var(--accent); }
      `}} />
    </div>
  );
}
