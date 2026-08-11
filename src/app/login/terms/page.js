'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Terms() {
  const router = useRouter();
  const [canAgree, setCanAgree] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 50) {
        setCanAgree(true);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark, #0f1923)', color: 'var(--text-primary, #ffffff)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '430px', display: 'flex', flexDirection: 'column', height: '100vh', padding: '40px 0' }}>
        
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>Terms & Conditions</h1>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="glass-card"
          style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-card, #162231)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-secondary, #8899aa)' }}
        >
          <h3 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px' }}>1. Data Collection</h3>
          <p style={{ marginBottom: '16px' }}>SafeLink collects your background location and audio recordings exclusively during an active SOS emergency event to ensure your safety and provide accurate dispatch services.</p>
          
          <h3 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px' }}>2. POPIA Compliance</h3>
          <p style={{ marginBottom: '16px' }}>We are fully compliant with the Protection of Personal Information Act (POPIA). Your personal data is strictly protected, encrypted, and accessible only by authorized SafeLink personnel.</p>
          
          <h3 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px' }}>3. Data Sharing</h3>
          <p style={{ marginBottom: '16px' }}>Minimum dispatch data (GPS coordinates, emergency type) is shared with first responders and armed response units only when an emergency is activated.</p>

          <h3 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px' }}>4. Audio Recording Consent</h3>
          <p style={{ marginBottom: '16px' }}>By accepting, you consent to the app recording audio through your device microphone during an active SOS event to assist control room operators.</p>

          <h3 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px' }}>5. Data Retention</h3>
          <p style={{ marginBottom: '16px' }}>Emergency event data and audio recordings are retained for a period of 6 months for legal and training purposes, after which they are securely deleted.</p>

          <h3 style={{ color: 'var(--text-primary, #ffffff)', marginBottom: '12px' }}>6. Right to Deletion</h3>
          <p style={{ marginBottom: '32px' }}>You have the right to request the deletion of your personal data at any time by contacting SafeLink support.</p>
        </div>

        {!canAgree && (
          <p style={{ color: 'var(--accent, #f7bb23)', fontSize: '14px', textAlign: 'center', marginBottom: '16px', animation: 'pulse 2s infinite' }}>
            Please scroll to read all terms
          </p>
        )}

        <button 
          onClick={() => router.push('/login/setup')}
          disabled={!canAgree}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: canAgree ? 'var(--accent, #f7bb23)' : '#334155', color: canAgree ? 'var(--bg-dark, #0f1923)' : '#94a3b8', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: canAgree ? 'pointer' : 'not-allowed', minHeight: '48px', transition: 'all 0.3s ease' }}
        >
          I Agree
        </button>

      </div>
    </div>
  );
}
