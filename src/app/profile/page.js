'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHousehold, updateHousehold, getUserDevices, getUserOrders } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const router           = useRouter();

  const [household, setHousehold] = useState(null);
  const [devices, setDevices]     = useState([]);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({});

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
      if (h) setForm({
        adminFirstName: h.adminFirstName || '',
        adminLastName:  h.adminLastName  || '',
        phone:          h.phone          || '',
        householdName:  h.householdName  || '',
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateHousehold(user.uid, form);
      setHousehold(prev => ({ ...prev, ...form }));
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) return <div className="profile-loading"><div className="spinner" /></div>;

  const initials = household
    ? `${household.adminFirstName?.[0] || ''}${household.adminLastName?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const activeDevices = devices.filter(d => d.status === 'online').length;

  return (
    <div className="profile-page">
      {/* Avatar + name */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div>
          <div className="profile-name">
            {household ? `${household.adminFirstName} ${household.adminLastName}` : 'SafeLink User'}
          </div>
          <div className="profile-email">{user?.email}</div>
          <div className="membership-badge">● SafeLink Active</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-num">{devices.length}</div>
          <div className="stat-label">Devices</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{orders.length}</div>
          <div className="stat-label">Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: activeDevices > 0 ? '#38a169' : 'var(--text-secondary)' }}>{activeDevices}</div>
          <div className="stat-label">Online</div>
        </div>
      </div>

      {/* Household details */}
      <div className="profile-section">
        <div className="section-header">
          <h2 className="section-title">Household Details</h2>
          <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>

        {editMode ? (
          <div className="edit-form">
            <PField label="First Name"       value={form.adminFirstName} onChange={v => setForm(f => ({ ...f, adminFirstName: v }))} />
            <PField label="Last Name"        value={form.adminLastName}  onChange={v => setForm(f => ({ ...f, adminLastName: v  }))} />
            <PField label="Mobile Number"    value={form.phone}          onChange={v => setForm(f => ({ ...f, phone: v }))} type="tel" />
            <PField label="Household Name"   value={form.householdName}  onChange={v => setForm(f => ({ ...f, householdName: v }))} />
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="info-card">
            <InfoRow icon="👤" label="Administrator" value={`${household?.adminFirstName || ''} ${household?.adminLastName || ''}`} />
            <InfoRow icon="🏠" label="Household"     value={household?.householdName || '—'} />
            <InfoRow icon="📱" label="Mobile"        value={household?.phone || '—'} />
            <InfoRow icon="👥" label="Members"       value={`${household?.memberCount || 1} member${household?.memberCount !== 1 ? 's' : ''}`} />
            {household?.address && (
              <InfoRow icon="📍" label="Address" value={`${household.address.line1}, ${household.address.suburb}, ${household.address.city}`} />
            )}
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      {household?.emergency && (
        <div className="profile-section">
          <h2 className="section-title">Emergency Contact</h2>
          <div className="info-card">
            <InfoRow icon="🆘" label="Name"         value={household.emergency.name || '—'} />
            <InfoRow icon="📞" label="Phone"        value={household.emergency.phone || '—'} />
            <InfoRow icon="🤝" label="Relationship" value={household.emergency.relation || '—'} />
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="profile-section">
        <h2 className="section-title">Quick Links</h2>
        <div className="quick-links">
          <QuickLink icon="📦" label="My Orders"   onClick={() => router.push('/orders')} />
          <QuickLink icon="📡" label="My Devices"  onClick={() => router.push('/devices')} />
          <QuickLink icon="🛒" label="Shop Sentinel" onClick={() => router.push('/store')} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="profile-section">
        <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        <p className="version-txt">SafeLink v1.0</p>
      </div>

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          padding-bottom: 90px;
        }
        .profile-loading {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; background: var(--bg-dark);
        }
        .profile-hero {
          display: flex; align-items: center; gap: 16px;
          padding: 32px 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .profile-avatar {
          width: 64px; height: 64px; border-radius: 20px;
          background: linear-gradient(135deg, var(--primary), #1a3a5c);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 800;
          box-shadow: 0 4px 20px rgba(44,90,133,0.4);
        }
        .profile-name  { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
        .profile-email { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
        .membership-badge {
          display: inline-block;
          background: rgba(56,161,105,0.15);
          border: 1px solid rgba(56,161,105,0.3);
          color: #68d391; font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 10px;
        }

        .profile-stats {
          display: flex; gap: 12px; padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .stat-card {
          flex: 1; text-align: center;
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 14px 8px;
        }
        .stat-num   { font-size: 26px; font-weight: 800; color: var(--accent); }
        .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-top: 2px; }

        .profile-section { padding: 20px 20px 0; }
        .section-header  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .section-title   { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .section-header .section-title { margin: 0; }
        .edit-btn {
          background: none; border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px; color: var(--text-secondary);
          font-size: 12px; padding: 5px 12px; cursor: pointer;
        }

        .info-card {
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; overflow: hidden;
        }

        .edit-form  { display: flex; flex-direction: column; gap: 12px; }
        .edit-field { display: flex; flex-direction: column; gap: 5px; }
        .edit-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .edit-input {
          padding: 12px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: var(--text-primary);
          font-size: 15px; outline: none;
        }
        .edit-input:focus { border-color: var(--primary); }
        .save-btn {
          padding: 14px;
          background: linear-gradient(135deg, var(--primary), #1a3a5c);
          border: none; border-radius: 12px; color: #fff;
          font-size: 15px; font-weight: 700; cursor: pointer;
        }
        .save-btn:disabled { opacity: 0.6; }

        .quick-links { display: flex; flex-direction: column; gap: 10px; }
        .quick-link {
          display: flex; align-items: center; gap: 14px;
          background: rgba(22,34,49,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 14px 16px;
          cursor: pointer; transition: background 0.2s;
          color: var(--text-primary); font-size: 15px; font-weight: 600;
        }
        .quick-link:active { background: rgba(44,90,133,0.2); }
        .ql-icon { font-size: 20px; }
        .ql-arrow { margin-left: auto; color: var(--text-secondary); font-size: 18px; }

        .logout-btn {
          width: 100%; padding: 15px; margin-bottom: 12px;
          background: rgba(229,62,62,0.1);
          border: 1px solid rgba(229,62,62,0.3);
          border-radius: 14px; color: #fc8181;
          font-size: 16px; font-weight: 700; cursor: pointer;
        }
        .version-txt { text-align: center; font-size: 11px; color: rgba(255,255,255,0.2); margin: 0; }

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

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 16, minWidth: 20 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function PField({ label, value, onChange, type = 'text' }) {
  return (
    <div className="edit-field">
      <label className="edit-label">{label}</label>
      <input
        type={type}
        className="edit-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function QuickLink({ icon, label, onClick }) {
  return (
    <div className="quick-link" onClick={onClick}>
      <span className="ql-icon">{icon}</span>
      <span>{label}</span>
      <span className="ql-arrow">›</span>
    </div>
  );
}
