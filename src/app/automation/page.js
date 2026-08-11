'use client';

import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import ComingSoon from '@/app/components/ComingSoon';
import { FEATURES } from '@/lib/features';

export default function AutomationPage() {
  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', paddingBottom: 90 }}>
        <div style={{ padding: '24px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Home Automation</h1>
        </div>
        {FEATURES.HOME_AUTOMATION ? (
          <div style={{ padding: 20 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Automation controls loading...</p>
          </div>
        ) : (
          <ComingSoon
            icon="🏡"
            title="Home Automation"
            description="Control your lights, locks, gates, and more directly from the SafeLink app. Smart home security is coming."
            accentColor="#dd6b20"
          />
        )}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
