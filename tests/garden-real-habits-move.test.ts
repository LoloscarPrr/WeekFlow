import { buildGardenPillars } from '../src/garden/summary';
import { GARDEN_HABIT_CATEGORIES, suggestGardenCategory, resolveGardenCategory } from '../src/habits/categories';
import { upsertHabit, completeHabit, sanitizeHabitsState } from '../src/habits/core';
import { DEFAULT_MOVE_PREFERENCES } from '../src/move/adaptation';
import { compatibleTargetedExercises, previewForDuration, routineForDuration } from '../src/move/library';
import { MOVE_EXERCISE_LIBRARY } from '../src/move/exerciseCatalog';

const ok=(v:unknown,msg:string)=>{if(!v)throw Error(msg)};
const eq=(a:unknown,b:unknown,msg:string)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(msg+': '+JSON.stringify(a)+' vs '+JSON.stringify(b))};
const date=new Date(2026,9,29,12,0);
let state=upsertHabit({habits:[],completions:[]},{name:'Relación amorosa',targetPerWeek:2},{id:'love',now:date});
state=upsertHabit(state,{name:'Hacer aseo habitación',targetPerWeek:2},{id:'home',now:date});
state=upsertHabit(state,{name:'Leer',targetPerWeek:3},{id:'read',now:date});
state=completeHabit(state,'read','full',date);
const before=JSON.stringify(state);
eq(suggestGardenCategory('Relación amorosa'),'relationships','relationship legacy suggestion');
eq(suggestGardenCategory('Hacer aseo habitación'),'home','house cleaning legacy suggestion');
eq(suggestGardenCategory('Leer'),'personal','reading legacy suggestion');
eq(suggestGardenCategory('Entrenar espalda'),null,'do not invent social/wellbeing categories');
eq(GARDEN_HABIT_CATEGORIES.length,5,'five user-managed garden categories');
let garden=buildGardenPillars({
 now:date,moveHistory:[],foodHistory:[],
 restView:{ heroTitle:'Descanso',contextTitle:'Descanso',contextCopy:'',contextMeta:'',
  content:{kind:'empty',sectionTitle:'DESCANSO'} },
 habitsState:state,
});
eq(garden.length,8,'all canonical garden pillars remain');
eq(garden.find(p=>p.key==='relationships')?.evidence,'1 hábito · 0/2 ocasiones registradas esta semana.','relationship has real habit');
eq(garden.find(p=>p.key==='home')?.status,'En curso','home has real active habit, no fabricated record');
eq(garden.find(p=>p.key==='personal')?.evidence,'1 hábito · 1/3 ocasiones registradas esta semana.','reading completion counted');
eq(garden.find(p=>p.key==='wellbeing')?.status,'Por configurar','missing category is actionable, not fake no data');
ok(garden.every(p=>['rest','food','move'].includes(p.key) || p.route==='/habits'),'all five categories open Habits');
eq(JSON.stringify(state),before,'summary never writes or mutates original records');

state=upsertHabit(state,{name:'Leer',targetPerWeek:3,gardenCategory:'wellbeing'},{id:'read',now:date});
eq(resolveGardenCategory(state.habits.find(h=>h.id==='read')!),'wellbeing','explicit user category overrides suggestion');
state=upsertHabit(state,{name:'Leer',targetPerWeek:3,gardenCategory:null},{id:'read',now:date});
eq(resolveGardenCategory(state.habits.find(h=>h.id==='read')!),null,'explicit no category remains uncategorized');
eq(sanitizeHabitsState(state).habits.find(h=>h.id==='read')?.gardenCategory,null,'SQLite sanitizer preserves explicit null');
eq(sanitizeHabitsState({habits:[{...state.habits[0],gardenCategory:'fictional'}],completions:[]}).habits[0]?.gardenCategory,null,'invalid category sanitized');
const ids=MOVE_EXERCISE_LIBRARY.map(e=>e.id);
eq(new Set(ids).size,ids.length,'no duplicate exercise ids');
ok(ids.length>=130,'library expanded beyond previous 121');
const strength={...DEFAULT_MOVE_PREFERENCES,goal:'fuerza' as const,focus:'fuerza' as const,
 targetMuscles:['biceps' as const],equipment:{...DEFAULT_MOVE_PREFERENCES.equipment,dumbbellsKg:5}};
const eligible=compatibleTargetedExercises(strength,'suave');
ok(eligible.some(e=>e.id==='db-biceps-curl'),'available dumbbell curl recognized');
ok(eligible[0]?.equipment?.includes('dumbbells'),'strength puts equipment exercise before manual self resistance');
const preview=previewForDuration(30,strength,'suave');
ok(preview.length>0 && preview[0].equipment?.includes('dumbbells'),'preview prioritizes available dumbbells');
const noWeight={...strength,equipment:DEFAULT_MOVE_PREFERENCES.equipment};
const fallback=compatibleTargetedExercises(noWeight,'suave');
ok(fallback.some(e=>e.id==='self-resisted-biceps-curl'),'self resistance remains equipment-free fallback');
ok(fallback.every(e=>!e.equipment?.includes('dumbbells')),'no phantom equipment');
const exhausted=compatibleTargetedExercises(strength,'recuperacion');
ok(exhausted.every(e=>!e.equipment?.length),'never force weights on recovery');
const routine=routineForDuration(30,strength,'suave');
ok(routine.steps.every(step=>!step.exercise.equipment||step.exercise.equipment.every(e=>e==='dumbbells')),'safe eligible chosen');
console.log('Garden canonical categories, Move strength priority and expanded catalogue passed.');
