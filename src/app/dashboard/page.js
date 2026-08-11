'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHousehold, getUserDevices, getUserOrders } from '@/lib/db';
import StatusBar from '@/app/components/StatusBar';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

const quickServices = [
  { id: 'sos',     icon: '🚨', label: 'Armed Response', border: 'var(--emergency)', href: '/sos' },
  { id: 'medical', icon: '🏥', label: 'Medical',        border: 'var(--emergency)', href: '/sos' },
  { id: 'store',   icon: '🛒', label: 'Buy Devices',    border: 'var(--accent)',    href: '/store' },
  { id: 'devices', icon: '📡', label: 'My Devices',     border: 'var(--primary)',   href: '/devices' },
  { id: 'orders',  icon: '📦', label: 'My Orders',      border: 'var(--primary)',   href: '/orders' },
  { id: 'profile', icon: '👤', label: 'Profile',        border: '#805ad5',          href: '/profile' },
];

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router   = useRouter();

  const [household, setHousehold] = useState(null);
  const [devices, setDevices]     = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getHousehold(user.uid),
      getUserDevices(user.uid),
      getUserOrders(user.uid),
    ]).then(([h, d, o]) => {
      setHousehold(h);
      setDevices(d);
      setOrders(o);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const activeDevices  = devices.filter(d => d.imei).length;
  const pendingDevices = devices.filter(d => !d.imei).length;
  const recentOrder    = orders[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-container">
      <StatusBar />

      <main className="dashboard-content">
        {/* Greeting */}
        <div className="dash-greeting">
          <div>
            <p className="greeting-text">
              {greeting()}, {household?.adminFirstName || 'there'} 👋
            </p>
            <h1 className="household-name">
              {household?.householdName || 'SafeLink Home'}
            </h1>
          </div>
          <div className="membership-pill">● Protected</div>
        </div>

        {/* SOS Hero Button */}
        <div className="sos-hero">
          <div className="sos-button-wrapper">
            <div className="sos-pulse-ring ring-1" />
            <div className="sos-pulse-ring ring-2" />
            <button className="sos-main-button" onClick={() => router.push('/sos')}>
              <span>SOS</span>
            </button>
          </div>
          <p className="sos-help-text">Hold for Emergency</p>
        </div>

        {/* Status Cards */}
        {!loading && (
          <div className="status-cards">
            <div className="status-card" onClick={() => router.push('/devices')}>
              <div className="sc-num" style={{ color: '#38a169' }}>{activeDevices}</div>
              <div className="sc-label">Active Devices</div>
            </div>
            {pendingDevices > 0 && (
              <div className="status-card warning" onClick={() => router.push('/devices')}>
                <div className="sc-num" style={{ color: '#f7bb23' }}>{pendingDevices}</div>
                <div className="sc-label">Needs IMEI</div>
              </div>
            )}
            <div className="status-card" onClick={() => router.push('/orders')}>
              <div className="sc-num">{orders.length}</div>
              <div className="sc-label">Orders</div>
            </div>
          </div>
        )}

        {/* Recent Order Banner */}
        {recentOrder && (
          <div className="glass-card order-banner" onClick={() => router.push(`/orders/${recentOrder.id}`)}>
            <div className="ob-icon">📦</div>
            <div className="ob-body">
              <div className="ob-title">Latest Order</div>
              <div className="ob-meta">
                #{recentOrder.id.slice(0, 8).toUpperCase()} ·{' '}
                <span style={{ color: recentOrder.status === 'delivered' ? '#38a169' : '#f7bb23', fontWeight: 700 }}>
                  {recentOrder.status?.charAt(0).toUpperCase() + recentOrder.status?.slice(1)}
                </span>
              </div>
            </div>
            <div className="ob-arrow">›</div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <section className="services-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="services-grid">
            {quickServices.map(service => (
              <div
                key={service.id}
                className="glass-card service-card"
                style={{ borderTop: `3px solid ${service.border}` }}
                onClick={() => router.push(service.href)}
              >
                <div className="service-icon">{service.icon}</div>
                <div className="service-label">{service.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* No devices CTA */}
        {!loading && devices.length === 0 && (
          <div className="glass-card cta-card" onClick={() => router.push('/store')}>
            <div className="cta-icon">🛡️</div>
            <div className="cta-body">
              <div className="cta-title">Activate your first device</div>
              <div className="cta-sub">Browse the SafeLink Store to get started</div>
            </div>
            <div className="cta-arrow">›</div>
          </div>
        )}
      </main>

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-container {
          display: flex; flex-direction: column;
          height: 100vh;
          background-color: var(--bg-dark, #0f1923);
          color: var(--text-primary, #ffffff);
          overflow: hidden;
        }
        .dashboard-content {
          flex: 1; overflow-y: auto;
          padding: 16px; padding-bottom: 100px;
          display: flex; flex-direction: column; gap: 20px;
        }

        /* Greeting */
        .dash-greeting {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding-top: 8px;
        }
        .greeting-text  { margin: 0; font-size: 13px; color: var(--text-secondary); }
        .household-name { margin: 4px 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .membership-pill {
          background: rgba(56,161,105,0.15);
          border: 1px solid rgba(56,161,105,0.3);
          color: #68d391; font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 12px; white-space: nowrap;
        }

        /* SOS Button */
        .sos-hero {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; margin: 4px 0;
        }
        .sos-button-wrapper {
          position: relative; width: 120px; height: 120px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }
        .sos-main-button {
          width: 120px; height: 120px; border-radius: 50%;
          background: linear-gradient(135deg, #f56565, var(--emergency, #e53e3e));
          border: none; color: white; font-size: 28px; font-weight: 800;
          letter-spacing: 2px; box-shadow: 0 4px 20px rgba(229,62,62,0.5);
          cursor: pointer; position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s;
        }
        .sos-main-button:active { transform: scale(0.95); }
        .sos-pulse-ring {
          position: absolute; width: 100%; height: 100%;
          border-radius: 50%; background-color: var(--emergency, #e53e3e);
          z-index: 1; opacity: 0;
        }
        .ring-1 { animation: pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite; }
        .ring-2 { animation: pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite 1s; }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .sos-help-text {
          font-size: 12px; color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
        }

        /* Status cards */
        .status-cards { display: flex; gap: 10px; }
        .status-card {
          flex: 1; text-align: center;
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 12px 8px;
          cursor: pointer; transition: background 0.2s;
        }
        .status-card:active { background: rgba(44,90,133,0.2); }
        .status-card.warning { border-color: rgba(247,187,35,0.3); }
        .sc-num   { font-size: 24px; font-weight: 800; color: var(--accent); }
        .sc-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; margin-top: 2px; }

        /* Order banner */
        .order-banner {
          display: flex; align-items: center; gap: 12px;
          cursor: pointer; transition: background 0.2s;
        }
        .order-banner:active { background: rgba(44,90,133,0.3); }
        .ob-icon { font-size: 24px; }
        .ob-body { flex: 1; }
        .ob-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
        .ob-meta  { font-size: 12px; color: var(--text-secondary); }
        .ob-arrow { font-size: 22px; color: var(--text-secondary); }

        /* Glass Card */
        .glass-card {
          background: rgba(22,34,49,0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px; padding: 16px;
        }

        /* Services */
        .section-title {
          font-size: 13px; font-weight: 700; color: var(--text-secondary);
          margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .services-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
        }
        .service-card {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 16px 8px;
          cursor: pointer; transition: background 0.2s;
        }
        .service-card:active { background: rgba(22,34,49,0.9); }
        .service-icon  { font-size: 24px; margin-bottom: 8px; }
        .service-label { font-size: 13px; font-weight: 600; text-align: center; }

        /* CTA card */
        .cta-card {
          display: flex; align-items: center; gap: 14px;
          background: linear-gradient(135deg, rgba(44,90,133,0.3), rgba(44,90,133,0.1));
          border-color: rgba(44,90,133,0.3); cursor: pointer;
        }
        .cta-card:active { opacity: 0.8; }
        .cta-icon  { font-size: 28px; }
        .cta-body  { flex: 1; }
        .cta-title { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
        .cta-sub   { font-size: 12px; color: var(--text-secondary); }
        .cta-arrow { font-size: 22px; color: var(--accent); }
      `}} />
    </div>
  );
}
