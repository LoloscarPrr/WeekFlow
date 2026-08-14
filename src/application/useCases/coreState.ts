import type { DayState } from '@/src/domain/entities/DailyState';
import type { WeekSchedule } from '@/src/domain/entities/Shift';
import type { UserProfile } from '@/src/domain/entities/UserProfile';
import type { DayStateRepository } from '@/src/domain/repositories/DayStateRepository';
import type { WeekScheduleRepository } from '@/src/domain/repositories/WeekScheduleRepository';
import type { UserProfileRepository } from '@/src/domain/repositories/UserProfileRepository';

export function loadDayState(repository: DayStateRepository) {
  return repository.load();
}

export function saveDayState(repository: DayStateRepository, state: DayState) {
  repository.save(state);
}

export function loadWeekSchedule(repository: WeekScheduleRepository) {
  return repository.load();
}

export function saveWeekSchedule(repository: WeekScheduleRepository, state: WeekSchedule) {
  repository.save(state);
}

export function loadUserProfile(repository: UserProfileRepository) {
  return repository.load();
}

export function saveUserProfile(repository: UserProfileRepository, profile: UserProfile) {
  repository.save(profile);
}
