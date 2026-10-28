/**
 * Align the next Move screen update with the elapsed-second boundary of the
 * current phase. The clock itself always uses real time, not a tick counter.
 */
export function nextMoveClockDelayMs(
  phaseStartedAt: string,
  phasePausedTotalMs: number,
  nowMs: number,
): number {
  const startedMs = Date.parse(phaseStartedAt);
  if (!Number.isFinite(startedMs) || !Number.isFinite(phasePausedTotalMs) || !Number.isFinite(nowMs)) {
    return 1000;
  }

  const elapsedMs = Math.max(0, nowMs - startedMs - phasePausedTotalMs);
  // A small safety margin makes the callback land *after* the next second
  // starts; otherwise timer jitter may leave an unchanged second visible.
  return 1000 - (elapsedMs % 1000) + 16;
}
