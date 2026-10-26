const fs = require('fs');
function ok(value, message) { if (!value) throw new Error(message); }
const controller = fs.readFileSync('src/presentation/assistant/useAssistantController.ts', 'utf8');
const advice = fs.readFileSync('src/assistant/dayAdvice.ts', 'utf8');
const screen = fs.readFileSync('app/assistant.tsx', 'utf8');
ok(controller.includes('interpretDayAdviceQuestion(input)') && controller.includes('answerDayAdvice(guidance'),
  'el Asistente enruta consultas a síntesis de las fuentes reales');
ok(controller.includes('nowView.upcomingMoments') && controller.includes('restView.contextTitle')
  && controller.includes('loadMovePreferences()') && controller.includes('loadMoveHistory()'),
  'la síntesis utiliza Ahora, Rest y Move canónicos');
ok(controller.includes("postNightRecovery: restView.contextTitle === 'Recuperación post-turno nocturno'"),
  'reconoce recuperación después del turno nocturno');
ok(controller.includes("return 'answered' as const"), 'consulta no solicita confirmación');
for (const forbidden of ['saveDayState', 'saveWeekState', 'applyBrainAction', 'saveMovePreferences', 'sqliteStateStore', 'fetch(']) {
  ok(!advice.includes(forbidden), 'consulta pura nunca debe ejecutar '+forbidden);
}
ok(advice.includes('needsExitReview') && advice.includes('postNightRecovery') && advice.includes('compatibleTargetedExercises'),
  'protección de salida real, noche y equipo');
ok(screen.includes('¿Qué priorizo hoy? · Sin conexión') && screen.includes("interpret('¿Qué priorizo hoy?')"),
  'atajo sin red ejecuta consulta real');
console.log('Brain offline advice integration structure tests passed.');
