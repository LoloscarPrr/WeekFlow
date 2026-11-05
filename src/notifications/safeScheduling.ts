/**
 * Avoid an empty reminder window if Android fails to schedule a replacement.
 * Stage the complete desired set first and only then retire old native IDs.
 * On partial failure, the next reconciliation will clean redundant new IDs.
 */
export async function scheduleBeforeCancel<T>(
  toSchedule: readonly T[],
  cancelIds: readonly string[],
  schedule: (item: T) => Promise<string | null>,
  cancel: (id: string) => Promise<void>,
): Promise<number> {
  let created = 0;
  for (const item of toSchedule) {
    if (await schedule(item)) created += 1;
  }
  await Promise.all(cancelIds.map(id => cancel(id)));
  return created;
}
