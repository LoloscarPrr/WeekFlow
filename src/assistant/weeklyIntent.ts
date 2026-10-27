export type WeeklyPlanningIntent = { weekOffset: 0 | 1 };

// This is a request to PREVIEW existing flexible habit planning, not permission
// to modify work shifts, create missing commitments or start a workout.
export function parseWeeklyPlanningIntent(input: string): WeeklyPlanningIntent | null {
  const text = input.toLocaleLowerCase('es-CL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  if (!text || text.length > 240) return null;
  const planningVerb = /\b(organiza|organizame|organizar|reorganiza|reorganizame|planifica|planificame|planificar|replanifica|distribuye|acomoda|ordena|ordenar|reparte)\b/;
  const scope = /\b(semana|semanal|habitos?|actividades|rutinas)\b/;
  if (!planningVerb.test(text) || !scope.test(text)) return null;
  // Never quietly turn a request to change a shift, appointment or day into
  // a habit-only plan. Those changes need their own supported action.
  if (/\b(no quiero|no me|no vayas|evita|sin cambiar|si|cuando|ayer|anteayer|pasado manana)\b/.test(text)) return null;
  if (/\b(cambia|cambiar|modifica|modificar|borra|elimina|agrega|anade|registrar|registra|agenda|agendar|cita|turno|entrada|salida|colacion|medicamentos?|pastillas?|dolor|lesion|tengo que)\b/.test(text)) return null;
  if (/\b(manana|hoy a las|en \d+ dias|\d{1,2}:\d{2})\b/.test(text)) return null;
  if (/\b(despues de la proxima|dentro de dos semanas|mes que viene)\b/.test(text)) return null;
  return { weekOffset: /\b(proxima semana|semana que viene|siguiente semana)\b/.test(text) ? 1 : 0 };
}
