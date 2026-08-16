import type { BrainMoment } from '../entities/Planning';

export type LiveMomentPhase = 'off' | 'before' | 'commuting' | 'working' | 'after';

export const IMPORTANT_MOMENT_ICON = '📌';

export function timelineAfterFeaturedMoment(
  upcomingMoments: BrainMoment[],
  phase: LiveMomentPhase,
  hasActualExit: boolean,
) {
  const firstMomentIsFeatured = !hasActualExit
    && !['working', 'commuting', 'after'].includes(phase)
    && upcomingMoments.length > 0;

  return firstMomentIsFeatured
    ? upcomingMoments.slice(1)
    : upcomingMoments;
}
