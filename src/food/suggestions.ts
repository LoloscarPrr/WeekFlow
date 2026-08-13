import type { FoodEntry } from '@/src/state/persistence';

export type FoodContext = 'free' | 'before' | 'working' | 'after';

export type FoodSuggestion = {
  id: string;
  icon: string;
  title: string;
  copy: string;
  tag: string;
  kind: FoodEntry['kind'];
};

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function foodContextForShift(
  now: Date,
  shift: { start: string; end: string; type: string },
): FoodContext {
  if (shift.type === 'off' || !shift.start || !shift.end) return 'free';
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  const overnight = end <= start;
  const working = overnight ? current >= start || current < end : current >= start && current < end;
  if (working) return 'working';

  const untilStart = (start - current + 1440) % 1440;
  if (untilStart <= 180) return 'before';
  const sinceEnd = (current - end + 1440) % 1440;
  if (sinceEnd <= 240) return 'after';
  return 'free';
}

export function suggestionsFor(context: FoodContext, hour: number, lowEnergy: boolean): FoodSuggestion[] {
  if (context === 'working') {
    return [
      { id: 'work-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Rápido, fácil de llevar y sin cocinar.', tag: 'Snack de turno', kind: 'snack' },
      { id: 'work-sandwich', icon: '🥪', title: 'Sándwich simple + verdura', copy: 'Pan con huevo, pollo o queso y algo fresco.', tag: 'Más completo', kind: 'meal' },
      { id: 'work-fruit', icon: '🍌', title: 'Fruta + lácteo', copy: 'Una opción corta cuando no tienes mucho tiempo.', tag: 'Muy rápido', kind: 'snack' },
      { id: 'work-water', icon: '💧', title: 'Agua', copy: 'Si llevas rato sin tomar, este puede ser un buen momento.', tag: 'Hidratación', kind: 'drink' },
    ];
  }

  if (context === 'before') {
    return [
      { id: 'before-egg', icon: '🍳', title: 'Pan con huevo + fruta', copy: 'Algo sencillo antes del turno, sin complicarte.', tag: 'Antes de trabajar', kind: 'meal' },
      { id: 'before-oats', icon: '🥣', title: 'Yogur o leche + avena + fruta', copy: 'Se arma rápido y puedes ajustar la cantidad a tu hambre.', tag: 'Rápido', kind: 'meal' },
      { id: 'before-sandwich', icon: '🥪', title: 'Sándwich casero + agua', copy: 'Práctico si vas saliendo y necesitas llevarlo.', tag: 'Para llevar', kind: 'meal' },
    ];
  }

  if (context === 'after') {
    return [
      { id: 'after-plate', icon: '🍲', title: 'Plato simple de casa', copy: 'Arroz o papa + legumbres, huevo o pollo + verduras.', tag: 'Después del turno', kind: 'meal' },
      { id: 'after-egg', icon: '🍳', title: 'Huevo + pan + tomate', copy: 'Pocos pasos para cuando quieres comer y bajar el ritmo.', tag: 'Fácil', kind: 'meal' },
      { id: 'after-yogurt', icon: '🥣', title: 'Yogur + avena + fruta', copy: 'Una alternativa liviana si no quieres cocinar mucho.', tag: 'Sin apuro', kind: 'meal' },
    ];
  }

  if (hour < 11) {
    return [
      { id: 'free-breakfast-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Desayuno simple que no necesita cocina.', tag: 'Desayuno', kind: 'meal' },
      { id: 'free-breakfast-egg', icon: '🍳', title: 'Pan con huevo y tomate', copy: 'Caliente, simple y fácil de adaptar.', tag: 'Desayuno', kind: 'meal' },
      { id: 'free-breakfast-oats', icon: '🥛', title: 'Avena + leche o yogur + fruta', copy: 'Una base fácil para una mañana tranquila.', tag: 'Desayuno', kind: 'meal' },
    ];
  }

  if (hour < 16) {
    return [
      { id: 'free-lunch-plate', icon: '🍛', title: 'Plato simple y completo', copy: 'Arroz, papa o pasta + legumbres, huevo o pollo + verduras.', tag: 'Almuerzo', kind: 'meal' },
      { id: 'free-lunch-sandwich', icon: '🥪', title: 'Sándwich + fruta', copy: 'Útil cuando quieres resolver sin cocinar demasiado.', tag: 'Rápido', kind: 'meal' },
      { id: 'free-lunch-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Para un momento con poco tiempo o poca hambre.', tag: 'Snack', kind: 'snack' },
    ];
  }

  const simpleCopy = lowEnergy ? 'Pocos pasos: hoy conviene que comer sea fácil.' : 'Simple y fácil de adaptar a lo que tengas.';
  return [
    { id: 'free-evening-yogurt', icon: '🥣', title: 'Yogur + fruta + frutos secos', copy: 'Una colación rápida para la tarde.', tag: 'Colación', kind: 'snack' },
    { id: 'free-evening-egg', icon: '🍳', title: 'Pan con huevo o queso + tomate', copy: simpleCopy, tag: 'Once / comida', kind: 'meal' },
    { id: 'free-evening-fruit', icon: '🍎', title: 'Fruta + yogur', copy: 'Dos cosas simples cuando quieres algo rápido.', tag: 'Muy rápido', kind: 'snack' },
  ];
}

export function contextTitle(context: FoodContext) {
  if (context === 'working') return 'Estás en tu turno';
  if (context === 'before') return 'Antes del trabajo';
  if (context === 'after') return 'Después del turno';
  return 'Tu día está más abierto';
}

export function contextCopy(context: FoodContext) {
  if (context === 'working') return 'Te propongo cosas fáciles de llevar o resolver sin convertir la comida en otra tarea.';
  if (context === 'before') return 'La idea es llegar con algo comido sin hacerte perder tiempo antes de salir.';
  if (context === 'after') return 'Primero algo viable para comer y bajar revoluciones; no una receta perfecta.';
  return 'Elegimos según la hora, tu energía y lo que ya registraste hoy.';
}
