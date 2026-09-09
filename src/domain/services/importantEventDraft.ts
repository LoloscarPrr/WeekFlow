export function defaultImportantEventWhen(now = new Date()) {
  return new Date(now.getTime() + 60 * 60_000);
}

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function localTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function replaceLocalDate(current: Date, selected: Date) {
  const next = new Date(current);
  next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  return next;
}

export function replaceLocalTime(current: Date, selected: Date) {
  const next = new Date(current);
  next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  return next;
}

export function numericLocalDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-');
  return year && month && day ? `${day}/${month}/${year}` : dateKey;
}
