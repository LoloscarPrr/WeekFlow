import { loadDailyEnergy } from './energyHistory';
import { sqliteStateStore } from '../data/local/sqlite/SQLiteStateStore';
import { loadWeekState, loadWeekStateForOffset, loadPreviousWeekState, hasPreparedNextWeek, loadDayState, loadMovePreferences, loadMoveHistory } from '../state/persistence';
import { loadHabitsState } from '../habits/persistence';
import { proposeWeeklyPlan, type WeeklyProposal } from './weeklyPlanner';

export type ConfirmedWeeklyPlan = Omit<WeeklyProposal, 'status'> & {
  status: 'confirmed'; confirmedAt: string;
  /** New confirmed plans are invalidated if that week's fixed shifts change. */
  workScheduleSignature?: string;
};
const KEY = 'brain-confirmed-weekly-plan-v1';
const NEXT_KEY = 'brain-confirmed-weekly-plan-next-v1';

function validPlan(value: ConfirmedWeeklyPlan | null): value is ConfirmedWeeklyPlan {
  return Boolean(value && value.status === 'confirmed' && Array.isArray(value.slots) && typeof value.weekStart === 'string');
}
function mondayOf(now: Date) {
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
function nextMondayKey(now: Date) {
  const date = new Date(now);
  date.setDate(date.getDate() + 7);
  return mondayOf(date);
}
function weekScheduleSignature(weekStart: string, week = loadWeekStateForOffset(0)) {
  const following = nextMondayKey(new Date(
    Number(weekStart.slice(0, 4)), Number(weekStart.slice(5, 7)) - 1,
    Number(weekStart.slice(8)), 12,
  ));
  return JSON.stringify({
    shifts: week.shifts.map(shift => [
      shift.day, shift.start, shift.end, shift.type, shift.breakMinutes ?? 0,
    ]),
    events: week.importantMoments.filter(m => m.date >= weekStart && m.date < following)
      .map(m => [m.id, m.date, m.time, m.title])
      .sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  });
}
function readPlan(key: string): ConfirmedWeeklyPlan | null {
  const value = sqliteStateStore.read<ConfirmedWeeklyPlan>(key);
  return validPlan(value) ? value : null;
}
/** A saved next-week plan becomes current on Monday, without replacing its history mid-week. */
function syncConfirmedWeekKeys(): void {
  const currentMonday = mondayOf(new Date());
  const nextMonday = nextMondayKey(new Date());
  const current = readPlan(KEY);
  const next = readPlan(NEXT_KEY);
  if (next?.weekStart === currentMonday && current?.weekStart !== currentMonday) {
    sqliteStateStore.writeBatch([
      { key: KEY, value: next },
      { key: NEXT_KEY, value: null },
    ]);
  } else if (current?.weekStart === nextMonday && !next) {
    // Legacy versions sometimes saved next week's plan in the sole old key.
    sqliteStateStore.writeBatch([
      { key: KEY, value: null },
      { key: NEXT_KEY, value: current },
    ]);
  }
}
function planForOffset(offset: 0 | 1): ConfirmedWeeklyPlan | null {
  syncConfirmedWeekKeys();
  const expected = offset === 0 ? mondayOf(new Date()) : nextMondayKey(new Date());
  const saved = readPlan(offset === 0 ? KEY : NEXT_KEY);
  if (!saved || saved.weekStart !== expected) return null;
  // A legacy next-week confirmation against the old repeating roster must
  // not remain actionable until the user actually prepares that dated roster.
  if (offset === 1 && !hasPreparedNextWeek()) return null;
  if (saved.workScheduleSignature && saved.workScheduleSignature !== weekScheduleSignature(
    saved.weekStart, loadWeekStateForOffset(offset),
  )) return null;
  return saved;
}
export function loadConfirmedWeeklyPlan(): ConfirmedWeeklyPlan | null {
  return planForOffset(0);
}
export function loadConfirmedWeeklyPlanForOffset(offset: 0 | 1): ConfirmedWeeklyPlan | null {
  return planForOffset(offset);
}
export function confirmedWeekNeedsReview(offset: 0 | 1): boolean {
  syncConfirmedWeekKeys();
  const saved = readPlan(offset === 0 ? KEY : NEXT_KEY);
  const expected = offset === 0 ? mondayOf(new Date()) : nextMondayKey(new Date());
  return Boolean(saved && saved.weekStart === expected
    && saved.workScheduleSignature
    && saved.workScheduleSignature !== weekScheduleSignature(
      saved.weekStart, loadWeekStateForOffset(offset),
    ));
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
  const isNext = proposal.weekStart === nextMondayKey(new Date());
  const targetOffset: 0 | 1 = isNext ? 1 : 0;
  if (isNext && !hasPreparedNextWeek()) {
    return { ok: false, reason: 'Primero configura la próxima semana. No se puede confirmar un plan sin conocer sus turnos.' };
  }
  if ('expectedCurrent' in options && JSON.stringify(loadConfirmedWeeklyPlanForOffset(targetOffset)) !== JSON.stringify(options.expectedCurrent)) {
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
    week: loadWeekStateForOffset(proposal.weekStart === nextKey ? 1 : 0),
    previousWeek: proposal.weekStart === nextKey ? loadWeekState() : loadPreviousWeekState(),
    habits: loadHabitsState(), settings: day.settings,
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
    workScheduleSignature: weekScheduleSignature(proposal.weekStart, loadWeekStateForOffset(targetOffset)),
  };
  sqliteStateStore.write(targetOffset === 0 ? KEY : NEXT_KEY, confirmed);
  return { ok: true, plan: confirmed };
}

/** Only use after verifying the expected stored plan snapshot. */
export function writeConfirmedWeeklyPlanSnapshot(plan: ConfirmedWeeklyPlan | null): void {
  syncConfirmedWeekKeys();
  const offset: 0 | 1 = plan?.weekStart === nextMondayKey(new Date()) ? 1 : 0;
  const key = offset === 0 ? KEY : NEXT_KEY;
  if (plan) sqliteStateStore.write(key, plan);
  else sqliteStateStore.delete(key);
}

/**
 * Deleting a habit is an explicit user action: prune only its future planned
 * sessions and shortfalls. Move and unrelated habits remain untouched.
 */
export function removeHabitFromConfirmedWeeklyPlan(habitId: string): ConfirmedWeeklyPlan | null {
  const current = loadConfirmedWeeklyPlan();
  const next = loadConfirmedWeeklyPlanForOffset(1);
  if (next) {
    const remaining = next.slots.filter(slot => slot.habitId !== habitId);
    const shortfallsNext = next.shortfalls.filter(item => item.habitId !== habitId);
    if (remaining.length !== next.slots.length || shortfallsNext.length !== next.shortfalls.length) {
      sqliteStateStore.write(NEXT_KEY, { ...next, slots: remaining, shortfalls: shortfallsNext });
    }
  }
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
  const targetOffset: 0 | 1 = confirmed.weekStart === nextMondayKey(new Date()) ? 1 : 0;
  if (JSON.stringify(loadConfirmedWeeklyPlanForOffset(targetOffset)) !== JSON.stringify(confirmed)) {
    return { ok: false, reason: 'El plan semanal cambió desde la confirmación. No se deshizo ningún dato nuevo.' };
  }
  const key = targetOffset === 0 ? KEY : NEXT_KEY;
  if (previous) sqliteStateStore.write(key, previous);
  else sqliteStateStore.delete(key);
  return { ok: true };
}
