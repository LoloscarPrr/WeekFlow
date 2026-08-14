const DAY_MINUTES = 24 * 60;

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutes(value: number) {
  const normalized = ((value % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function addMinutes(time: string, amount: number) {
  return formatMinutes(toMinutes(time) + amount);
}

export const timeConstants = {
  dayMinutes: DAY_MINUTES,
};
