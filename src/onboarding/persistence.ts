import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { loadHabitsState } from '@/src/habits/persistence';
import {
  cleanOnboardingName,
  completedOnboardingState,
  EMPTY_ONBOARDING_STATE,
  hasMeaningfulPriorUse,
  sanitizeOnboardingState,
  type OnboardingNextStep,
  type OnboardingState,
} from '@/src/onboarding/core';
import {
  loadFoodHistory,
  loadMoveHistory,
  loadUserProfile,
  loadWeekState,
  saveUserProfile,
} from '@/src/state/persistence';

const ONBOARDING_STATE_KEY = 'onboarding-state';

function priorUseSnapshot() {
  return {
    profile: loadUserProfile(),
    week: loadWeekState(),
    moveHistoryCount: loadMoveHistory().length,
    foodHistoryCount: loadFoodHistory().length,
    habitCount: loadHabitsState().habits.length,
  };
}

export function loadOnboardingState(): OnboardingState {
  const persisted = sanitizeOnboardingState(sqliteStateStore.read<unknown>(ONBOARDING_STATE_KEY));
  if (persisted) return persisted;

  if (hasMeaningfulPriorUse(priorUseSnapshot())) {
    const migrated = completedOnboardingState('legacy', null);
    sqliteStateStore.write(ONBOARDING_STATE_KEY, migrated);
    return migrated;
  }

  return EMPTY_ONBOARDING_STATE;
}

export function shouldShowOnboarding() {
  return !loadOnboardingState().completed;
}

export function completeOnboarding(nextStep: OnboardingNextStep, now = new Date()) {
  const completed = completedOnboardingState('fresh', nextStep, now);
  sqliteStateStore.write(ONBOARDING_STATE_KEY, completed);
  return completed;
}

export function saveOnboardingName(value: string) {
  const name = cleanOnboardingName(value);
  if (!name) return loadUserProfile();
  const current = loadUserProfile();
  const next = { ...current, name };
  saveUserProfile(next);
  return next;
}
