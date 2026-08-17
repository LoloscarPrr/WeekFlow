const LONG_DAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const SHORT_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
];

function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
}

export function parseLocalDateKey(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isLocalDateKey(value: unknown): value is string {
  return Boolean(parseLocalDateKey(value));
}

export function mondayBasedDay(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function localDateKeyForWeekday(day: number, referenceDate: Date) {
  const monday = new Date(referenceDate);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - mondayBasedDay(monday) + day);
  return localDateKey(monday);
}

export function shortLocalDateLabel(value: string) {
  const date = parseLocalDateKey(value);
  if (!date) return value;
  return `${SHORT_DAYS[date.getDay()]} ${date.getDate()} ${SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function longLocalDateLabel(value: string) {
  const date = parseLocalDateKey(value);
  if (!date) return value;
  return `${LONG_DAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}
