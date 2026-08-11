'use client';

import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import ComingSoon from '@/app/components/ComingSoon';

export default function AddBLEDevice() {
  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', paddingBottom: 90 }}>
        <div style={{ padding: '24px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Add Device via Bluetooth</h1>
        </div>
        <ComingSoon
          icon="📶"
          title="Bluetooth Device Pairing"
          description="Pair your Sentinel device wirelessly over Bluetooth — feature coming in a future update."
          accentColor="#4299e1"
        />
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
