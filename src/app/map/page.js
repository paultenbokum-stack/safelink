'use client';

import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import ComingSoon from '@/app/components/ComingSoon';
import { FEATURES } from '@/lib/features';

export default function MapPage() {
  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', paddingBottom: 90 }}>
        <div style={{ padding: '24px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Family Tracking</h1>
        </div>
        {FEATURES.FAMILY_TRACKING ? (
          <div style={{ padding: 20 }}>
            {/* Full family tracking map will be implemented here */}
            <p style={{ color: 'var(--text-secondary)' }}>Family tracking map coming online...</p>
          </div>
        ) : (
          <ComingSoon
            icon="🗺️"
            title="Family Tracking"
            description="See all your household members on a live map. Set safe zones, get arrival notifications, and stay connected — all in one place."
            accentColor="#2c5a85"
          />
        )}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
