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
ok(screen.includes('↶ Deshacer cambio'), 'UI debe ofrecer un solo undo compacto');
ok(screen.includes('lastReceipt && !pendingProposal'), 'Undo debe ocultarse durante propuesta pendiente');
ok(screen.includes('accessibilityLabel="Deshacer último cambio del Asistente"'), 'Undo debe ser accesible');
ok(screen.includes('keyboardShouldPersistTaps="handled"'), 'Scroll debe convivir con teclado');
ok(controller.includes('interpretAssistantText'), 'controller debe interpretar texto');
ok(controller.includes('applyBrainAction'), 'confirmación debe pasar por Brain Action Foundation');
ok(controller.includes('saveDayState'), 'energía confirmada debe persistir DayState');
ok(controller.includes('saveWeekState'), 'turno confirmado debe persistir Semana');
ok(controller.includes('syncLivePlanReminders'), 'cambio confirmado debe resincronizar recordatorios');
ok(controller.includes('undoBrainAction(state, lastReceipt)'), 'Undo debe usar Brain Action Foundation sobre estado canónico');
ok(controller.includes('receiptHasEffectiveChange(result.receipt)'), 'no-op no muestra undo redundante');
ok(controller.includes('setLastReceipt(null)'), 'undo o conflicto descarta recibo obsoleto');
ok(controller.includes("lastReceipt.before.target === 'day-state'"), 'Undo persiste solo el target canónico');
ok(controller.includes('loadDayState()') && controller.includes('loadWeekState()'), 'Undo debe usar estado fresco para detectar conflicto');
ok(!controller.includes('saveBrainActionReceipt'), 'no se debe crear persistencia paralela de recibos');
ok(parser.includes("requiresConfirmation: true"), 'propuestas conversacionales deben requerir confirmación');
ok(!parser.includes('saveDayState') && !parser.includes('saveWeekState'), 'parser puro no debe persistir');
ok(screen.includes("title: 'Cuenta WeekFlow'") && screen.includes("title: 'Horario semanal'"), 'controles existentes se conservan');

ok(parser.includes("status: 'actual-exit-intent'"), 'pasado real debe ser distinto de programación semanal');
ok(controller.includes("kind: 'record-actual-exit'"), 'Asistente genera propuesta de salida real confirmable');
ok(controller.includes('shiftKey: view.shiftContext.key'), 'salida usa identidad canónica de turno');
ok(controller.includes('plannedEnd: view.todayShift.end'), 'propuesta captura salida planificada para evitar cambios obsoletos');
ok(controller.includes('getNowView({'), 'confirmación relee la realidad desde Ahora');
ok(controller.includes('actualExitContext'), 'Brain recibe contexto actual de salida real');
ok(controller.includes("pendingProposal.kind === 'record-actual-exit'"), 'solo DayState guarda la salida real');
ok(screen.includes('context.needsExitReview'), 'Asistente anuncia si falta confirmar el reajuste');
ok(screen.includes('Revisar reajuste en Ahora'), 'reajuste importante tiene acción directa');
const actions = fs.readFileSync('src/brain/actions.ts', 'utf8');
ok(actions.includes('correctActualExitTime'), 'Brain aplica el use case canónico de salida real');
ok(actions.includes('context.snapshot.shift.end !== proposal.payload.plannedEnd'), 'rechazar propuestas si cambió el turno antes de confirmar');
ok(actions.includes("kind === 'record-actual-exit'"), 'undo también identifica el target DayState');
const relative = fs.readFileSync('src/assistant/relativeExit.ts', 'utf8');
ok(parser.includes("status: 'actual-exit-relative-intent'"), 'parser debe distinguir desfases del horario de Semana');
ok(parser.includes('parseRelativeExitOffset'), 'interpretación debe pasar por parser de desfases acotados');
ok(controller.includes('relativeExitFromShiftEnd(view.shiftContext.endAt!'), 'hora relativa deriva de fin FECHADO de la jornada');
ok(controller.includes('resolved.exitAt < startAt || resolved.exitAt > now'), 'rechaza horas anteriores al turno y futuras');
ok(controller.includes("kind: 'record-actual-exit'"), 'el mismo Brain Action aplica salidas absolutas/relativas');
ok(relative.includes('minutes > 180'), 'solo desfases razonables y explícitos');
ok(!relative.includes('saveDayState') && !relative.includes('saveWeekState'), 'helper puro no escribe estado');
const questions = fs.readFileSync('src/assistant/questions.ts', 'utf8');
ok(controller.includes('interpretAssistantQuestion(input)'), 'Asistente debe detectar consulta antes de acciones');
ok(controller.indexOf('interpretAssistantQuestion(input)') < controller.indexOf('interpretAssistantText(input, now)'), 'consulta se resuelve antes de una propuesta');
ok(controller.includes('answerAssistantQuestion(question, fresh)'), 'preguntas leen contexto fresco desde fuente canónica');
ok(controller.includes('setPendingProposal(null)'), 'consultar descarta propuesta sin confirmar');
ok(controller.includes("return 'answered' as const"), 'controller marca consulta ya respondida');
ok(screen.includes("interpret(input) === 'answered'"), 'UI limpia texto de consulta respondida');
ok(questions.includes("import type { AssistantRealState }"), 'preguntas responden desde mismo contexto');
ok(questions.includes("context.move.doneToday") && questions.includes("context.food.countToday"), 'Move y Food usan datos reales');
ok(questions.includes("context.rest.title") && questions.includes("context.energyLabel"), 'Rest y energía usan fuente común');
for (const forbidden of ['saveDayState', 'saveWeekState', 'applyBrainAction', 'syncLivePlanReminders', 'expo-sqlite']) {
  ok(!questions.includes(forbidden), 'preguntas puras nunca deben ejecutar: ' + forbidden);
}
console.log('Assistant conversation structure tests passed.');
