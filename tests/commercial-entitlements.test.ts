import {
  COMMERCIAL_CONFIG,
  DEFAULT_ENTITLEMENT,
  FEATURE_TIER,
  featureAccessDecision,
  hasFeatureAccess,
  requiredTier,
  type CommercialFeature,
  type UserEntitlement,
} from '../src/commercial/entitlements';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
  }
}

const premium: UserEntitlement = {
  tier: 'premium',
  source: 'google-play',
  active: true,
};

const inactivePremium: UserEntitlement = {
  tier: 'premium',
  source: 'google-play',
  active: false,
};

const expiredPremium: UserEntitlement = {
  tier: 'premium',
  source: 'google-play',
  active: true,
  expiresAt: '2026-08-01T00:00:00.000Z',
};

const malformedPremium: UserEntitlement = {
  tier: 'premium',
  source: 'google-play',
  active: true,
  expiresAt: 'not-a-date',
};

const inactiveFree: UserEntitlement = {
  tier: 'free',
  source: 'local',
  active: false,
};

const now = new Date('2026-08-18T12:00:00.000Z');
const features = Object.keys(FEATURE_TIER) as CommercialFeature[];
const freeFeatures = features.filter((feature) => FEATURE_TIER[feature] === 'free');
const premiumFeatures = features.filter((feature) => FEATURE_TIER[feature] === 'premium');

equal(COMMERCIAL_CONFIG.billingEnabled, false, 'billing permanece desactivado en la fundación comercial');
equal(COMMERCIAL_CONFIG.distributionModel, 'single-app', 'Free/Premium comparten una sola app y línea de actualización');
equal(DEFAULT_ENTITLEMENT.tier, 'free', 'el acceso por defecto es Free');
equal(requiredTier('week_planning'), 'free', 'Semana pertenece al núcleo Free');
equal(requiredTier('assistant_brain'), 'premium', 'Assistant/Brain queda preparado como Premium');

for (const feature of freeFeatures) {
  equal(hasFeatureAccess(feature, DEFAULT_ENTITLEMENT, now), true, `${feature} permanece disponible en Free`);
  equal(hasFeatureAccess(feature, inactiveFree, now), true, `${feature} no depende de una compra activa`);
  equal(hasFeatureAccess(feature, expiredPremium, now), true, `${feature} no se bloquea cuando vence Premium`);
}

for (const feature of premiumFeatures) {
  equal(hasFeatureAccess(feature, DEFAULT_ENTITLEMENT, now), false, `${feature} requiere Premium`);
  equal(hasFeatureAccess(feature, premium, now), true, `${feature} se habilita con Premium activo`);
  equal(hasFeatureAccess(feature, inactivePremium, now), false, `${feature} se bloquea con Premium inactivo`);
  equal(hasFeatureAccess(feature, expiredPremium, now), false, `${feature} se bloquea con Premium vencido`);
  equal(hasFeatureAccess(feature, malformedPremium, now), false, `${feature} falla cerrado con fecha inválida`);
}

const freeDecision = featureAccessDecision('week_planning', DEFAULT_ENTITLEMENT, now);
equal(freeDecision.allowed, true, 'la decisión Free permite acceso');
equal(freeDecision.requiredTier, 'free', 'la decisión Free informa tier requerido');
equal(freeDecision.reason, 'free-feature', 'la decisión Free informa razón estable');

const requiredDecision = featureAccessDecision('assistant_brain', DEFAULT_ENTITLEMENT, now);
equal(requiredDecision.allowed, false, 'la decisión Premium bloquea Free');
equal(requiredDecision.requiredTier, 'premium', 'la decisión Premium informa tier requerido');
equal(requiredDecision.reason, 'premium-required', 'la decisión Premium distingue falta de entitlement');

const activeDecision = featureAccessDecision('assistant_brain', premium, now);
equal(activeDecision.allowed, true, 'Premium activo permite la función');
equal(activeDecision.reason, 'premium-active', 'Premium activo informa razón estable');

const inactiveDecision = featureAccessDecision('assistant_brain', inactivePremium, now);
equal(inactiveDecision.allowed, false, 'Premium inactivo no permite la función');
equal(inactiveDecision.reason, 'premium-inactive', 'Premium inactivo informa razón estable');

const expiredDecision = featureAccessDecision('assistant_brain', expiredPremium, now);
equal(expiredDecision.allowed, false, 'Premium vencido no permite la función');
equal(expiredDecision.reason, 'premium-expired', 'Premium vencido informa razón estable');

const malformedDecision = featureAccessDecision('assistant_brain', malformedPremium, now);
equal(malformedDecision.allowed, false, 'Premium con expiración inválida no permite la función');
equal(malformedDecision.reason, 'premium-invalid-expiry', 'expiración inválida informa razón estable');

console.log('Commercial entitlement regression tests passed.');
