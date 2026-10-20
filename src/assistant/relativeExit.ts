// Interpreta solo desfases explícitos para una salida real.
// No modifica el turno semanal ni infiere frases vagas.
export function parseRelativeExitOffset(text: string): number | null {
  const phrase = text.trim().toLocaleLowerCase('es-CL').replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  const match = /^(?:una?\s+hora|(\d{1,3})\s+horas?|media\s+hora|(\d{1,3})\s+(?:minutos?|mins?|min))\s+(tarde|antes)$/.exec(phrase);
  if (!match) return null;

  let minutes: number;
  if (phrase.startsWith('media hora')) minutes = 30;
  else if (/^una?\s+hora\b/.test(phrase)) minutes = 60;
  else if (match[1] !== undefined) minutes = Number(match[1]) * 60;
  else minutes = Number(match[2]);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return null;
  return match[3] === 'antes' ? -minutes : minutes;
}

export function relativeExitFromShiftEnd(shiftEndAt: string, deltaMinutes: number) {
  const end = new Date(shiftEndAt);
  if (!Number.isFinite(end.getTime())
    || !Number.isInteger(deltaMinutes)
    || deltaMinutes === 0 || Math.abs(deltaMinutes) > 180) {
    throw new Error('Invalid relative exit offset or dated shift end');
  }
  const exitAt = new Date(end.getTime() + deltaMinutes * 60_000);
  const time = String(exitAt.getHours()).padStart(2, '0') + ':'
    + String(exitAt.getMinutes()).padStart(2, '0');
  return { time, exitAt };
}
