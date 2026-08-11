'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserDevices, allocateIMEI, updateDeviceStatus } from '@/lib/db';
import { decryptIMEI, maskIMEI } from '@/lib/crypto';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';

const STATUS_META = {
  pending:  { label: 'Pending Setup',  color: '#f59e0b', icon: '⏳' },
  online:   { label: 'Online',          color: '#10b981', icon: '●' },
  offline:  { label: 'Offline',         color: '#6b7280', icon: '○' },
  low_batt: { label: 'Low Battery',    color: '#ef4444', icon: '🔋' },
};

export default function DeviceDetailPage() {
  return (
    <AuthGuard>
      <DeviceDetailContent />
    </AuthGuard>
  );
}

function DeviceDetailContent() {
  const { deviceId } = useParams();
  const router       = useRouter();
  const { user }     = useAuth();

  const [device, setDevice]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [imeiPlain, setImeiPlain] = useState(null);   // decrypted
  const [revealed, setRevealed]   = useState(false);
  const [decrypting, setDecrypting] = useState(false);

  // IMEI allocation form
  const [showImeiForm, setShowImeiForm] = useState(false);
  const [imeiInput, setImeiInput]       = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');

  useEffect(() => {
    if (!user) return;
    getUserDevices(user.uid).then(devices => {
      const d = devices.find(x => x.id === deviceId);
      setDevice(d || null);
      setLoading(false);
    });
  }, [user, deviceId]);

  const handleRevealIMEI = async () => {
    if (!device?.imei || !user) return;
    setDecrypting(true);
    try {
      const plain = await decryptIMEI(device.imei, user.uid);
      setImeiPlain(plain);
      setRevealed(true);
    } catch {
      setImeiPlain(null);
    } finally {
      setDecrypting(false);
    }
  };

  const handleHideIMEI = () => {
    setRevealed(false);
    setImeiPlain(null);
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setSaveError('');
    const cleaned = imeiInput.replace(/\D/g, '');
    if (cleaned.length < 15) {
      setSaveError('IMEI must be 15 digits');
      return;
    }
    setSaving(true);
    try {
      await allocateIMEI(deviceId, cleaned, nicknameInput, user.uid);
      // Refresh
      const devices = await getUserDevices(user.uid);
      setDevice(devices.find(x => x.id === deviceId) || null);
      setShowImeiForm(false);
      setImeiInput('');
    } catch (err) {
      setSaveError(err.message || 'Failed to save IMEI');
    } finally {
      setSaving(false);
    }
  };

  const statusMeta = STATUS_META[device?.status] || STATUS_META.pending;

  if (loading) {
    return (
      <div className="dd-page">
        <div className="dd-loading">Loading device…</div>
        <BottomNav />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="dd-page">
        <div className="dd-loading">Device not found.</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="dd-page">
      {/* Header */}
      <div className="dd-header">
        <button className="dd-back" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="dd-header-title">Device Detail</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Device hero */}
      <div className="dd-hero">
        <div className="dd-device-icon">📡</div>
        <h1 className="dd-device-name">{device.nickname || device.productName}</h1>
        <div className="dd-status-badge" style={{ background: `${statusMeta.color}22`, color: statusMeta.color }}>
          {statusMeta.icon} {statusMeta.label}
        </div>
      </div>

      {/* Info cards */}
      <div className="dd-cards">

        {/* IMEI section */}
        <div className="dd-card">
          <div className="dd-card-title">IMEI Number</div>

          {device.imei ? (
            <div className="imei-display-row">
              <div className="imei-value">
                {revealed && imeiPlain
                  ? imeiPlain
                  : maskIMEI(imeiPlain || '•••••••••••••••')}
              </div>
              {!revealed ? (
                <button
                  className="imei-reveal-btn"
                  onClick={handleRevealIMEI}
                  disabled={decrypting}
                >
                  {decrypting ? '…' : '🔓 Reveal'}
                </button>
              ) : (
                <button className="imei-reveal-btn imei-hide-btn" onClick={handleHideIMEI}>
                  🔒 Hide
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="imei-pending">No IMEI allocated yet</p>
              <button className="imei-allocate-btn" onClick={() => setShowImeiForm(v => !v)}>
                + Allocate IMEI
              </button>
            </div>
          )}

          {/* IMEI allocation form */}
          {showImeiForm && (
            <form className="imei-form" onSubmit={handleAllocate}>
              <label className="form-label">IMEI Number (15 digits)</label>
              <input
                className="form-input"
                type="tel"
                inputMode="numeric"
                maxLength={15}
                placeholder="e.g. 356938035643809"
                value={imeiInput}
                onChange={e => setImeiInput(e.target.value.replace(/\D/g, ''))}
              />
              <label className="form-label" style={{ marginTop: 12 }}>Nickname (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Living Room Hub"
                value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
              />
              {saveError && <p className="form-err">{saveError}</p>}
              <button className="form-submit" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save IMEI (Encrypted)'}
              </button>
              <p className="form-note">🔒 IMEI is encrypted before storage — POPIA compliant</p>
            </form>
          )}
        </div>

        {/* Device info */}
        <div className="dd-card">
          <div className="dd-card-title">Device Info</div>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-key">Product</span>
              <span className="info-val">{device.productName}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Nickname</span>
              <span className="info-val">{device.nickname || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Order ID</span>
              <span className="info-val" style={{ fontSize: 12 }}>#{device.orderId?.slice(0, 12)}…</span>
            </div>
            {device.lastSeen && (
              <div className="info-row">
                <span className="info-key">Last Seen</span>
                <span className="info-val">
                  {device.lastSeen?.toDate
                    ? device.lastSeen.toDate().toLocaleString('en-ZA')
                    : '—'}
                </span>
              </div>
            )}
            {device.batteryLevel != null && (
              <div className="info-row">
                <span className="info-key">Battery</span>
                <span className="info-val">{device.batteryLevel}%</span>
              </div>
            )}
          </div>
        </div>

        {/* POPIA notice */}
        <div className="popia-notice">
          <span className="popia-icon">🔐</span>
          <div>
            <div className="popia-title">POPIA Protected</div>
            <div className="popia-text">Your IMEI is stored using AES-256-GCM encryption. Only you can decrypt it.</div>
          </div>
        </div>
      </div>

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        .dd-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          padding-bottom: 90px;
        }

        /* Header */
        .dd-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top: 0;
          background: rgba(15,25,35,0.95);
          backdrop-filter: blur(12px);
          z-index: 10;
        }
        .dd-back {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 8px; color: var(--text-primary);
          cursor: pointer; display: flex; align-items: center;
        }
        .dd-header-title { font-weight: 700; font-size: 17px; }
        .dd-loading { text-align: center; padding: 80px 24px; color: var(--text-secondary); }

        /* Hero */
        .dd-hero { text-align: center; padding: 32px 24px 20px; }
        .dd-device-icon { font-size: 52px; margin-bottom: 12px; }
        .dd-device-name { font-size: 22px; font-weight: 900; margin: 0 0 12px; }
        .dd-status-badge {
          display: inline-block; padding: 6px 16px; border-radius: 20px;
          font-size: 13px; font-weight: 700; border: 1px solid currentColor;
        }

        /* Cards */
        .dd-cards { display: flex; flex-direction: column; gap: 14px; padding: 0 20px; }
        .dd-card {
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 20px;
        }
        .dd-card-title { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }

        /* IMEI */
        .imei-display-row { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
        .imei-value { font-size: 18px; font-weight: 800; letter-spacing: 2px; font-family: monospace; }
        .imei-reveal-btn {
          background: rgba(247,187,35,0.12); border: 1px solid rgba(247,187,35,0.3);
          color: #f7bb23; border-radius: 8px; padding: 8px 14px;
          font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
        }
        .imei-hide-btn { background: rgba(100,116,139,0.2); border-color: rgba(100,116,139,0.4); color: #94a3b8; }
        .imei-pending { color: var(--text-secondary); font-size: 14px; margin: 0 0 12px; }
        .imei-allocate-btn {
          background: rgba(44,90,133,0.3); border: 1px solid rgba(44,90,133,0.5);
          color: #93c5fd; border-radius: 10px; padding: 10px 18px;
          font-size: 14px; font-weight: 700; cursor: pointer;
        }

        /* Form */
        .imei-form { margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 16px; }
        .form-label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; }
        .form-input {
          width: 100%; padding: 12px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 16px; box-sizing: border-box; outline: none;
          font-family: monospace;
        }
        .form-input:focus { border-color: var(--accent, #f7bb23); }
        .form-err { color: #fc8181; font-size: 13px; margin: 8px 0 0; }
        .form-submit {
          width: 100%; padding: 14px; margin-top: 16px;
          background: var(--accent, #f7bb23); border: none; border-radius: 10px;
          color: #000; font-size: 15px; font-weight: 800; cursor: pointer;
        }
        .form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .form-note { font-size: 12px; color: var(--text-secondary); text-align: center; margin: 8px 0 0; }

        /* Info rows */
        .info-rows { display: flex; flex-direction: column; gap: 4px; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .info-row:last-child { border-bottom: none; }
        .info-key { font-size: 13px; color: var(--text-secondary); }
        .info-val { font-size: 14px; font-weight: 600; text-align: right; max-width: 60%; }

        /* POPIA notice */
        .popia-notice {
          display: flex; align-items: flex-start; gap: 12px;
          background: rgba(16, 185, 129, 0.07);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px; padding: 14px 16px;
        }
        .popia-icon { font-size: 22px; }
        .popia-title { font-size: 14px; font-weight: 700; color: #6ee7b7; }
        .popia-text { font-size: 12px; color: var(--text-secondary); margin-top: 4px; line-height: 1.5; }
      `}} />
    </div>
  );
}
