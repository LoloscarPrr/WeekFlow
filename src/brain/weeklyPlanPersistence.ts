import { sqliteStateStore } from '../data/local/sqlite/SQLiteStateStore';
import { loadWeekState, loadDayState } from '../state/persistence';
import { loadHabitsState } from '../habits/persistence';
import { proposeWeeklyPlan, type WeeklyProposal } from './weeklyPlanner';

export type ConfirmedWeeklyPlan = Omit<WeeklyProposal, 'status'> & { status: 'confirmed'; confirmedAt: string };
const KEY = 'brain-confirmed-weekly-plan-v1';

export function loadConfirmedWeeklyPlan(): ConfirmedWeeklyPlan | null {
  const saved = sqliteStateStore.read<ConfirmedWeeklyPlan>(KEY);
  if (!saved || saved.status !== 'confirmed' || !Array.isArray(saved.slots) || typeof saved.weekStart !== 'string') return null;
  return saved;
}

/**
 * Recompute before writing: a proposal is rejected when shifts, habits,
 * completions, energy or the current time have made it stale.
 * Store in a separate SQLite key, preserving all existing habit records.
 */
export function confirmWeeklyProposal(proposal: WeeklyProposal): { ok: boolean; reason?: string; plan?: ConfirmedWeeklyPlan } {
  const day = loadDayState();
  const currentMonday = new Date();
  currentMonday.setHours(0, 0, 0, 0);
  currentMonday.setDate(currentMonday.getDate() - (currentMonday.getDay() + 6) % 7);
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextKey = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`;
  const current = proposeWeeklyPlan({
    week: loadWeekState(), habits: loadHabitsState(), settings: day.settings,
    energy: day.energy, now: new Date(), weekOffset: proposal.weekStart === nextKey ? 1 : 0,
  });
  const signature = (p: WeeklyProposal) => JSON.stringify({
    weekStart: p.weekStart,
    slots: p.slots.map(s => [s.id, s.date, s.start, s.end, s.variant]),
    shortfalls: p.shortfalls,
  });
  if (signature(current) !== signature(proposal)) {
    return { ok: false, reason: 'El contexto cambió desde la vista previa. Vuelve a calcular antes de confirmar.' };
  }
  const confirmed: ConfirmedWeeklyPlan = {
    ...proposal, status: 'confirmed', confirmedAt: new Date().toISOString(),
  };
  sqliteStateStore.write(KEY, confirmed);
  return { ok: true, plan: confirmed };
}
