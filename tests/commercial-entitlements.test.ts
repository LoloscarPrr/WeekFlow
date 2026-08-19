import {
  COMMERCIAL_CONFIG,
  DEFAULT_ENTITLEMENT,
  hasFeatureAccess,
  requiredTier,
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

const expiredPremium: UserEntitlement = {
  tier: 'premium',
  source: 'google-play',
  active: true,
  expiresAt: '2026-08-01T00:00:00.000Z',
};

const now = new Date('2026-08-18T12:00:00.000Z');

equal(COMMERCIAL_CONFIG.billingEnabled, false, 'billing permanece desactivado en la fundación comercial');
equal(DEFAULT_ENTITLEMENT.tier, 'free', 'el acceso por defecto es Free');
equal(requiredTier('week_planning'), 'free', 'Semana pertenece al núcleo Free');
equal(requiredTier('assistant_brain'), 'premium', 'Assistant/Brain queda preparado como Premium');
equal(hasFeatureAccess('week_planning', DEFAULT_ENTITLEMENT, now), true, 'Free conserva planificación semanal');
equal(hasFeatureAccess('move_basic', DEFAULT_ENTITLEMENT, now), true, 'Free conserva Move básico');
equal(hasFeatureAccess('assistant_brain', DEFAULT_ENTITLEMENT, now), false, 'Free no habilita futuras funciones Premium');
equal(hasFeatureAccess('assistant_brain', premium, now), true, 'Premium habilita funciones Premium');
equal(hasFeatureAccess('assistant_brain', expiredPremium, now), false, 'Premium vencido no mantiene acceso Premium');
equal(hasFeatureAccess('week_planning', expiredPremium, now), true, 'las funciones Free nunca se bloquean al vencer Premium');

console.log('Commercial entitlement regression tests passed.');
