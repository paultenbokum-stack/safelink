/**
 * SafeLink Subscription Tiers
 *
 * Defines the 3-tier pricing model:
 * - Free (Essentials): Store access + device monitoring only
 * - Standard (R100/mo): SOS dispatch via Aura + Family GPS
 * - Premium (R150/mo): Direct security company integration
 */

export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'SafeLink Essentials',
    price: 0,
    priceDisplay: 'FREE',
    currency: 'ZAR',
    paystackPlanCode: null, // No payment required
    color: '#6B7280',
    icon: '🛡️',
    features: [
      'Sentinel IoT device store access',
      'Device monitoring dashboard',
      'Purchase & track BLE devices',
      'Basic device alerts (low battery)',
      'Community Watch (read-only)',
    ],
    excluded: [
      'SOS emergency dispatch',
      'Armed response',
      'Family GPS radar',
      'Geofence alerts',
      'Direct security company integration',
      'Home automation',
    ],
  },

  standard: {
    id: 'standard',
    name: 'SafeLink Protected',
    price: 10000, // In cents for Paystack (R100.00)
    priceDisplay: 'R100',
    currency: 'ZAR',
    interval: 'monthly',
    paystackPlanCode: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_STANDARD || '',
    color: '#F7BB23',
    icon: '🔒',
    features: [
      'Everything in Essentials',
      'SOS panic button → Aura central dispatch',
      'Verified armed response',
      'Family GPS radar (real-time tracking)',
      'Geofence alerts (Home, School, Work)',
      '24/7 monitoring',
      'Community Watch (full access)',
      'Incident history & reports',
    ],
    excluded: [
      'Direct security company integration',
      'Priority local dispatch',
      'Home automation',
    ],
  },

  premium: {
    id: 'premium',
    name: 'SafeLink Guarded',
    price: 15000, // In cents for Paystack (R150.00)
    priceDisplay: 'R150',
    currency: 'ZAR',
    interval: 'monthly',
    paystackPlanCode: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PREMIUM || '',
    color: '#EF4444',
    icon: '🛡️',
    features: [
      'Everything in Protected',
      'Direct integration with local armed response',
      'Dedicated local responder',
      'Priority dispatch',
      'Home automation control',
      'Advanced analytics dashboard',
      'Family location sharing URL',
      'Route playback history',
    ],
    excluded: [],
  },
};

/**
 * Feature gate check.
 * Returns true if the user's subscription tier includes the feature.
 */
export function hasFeature(tier, feature) {
  const featureMap = {
    store_access:          ['free', 'standard', 'premium'],
    device_monitoring:     ['free', 'standard', 'premium'],
    community_watch_read:  ['free', 'standard', 'premium'],
    community_watch_write: ['standard', 'premium'],
    sos_dispatch:          ['standard', 'premium'],
    family_gps:            ['standard', 'premium'],
    geofence_alerts:       ['standard', 'premium'],
    incident_reports:      ['standard', 'premium'],
    direct_security:       ['premium'],
    priority_dispatch:     ['premium'],
    home_automation:       ['premium'],
    route_playback:        ['premium'],
    advanced_analytics:    ['premium'],
    location_sharing:      ['premium'],
  };

  return (featureMap[feature] || []).includes(tier);
}

/**
 * Get tier config by ID.
 */
export function getTier(tierId) {
  return SUBSCRIPTION_TIERS[tierId] || SUBSCRIPTION_TIERS.free;
}

/**
 * Get all tiers as an ordered array.
 */
export function getAllTiers() {
  return [
    SUBSCRIPTION_TIERS.free,
    SUBSCRIPTION_TIERS.standard,
    SUBSCRIPTION_TIERS.premium,
  ];
}
