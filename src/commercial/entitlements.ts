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

export type FeatureAccessReason =
  | 'free-feature'
  | 'premium-active'
  | 'premium-required'
  | 'premium-inactive'
  | 'premium-expired'
  | 'premium-invalid-expiry';

export type FeatureAccessDecision = {
  allowed: boolean;
  requiredTier: AccessTier;
  reason: FeatureAccessReason;
};

export const COMMERCIAL_CONFIG = {
  billingEnabled: false,
  publicPreview: true,
  distributionModel: 'single-app',
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

function premiumExpiryState(
  entitlement: UserEntitlement,
  now: Date,
): 'valid' | 'expired' | 'invalid' {
  if (!entitlement.expiresAt) return 'valid';

  const expiresAt = Date.parse(entitlement.expiresAt);
  if (!Number.isFinite(expiresAt)) return 'invalid';
  if (expiresAt <= now.getTime()) return 'expired';
  return 'valid';
}

export function featureAccessDecision(
  feature: CommercialFeature,
  entitlement: UserEntitlement = DEFAULT_ENTITLEMENT,
  now: Date = new Date(),
): FeatureAccessDecision {
  const tier = FEATURE_TIER[feature];

  if (tier === 'free') {
    return {
      allowed: true,
      requiredTier: 'free',
      reason: 'free-feature',
    };
  }

  if (entitlement.tier !== 'premium') {
    return {
      allowed: false,
      requiredTier: 'premium',
      reason: 'premium-required',
    };
  }

  if (!entitlement.active) {
    return {
      allowed: false,
      requiredTier: 'premium',
      reason: 'premium-inactive',
    };
  }

  const expiryState = premiumExpiryState(entitlement, now);
  if (expiryState === 'invalid') {
    return {
      allowed: false,
      requiredTier: 'premium',
      reason: 'premium-invalid-expiry',
    };
  }

  if (expiryState === 'expired') {
    return {
      allowed: false,
      requiredTier: 'premium',
      reason: 'premium-expired',
    };
  }

  return {
    allowed: true,
    requiredTier: 'premium',
    reason: 'premium-active',
  };
}

export function hasFeatureAccess(
  feature: CommercialFeature,
  entitlement: UserEntitlement = DEFAULT_ENTITLEMENT,
  now: Date = new Date(),
): boolean {
  return featureAccessDecision(feature, entitlement, now).allowed;
}

export function requiredTier(feature: CommercialFeature): AccessTier {
  return FEATURE_TIER[feature];
}
