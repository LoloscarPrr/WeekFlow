import { sqliteStateStore } from '../data/local/sqlite/SQLiteStateStore';
import {
  sanitizeGardenPreferences,
  type ConfigurableGardenPillarKey,
  type GardenPreferences,
} from './model';

export type { ConfigurableGardenPillarKey, GardenPreferences, GardenPillarPlan } from './model';
export { formatGardenDays, sanitizeGardenPreferences } from './model';

const GARDEN_PREFERENCES_KEY = 'garden-pillar-preferences';

export function loadGardenPreferences(): GardenPreferences {
  const persisted = sqliteStateStore.read<unknown>(GARDEN_PREFERENCES_KEY);
  return persisted ? sanitizeGardenPreferences(persisted) : {};
}

export function saveGardenPreferences(preferences: GardenPreferences): GardenPreferences {
  const sanitized = sanitizeGardenPreferences(preferences);
  sqliteStateStore.write(GARDEN_PREFERENCES_KEY, sanitized);
  return sanitized;
}

export function saveGardenPillarPlan(
  preferences: GardenPreferences,
  key: ConfigurableGardenPillarKey,
  days: number[],
): GardenPreferences {
  return saveGardenPreferences({ ...preferences, [key]: { days } });
}
