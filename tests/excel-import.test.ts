import { parseScheduleRows } from '../src/import/scheduleExcel';

function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const rosterRows: unknown[][] = [
  ['', 'Lunes', '', '', 'Martes', '', '', 'Miércoles', '', '', 'Jueves', '', '', 'Viernes', '', '', 'Sábado', '', '', 'Domingo', '', '', ''],
  ['', '17', '', '', '18', '', '', '19', '', '', '20', '', '', '21', '', '', '22', '', '', '23', '', '', ''],
  ['AMADO', 20.75 / 24, 30 / 1440, 7.5 / 24, 20.75 / 24, 30 / 1440, 7.5 / 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21.5 / 24, 30 / 1440, 8 / 24, 20.75 / 24, 30 / 1440, 7.5 / 24, '40:45'],
  ['OSCAR', 0, 0, 0, 7 / 24, 30 / 1440, 17.5 / 24, 20.75 / 24, 30 / 1440, 7.5 / 24, 20.75 / 24, 30 / 1440, 7.5 / 24, 20.75 / 24, 30 / 1440, 7.5 / 24, 0, 0, 0, 0, 0, 0, '40:45'],
  ['DANIELA', 7 / 24, 30 / 1440, 16 / 24, 7 / 24, 30 / 1440, 16 / 24, 7 / 24, 30 / 1440, 16 / 24, 7 / 24, 30 / 1440, 16 / 24, 7 / 24, 30 / 1440, 15.5 / 24, 0, 0, 0, 0, 0, 0, '42:00'],
];

const parsed = parseScheduleRows(rosterRows, 'OSCAR');
assert(parsed.nameFound, 'debe encontrar la fila OSCAR');
assert(parsed.matchedNameText === 'OSCAR', 'debe conservar el nombre encontrado');
assert(parsed.shifts.length === 7, 'debe devolver siete días');
assert(parsed.shifts[0].off, 'lunes debe quedar libre');
assert(parsed.shifts[1].start === '07:00' && parsed.shifts[1].end === '17:30', 'martes debe ser 07:00–17:30');
assert(parsed.shifts[1].breakMinutes === 30, 'martes debe conservar 30 min de colación');
assert(parsed.shifts[2].start === '20:45' && parsed.shifts[2].end === '07:30', 'miércoles debe conservar turno nocturno');
assert(parsed.shifts[2].type === 'night', 'miércoles debe clasificarse como noche');
assert(parsed.shifts[3].start === '20:45' && parsed.shifts[3].end === '07:30', 'jueves debe conservar turno nocturno');
assert(parsed.shifts[4].start === '20:45' && parsed.shifts[4].end === '07:30', 'viernes debe conservar turno nocturno');
assert(parsed.shifts[5].off && parsed.shifts[6].off, 'sábado y domingo deben quedar libres');

const ambiguousRows: unknown[][] = [
  ['', 'Lunes', '', '', 'Martes', '', '', 'Miércoles', '', '', 'Jueves', '', '', 'Viernes', '', '', 'Sábado', '', '', 'Domingo', '', ''],
  ['OSCAR', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ['OSCAR PEREZ', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const ambiguous = parseScheduleRows(ambiguousRows, 'OSCAR');
assert(!ambiguous.nameFound, 'no debe elegir entre dos filas compatibles');

console.log('Excel import cases passed');
