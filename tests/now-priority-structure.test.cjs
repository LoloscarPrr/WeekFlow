const fs = require('fs');

const source = fs.readFileSync('app/index.tsx', 'utf8');

function ok(value, message) {
  if (!value) throw new Error(message);
}

const hero = source.indexOf('Qué importa ahora');
const live = source.indexOf('DÍA VIVO');
const brain = source.indexOf('WeekFlow Brain');
const energy = source.indexOf('¿CÓMO LLEGAS HOY?');
const timeline = source.indexOf('LO QUE VIENE');

ok(hero >= 0, 'Ahora debe declarar Qué importa ahora');
ok(live > hero, 'La prioridad viva debe aparecer después del encabezado');
ok(brain > live, 'El contexto Brain debe quedar subordinado a la prioridad viva');
ok(energy > brain, 'El selector de energía debe seguir disponible después del contexto');
ok(timeline > energy, 'Lo que viene debe conservarse después del contexto de hoy');

for (const handler of ['markActualExit', 'confirmExitReplan', 'correctActualExitTime', 'timelineMoments']) {
  ok(source.includes(handler), `Ahora debe conservar ${handler}`);
}

console.log('Now priority structure tests passed.');
