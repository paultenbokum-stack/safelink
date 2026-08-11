'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserDevices } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';

const STATUS_COLORS = {
  online:   { color: '#38a169', label: 'Online',   dot: '●' },
  offline:  { color: '#e53e3e', label: 'Offline',  dot: '●' },
  pending:  { color: '#f7bb23', label: 'Pending',  dot: '○' },
  moving:   { color: '#4299e1', label: 'Moving',   dot: '●' },
};

const CATEGORY_ICONS = {
  'Aura Hub': '🏠',
  'Portable': '🔑',
  'Sensors':  '📡',
  'Cameras':  '📷',
};

export default function DevicesPage() {
  return (
    <AuthGuard>
      <DevicesContent />
    </AuthGuard>
  );
}

function DevicesContent() {
  const { user } = useAuth();
  const router   = useRouter();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserDevices(user.uid)
      .then(setDevices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const activatedDevices = devices.filter(d => d.imei);
  const pendingDevices   = devices.filter(d => !d.imei);

  return (
    <div className="devices-page">
      <div className="devices-header">
        <h1 className="devices-title">My Devices</h1>
        <button className="add-device-btn" onClick={() => router.push('/store')}>+ Add Device</button>
      </div>

      {/* Stats */}
      {devices.length > 0 && (
        <div className="devices-stats">
          <div className="dstat">
            <div className="dstat-num" style={{ color: '#38a169' }}>{activatedDevices.length}</div>
            <div className="dstat-label">Activated</div>
          </div>
          <div className="dstat">
            <div className="dstat-num" style={{ color: '#f7bb23' }}>{pendingDevices.length}</div>
            <div className="dstat-label">Pending IMEI</div>
          </div>
          <div className="dstat">
            <div className="dstat-num">{devices.length}</div>
            <div className="dstat-label">Total</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="center-state"><div className="spinner" /></div>
      ) : devices.length === 0 ? (
        <div className="center-state empty">
          <div style={{ fontSize: 56 }}>📡</div>
          <h2>No devices yet</h2>
          <p>Purchase a Sentinel device to get started</p>
          <button className="shop-btn" onClick={() => router.push('/store')}>Browse Store →</button>
        </div>
      ) : (
        <div className="devices-list">
          {pendingDevices.length > 0 && (
            <div className="group-label">⏳ Awaiting IMEI — <span style={{ color: 'var(--accent)' }}>tap order to activate</span></div>
          )}
          {pendingDevices.map(d => (
            <DeviceCard key={d.id} device={d} onClick={() => router.push(`/orders/${d.orderId}`)} />
          ))}

          {activatedDevices.length > 0 && (
            <div className="group-label">✅ Activated Devices</div>
          )}
          {activatedDevices.map(d => (
            <DeviceCard key={d.id} device={d} onClick={() => {}} />
          ))}
        </div>
      )}

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        .devices-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          padding-bottom: 90px;
        }
        .devices-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 28px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .devices-title { margin: 0; font-size: 26px; font-weight: 800; }
        .add-device-btn {
          background: var(--primary); border: none; border-radius: 10px;
          color: #fff; font-size: 13px; font-weight: 700; padding: 8px 14px;
          cursor: pointer;
        }
        .devices-stats {
          display: flex; padding: 16px 20px; gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .dstat { flex: 1; text-align: center; }
        .dstat-num   { font-size: 28px; font-weight: 800; }
        .dstat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-top: 2px; }
        .center-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 20px; text-align: center;
        }
        .center-state h2 { margin: 0; font-size: 20px; }
        .center-state p  { margin: 0; color: var(--text-secondary); font-size: 14px; }
        .shop-btn {
          background: linear-gradient(135deg, var(--primary), #1a3a5c);
          border: none; border-radius: 12px; color: #fff;
          padding: 12px 22px; font-size: 14px; font-weight: 700; cursor: pointer;
          margin-top: 8px;
        }
        .devices-list { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .group-label { font-size: 12px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 4px 0 2px; }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent); border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

function DeviceCard({ device, onClick }) {
  const s = STATUS_COLORS[device.status] || STATUS_COLORS.pending;

  return (
    <div className="device-card" onClick={onClick}>
      <div className="device-icon">
        {CATEGORY_ICONS[device.category] || '📡'}
      </div>
      <div className="device-info">
        <div className="device-name">{device.nickname || device.productName}</div>
        {device.imei ? (
          <div className="device-imei">IMEI: {device.imei}</div>
        ) : (
          <div className="device-imei-missing">Tap to enter IMEI →</div>
        )}
      </div>
      <div className="device-status" style={{ color: s.color }}>
        {s.dot} {s.label}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .device-card {
          display: flex; align-items: center; gap: 14px;
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px;
          cursor: pointer; transition: background 0.2s;
        }
        .device-card:active { background: rgba(44,90,133,0.2); }
        .device-icon { font-size: 28px; min-width: 36px; text-align: center; }
        .device-info { flex: 1; }
        .device-name  { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
        .device-imei  { font-size: 12px; color: var(--text-secondary); font-family: monospace; }
        .device-imei-missing { font-size: 12px; color: var(--accent); font-weight: 600; }
        .device-status { font-size: 12px; font-weight: 700; white-space: nowrap; }
      `}} />
    </div>
  );
}
