'use client';

import { useRouter } from 'next/navigation';

export default function Subscribe() {
  const router = useRouter();

  const features = [
    "Mobile panic button with armed response",
    "Real-time family location tracking",
    "Medical, fire & towing dispatch",
    "NFC & BLE device tracking",
    "Technician booking & alarm testing",
    "24/7 control room monitoring"
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark, #0f1923)', color: 'var(--text-primary, #ffffff)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '430px', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.5s ease-out' }}>
        
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>Join SafeLink</h1>

        <div className="glass-card" style={{ backgroundColor: 'var(--bg-card, #162231)', borderRadius: '20px', padding: '32px 24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', marginBottom: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--text-secondary, #8899aa)', marginBottom: '8px', textAlign: 'center' }}>SafeLink Member</h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--accent, #f7bb23)', textAlign: 'center', marginBottom: '32px' }}>
            R100 <span style={{ fontSize: '18px', color: 'var(--text-secondary, #8899aa)' }}>/ month</span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {features.map((feature, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', fontSize: '15px', lineHeight: '1.4' }}>
                <span style={{ color: 'var(--accent, #f7bb23)', marginRight: '12px', fontSize: '18px' }}>✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <button 
          onClick={() => router.push('/login/terms')}
          className="btn-primary"
          style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--accent, #f7bb23)', color: 'var(--bg-dark, #0f1923)', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', minHeight: '48px', marginBottom: '16px' }}
        >
          Subscribe — R100/month
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary, #8899aa)', fontSize: '14px', marginBottom: '8px' }}>Powered by <strong>PayFast</strong></p>
          <p style={{ color: 'var(--text-secondary, #8899aa)', fontSize: '13px' }}>Cancel anytime</p>
        </div>

      </div>
    </div>
  );
}
