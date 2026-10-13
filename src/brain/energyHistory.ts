import { sqliteStateStore } from '../data/local/sqlite/SQLiteStateStore';
import type { Energy } from '../domain/entities/DailyState';
import { localHabitDateKey } from '../habits/core';

const KEY = 'brain-daily-energy-v1';
const VALID: Energy[] = ['vigoroso', 'bien', 'cansado', 'agotado'];

export function loadDailyEnergy(): Record<string, Energy> {
  const raw = sqliteStateStore.read<Record<string, unknown>>(KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([date, value]) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) && VALID.includes(value as Energy),
  )) as Record<string, Energy>;
}

export function recordDailyEnergy(energy: Energy, date = new Date()) {
  const key = localHabitDateKey(date);
  const existing = loadDailyEnergy();
  const recent = Object.entries({ ...existing, [key]: energy })
    .sort(([a], [b]) => b.localeCompare(a)).slice(0, 35);
  sqliteStateStore.write(KEY, Object.fromEntries(recent));
}
