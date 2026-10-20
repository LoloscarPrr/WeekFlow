import { interpretAssistantText } from '../src/assistant/interpret';
import { parseRelativeExitOffset, relativeExitFromShiftEnd } from '../src/assistant/relativeExit';

function equal<T>(actual: T, expected: T, message: string) {
  if (!Object.is(actual, expected)) throw new Error(`${message}: esperaba ${String(expected)}, recibí ${String(actual)}`);
}
function ok(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const monday = new Date(2026, 9, 5, 9, 0, 0, 0);

for (const [input, energy] of [
  ['hoy estoy cansado', 'cansado'],
  ['ando agotado', 'agotado'],
  ['estoy bien', 'bien'],
  ['ando con energía', 'vigoroso'],
] as const) {
  const result = interpretAssistantText(input, monday);
  equal(result.status, 'proposal', `${input} debe generar propuesta`);
  if (result.status === 'proposal') {
    equal(result.proposal.kind, 'set-energy', 'energía usa set-energy');
    if (result.proposal.kind === 'set-energy') equal(result.proposal.payload.energy, energy, 'energía interpretada');
    equal(result.proposal.requiresConfirmation, true, 'requiere confirmación');
  }
}

const tomorrow = interpretAssistantText('mañana entro a las 10', monday);
equal(tomorrow.status, 'proposal', 'mañana entra debe reconocerse');
if (tomorrow.status === 'proposal' && tomorrow.proposal.kind === 'update-week-shift') {
  equal(tomorrow.proposal.payload.day, 1, 'martes es día 1');
  equal(tomorrow.proposal.payload.patch.start, '10:00', 'hora de entrada normalizada');
}

const friday = interpretAssistantText('el viernes salgo a las 18:30', monday);
equal(friday.status, 'proposal', 'día explícito debe reconocerse');
if (friday.status === 'proposal' && friday.proposal.kind === 'update-week-shift') {
  equal(friday.proposal.payload.day, 4, 'viernes es día 4');
  equal(friday.proposal.payload.patch.end, '18:30', 'hora de salida normalizada');
}

for (const [input, expected] of [
  ['hoy salí a las 22:30', '22:30'],
  ['salí a las 6:05', '06:05'],
  ['terminé mi turno a las 23', '23:00'],
] as const) {
  const result = interpretAssistantText(input, monday);
  equal(result.status, 'actual-exit-intent', 'salida pasada debe distinguirse de hora de Semana');
  if (result.status === 'actual-exit-intent') equal(result.time, expected, 'hora real de salida');
}
for (const text of [
  'hoy salí a las 25:00',
  'hoy salí a las 22:89',
  'salí una hora tarde',
  'ayer salí a las 21:00',
  'mañana salí a las 22:00',
  'salí a las 22 y entro a las 10',
  'estoy cansado y salí a las 22:00',
]) {
  equal(interpretAssistantText(text, monday).status, 'unsupported', 'salida inválida o múltiple debe rechazarse: ' + text);
}
const scheduledExit = interpretAssistantText('mañana salgo a las 20:00', monday);
equal(scheduledExit.status, 'proposal', 'salgo sigue siendo programación de Semana');
if (scheduledExit.status === 'proposal') equal(scheduledExit.proposal.kind, 'update-week-shift', 'salgo no es salida real');

equal(interpretAssistantText('mañana entro a las 25', monday).status, 'unsupported', 'hora inválida se rechaza');
equal(interpretAssistantText('mañana entro a las 9 y salgo a las 18', monday).status, 'unsupported', 'entrada y salida juntas se consideran ambiguas');
equal(interpretAssistantText('no alcanzo a entrenar', monday).status, 'unsupported', 'frase fuera de alcance no inventa acción');
equal(interpretAssistantText('', monday).status, 'unsupported', 'texto vacío no genera acción');

const sunday = new Date(2026, 9, 11, 9, 0, 0, 0);
const mondayTomorrow = interpretAssistantText('mañana entro a las 8:15', sunday);
ok(mondayTomorrow.status === 'proposal', 'mañana desde domingo debe reconocerse');
if (mondayTomorrow.status === 'proposal' && mondayTomorrow.proposal.kind === 'update-week-shift') {
  equal(mondayTomorrow.proposal.payload.day, 0, 'domingo + mañana cruza a lunes');
}


// Desfases relativos siempre refieren al final FECHADO del turno de Ahora.
for (const [input, delta] of [
  ['salí una hora tarde', 60],
  ['hoy salí 30 minutos antes', -30],
  ['terminé mi turno media hora tarde', 30],
  ['salí 2 horas tarde', 120],
  ['salí 45 min antes', -45],
] as const) {
  const answer = interpretAssistantText(input, monday);
  equal(answer.status, 'actual-exit-relative-intent', 'salida relativa reconocida: ' + input);
  if (answer.status === 'actual-exit-relative-intent') {
    equal(answer.deltaMinutes, delta, 'desfase firmado correcto');
  }
}
for (const invalid of [
  'salí tarde',
  'salí 0 minutos tarde',
  'salí 200 minutos tarde',
  'salí 4 horas tarde',
  'salí una hora tarde y entro a las 10',
  'ayer salí una hora tarde',
  'mañana salí 20 min antes',
  'no salí una hora tarde',
  'salí una hora tarde a las 22:00',
]) {
  equal(interpretAssistantText(invalid, monday).status, 'unsupported', 'frase relativa ambigua no se aplica: ' + invalid);
}

equal(parseRelativeExitOffset('una hora tarde'), 60, 'una hora');
equal(parseRelativeExitOffset('1 hora antes'), -60, 'hora en dígitos');
equal(parseRelativeExitOffset('media hora antes'), -30, 'media hora');
equal(parseRelativeExitOffset('0 min tarde'), null, 'cero no es salida relativa');
equal(parseRelativeExitOffset('181 minutos tarde'), null, 'tope de desfase');
const nightEnd = new Date(2026, 9, 6, 6, 0);
const oneHourLate = relativeExitFromShiftEnd(nightEnd.toISOString(), 60);
equal(oneHourLate.time, '07:00', 'salida nocturna +60');
equal(oneHourLate.exitAt.getDate(), 6, 'salida después de medianoche conserva día correcto');
const oneHourEarly = relativeExitFromShiftEnd(nightEnd.toISOString(), -60);
equal(oneHourEarly.time, '05:00', 'salida nocturna −60');
equal(oneHourEarly.exitAt.getDate(), 6, 'salida temprana nocturna conserva día correcto');
const midnightEnd = new Date(2026, 9, 6, 0, 15);
const previousDayExit = relativeExitFromShiftEnd(midnightEnd.toISOString(), -30);
equal(previousDayExit.time, '23:45', 'desfase negativo cruza medianoche');
equal(previousDayExit.exitAt.getDate(), 5, 'desfase negativo usa el día anterior');
let thrown = false;
try { relativeExitFromShiftEnd('invalid', 60); } catch { thrown = true; }
ok(thrown, 'no se calcula hora con fin sin fecha');
thrown = false;
try { relativeExitFromShiftEnd(nightEnd.toISOString(), 181); } catch { thrown = true; }
ok(thrown, 'desfase excesivo se rechaza');

console.log('Assistant conversation interpretation tests passed.');
