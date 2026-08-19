export type AccessTier = 'free' | 'premium';

export type CommercialFeature =
  | 'week_planning'
  | 'live_day'
  | 'actual_exit'
  | 'important_moments'
  | 'offline_storage'
  | 'rest_basic'
  | 'move_basic'
  | 'food_basic'
  | 'manual_corrections'
  | 'advanced_schedule_import'
  | 'move_adaptive'
  | 'food_adaptive'
  | 'rest_adaptive'
  | 'habits_garden'
  | 'advanced_insights'
  | 'advanced_personalization'
  | 'automations'
  | 'cloud_sync'
  | 'assistant_brain';

export type EntitlementSource = 'local' | 'google-play';

export type UserEntitlement = {
  tier: AccessTier;
  source: EntitlementSource;
  active: boolean;
  expiresAt?: string | null;
};

export const COMMERCIAL_CONFIG = {
  billingEnabled: false,
  publicPreview: true,
} as const;

export const DEFAULT_ENTITLEMENT: UserEntitlement = {
  tier: 'free',
  source: 'local',
  active: true,
};

export const FEATURE_TIER: Readonly<Record<CommercialFeature, AccessTier>> = {
  week_planning: 'free',
  live_day: 'free',
  actual_exit: 'free',
  important_moments: 'free',
  offline_storage: 'free',
  rest_basic: 'free',
  move_basic: 'free',
  food_basic: 'free',
  manual_corrections: 'free',
  advanced_schedule_import: 'premium',
  move_adaptive: 'premium',
  food_adaptive: 'premium',
  rest_adaptive: 'premium',
  habits_garden: 'premium',
  advanced_insights: 'premium',
  advanced_personalization: 'premium',
  automations: 'premium',
  cloud_sync: 'premium',
  assistant_brain: 'premium',
};

function isExpired(entitlement: UserEntitlement, now: Date): boolean {
  if (!entitlement.expiresAt) return false;
  const expiresAt = Date.parse(entitlement.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= now.getTime();
}

export function hasFeatureAccess(
  feature: CommercialFeature,
  entitlement: UserEntitlement = DEFAULT_ENTITLEMENT,
  now: Date = new Date(),
): boolean {
  if (FEATURE_TIER[feature] === 'free') return true;
  return entitlement.active && entitlement.tier === 'premium' && !isExpired(entitlement, now);
}

export function requiredTier(feature: CommercialFeature): AccessTier {
  return FEATURE_TIER[feature];
}
