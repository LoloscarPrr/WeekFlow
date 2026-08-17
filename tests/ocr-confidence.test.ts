import { parseScheduleOcr, type OcrElement, type OcrTextResult } from '../src/import/scheduleOcr';

function element(text: string, left: number, top: number, width = 70): OcrElement {
  return { text, frame: { left, top, right: left + width, bottom: top + 20 } };
}

function fixture(names: string[]): OcrTextResult {
  const headers = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    .map((label, day) => element(label, 100 + day * 100, 10));
  const values = [
    '07:00 00:30 15:00',
    '13:00 00:30 22:00',
    '22:00 00:30 06:00',
    '00:00 00:00 00:00',
    '08:00 00:30 16:00',
    '09:00 00:30 17:00',
    '00:00 00:00 00:00',
  ];
  const lines = [
    { text: 'Días', frame: { left: 80, top: 10, right: 850, bottom: 30 }, elements: headers },
    ...names.map((name, index) => ({
      text: name,
      frame: { left: 0, top: 100 + index * 50, right: 850, bottom: 120 + index * 50 },
      elements: [
        element(name, 0, 100 + index * 50, 90),
        ...values.map((text, day) => element(text, 100 + day * 100, 100 + index * 50)),
      ],
    })),
  ];
  return { text: names.join('\n'), blocks: [{ text: 'Horario', frame: { left: 0, top: 0, right: 900, bottom: 260 }, lines }] };
}

function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const exact = parseScheduleOcr(fixture(['OSCAR URRUTIA']), 'OSCAR URRUTIA');
assert(exact.nameFound, 'debe aceptar una coincidencia exacta');
assert(exact.shifts[2].type === 'night', 'debe conservar jornada nocturna');

const weak = parseScheduleOcr(fixture(['OSCAR PEREZ']), 'OSCAR URRUTIA GONZALEZ');
assert(!weak.nameFound, 'no debe aceptar una coincidencia parcial débil');

const ambiguous = parseScheduleOcr(fixture(['OSCAR URRUTIA', 'OSCAR URRUTIA PEREZ']), 'OSCAR URRUTIA');
assert(!ambiguous.nameFound, 'no debe elegir silenciosamente entre dos filas compatibles');

console.log('OCR confidence cases passed');
