'use client';

/**
 * FeatureGate — Wraps content that requires a specific subscription tier.
 *
 * Usage:
 *   <FeatureGate feature="sos_dispatch" fallback={<UpgradeCard />}>
 *     <SOSButton />
 *   </FeatureGate>
 *
 * Or inline:
 *   <FeatureGate feature="family_gps">
 *     <FamilyRadarMap />
 *   </FeatureGate>
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/useSubscription';

export default function FeatureGate({ feature, children, fallback }) {
  const { canAccess, isLoading, tier } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-md">
        <div className="w-5 h-5 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <div className="glass-panel rounded-2xl p-md border border-secondary/30 text-center space-y-sm">
      <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center mx-auto">
        <span
          className="material-symbols-outlined text-3xl text-secondary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          lock
        </span>
      </div>
      <h3 className="font-headline-md text-lg font-bold text-on-surface">
        Upgrade to Unlock
      </h3>
      <p className="font-body-md text-sm text-on-surface-variant max-w-sm mx-auto">
        {getFeatureDescription(feature)} Upgrade your plan to access this feature.
      </p>
      <p className="text-xs text-on-surface-variant">
        Current plan: <strong className="text-secondary capitalize">{tier}</strong>
      </p>
      <button
        onClick={() => router.push('/subscribe')}
        className="bg-secondary hover:bg-secondary-fixed text-on-secondary font-label-md text-sm font-bold py-2.5 px-8 rounded-xl active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg">upgrade</span>
        View Plans
      </button>
    </div>
  );
}

function getFeatureDescription(feature) {
  const descriptions = {
    sos_dispatch: 'SOS emergency dispatch with armed response.',
    family_gps: 'Real-time GPS tracking for your family members.',
    geofence_alerts: 'Geofence zone alerts for Home, School, and Work.',
    community_watch_write: 'Post alerts and reports to your community.',
    direct_security: 'Direct integration with your local security company.',
    priority_dispatch: 'Priority dispatch with dedicated local responders.',
    home_automation: 'Smart home control for lights, locks, and gates.',
    route_playback: 'Historical route playback and trip reports.',
    advanced_analytics: 'Advanced security analytics dashboard.',
    location_sharing: 'Generate shareable live location URLs.',
  };
  return descriptions[feature] || 'This feature requires a higher subscription tier.';
}
