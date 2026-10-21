import { parseConsumedFood } from '../src/assistant/foodLog';
import { interpretAssistantText } from '../src/assistant/interpret';
import { applyBrainAction, undoBrainAction, receiptHasEffectiveChange, type BrainActionState, type BrainActionProposal } from '../src/brain/actions';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import type { FoodDayRecord } from '../src/food/history';

function equal<T>(a: T, b: T, message: string) {
  if (!Object.is(a, b)) throw new Error(`${message}: esperaba ${String(b)}, recibí ${String(a)}`);
}
function ok(v: unknown, m: string) { if (!v) throw new Error(m); }

const now = new Date(2026, 9, 21, 12, 34);
for (const [phrase, expected] of [
  ['Comí pan tostado con margarina', 'pan tostado con margarina'],
  ['Hoy comí Yogur y frutas', 'Yogur y frutas'],
  ['Desayuné avena', 'avena'],
  ['Almorcé arroz con pollo', 'arroz con pollo'],
  ['Cené sopa', 'sopa'],
  ['yo comi lentejas', 'lentejas'],
] as const) {
  equal(parseConsumedFood(phrase), expected, 'extraer alimento sin inventar: ' + phrase);
  const result = interpretAssistantText(phrase, now);
  equal(result.status, 'proposal', 'declaración de Food genera propuesta');
  if (result.status === 'proposal') {
    equal(result.proposal.kind, 'log-food-entry', 'tipo de propuesta Food');
    if (result.proposal.kind === 'log-food-entry') {
      equal(result.proposal.payload.title, expected, 'conservar descripción literal');
      equal(result.proposal.payload.date, '2026-10-21', 'fecha local de hoy');
    }
    equal(result.proposal.requiresConfirmation, true, 'Food nunca se escribe sin confirmar');
  }
}

for (const invalid of [
  'Comí', 'No comí pan', '¿Qué comí hoy?', 'Ayer comí pan', 'mañana comí pan',
  'Comí nada', 'Comí algo', 'Comí 1234', 'Comí sopa y estoy cansado',
  'Comí sopa y salí tarde', 'Ojalá coma pan', 'Comeré sopa', 'Comí sopa?',
]) {
  equal(parseConsumedFood(invalid), null, 'no inventar registro ambiguo: ' + invalid);
  const result = interpretAssistantText(invalid, now);
  ok(result.status !== 'proposal' || result.proposal.kind !== 'log-food-entry', 'no genera entrada Food: ' + invalid);
}

const initialFood: FoodDayRecord = {
  date: '2026-10-21',
  entries: [{ id: 'original', at: new Date(2026,9,21,9).toISOString(), title: 'Café', kind: 'other', source: 'manual' }],
};
const state: BrainActionState = { dayState: defaultDayState, weekState: defaultWeekState, foodDay: initialFood };
const proposed = interpretAssistantText('Comí pan tostado con margarina', now);
if (proposed.status !== 'proposal' || proposed.proposal.kind !== 'log-food-entry') throw new Error('Food proposal required');
const foodProposal: BrainActionProposal = proposed.proposal;
const notConfirmed = applyBrainAction(state, foodProposal, { confirmed: false, now });
equal(notConfirmed.status, 'confirmation-required', 'antes de confirmar no se aplica');
equal(notConfirmed.state, state, 'no cambia memoria');
const applied = applyBrainAction(state, foodProposal, { confirmed: true, now });
equal(applied.status, 'applied', 'Food se confirma');
equal(applied.state.foodDay!.entries.length, 2, 'conserva entradas previas y agrega una');
equal(applied.state.foodDay!.entries[1].title, 'pan tostado con margarina', 'registro conserva texto');
equal(applied.state.foodDay!.entries[1].source, 'manual', 'misma fuente que Food manual');
equal(applied.state.foodDay!.entries[1].kind, 'other', 'misma categoría que Food manual');
equal(applied.state.weekState, defaultWeekState, 'registrar comida no altera Semana');
equal(applied.state.dayState, defaultDayState, 'registrar comida no altera energía ni salida');
ok(applied.receipt && receiptHasEffectiveChange(applied.receipt), 'Food emite recibo reversible');
equal(applied.receipt!.after.target, 'food-day', 'receipt identifica Food');

const undone = undoBrainAction(applied.state, applied.receipt!);
equal(undone.status, 'reverted', 'Food se deshace');
equal(undone.state.foodDay!.entries.length, 1, 'deshacer conserva entrada previa');
equal(undone.state.foodDay!.entries[0].id, 'original', 'no borra comida ajena');
const modifiedDay: FoodDayRecord = {
  ...applied.state.foodDay!,
  entries: [...applied.state.foodDay!.entries, {
    id: 'newer', title: 'Fruta', at: new Date(2026,9,21,13).toISOString(), kind: 'other', source: 'manual',
  }],
};
const conflict = undoBrainAction({ ...applied.state, foodDay: modifiedDay }, applied.receipt!);
equal(conflict.status, 'conflict', 'no borra datos de Food modificados después');
equal(conflict.state.foodDay, modifiedDay, 'no pisa cambios posteriores');
const alreadyExists = applyBrainAction(applied.state, foodProposal, { confirmed: true, now });
equal(alreadyExists.status, 'conflict', 'doble confirmación no duplica registros');
const tomorrow = applyBrainAction(state, foodProposal, { confirmed: true, now: new Date(2026,9,22,1) });
equal(tomorrow.status, 'conflict', 'cambio de medianoche exige nueva confirmación');
equal(tomorrow.state.foodDay, initialFood, 'no registra en día erróneo');

console.log('Assistant Food log / Brain undo tests passed.');
