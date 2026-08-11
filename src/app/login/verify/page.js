'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOTP() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [phone, setPhone] = useState('+27 82 XXX XXXX');
  const inputRefs = useRef([]);

  useEffect(() => {
    const storedPhone = localStorage.getItem('phone');
    if (storedPhone) {
      // Masking the phone number except last 4 digits
      const masked = storedPhone.slice(0, -4).replace(/\d/g, 'X') + storedPhone.slice(-4);
      setPhone(masked);
    }
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = val;
      setOtp(newOtp);
      if (val && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.join('').length === 6) {
      router.push('/login/subscribe');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark, #0f1923)', color: 'var(--text-primary, #ffffff)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '430px', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.5s ease-out' }}>
        
        <button onClick={() => router.back()} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-primary, #ffffff)', fontSize: '24px', cursor: 'pointer', marginBottom: '40px', padding: '8px' }}>
          &#8592;
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>Verify Your Number</h1>
        <p style={{ color: 'var(--text-secondary, #8899aa)', marginBottom: '40px', fontSize: '16px', lineHeight: '1.5' }}>
          We sent a 6-digit code to <br/><strong style={{ color: 'var(--text-primary, #ffffff)' }}>{phone}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="tel"
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{ width: '50px', height: '60px', borderRadius: '12px', backgroundColor: 'var(--bg-card, #162231)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent, #f7bb23)', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                required
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-secondary, #8899aa)', fontSize: '14px' }}>
            {timer > 0 ? (
              <span>Resend code in {timer}s</span>
            ) : (
              <button type="button" onClick={() => setTimer(30)} style={{ background: 'none', border: 'none', color: 'var(--accent, #f7bb23)', fontWeight: 'bold', cursor: 'pointer' }}>
                Resend Code
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--accent, #f7bb23)', color: 'var(--bg-dark, #0f1923)', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px', minHeight: '48px', opacity: otp.join('').length === 6 ? 1 : 0.5 }}
            disabled={otp.join('').length !== 6}
          >
            Verify
          </button>
        </form>

      </div>
    </div>
  );
}
