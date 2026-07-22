/**
 * Optional marketplace modules gated by env flags.
 * Default OFF — keep launch core (auth/marketplace/logistics/security) lean.
 * Set FEATURE_*=true in .env to enable.
 */

function flagEnabled(name: string, defaultOn = false): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return defaultOn;
  }
  return raw === 'true' || raw === '1';
}

export const featureFlags = {
  returns: flagEnabled('FEATURE_RETURNS', false),
  loyalty: flagEnabled('FEATURE_LOYALTY', false),
  gamification: flagEnabled('FEATURE_GAMIFICATION', false),
  blockchain: flagEnabled('FEATURE_BLOCKCHAIN', false),
  accounting: flagEnabled('FEATURE_ACCOUNTING', false),
  hr: flagEnabled('FEATURE_HR', false),
  crm: flagEnabled('FEATURE_CRM', false),
  commission: flagEnabled('FEATURE_COMMISSION', false),
  advancedAnalytics: flagEnabled('FEATURE_ADVANCED_ANALYTICS', false),
  drone: flagEnabled('FEATURE_DRONE', false),
};

export type FeatureFlagKey = keyof typeof featureFlags;
