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
  return {
    text: names.join('\n'),
    blocks: [{ text: 'Horario', frame: { left: 0, top: 0, right: 900, bottom: 260 }, lines }],
  };
}

function compressedOscarFixture(): OcrTextResult {
  const headers = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    .map((label, day) => element(label, 100 + day * 100, 10));

  const oscarRow = [
    '00:00', '00:00', '00:00',
    '07:00', '00:30', '17:30',
    '20:45', '00:30', '07:30',
    '20:45', '00:30', '07:30',
    '20:45', '00:30', '07:30',
    '00:00', '00:00', '00:00',
    '00:00', '00:00', '00:00',
    '40:45',
  ].join(' ');

  const lines = [
    { text: 'Días', frame: { left: 80, top: 10, right: 850, bottom: 30 }, elements: headers },
    {
      text: 'OSCAR',
      frame: { left: 0, top: 100, right: 900, bottom: 120 },
      elements: [
        element('OSCAR', 0, 100, 90),
        element(oscarRow, 100, 100, 700),
      ],
    },
  ];

  return {
    text: `OSCAR\n${oscarRow}`,
    blocks: [{ text: 'Horario', frame: { left: 0, top: 0, right: 920, bottom: 160 }, lines }],
  };
}

function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

const exact = parseScheduleOcr(fixture(['OSCAR URRUTIA']), 'OSCAR URRUTIA');
assert(exact.nameFound, 'debe aceptar una coincidencia exacta');
assert(exact.shifts[2].type === 'night', 'debe conservar jornada nocturna');

const weak = parseScheduleOcr(fixture(['OSCAR PEREZ']), 'OSCAR URRUTIA GONZALEZ');
assert(!weak.nameFound, 'no debe aceptar una coincidencia parcial débil');

const ambiguous = parseScheduleOcr(
  fixture(['OSCAR URRUTIA', 'OSCAR URRUTIA PEREZ']),
  'OSCAR URRUTIA',
);
assert(!ambiguous.nameFound, 'no debe elegir silenciosamente entre dos filas compatibles');

const compressed = parseScheduleOcr(compressedOscarFixture(), 'OSCAR');
assert(compressed.nameFound, 'debe encontrar OSCAR en la planilla real');
assert(compressed.shifts[0].off, 'lunes debe quedar libre');
assert(
  compressed.shifts[1].start === '07:00'
    && compressed.shifts[1].end === '17:30'
    && compressed.shifts[1].breakMinutes === 30,
  'martes debe quedar 07:00–17:30 con 30 min',
);
for (const day of [2, 3, 4]) {
  assert(
    compressed.shifts[day].start === '20:45'
      && compressed.shifts[day].end === '07:30'
      && compressed.shifts[day].breakMinutes === 30
      && compressed.shifts[day].type === 'night',
    `${compressed.shifts[day].label} debe quedar 20:45–07:30 con 30 min`,
  );
}
assert(compressed.shifts[5].off && compressed.shifts[6].off, 'sábado y domingo deben quedar libres');
assert(
  compressed.shifts.every((shift) => !shift.issue),
  'la fila completa y coherente no debe exigir reescritura manual',
);

console.log('OCR confidence cases passed');
