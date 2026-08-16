export type FoodEntry = {
  id: string;
  at: string;
  title: string;
  kind: 'meal' | 'snack' | 'drink' | 'other';
  source: 'suggestion' | 'manual';
};

export type FoodDayRecord = {
  date: string;
  entries: FoodEntry[];
};

export function correctFoodEntryTime(
  entries: FoodEntry[],
  entryId: string,
  time: string,
  dateKey: string,
): FoodEntry[] | null {
  const timeMatch = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!timeMatch || !dateMatch || !entries.some((item) => item.id === entryId)) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const correctedAt = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    correctedAt.getFullYear() !== year
    || correctedAt.getMonth() !== month - 1
    || correctedAt.getDate() !== day
  ) return null;

  return entries
    .map((item) => item.id === entryId ? { ...item, at: correctedAt.toISOString() } : item)
    .sort((a, b) => a.at.localeCompare(b.at));
}
