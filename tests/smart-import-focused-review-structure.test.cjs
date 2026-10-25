const fs = require('fs');
function ok(v, m) { if (!v) throw new Error(m); }
const summary = fs.readFileSync('src/import/reviewSummary.ts','utf8');
const brain = fs.readFileSync('src/brain/smartImport.ts','utf8');
const imageExcel = fs.readFileSync('src/components/ScheduleImportCard.tsx','utf8');
const pdf = fs.readFileSync('src/components/SchedulePdfImportCard.tsx','utf8');
ok(brain.includes('export function validateSmartImportShift'), 'exponer validador canónico de Brain');
ok(summary.includes('validateSmartImportShift(shift)'), 'revisión usa validador Brain, sin segundo motor');
ok(summary.includes('shiftSignature(shift) !== shiftSignature(previous)'), 'diff compara solo valores canónicos');
ok(summary.includes('valid: complete && rows.every'), 'nunca habilitar sin 7 días únicos y válidos');
for (const [name, source] of [['captura / Excel',imageExcel],['PDF',pdf]]) {
  ok(source.includes('summarizeWeekReview(review, baseline)'), name + ' compara con Semana capturada');
  ok(source.includes('reviewSummary?.valid && matchedName'), name + ' bloquea confirmación si hay dudas');
  ok(source.includes("status === 'review'"), name + ' centra la revisión en pendientes');
  ok(source.includes('toggleDayDetails(shift.day)'), name + ' permite abrir edición día a día');
  ok(source.includes('showAllDays') && source.includes('hideCompletedDays'), name + ' permite inspeccionar todos');
  ok(source.includes('Cambió respecto a Semana') && source.includes('Sin cambios'), name + ' destaca diferencias');
  ok(source.includes('Antes: '), name + ' permite comparar estado anterior');
  ok(source.includes('Confirmar semana'), name + ' mantiene confirmación explícita');
  ok(source.includes('undoReviewedImport(savedReceipt)'), name + ' conserva deshacer');
  ok(source.includes('confirmReviewedImport({'), name + ' mismo Brain commit');
  ok(!source.includes('saveWeekState('), name + ' nunca persiste por sí mismo');
}
console.log('Smart Import compact focused review structure tests passed.');
