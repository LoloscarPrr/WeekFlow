import type { MoveGoal } from './adaptation';

export type TrainerSetTemplateItem = {
  exerciseId: string;
  sets: number;
  reps: string;
  unilateral?: boolean;
};

export type TrainerSetTemplate = {
  id: string;
  title: string;
  goals: MoveGoal[];
  items: TrainerSetTemplateItem[];
  sourceNote: string;
};

/**
 * Structured only from movements and prescriptions that are legible in the
 * trainer-board photos supplied by the user. Personal RM/load notes and
 * ambiguous/cropped text are intentionally excluded.
 */
export const TRAINER_SET_TEMPLATES: TrainerSetTemplate[] = [
  {
    id: 'trainer-lower-strength',
    title: 'Fuerza tren inferior',
    goals: ['fuerza', 'musculo'],
    sourceNote: 'Pizarra: back squat 5×5; peso muerto rumano 4×6–8; zancada 3×10/lado; curl femoral con banda 3×15; elevación de talón 4×15–20.',
    items: [
      { exerciseId: 'barbell-back-squat', sets: 5, reps: '5' },
      { exerciseId: 'barbell-rdl', sets: 4, reps: '6–8' },
      { exerciseId: 'reverse-lunge', sets: 3, reps: '10/lado', unilateral: true },
      { exerciseId: 'band-hamstring-curl', sets: 3, reps: '15' },
      { exerciseId: 'heel-raise', sets: 4, reps: '15–20' },
    ],
  },
  {
    id: 'trainer-upper-push',
    title: 'Empuje e hipertrofia',
    goals: ['musculo', 'fuerza'],
    sourceNote: 'Pizarra: press banca, press inclinado con mancuernas, fondos, press cerrado y extensión de tríceps; bloques de 4 series.',
    items: [
      { exerciseId: 'barbell-bench-press', sets: 4, reps: '10' },
      { exerciseId: 'db-incline-press', sets: 4, reps: '10' },
      { exerciseId: 'parallel-dip', sets: 4, reps: '10' },
      { exerciseId: 'barbell-close-grip-press', sets: 4, reps: '10' },
      { exerciseId: 'band-triceps-extension', sets: 4, reps: '12–15' },
    ],
  },
  {
    id: 'trainer-mixed-strength',
    title: 'Fuerza general',
    goals: ['fuerza', 'musculo', 'bienestar'],
    sourceNote: 'Pizarras: peso muerto 4×10, remo con barra 4×10, press banca 4×10, press de hombro 4×10 y curls 4×10–12.',
    items: [
      { exerciseId: 'barbell-deadlift', sets: 4, reps: '10' },
      { exerciseId: 'barbell-row', sets: 4, reps: '10' },
      { exerciseId: 'barbell-bench-press', sets: 4, reps: '10' },
      { exerciseId: 'db-shoulder-press', sets: 4, reps: '10' },
      { exerciseId: 'db-biceps-curl', sets: 4, reps: '10–12' },
    ],
  },
  {
    id: 'trainer-upper-mixed',
    title: 'Torso mixto',
    goals: ['fuerza', 'musculo'],
    sourceNote: 'Pizarra: press banca 4×10, bíceps TRX/barra 4×10, press hombro 4×10 y barra al mentón 4×10.',
    items: [
      { exerciseId: 'barbell-bench-press', sets: 4, reps: '10' },
      { exerciseId: 'suspension-biceps-curl', sets: 4, reps: '10' },
      { exerciseId: 'db-shoulder-press', sets: 4, reps: '10' },
      { exerciseId: 'barbell-upright-row', sets: 4, reps: '10' },
    ],
  },
];

export type TrainerAmrapItem = {
  exerciseId: string;
  reps: string;
};

export const TRAINER_AMRAP_ITEMS: TrainerAmrapItem[] = [
  { exerciseId: 'burpee', reps: '3–5' },
  { exerciseId: 'squat-jump', reps: '6' },
  { exerciseId: 'pushup', reps: '4–8' },
  { exerciseId: 'renegade-row', reps: '12' },
  { exerciseId: 'reverse-lunge', reps: '12 total' },
  { exerciseId: 'kb-front-raise', reps: '10' },
  { exerciseId: 'broad-jump', reps: '6' },
  { exerciseId: 'jumping-jack', reps: '30' },
];

export const TRAINER_WARMUP_IDS = [
  'skipping-low',
  'jumping-jack',
  'pushup',
  'squat-jump',
  'mountain-climber',
  'shoulder-tap-plank',
  'hollow-hold',
  'band-pull-apart',
] as const;

export const TRAINER_SOURCE_RULES = {
  structuredRestSec: 90,
  amrapWorkSec: 300,
  amrapRestSec: 120,
  amrapMaxRounds: 3,
} as const;
