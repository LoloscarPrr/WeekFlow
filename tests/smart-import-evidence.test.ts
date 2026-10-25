import { parseScheduleOcr, type OcrElement, type OcrTextResult } from '../src/import/scheduleOcr';
import { parseSchedulePdfText } from '../src/import/schedulePdfText';
import { prepareSmartImport } from '../src/brain/smartImport';
import { defaultWeekState } from '../src/domain/defaults';

function ok(value: unknown, msg: string) { if (!value) throw new Error(msg); }
function eq<T>(a: T, b: T, msg: string) { if (!Object.is(a, b)) throw new Error(msg + ': ' + String(a) + ' vs ' + String(b)); }
const labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
function cell(text: string, x: number, y: number, width = 84): OcrElement {
  return { text, frame: { left: x, right: x + width, top: y, bottom: y + 20 } };
}
function ocr(values: string[]): OcrTextResult {
  const headers = labels.map((label, day) => cell(label, 100 + 100 * day, 10));
  const rowCells = values.map((value, day) => cell(value, 100 + 100 * day, 100));
  const name = cell('OSCAR', 0, 100, 80);
  return {
    text: 'OSCAR ' + values.join(' '),
    blocks: [{
      text: 'Horario',
      frame: { left: 0, top: 0, right: 900, bottom: 190 },
      lines: [
        { text: labels.join(' '), frame: { left: 80, top: 10, right: 850, bottom: 30 }, elements: headers },
        { text: 'OSCAR ' + values.join(' '), frame: { left: 0, top: 100, right: 850, bottom: 120 }, elements: [name, ...rowCells] },
      ],
    }],
  };
}
const base = [
  '07:00 00:30 15:00',
  '13:00 00:30 22:00',
  '22:00 00:30 06:00',
  '00:00 00:00 00:00',
  '07:00 00:30 15:00',
  '08:00 00:30 16:00',
  '00:00 00:00 00:00',
];
const normal = parseScheduleOcr(ocr(base), 'OSCAR');
ok(normal.nameFound, 'foto identifica persona');
eq(normal.shifts[2].type, 'night', 'noche cruza medianoche');
eq(normal.shifts[3].off, true, 'tres ceros representan libre explícito');
eq(normal.shifts[4].breakMinutes, 30, 'colación de 30 min preservada');
const libre = parseScheduleOcr(ocr(base.map((v, i) => i === 3 ? 'LIBRE' : v)), 'OSCAR');
eq(libre.shifts[3].off, true, 'LIBRE textual vale como día libre');
eq(libre.shifts[3].issue, null, 'LIBRE aislado es certeza suficiente');
const mixed = parseScheduleOcr(ocr(base.map((v, i) => i === 3 ? 'LIBRE 07:00 00:30 15:00' : v)), 'OSCAR');
eq(mixed.shifts[3].off, false, 'LIBRE y horarios contradictorios no se acepta');
ok(Boolean(mixed.shifts[3].issue), 'contradicción requiere revisión');
const withoutBreak = parseScheduleOcr(ocr(base.map((v, i) => i === 4 ? '07:00 15:00' : v)), 'OSCAR');
eq(withoutBreak.shifts[4].breakMinutes, null, 'colación ilegible no se sustituye por cero');
ok(Boolean(withoutBreak.shifts[4].issue), 'colación debe revisarse');
eq(prepareSmartImport(defaultWeekState, withoutBreak.shifts, 'library', 'OSCAR').status, 'review-required',
  'Brain no persiste semana con colación omitida');
const midnight = parseScheduleOcr(ocr(base.map((v, i) => i === 4 ? '00:30 00:30 08:30' : v)), 'OSCAR');
eq(midnight.shifts[4].start, '00:30', 'inicio de turno a medianoche es hora válida');
eq(midnight.shifts[4].issue, null, 'no se confunde entrada a medianoche con colación');
eq(prepareSmartImport(defaultWeekState, midnight.shifts, 'library', 'OSCAR').status, 'ready',
  'puede confirmar turno real de madrugada');

const pdfRow = base.join(' ');
const pdf = parseSchedulePdfText('OSCAR ' + pdfRow + ' 40:45', 'OSCAR');
eq(pdf.nameFound, true, 'PDF digital selecciona fila de usuario');
eq(pdf.shifts[2].type, 'night', 'PDF conserva turno nocturno');
eq(pdf.shifts[1].breakMinutes, 30, 'PDF respeta colación real');
eq(pdf.shifts[3].off, true, 'PDF reconoce día libre en cero');
const pdfWrapped = parseSchedulePdfText(
  'OSCAR\n' + base.slice(0, 2).join(' ') + '\n'
  + base.slice(2, 5).join(' ') + '\n'
  + base.slice(5).join(' '), 'OSCAR',
);
eq(pdfWrapped.shifts[4].start, '07:00', 'PDF recompone fila dividida en líneas de horas');
eq(pdfWrapped.shifts[6].off, true, 'PDF conserva domingo libre al recomponer');
const twoTimes = base.map((v) => v.split(' ').filter((_, i) => i !== 1).join(' ')).join(' ');
const pdfNoBreak = parseSchedulePdfText('OSCAR ' + twoTimes, 'OSCAR');
eq(pdfNoBreak.shifts[4].breakMinutes, null, 'PDF sin colación no inventa cero');
ok(Boolean(pdfNoBreak.shifts[4].issue), 'PDF exige corrección de la colación faltante');
eq(prepareSmartImport(defaultWeekState, pdfNoBreak.shifts, 'pdf', 'OSCAR').status, 'review-required',
  'no aplica PDF con colación incierta');
const wrongWorker = parseSchedulePdfText(
  'OSCAR 07:00 00:30 15:00\nDANIELA ' + pdfRow, 'OSCAR',
);
ok(wrongWorker.shifts.every((s) => Boolean(s.issue)), 'no usa horas de otra persona para completar OSCAR');
eq(wrongWorker.nameFound, true, 'nombre encontrado no equivale a horario inventado');
const duplicated = parseSchedulePdfText(
  'OSCAR ' + pdfRow + '\nOSCAR PEREZ ' + pdfRow, 'OSCAR',
);
eq(duplicated.nameFound, false, 'dos filas parecidas son ambiguas');
const footer = parseSchedulePdfText(
  'PREMIO OSCAR\nOSCAR ' + pdfRow, 'OSCAR',
);
eq(footer.nameFound, true, 'mención de Oscar fuera de columna de nombre no selecciona fila');
eq(footer.shifts[4].end, '15:00', 'se lee la verdadera fila, no el encabezado');
console.log('Smart Import OCR and PDF evidence-integrity regressions passed.');
