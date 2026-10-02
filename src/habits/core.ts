export type HabitCompletionMode = 'full' | 'mini';

export type Habit = {
  id: string;
  name: string;
  miniVersion: string | null;
  targetPerWeek: number;
  plannedFor: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
};

export type HabitCompletion = {
  habitId: string;
  date: string;
  mode: HabitCompletionMode;
  completedAt: string;
};

export type HabitsState = {
  habits: Habit[];
  completions: HabitCompletion[];
};

export type HabitDraft = {
  name: string;
  miniVersion?: string | null;
  targetPerWeek: number;
};

export const EMPTY_HABITS_STATE: HabitsState = { habits: [], completions: [] };

function cleanText(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

function clampTarget(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 3;
  return Math.min(7, Math.max(1, Math.round(numeric)));
}

function isMode(value: unknown): value is HabitCompletionMode {
  return value === 'full' || value === 'mini';
}

function isLocalDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function localHabitDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mondayStart(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + offset);
  return result;
}

export function nextHabitPlanDates(date = new Date(), count = 7) {
  const numericCount = Number.isFinite(count) ? Math.floor(count) : 7;
  const safeCount = Math.min(7, Math.max(1, numericCount));
  const cursor = new Date(date);
  cursor.setHours(12, 0, 0, 0);
  const dates: string[] = [];
  for (let index = 0; index < safeCount; index += 1) {
    cursor.setDate(cursor.getDate() + 1);
    dates.push(localHabitDateKey(cursor));
  }
  return dates;
}

export function visibleHabitPlan(habit: Habit, date = new Date()) {
  if (!habit.plannedFor || !isLocalDateKey(habit.plannedFor)) return null;
  return habit.plannedFor >= localHabitDateKey(date) ? habit.plannedFor : null;
}

export function sanitizeHabitsState(value: unknown): HabitsState {
  if (!value || typeof value !== 'object') return EMPTY_HABITS_STATE;
  const raw = value as Partial<HabitsState>;

  const habits = Array.isArray(raw.habits)
    ? raw.habits.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const source = item as Partial<Habit>;
      const id = cleanText(source.id, 120);
      const name = cleanText(source.name, 80);
      if (!id || !name) return [];
      const mini = cleanText(source.miniVersion, 120);
      const createdAt = cleanText(source.createdAt, 40) || new Date(0).toISOString();
      const updatedAt = cleanText(source.updatedAt, 40) || createdAt;
      return [{
        id,
        name,
        miniVersion: mini || null,
        targetPerWeek: clampTarget(source.targetPerWeek),
        plannedFor: isLocalDateKey(source.plannedFor) ? source.plannedFor : null,
        createdAt,
        updatedAt,
        active: source.active !== false,
      } satisfies Habit];
    })
    : [];

  const validIds = new Set(habits.map((habit) => habit.id));
  const seen = new Set<string>();
  const completions = Array.isArray(raw.completions)
    ? raw.completions.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const source = item as Partial<HabitCompletion>;
      const habitId = cleanText(source.habitId, 120);
      const date = cleanText(source.date, 10);
      if (!validIds.has(habitId) || !isLocalDateKey(date) || !isMode(source.mode)) return [];
      const uniqueKey = `${habitId}:${date}`;
      if (seen.has(uniqueKey)) return [];
      seen.add(uniqueKey);
      return [{
        habitId,
        date,
        mode: source.mode,
        completedAt: cleanText(source.completedAt, 40) || `${date}T12:00:00.000Z`,
      } satisfies HabitCompletion];
    })
    : [];

  return { habits, completions };
}

export function upsertHabit(
  state: HabitsState,
  draft: HabitDraft,
  options: { id?: string; now?: Date } = {},
): HabitsState {
  const name = cleanText(draft.name, 80);
  if (!name) return state;
  const miniVersion = cleanText(draft.miniVersion, 120) || null;
  const now = options.now ?? new Date();
  const stamp = now.toISOString();
  const existing = options.id ? state.habits.find((habit) => habit.id === options.id) : undefined;

  if (existing) {
    return {
      ...state,
      habits: state.habits.map((habit) => habit.id === existing.id ? {
        ...habit,
        name,
        miniVersion,
        targetPerWeek: clampTarget(draft.targetPerWeek),
        updatedAt: stamp,
      } : habit),
    };
  }

  const id = options.id ?? `habit-${now.getTime()}`;
  const habit: Habit = {
    id,
    name,
    miniVersion,
    targetPerWeek: clampTarget(draft.targetPerWeek),
    plannedFor: null,
    createdAt: stamp,
    updatedAt: stamp,
    active: true,
  };
  return { ...state, habits: [...state.habits, habit] };
}

export function replanHabit(
  state: HabitsState,
  habitId: string,
  targetDate: string,
  now = new Date(),
): HabitsState {
  if (!isLocalDateKey(targetDate) || targetDate < localHabitDateKey(now)) return state;
  const existing = state.habits.find((habit) => habit.id === habitId);
  if (!existing) return state;
  return {
    ...state,
    habits: state.habits.map((habit) => habit.id === habitId ? {
      ...habit,
      plannedFor: targetDate,
      updatedAt: now.toISOString(),
    } : habit),
  };
}

export function clearHabitPlan(
  state: HabitsState,
  habitId: string,
  now = new Date(),
): HabitsState {
  const existing = state.habits.find((habit) => habit.id === habitId);
  if (!existing || existing.plannedFor === null) return state;
  return {
    ...state,
    habits: state.habits.map((habit) => habit.id === habitId ? {
      ...habit,
      plannedFor: null,
      updatedAt: now.toISOString(),
    } : habit),
  };
}

export function completionForDate(
  state: HabitsState,
  habitId: string,
  date = new Date(),
) {
  const key = localHabitDateKey(date);
  return state.completions.find((item) => item.habitId === habitId && item.date === key) ?? null;
}

export function completeHabit(
  state: HabitsState,
  habitId: string,
  mode: HabitCompletionMode,
  date = new Date(),
): HabitsState {
  if (!state.habits.some((habit) => habit.id === habitId)) return state;
  const key = localHabitDateKey(date);
  const completion: HabitCompletion = {
    habitId,
    date: key,
    mode,
    completedAt: date.toISOString(),
  };
  return {
    ...state,
    habits: state.habits.map((habit) => habit.id === habitId && habit.plannedFor ? {
      ...habit,
      plannedFor: null,
      updatedAt: date.toISOString(),
    } : habit),
    completions: [
      ...state.completions.filter((item) => !(item.habitId === habitId && item.date === key)),
      completion,
    ],
  };
}

export function undoHabitCompletion(
  state: HabitsState,
  habitId: string,
  date = new Date(),
): HabitsState {
  const key = localHabitDateKey(date);
  return {
    ...state,
    completions: state.completions.filter((item) => !(item.habitId === habitId && item.date === key)),
  };
}

export function completionsThisWeek(
  state: HabitsState,
  habitId: string,
  date = new Date(),
) {
  const start = mondayStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return state.completions.filter((item) => {
    if (item.habitId !== habitId) return false;
    const [year, month, day] = item.date.split('-').map(Number);
    const itemDate = new Date(year, month - 1, day);
    return itemDate >= start && itemDate < end;
  }).length;
}
