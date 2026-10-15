const fs = require('fs');

function read(path) { return fs.readFileSync(path, 'utf8'); }
function ok(condition, message) { if (!condition) throw new Error(message); }

const now = read('app/index.tsx');
const rest = read('app/rest.tsx');
const move = read('src/move/MovePlan.tsx');
const controller = read('src/move/useMoveController.ts');
const garden = read('app/garden.tsx');
const food = read('app/food.tsx');
const assistant = read('app/assistant.tsx');
const week = read('app/week.tsx');

ok(now.includes('>AHORA</Text>'), 'Ahora conserva un encabezado único');
ok(!now.includes('Qué importa ahora') && !now.includes('DÍA VIVO'), 'Ahora no repite títulos');
ok(!now.includes('WeekFlow Brain'), 'Ahora no repite estado en otra tarjeta');
ok(now.includes('markActualExit') && now.includes('confirmExitReplan'), 'salida real y reajuste siguen presentes');
ok(now.includes('Traslado ·'), 'traslados se conservan sin duplicar energía/jornada');
ok(!rest.includes('REGLAS ACTIVAS'), 'Rest no debe mostrar reglas internas');
ok(rest.includes('content.plan.nap') && rest.includes('content.plan.nextStart'), 'Rest conserva plan y pausa');
ok(!move.includes('Dame una versión más corta'), 'Move no ofrece versión recortada');
ok(!move.includes('useShorterVersion'), 'Move no conserva un handler de recorte');
ok(controller.includes('MOVE_DURATIONS = [30, 45, 60]'), 'Move ofrece 30/45/60 minutos');
ok(!controller.includes('shorterMoveDuration'), 'controlador no reintroduce reducción automática');
ok(!garden.includes('VISTA GENERAL'), 'Jardín no usa panel educativo repetido');
ok(!food.includes('no te persigue'), 'Food no exhibe justificaciones de filosofía interna');
ok(!assistant.includes('No es una copia aparte'), 'Asistente no explica arquitectura al usuario');
ok(!week.includes('styles.ritualSummary'), 'Semana muestra el resumen en un solo lugar');

console.log('UX single-message structure tests passed.');
