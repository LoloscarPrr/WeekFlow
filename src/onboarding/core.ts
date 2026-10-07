import type { UserProfile } from '@/src/domain/entities/UserProfile';
import type { WeekSchedule } from '@/src/domain/entities/Shift';

export type OnboardingNextStep = 'week' | 'later';

export type OnboardingState = {
  completed: boolean;
  completedAt: string | null;
  source: 'fresh' | 'legacy';
  nextStep: OnboardingNextStep | null;
};

export type PriorUseSnapshot = {
  profile: UserProfile;
  week: WeekSchedule;
  moveHistoryCount: number;
  foodHistoryCount: number;
  habitCount: number;
};

export const EMPTY_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  completedAt: null,
  source: 'fresh',
  nextStep: null,
};

function cleanText(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

export function cleanOnboardingName(value: unknown) {
  return cleanText(value, 60);
}

export function sanitizeOnboardingState(value: unknown): OnboardingState | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<OnboardingState>;
  if (typeof raw.completed !== 'boolean') return null;

  return {
    completed: raw.completed,
    completedAt: typeof raw.completedAt === 'string' && raw.completedAt.trim() ? raw.completedAt : null,
    source: raw.source === 'legacy' ? 'legacy' : 'fresh',
    nextStep: raw.nextStep === 'week' || raw.nextStep === 'later' ? raw.nextStep : null,
  };
}

export function hasMeaningfulPriorUse(snapshot: PriorUseSnapshot) {
  const { profile, week, moveHistoryCount, foodHistoryCount, habitCount } = snapshot;
  if (profile.name.trim() || profile.scheduleName.trim()) return true;
  if (week.organizedAt) return true;
  if (week.importantMoments.length > 0) return true;
  if (week.shifts.some((shift) => shift.type !== 'off' || shift.start.trim() || shift.end.trim())) return true;
  if (moveHistoryCount > 0 || foodHistoryCount > 0 || habitCount > 0) return true;
  return false;
}

export function completedOnboardingState(
  source: OnboardingState['source'],
  nextStep: OnboardingNextStep | null,
  now = new Date(),
): OnboardingState {
  return {
    completed: true,
    completedAt: now.toISOString(),
    source,
    nextStep,
  };
}
