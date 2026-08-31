'use client';

/**
 * useSubscription — Client-side hook for subscription tier & feature gating.
 *
 * Reads the user's subscription tier from Firestore (via the household doc)
 * and provides feature-check utilities for gating UI elements.
 *
 * Usage:
 *   const { tier, canAccess, isLoading } = useSubscription();
 *   if (!canAccess('sos_dispatch')) return <UpgradePrompt />;
 */

import { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { hasFeature } from './subscriptions';

export function useSubscription() {
  const { user } = useAuth();
  const [tier, setTier] = useState('free');
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setTier('free');
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // Check localStorage cache first (for instant render)
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`safelink_sub_${user.uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setTier(parsed.tier || 'free');
          setSubscription(parsed);
        } catch (e) { /* ignore */ }
      }
    }

    // Real-time listener on household doc
    const unsubscribe = onSnapshot(
      doc(db, 'households', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const sub = data.subscription || {};
          const newTier = sub.tier || (data.membershipStatus === 'active' ? 'standard' : 'free');
          setTier(newTier);
          setSubscription(sub);

          // Cache for instant render
          if (typeof window !== 'undefined') {
            localStorage.setItem(`safelink_sub_${user.uid}`, JSON.stringify({ ...sub, tier: newTier }));
          }
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn('[useSubscription] Firestore listener error:', err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  /**
   * Check if the current tier can access a feature.
   * Feature names:
   *   store_access, device_monitoring, community_watch_read, community_watch_write,
   *   sos_dispatch, family_gps, geofence_alerts, incident_reports,
   *   direct_security, priority_dispatch, home_automation, route_playback,
   *   advanced_analytics, location_sharing
   */
  const canAccess = (feature) => hasFeature(tier, feature);

  return {
    tier,
    subscription,
    isLoading,
    canAccess,
    isFree: tier === 'free',
    isStandard: tier === 'standard',
    isPremium: tier === 'premium',
    isPaid: tier === 'standard' || tier === 'premium',
  };
}
