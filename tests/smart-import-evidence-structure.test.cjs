const fs = require('fs');
function ok(v,m) { if (!v) throw new Error(m); }
const ocr = fs.readFileSync('src/import/scheduleOcr.ts', 'utf8');
const pdf = fs.readFileSync('src/import/schedulePdfText.ts', 'utf8');
const pdfAdapter = fs.readFileSync('src/import/schedulePdf.ts', 'utf8');
const importer = fs.readFileSync('src/brain/smartImport.ts', 'utf8');
const photos = fs.readFileSync('src/components/ScheduleImportCard.tsx', 'utf8');
const digital = fs.readFileSync('src/components/SchedulePdfImportCard.tsx', 'utf8');
ok(ocr.includes('No pude leer la colación.'), 'OCR avisa que falta colación');
ok(ocr.includes('breakMinutes: breakTime ? toMinutes(breakTime) : null'), 'sin evidencia OCR no inventa 0 min');
ok(ocr.includes('LIBRE|DESCANSO|OFF'), 'OCR reconoce texto libre por celda');
ok(pdf.includes('No pude leer la colación.'), 'PDF obliga aclarar duración');
ok(pdf.includes('breakMinutes: breakLooksValid ? breakMinutes : null'), 'PDF no inventa 0 min');
ok(pdf.includes('if (nameCandidates.length > 1)'), 'PDF bloquea nombre ambiguo');
ok(pdf.includes('if (!/^[\\d\\s:.,hH\\/-]+$/.test(continuation)) break;'), 'PDF no cruza a siguiente fila de persona');
ok(pdfAdapter.includes("export { parseSchedulePdfText }"), 'PDF mantiene API previa');
ok(photos.includes('confirmReviewedImport({') && digital.includes('confirmReviewedImport({'), 'ambos formatos usan mismo Brain');
ok(importer.includes('if (shift.issue) return shift.issue'), 'transacción respeta incertidumbre');
console.log('Smart Import evidence structure tests passed.');
