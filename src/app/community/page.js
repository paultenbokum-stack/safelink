'use client';

import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import ComingSoon from '@/app/components/ComingSoon';
import { FEATURES } from '@/lib/features';

export default function CommunityPage() {
  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', paddingBottom: 90 }}>
        <div style={{ padding: '24px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Community Watch</h1>
        </div>
        {FEATURES.COMMUNITY_WATCH ? (
          <div style={{ padding: 20 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Community watch feed coming soon...</p>
          </div>
        ) : (
          <ComingSoon
            icon="👁️"
            title="Community Watch"
            description="Share and receive real-time security alerts from neighbours in your area. Build a safer street, together."
            accentColor="#805ad5"
          />
        )}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
