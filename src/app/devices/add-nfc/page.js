'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddNFCTag() {
  const router = useRouter();
  const [step, setStep] = useState('tap'); // 'tap', 'scanning', 'form'
  const [tagId, setTagId] = useState('');

  useEffect(() => {
    if (step === 'tap') {
      const timer = setTimeout(() => {
        setStep('scanning');
        setTimeout(() => {
          setTagId('NFC-Q7R8S9T0');
          setStep('form');
        }, 1500);
      }, 2000); // simulate initial wait
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('NFC Tag successfully registered!');
    router.push('/devices');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', padding: 20, color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30, paddingTop: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 20, margin: '0 0 0 15px' }}>Register NFC Tag</h1>
      </div>

      {step !== 'form' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 60, zIndex: 2 }}>📱</div>
            <div style={{ 
              position: 'absolute', inset: -20, borderRadius: '50%', 
              border: '2px solid var(--primary)', 
              animation: 'ripple 1.5s infinite ease-out'
            }} />
            <div style={{ 
              position: 'absolute', inset: -40, borderRadius: '50%', 
              border: '2px solid var(--primary)', opacity: 0.5,
              animation: 'ripple 1.5s infinite ease-out 0.5s'
            }} />
          </div>
          
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>
            {step === 'tap' ? 'Ready to Scan' : 'Reading Tag...'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 250 }}>
            {step === 'tap' 
              ? 'Hold your phone near the NFC tag to register it to your account.' 
              : 'Keep your phone steady.'}
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 20, borderRadius: 16, animation: 'fadeIn 0.5s ease' }}>
          <div style={{ backgroundColor: 'rgba(56,161,105,0.1)', color: 'var(--success)', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 25, fontWeight: 'bold' }}>
            ✓ Tag Detected! {tagId}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Item Name</label>
              <input type="text" placeholder="e.g., MacBook Pro" required style={{
                width: '100%', padding: 15, borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 16
              }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Category</label>
              <select required style={{
                width: '100%', padding: 15, borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 16, appearance: 'none'
              }}>
                <option value="" disabled selected>Select category...</option>
                <option value="Electronics">Electronics</option>
                <option value="Personal">Personal Items</option>
                <option value="Vehicle">Vehicle Accessories</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Serial Number (Optional)</label>
              <input type="text" placeholder="Device serial number" style={{
                width: '100%', padding: 15, borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 16
              }} />
            </div>

            <div style={{ marginBottom: 25 }}>
              <button type="button" className="btn-outline" style={{ width: '100%', padding: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span>📷</span> Add Photo of Item
              </button>
            </div>

            <button type="submit" className="btn-primary" style={{ 
              width: '100%', padding: 16, backgroundColor: 'var(--accent)', 
              color: '#000', fontSize: 16, fontWeight: 'bold' 
            }}>
              Register Tag
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
