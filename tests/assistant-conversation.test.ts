import { interpretAssistantText } from '../src/assistant/interpret';

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

console.log('Assistant conversation interpretation tests passed.');
