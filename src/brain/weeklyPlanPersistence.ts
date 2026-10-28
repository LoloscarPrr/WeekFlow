import { loadDailyEnergy } from './energyHistory';
import { sqliteStateStore } from '../data/local/sqlite/SQLiteStateStore';
import { loadWeekState, loadDayState, loadMovePreferences, loadMoveHistory } from '../state/persistence';
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
export function confirmWeeklyProposal(
  proposal: WeeklyProposal,
  options: { expectedCurrent?: ConfirmedWeeklyPlan | null } = {},
): { ok: boolean; reason?: string; plan?: ConfirmedWeeklyPlan } {
  if ('expectedCurrent' in options && JSON.stringify(loadConfirmedWeeklyPlan()) !== JSON.stringify(options.expectedCurrent)) {
    return { ok: false, reason: 'Cambió el plan semanal confirmado. Vuelve a revisar antes de reemplazarlo.' };
  }
  const day = loadDayState();
  const currentMonday = new Date();
  currentMonday.setHours(0, 0, 0, 0);
  currentMonday.setDate(currentMonday.getDate() - (currentMonday.getDay() + 6) % 7);
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const nextKey = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`;
  const current = proposeWeeklyPlan({
    week: loadWeekState(), habits: loadHabitsState(), settings: day.settings,
    energy: day.energy, energyByDate: loadDailyEnergy(), now: new Date(), weekOffset: proposal.weekStart === nextKey ? 1 : 0,
    move: { preferences: loadMovePreferences(), history: loadMoveHistory() },
  });
  const signature = (p: WeeklyProposal) => JSON.stringify({
    weekStart: p.weekStart,
    slots: p.slots.map(s => [s.id, s.date, s.start, s.end, s.variant]),
    moveSlots: (p.moveSlots ?? []).map(s => [s.id, s.date, s.start, s.end, s.durationMin, s.intensity, s.muscles, s.targetMuscles ?? [], s.sampleExercises]),
    moveSummary: p.moveSummary,
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

/**
 * Deleting a habit is an explicit user action: prune only its future planned
 * sessions and shortfalls. Move and unrelated habits remain untouched.
 */
export function removeHabitFromConfirmedWeeklyPlan(habitId: string): ConfirmedWeeklyPlan | null {
  const current = loadConfirmedWeeklyPlan();
  if (!current) return null;
  const slots = current.slots.filter(slot => slot.habitId !== habitId);
  const shortfalls = current.shortfalls.filter(item => item.habitId !== habitId);
  if (slots.length === current.slots.length && shortfalls.length === current.shortfalls.length) return current;
  const updated = { ...current, slots, shortfalls };
  sqliteStateStore.write(KEY, updated);
  return updated;
}

// Undoes only the plan written by this confirmation. Never deletes/reverts a
// newer plan confirmed from Semana, Hábitos or another Assistant session.
export function undoConfirmedWeeklyProposal(
  confirmed: ConfirmedWeeklyPlan,
  previous: ConfirmedWeeklyPlan | null,
): { ok: boolean; reason?: string } {
  if (JSON.stringify(loadConfirmedWeeklyPlan()) !== JSON.stringify(confirmed)) {
    return { ok: false, reason: 'El plan semanal cambió desde la confirmación. No se deshizo ningún dato nuevo.' };
  }
  if (previous) sqliteStateStore.write(KEY, previous);
  else sqliteStateStore.delete(KEY);
  return { ok: true };
}
