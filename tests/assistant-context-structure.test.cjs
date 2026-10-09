const fs = require('fs');

const context = fs.readFileSync('src/assistant/context.ts', 'utf8');
const controller = fs.readFileSync('src/presentation/assistant/useAssistantController.ts', 'utf8');
const screen = fs.readFileSync('app/assistant.tsx', 'utf8');

function ok(value, message) {
  if (!value) throw new Error(message);
}

ok(controller.includes('getNowView'), 'controller debe reutilizar getNowView');
ok(controller.includes('getRestView'), 'controller debe reutilizar getRestView');
ok(!context.includes('getNowView'), 'builder puro no debe depender de getNowView');
ok(!context.includes('getRestView'), 'builder puro no debe depender de getRestView');
ok(controller.includes('loadDayState'), 'controller debe leer DayState canónico');
ok(controller.includes('loadWeekState'), 'controller debe leer Semana canónica');
ok(controller.includes('loadMoveHistory'), 'controller debe leer Move real');
ok(controller.includes('loadFoodDay'), 'controller debe leer Food de hoy');
ok(controller.includes('loadUserProfile'), 'controller debe leer perfil');
ok(controller.includes('useFocusEffect'), 'Asistente debe refrescar al volver al foco');
ok(screen.includes('ESTADO REAL'), 'UI debe mostrar estado real');
ok(screen.includes('context.energyLabel'), 'UI debe mostrar energía');
ok(screen.includes('context.move.label'), 'UI debe mostrar Move');
ok(screen.includes('context.food.label'), 'UI debe mostrar Food');
ok(screen.includes('context.rest.title'), 'UI debe mostrar Rest');
ok(screen.includes("title: 'Cuenta WeekFlow'"), 'controles existentes deben conservarse');
ok(screen.includes("title: 'Notificaciones'"), 'Notificaciones debe conservarse');
ok(screen.includes("title: 'Horario semanal'"), 'Semana debe conservarse');

for (const forbidden of ['sqliteStateStore', 'saveDayState', 'saveWeekState', 'saveFood', 'saveMove']) {
  ok(!context.includes(forbidden), `builder puro no debe usar ${forbidden}`);
}
ok(!controller.includes('sqliteStateStore'), 'controller no debe acceder SQLite directamente');
ok(!controller.includes('saveFood'), 'controller no debe escribir Food');
ok(!controller.includes('saveMove'), 'controller no debe escribir Move');

console.log('Assistant real-state structure tests passed.');
