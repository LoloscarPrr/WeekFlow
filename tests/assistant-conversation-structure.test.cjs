const fs = require('fs');
const screen = fs.readFileSync('app/assistant.tsx','utf8');
const controller = fs.readFileSync('src/presentation/assistant/useAssistantController.ts','utf8');
const parser = fs.readFileSync('src/assistant/interpret.ts','utf8');

function ok(v,m){ if(!v) throw new Error(m); }

ok(screen.includes('CUÉNTAME QUÉ CAMBIÓ'), 'UI debe mostrar entrada conversacional');
ok(screen.includes('TextInput'), 'UI debe tener TextInput');
ok(screen.includes('Interpretar'), 'UI debe tener acción Interpretar');
ok(screen.includes('Confirmar cambio'), 'UI debe pedir confirmación');
ok(screen.includes('Cancelar'), 'UI debe permitir cancelar');
ok(screen.includes('keyboardShouldPersistTaps="handled"'), 'Scroll debe convivir con teclado');
ok(controller.includes('interpretAssistantText'), 'controller debe interpretar texto');
ok(controller.includes('applyBrainAction'), 'confirmación debe pasar por Brain Action Foundation');
ok(controller.includes('saveDayState'), 'energía confirmada debe persistir DayState');
ok(controller.includes('saveWeekState'), 'turno confirmado debe persistir Semana');
ok(controller.includes('syncLivePlanReminders'), 'cambio confirmado debe resincronizar recordatorios');
ok(parser.includes("requiresConfirmation: true"), 'propuestas conversacionales deben requerir confirmación');
ok(!parser.includes('saveDayState') && !parser.includes('saveWeekState'), 'parser puro no debe persistir');
ok(screen.includes("title: 'Cuenta WeekFlow'") && screen.includes("title: 'Horario semanal'"), 'controles existentes se conservan');

console.log('Assistant conversation structure tests passed.');
