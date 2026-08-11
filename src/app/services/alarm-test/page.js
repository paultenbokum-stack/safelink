'use client';

import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';
import ComingSoon from '@/app/components/ComingSoon';

export default function AlarmTestPage() {
  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', paddingBottom: 90 }}>
        <div style={{ padding: '24px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Alarm Test</h1>
        </div>
        <ComingSoon
          icon="🔔"
          title="Alarm Testing"
          description="Run a live alarm test on your Sentinel devices and get a full report on response times and system health."
          accentColor="#2c5a85"
        />
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
