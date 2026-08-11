'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHousehold, updateSubscription } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';

const PLAN_MONTHLY = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_MONTHLY || '';
const PLAN_ANNUAL  = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_ANNUAL  || '';
const PS_KEY       = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY   || '';

const PLANS = [
  {
    id: 'annual',
    label: 'Annual',
    badge: 'BEST VALUE',
    price: 1920,
    period: '/year',
    equiv: 'R160/month',
    saving: 'Save R480 (20% off)',
    planCode: PLAN_ANNUAL,
    color: '#f7bb23',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    badge: null,
    price: 200,
    period: '/month',
    equiv: null,
    saving: 'Cancel anytime',
    planCode: PLAN_MONTHLY,
    color: '#2c5a85',
  },
];

const FEATURES = [
  { icon: '🛡️', text: 'Mobile panic button with armed response' },
  { icon: '📍', text: 'Real-time family location tracking' },
  { icon: '🚑', text: 'Medical, fire & towing dispatch' },
  { icon: '📡', text: 'NFC & BLE device tracking' },
  { icon: '🔧', text: 'Technician booking & alarm testing' },
  { icon: '👁️', text: '24/7 control room monitoring' },
];

export default function SubscribePage() {
  return (
    <AuthGuard>
      <SubscribeContent />
    </AuthGuard>
  );
}

function SubscribeContent() {
  const { user } = useAuth();
  const router   = useRouter();

  const [selected, setSelected]     = useState('annual');
  const [household, setHousehold]   = useState(null);
  const [busy, setBusy]             = useState(false);
  const [subStatus, setSubStatus]   = useState(null); // existing subscription

  useEffect(() => {
    if (!user) return;
    getHousehold(user.uid).then(h => {
      if (h) {
        setHousehold(h);
        if (h.subscription?.status === 'active') {
          setSubStatus(h.subscription);
        }
      }
    });
  }, [user]);

  const activePlan = PLANS.find(p => p.id === selected);

  const handleSubscribe = () => {
    if (!user || !activePlan) return;
    if (!PS_KEY) {
      alert('Paystack key not configured. Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env.local');
      return;
    }
    setBusy(true);

    // Load Paystack inline script dynamically
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
      // eslint-disable-next-line no-undef
      const handler = PaystackPop.setup({
        key:       PS_KEY,
        email:     user.email,
        amount:    activePlan.price * 100, // kobo/cents
        currency:  'ZAR',
        plan:      activePlan.planCode, // Paystack recurring plan code
        ref:       `SBSec-SUB-${Date.now().toString(36).toUpperCase()}`,
        metadata: {
          custom_fields: [
            { display_name: 'Plan',       variable_name: 'plan',    value: activePlan.label },
            { display_name: 'Household',  variable_name: 'uid',     value: user.uid },
          ],
        },
        callback: async (response) => {
          // Payment successful — update Firestore
          await updateSubscription(user.uid, {
            status:        'active',
            plan:          activePlan.id,
            paystackRef:   response.reference,
            startedAt:     new Date().toISOString(),
            nextBilling:   getNextBillingDate(activePlan.id),
            amount:        activePlan.price,
          });
          setBusy(false);
          router.push('/dashboard?subscribed=1');
        },
        onClose: () => {
          setBusy(false);
        },
      });
      handler.openIframe();
    };
    script.onerror = () => setBusy(false);
    document.body.appendChild(script);
  };

  if (subStatus) {
    return <ActiveSubscription sub={subStatus} onBack={() => router.back()} />;
  }

  return (
    <div className="sub-page">
      {/* Header */}
      <div className="sub-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="sub-header-title">Join SafeLink</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero */}
      <div className="sub-hero">
        <div className="sub-shield">🛡️</div>
        <h1 className="sub-headline">Secure Your World</h1>
        <p className="sub-tagline">The digital bodyguard for the modern South African household.</p>
      </div>

      {/* Plan selector */}
      <div className="plan-cards">
        {PLANS.map(plan => (
          <button
            key={plan.id}
            className={`plan-card ${selected === plan.id ? 'plan-active' : ''}`}
            onClick={() => setSelected(plan.id)}
            style={selected === plan.id ? { borderColor: plan.color } : {}}
          >
            <div className="plan-card-top">
              <div>
                <div className="plan-label">{plan.label}</div>
                {plan.badge && (
                  <div className="plan-badge" style={{ background: plan.color, color: '#000' }}>
                    {plan.badge}
                  </div>
                )}
              </div>
              <div className="plan-price-wrap">
                <span className="plan-price" style={selected === plan.id ? { color: plan.color } : {}}>
                  R{plan.price.toLocaleString()}
                </span>
                <span className="plan-period">{plan.period}</span>
              </div>
            </div>
            {plan.equiv && <div className="plan-equiv">{plan.equiv}</div>}
            <div className="plan-saving" style={selected === plan.id ? { color: plan.color } : {}}>
              {plan.saving}
            </div>
            {selected === plan.id && (
              <div className="plan-check" style={{ background: plan.color }}>✓</div>
            )}
          </button>
        ))}
      </div>

      {/* Features list */}
      <div className="features-card">
        <div className="features-title">Everything included</div>
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-row">
            <span className="feature-icon">{f.icon}</span>
            <span className="feature-text">{f.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="sub-cta-wrap">
        <button
          className="sub-cta-btn"
          onClick={handleSubscribe}
          disabled={busy}
        >
          {busy
            ? 'Opening payment…'
            : `Subscribe — R${activePlan.price.toLocaleString()}${activePlan.period}`}
        </button>
        <p className="sub-note">Payment powered by Paystack · Secure · {activePlan.saving}</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sub-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          display: flex; flex-direction: column;
          padding-bottom: 40px;
        }

        /* Header */
        .sub-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .back-btn {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 8px; color: var(--text-primary);
          cursor: pointer; display: flex; align-items: center;
        }
        .sub-header-title { font-weight: 700; font-size: 17px; color: var(--accent, #f7bb23); }

        /* Hero */
        .sub-hero { text-align: center; padding: 36px 24px 20px; }
        .sub-shield { font-size: 48px; margin-bottom: 16px; filter: drop-shadow(0 0 20px rgba(247,187,35,0.4)); }
        .sub-headline { margin: 0 0 10px; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
        .sub-tagline { margin: 0; font-size: 15px; color: var(--text-secondary); line-height: 1.5; }

        /* Plan cards */
        .plan-cards { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
        .plan-card {
          background: rgba(22, 34, 49, 0.8);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 16px; padding: 18px 20px;
          cursor: pointer; text-align: left;
          transition: border-color 0.2s, transform 0.1s;
          position: relative; width: 100%;
        }
        .plan-card:active { transform: scale(0.99); }
        .plan-active { background: rgba(22, 34, 49, 0.95); box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
        .plan-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .plan-label { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
        .plan-badge {
          display: inline-block; padding: 3px 9px; border-radius: 8px;
          font-size: 10px; font-weight: 900; letter-spacing: 0.5px;
        }
        .plan-price-wrap { text-align: right; }
        .plan-price { font-size: 30px; font-weight: 900; color: var(--text-primary); }
        .plan-period { font-size: 13px; color: var(--text-secondary); margin-left: 2px; }
        .plan-equiv { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }
        .plan-saving { font-size: 13px; color: var(--text-secondary); font-weight: 600; margin-top: 4px; }
        .plan-check {
          position: absolute; top: -8px; right: -8px;
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 900; color: #000;
        }

        /* Features */
        .features-card {
          margin: 4px 20px 8px;
          background: rgba(22, 34, 49, 0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 20px;
        }
        .features-title { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
        .feature-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .feature-row:last-child { border-bottom: none; }
        .feature-icon { font-size: 18px; width: 26px; text-align: center; }
        .feature-text { font-size: 14px; color: #e0e8f0; }

        /* CTA */
        .sub-cta-wrap { padding: 20px; }
        .sub-cta-btn {
          width: 100%; padding: 18px;
          background: var(--accent, #f7bb23); color: #000;
          border: none; border-radius: 14px;
          font-size: 16px; font-weight: 900; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .sub-cta-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sub-cta-btn:active { transform: scale(0.98); }
        .sub-note { text-align: center; font-size: 12px; color: var(--text-secondary); margin-top: 12px; }
      `}} />
    </div>
  );
}

function ActiveSubscription({ sub, onBack }) {
  const plan = sub.plan === 'annual' ? 'Annual' : 'Monthly';
  const amount = sub.plan === 'annual' ? 'R1,920/year' : 'R200/month';

  return (
    <div className="sub-page" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="active-shield">🛡️</div>
      <h2 style={{ fontSize: 26, fontWeight: 900, margin: '16px 0 8px', textAlign: 'center' }}>
        You&apos;re Protected
      </h2>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32 }}>
        Your SafeLink membership is active.
      </p>
      <div className="active-card">
        <div className="active-row">
          <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
          <span style={{ fontWeight: 700 }}>SafeLink {plan}</span>
        </div>
        <div className="active-row">
          <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{amount}</span>
        </div>
        {sub.nextBilling && (
          <div className="active-row">
            <span style={{ color: 'var(--text-secondary)' }}>Next billing</span>
            <span style={{ fontWeight: 700 }}>{new Date(sub.nextBilling).toLocaleDateString('en-ZA')}</span>
          </div>
        )}
        <div className="active-row">
          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
          <span style={{ fontWeight: 700, color: '#38a169' }}>● Active</span>
        </div>
      </div>
      <button className="back-to-profile" onClick={onBack}>← Back to Profile</button>

      <style dangerouslySetInnerHTML={{ __html: `
        .active-shield { font-size: 64px; filter: drop-shadow(0 0 30px rgba(247,187,35,0.5)); }
        .active-card {
          width: 100%;
          background: rgba(22,34,49,0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .active-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 15px;
        }
        .active-row:last-child { border-bottom: none; }
        .back-to-profile {
          margin-top: 24px; background: none; border: 1px solid rgba(255,255,255,0.15);
          color: var(--text-secondary); border-radius: 10px; padding: 12px 28px;
          cursor: pointer; font-size: 14px; font-weight: 600;
        }
      `}} />
    </div>
  );
}

function getNextBillingDate(planId) {
  const d = new Date();
  if (planId === 'annual') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}
