export type ConfigurableGardenPillarKey = 'relationships' | 'wellbeing' | 'home' | 'responsibilities' | 'personal';

export type GardenPillarPlan = {
  days: number[];
};

export type GardenPreferences = Partial<Record<ConfigurableGardenPillarKey, GardenPillarPlan>>;

const CONFIGURABLE_KEYS: ConfigurableGardenPillarKey[] = ['relationships', 'wellbeing', 'home', 'responsibilities', 'personal'];

function sanitizeDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((day): day is number => Number.isInteger(day) && day >= 1 && day <= 7))].sort((a, b) => a - b);
}

export function sanitizeGardenPreferences(value: unknown): GardenPreferences {
  if (!value || typeof value !== 'object') return {};
  const input = value as Record<string, unknown>;
  const output: GardenPreferences = {};
  for (const key of CONFIGURABLE_KEYS) {
    const raw = input[key];
    if (!raw || typeof raw !== 'object') continue;
    const days = sanitizeDays((raw as { days?: unknown }).days);
    if (days.length > 0) output[key] = { days };
  }
  return output;
}

export function formatGardenDays(days: number[]): string {
  const labels: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
  return days.map((day) => labels[day]).filter(Boolean).join(' · ');
}
