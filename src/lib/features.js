/**
 * Feature flags driven by environment variables.
 * Set to "true" in .env.local to enable a feature.
 *
 * §2.2 – Family Tracking
 * §2.3 – Armed Response Integration
 * §2.4 – Community Watch
 * §2.5 – Home Automation
 */
export const FEATURES = {
  FAMILY_TRACKING:  process.env.NEXT_PUBLIC_FEATURE_FAMILY_TRACKING  === 'true',
  ARMED_RESPONSE:   process.env.NEXT_PUBLIC_FEATURE_ARMED_RESPONSE   === 'true',
  COMMUNITY_WATCH:  process.env.NEXT_PUBLIC_FEATURE_COMMUNITY_WATCH  === 'true',
  HOME_AUTOMATION:  process.env.NEXT_PUBLIC_FEATURE_HOME_AUTOMATION  === 'true',
};
