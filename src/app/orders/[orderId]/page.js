'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getOrder, getUserDevices, allocateIMEI } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';

const STEPS = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'];
const STATUS_ORDER = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 };

export default function OrderDetailPage() {
  return (
    <AuthGuard>
      <OrderDetail />
    </AuthGuard>
  );
}

function OrderDetail() {
  const { user }   = useAuth();
  const router     = useRouter();
  const { orderId } = useParams();

  const [order, setOrder]     = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !orderId) return;
    Promise.all([
      getOrder(orderId),
      getUserDevices(user.uid),
    ]).then(([ord, devs]) => {
      setOrder(ord);
      setDevices(devs.filter(d => d.orderId === orderId));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user, orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 24, color: 'var(--text-primary)', background: 'var(--bg-dark)', minHeight: '100vh' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 15 }}>← Back</button>
        <p>Order not found.</p>
      </div>
    );
  }

  const statusIdx = STATUS_ORDER[order.status] ?? 0;

  return (
    <div className="order-detail">
      {/* Header */}
      <div className="od-header">
        <button className="back-btn" onClick={() => router.push('/orders')}>← Orders</button>
        <h1 className="od-title">Order Details</h1>
      </div>

      {/* Order summary card */}
      <div className="od-card">
        <div className="od-row">
          <span className="od-label">Order ID</span>
          <span className="od-val mono">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="od-row">
          <span className="od-label">Referral Code</span>
          <span className="od-val accent">{order.referralCode}</span>
        </div>
        <div className="od-row">
          <span className="od-label">Total Paid</span>
          <span className="od-val bold">R{order.total?.toLocaleString()}</span>
        </div>
      </div>

      {/* Delivery stepper */}
      <div className="od-section">
        <h2 className="od-section-title">Delivery Status</h2>
        <div className="stepper">
          {STEPS.map((step, i) => (
            <div key={step} className={`step-item ${i <= statusIdx ? 'done' : ''} ${i === statusIdx ? 'current' : ''}`}>
              <div className="step-circle">
                {i < statusIdx ? '✓' : i === statusIdx ? '●' : '○'}
              </div>
              <div className="step-label">{step}</div>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="od-section">
        <h2 className="od-section-title">Items Ordered</h2>
        {order.items?.map((item, i) => (
          <div key={i} className="item-row">
            <span>{item.name} ×{item.qty}</span>
            <span className="item-price">R{(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* IMEI Allocation */}
      {devices.length > 0 && (
        <div className="od-section">
          <h2 className="od-section-title">Device Registration</h2>
          <p className="od-hint">Once your Sentinel devices arrive, enter the IMEI number found on the device box to activate it.</p>
          {devices.map(device => (
            <IMEISlot key={device.id} device={device} onSaved={(updatedDevice) => {
              setDevices(prev => prev.map(d => d.id === updatedDevice.id ? updatedDevice : d));
            }} />
          ))}
        </div>
      )}

      {/* Delivery address */}
      {order.delivery && (
        <div className="od-section">
          <h2 className="od-section-title">Delivery Address</h2>
          <div className="od-card" style={{ gap: 4 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{order.delivery.name}</p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              {order.delivery.addressLine1}, {order.delivery.suburb}, {order.delivery.city}
            </p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              {order.delivery.province}, {order.delivery.postalCode}
            </p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .order-detail {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          padding: 0 0 40px;
        }
        .od-header {
          display: flex; align-items: center; gap: 16px;
          padding: 24px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .back-btn { background: none; border: none; color: var(--accent); font-size: 14px; font-weight: 600; cursor: pointer; padding: 0; }
        .od-title  { margin: 0; font-size: 20px; font-weight: 800; }

        .od-card {
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px; margin: 16px 20px 0;
          display: flex; flex-direction: column; gap: 12px;
        }
        .od-row   { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .od-label { color: var(--text-secondary); }
        .od-val   { font-weight: 600; }
        .od-val.mono   { font-family: monospace; letter-spacing: 0.5px; }
        .od-val.accent { color: var(--accent); font-weight: 700; }
        .od-val.bold   { font-size: 16px; font-weight: 800; color: var(--accent); }

        .od-section { padding: 20px 20px 0; }
        .od-section-title { margin: 0 0 12px; font-size: 16px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .od-hint { margin: 0 0 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

        /* Stepper */
        .stepper { display: flex; align-items: flex-start; position: relative; }
        .step-item { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 6px; position: relative; }
        .step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 2px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; z-index: 1;
          transition: all 0.3s;
        }
        .step-item.done .step-circle   { background: var(--success, #38a169); border-color: var(--success, #38a169); color: #fff; }
        .step-item.current .step-circle { background: var(--accent); border-color: var(--accent); color: #000; }
        .step-label { font-size: 10px; text-align: center; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
        .step-item.done .step-label   { color: var(--success, #38a169); }
        .step-item.current .step-label { color: var(--accent); }
        .step-line {
          position: absolute; top: 13px; left: 50%; right: -50%;
          height: 2px; background: rgba(255,255,255,0.1); z-index: 0;
        }
        .step-item.done .step-line { background: var(--success, #38a169); }

        /* Items */
        .item-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px; margin-bottom: 8px; font-size: 14px;
        }
        .item-price { font-weight: 700; color: var(--accent); }

        .spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent); border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

function IMEISlot({ device, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [imei, setImei]       = useState(device.imei || '');
  const [nickname, setNickname] = useState(device.nickname || '');
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    if (!imei || imei.length < 14) return;
    setSaving(true);
    try {
      await allocateIMEI(device.id, imei, nickname);
      onSaved({ ...device, imei, nickname });
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="imei-slot">
      <div className="imei-slot-header">
        <span className="imei-device-name">{device.productName}</span>
        {device.imei ? (
          <span className="imei-status activated">● Activated</span>
        ) : (
          <span className="imei-status pending">⏳ Pending IMEI</span>
        )}
      </div>

      {device.imei && !editing ? (
        <div className="imei-display">
          <div className="imei-row"><span className="imei-label">IMEI</span><span className="imei-num">{device.imei}</span></div>
          {device.nickname && <div className="imei-row"><span className="imei-label">Name</span><span>{device.nickname}</span></div>}
          <button className="imei-edit-btn" onClick={() => setEditing(true)}>Edit</button>
        </div>
      ) : (
        <div className="imei-entry">
          <input
            type="text"
            className="imei-input"
            placeholder="Enter 15-digit IMEI number"
            value={imei}
            onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
            maxLength={15}
            inputMode="numeric"
          />
          <input
            type="text"
            className="imei-input"
            placeholder="Device nickname (optional)"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            {editing && <button className="imei-cancel" onClick={() => setEditing(false)}>Cancel</button>}
            <button
              className="imei-save"
              onClick={save}
              disabled={saving || imei.length < 14}
              style={{ flex: 1 }}
            >
              {saving ? 'Saving...' : 'Activate Device →'}
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .imei-slot {
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px; margin-bottom: 12px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .imei-slot-header { display: flex; justify-content: space-between; align-items: center; }
        .imei-device-name { font-size: 15px; font-weight: 700; }
        .imei-status { font-size: 12px; font-weight: 700; }
        .imei-status.activated { color: var(--success, #38a169); }
        .imei-status.pending   { color: var(--accent); }
        .imei-display { display: flex; flex-direction: column; gap: 8px; }
        .imei-row { display: flex; gap: 12px; font-size: 13px; }
        .imei-label { color: var(--text-secondary); min-width: 40px; }
        .imei-num { font-family: monospace; font-weight: 700; letter-spacing: 1px; }
        .imei-edit-btn {
          background: none; border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px; color: var(--text-secondary);
          font-size: 12px; padding: 6px 12px; cursor: pointer; align-self: flex-start;
        }
        .imei-entry { display: flex; flex-direction: column; gap: 10px; }
        .imei-input {
          padding: 12px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: var(--text-primary);
          font-size: 15px; outline: none;
        }
        .imei-input:focus { border-color: var(--primary); }
        .imei-input::placeholder { color: rgba(255,255,255,0.25); }
        .imei-save {
          padding: 13px; background: var(--primary); border: none;
          border-radius: 10px; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
        }
        .imei-save:disabled { opacity: 0.5; }
        .imei-cancel {
          padding: 13px 16px; background: none;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px; color: var(--text-secondary);
          font-size: 14px; font-weight: 600; cursor: pointer;
        }
      `}} />
    </div>
  );
}
