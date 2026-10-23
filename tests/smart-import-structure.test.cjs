const fs = require('fs');
function ok(v, msg) { if (!v) throw new Error(msg); }
const photo = fs.readFileSync('src/components/ScheduleImportCard.tsx','utf8');
const pdf = fs.readFileSync('src/components/SchedulePdfImportCard.tsx','utf8');
const adapter = fs.readFileSync('src/brain/smartImportPersistence.ts','utf8');
const service = fs.readFileSync('src/brain/smartImport.ts','utf8');
for (const [name, src] of [['imagen/Excel', photo], ['PDF', pdf]]) {
  ok(src.includes('confirmReviewedImport({'), name + ' debe pasar por confirmación Brain común');
  ok(src.includes('undoReviewedImport(savedReceipt)'), name + ' debe tener deshacer visible');
  ok(src.includes('setBaseline(loadWeekState())'), name + ' guarda snapshot de la lectura para detectar ediciones posteriores');
  ok(!src.includes('saveWeekState('), name + ' no debe escribir Semana por sí mismo');
  ok(src.includes('Deshacer importación'), name + ' muestra reversión sin salir de pantalla');
}
ok(adapter.includes('prepareSmartImport(input.baseline'), 'se valida propuesta contra semana leída');
ok(adapter.includes('applySmartImport(loadWeekState()'), 'se relee Semana justo antes de confirmar');
ok(adapter.includes('undoSmartImport(loadWeekState()'), 'undo confirma no sobrescribir modificaciones nuevas');
ok(adapter.includes('saveWeekState(committed.week)'), 'única fuente de verdad al guardar');
ok(adapter.includes('saveWeekState(result.week)'), 'undo restaura misma Semana canónica');
ok(adapter.includes('syncLivePlanReminders()'), 'cambios resincronizan recordatorios');
ok(service.includes('importantMoments: before.importantMoments'), 'compromisos fijos se conservan');
ok(service.includes('organizedAt: null'), 'la semana no queda organizada falsamente');
ok(!service.includes('saveWeekState') && !service.includes('expo-sqlite'), 'contrato de Brain es puro');
console.log('Smart Import unified UI/storage structure tests passed.');
