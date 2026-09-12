'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createHousehold } from '@/lib/db';

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

export default function HouseholdSetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 = personal, 2 = address, 3 = emergency
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1 — Administrator
    adminFirstName: '',
    adminLastName: '',
    phone: '',
    householdName: '',
    members: '2',
    // Step 2 — Address
    addressLine1: '',
    suburb: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    // Step 3 — Emergency contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    setError('');
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      await createHousehold(user.uid, {
        adminFirstName: form.adminFirstName,
        adminLastName:  form.adminLastName,
        householdName:  form.householdName || `${form.adminLastName} Household`,
        phone:          form.phone,
        memberCount:    parseInt(form.members, 10),
        address: {
          line1:      form.addressLine1,
          suburb:     form.suburb,
          city:       form.city,
          province:   form.province,
          postalCode: form.postalCode,
        },
        emergency: {
          name:     form.emergencyName,
          phone:    form.emergencyPhone,
          relation: form.emergencyRelation,
        },
        email: user.email,
      });
      router.replace('/dashboard');
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const stepTitles = ['Personal Details', 'Home Address', 'Emergency Contact'];
  const stepIcons  = ['👤', '🏠', '🆘'];

  return (
    <div className="setup-page">
      {/* Header */}
      <div className="setup-header">
        <div className="setup-logo">
          <img src="/safelink-shield.png" alt="" width="36" height="36" style={{ objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: 18 }}>SafeLink</span>
        </div>
        <h1 className="setup-title">Set up your household</h1>
        <p className="setup-sub">Complete your profile to activate your security membership</p>
      </div>

      {/* Progress */}
      <div className="progress-bar-row">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`progress-step ${step >= s ? 'done' : ''} ${step === s ? 'active' : ''}`}>
            <div className="step-dot">{step > s ? '✓' : s}</div>
            <span className="step-label">{stepTitles[s - 1]}</span>
          </div>
        ))}
      </div>

      {error && <div className="setup-error">{error}</div>}

      {/* Step 1 */}
      {step === 1 && (
        <form className="setup-form" onSubmit={nextStep}>
          <SectionTitle icon="👤" title="Your Details" />
          <Field label="First Name" value={form.adminFirstName} onChange={update('adminFirstName')} required placeholder="e.g. John" />
          <Field label="Last Name"  value={form.adminLastName}  onChange={update('adminLastName')}  required placeholder="e.g. Smith" />
          <Field label="Mobile Number" value={form.phone} onChange={update('phone')} required placeholder="+27 82 000 0000" type="tel" />
          <Field label="Household Name (optional)" value={form.householdName} onChange={update('householdName')} placeholder="e.g. Smith Family" />
          <div className="field-group">
            <label className="field-label">Number of Household Members</label>
            <select className="field-input" value={form.members} onChange={update('members')}>
              {['1','2','3','4','5','6','7','8+'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button type="submit" className="setup-btn">Continue →</button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form className="setup-form" onSubmit={nextStep}>
          <SectionTitle icon="🏠" title="Home Address" />
          <Field label="Street Address" value={form.addressLine1} onChange={update('addressLine1')} required placeholder="e.g. 14 Protea Road" />
          <Field label="Suburb" value={form.suburb} onChange={update('suburb')} required placeholder="e.g. Sandton" />
          <Field label="City / Town" value={form.city} onChange={update('city')} required placeholder="e.g. Johannesburg" />
          <div className="field-group">
            <label className="field-label">Province</label>
            <select className="field-input" value={form.province} onChange={update('province')}>
              {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Postal Code" value={form.postalCode} onChange={update('postalCode')} required placeholder="e.g. 2196" pattern="[0-9]{4}" />

          <div className="step-nav">
            <button type="button" className="setup-btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button type="submit" className="setup-btn" style={{ flex: 1 }}>Continue →</button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <form className="setup-form" onSubmit={handleSubmit}>
          <SectionTitle icon="🆘" title="Emergency Contact" />
          <Field label="Contact Name"     value={form.emergencyName}     onChange={update('emergencyName')}     required placeholder="e.g. Jane Smith" />
          <Field label="Contact Number"   value={form.emergencyPhone}    onChange={update('emergencyPhone')}    required placeholder="+27 83 000 0000" type="tel" />
          <Field label="Relationship"     value={form.emergencyRelation} onChange={update('emergencyRelation')} required placeholder="e.g. Spouse, Parent, Sibling" />

          <div className="setup-info-box">
            <span>🔒</span>
            <span>Your details are encrypted and only used to dispatch emergency services when needed.</span>
          </div>

          <div className="step-nav">
            <button type="button" className="setup-btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button type="submit" className="setup-btn" style={{ flex: 1 }} disabled={busy}>
              {busy ? <span className="spinner" /> : 'Activate SafeLink ✓'}
            </button>
          </div>
        </form>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .setup-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          padding: 32px 20px 48px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .setup-header { display: flex; flex-direction: column; gap: 8px; }
        .setup-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .setup-title { margin: 0; font-size: 26px; font-weight: 700; }
        .setup-sub   { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

        .progress-bar-row {
          display: flex; gap: 8px; align-items: flex-start;
        }
        .progress-step {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; flex: 1; text-align: center;
        }
        .step-dot {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          transition: all 0.3s;
        }
        .progress-step.active .step-dot {
          background: var(--primary); border-color: var(--primary);
          box-shadow: 0 0 16px rgba(44,90,133,0.5);
        }
        .progress-step.done .step-dot {
          background: var(--success, #38a169); border-color: var(--success, #38a169);
        }
        .step-label { font-size: 10px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .setup-form { display: flex; flex-direction: column; gap: 16px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .field-input {
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: var(--text-primary, #fff);
          font-size: 15px; outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
        }
        .field-input:focus { border-color: var(--primary); }
        .field-input::placeholder { color: rgba(255,255,255,0.25); }

        .setup-btn {
          padding: 16px;
          background: linear-gradient(135deg, var(--primary), #1a3a5c);
          border: none; border-radius: 14px;
          color: #fff; font-size: 16px; font-weight: 700;
          cursor: pointer; box-shadow: 0 4px 20px rgba(44,90,133,0.4);
          display: flex; align-items: center; justify-content: center;
          min-height: 52px; transition: opacity 0.2s;
        }
        .setup-btn:disabled { opacity: 0.6; }
        .setup-btn-outline {
          padding: 16px 20px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px; background: transparent;
          color: var(--text-secondary); font-size: 15px; font-weight: 600;
          cursor: pointer;
        }
        .step-nav { display: flex; gap: 12px; align-items: center; }

        .setup-info-box {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(44,90,133,0.12);
          border: 1px solid rgba(44,90,133,0.25);
          border-radius: 10px; padding: 12px 14px;
          font-size: 12px; color: var(--text-secondary); line-height: 1.5;
        }
        .setup-error {
          background: rgba(229,62,62,0.15);
          border: 1px solid rgba(229,62,62,0.4);
          border-radius: 10px; padding: 12px 14px;
          font-size: 13px; color: #fc8181;
        }
        .spinner {
          display: inline-block; width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text', pattern }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <input
        type={type}
        className="field-input"
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
      />
    </div>
  );
}
