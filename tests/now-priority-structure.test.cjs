const fs = require('fs');

const source = fs.readFileSync('app/index.tsx', 'utf8');

function ok(value, message) {
  if (!value) throw new Error(message);
}

const header = source.indexOf('>AHORA</Text>');
const live = source.indexOf('<View style={styles.liveCard}>');
const energy = source.indexOf('¿CÓMO LLEGAS HOY?');
const timeline = source.indexOf('LO QUE VIENE');

ok(header >= 0, 'Ahora debe mostrar el encabezado AHORA');
ok(live > header, 'La tarjeta viva debe aparecer debajo de su encabezado');
ok(energy > live, 'El selector de energía debe seguir disponible');
ok(timeline > energy, 'Lo que viene debe seguir después de energía');
ok(!source.includes('Qué importa ahora'), 'No repetir la pregunta como hero');
ok(!source.includes('DÍA VIVO'), 'No reintroducir etiqueta Día Vivo');
ok(!source.includes('WeekFlow Brain'), 'No duplicar la prioridad con un segundo resumen');
ok(source.includes('Traslado ·'), 'Preservar la información única de traslado');

for (const handler of ['markActualExit', 'confirmExitReplan', 'correctActualExitTime', 'timelineMoments']) {
  ok(source.includes(handler), `Ahora debe conservar ${handler}`);
}

console.log('Now priority structure tests passed.');
