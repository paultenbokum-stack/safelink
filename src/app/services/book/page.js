'use client';

import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import ComingSoon from '@/app/components/ComingSoon';

export default function BookTechnicianPage() {
  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', paddingBottom: 90 }}>
        <div style={{ padding: '24px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Book a Technician</h1>
        </div>
        <ComingSoon
          icon="📅"
          title="Technician Booking"
          description="Schedule a professional technician for installation, maintenance, or fault assessment."
          accentColor="#2c5a85"
        />
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
