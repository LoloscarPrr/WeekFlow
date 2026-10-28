import { deleteHabit, upsertHabit, completeHabit } from '../src/habits/core';
import { DEFAULT_MOVE_PREFERENCES, sanitizeMovePreferences } from '../src/move/adaptation';
import { MOVE_EXERCISE_BY_ID, MOVE_EXERCISE_LIBRARY } from '../src/move/exerciseCatalog';
import { MOVE_MUSCLE_EXERCISE_IDS } from '../src/move/muscles';
import { compatibleTargetedExercises, routineForDuration, previewForDuration } from '../src/move/library';

const eq=(a:unknown,b:unknown,label:string)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(label+': '+JSON.stringify(a))};
const ok=(v:unknown,label:string)=>{if(!v)throw Error(label)};

let state=upsertHabit({habits:[],completions:[]},{name:'Leer',targetPerWeek:3},{id:'read',now:new Date(2026,9,28)});
state=upsertHabit(state,{name:'Relación amorosa',targetPerWeek:2},{id:'love',now:new Date(2026,9,28)});
state=completeHabit(state,'read','full',new Date(2026,9,28));
state=completeHabit(state,'love','mini',new Date(2026,9,28));
const unchanged=JSON.stringify(state);
const erased=deleteHabit(state,'read');
eq(erased.habits.map(x=>x.id),['love'],'delete selected habit, preserve other');
ok(erased.completions.every(x=>x.habitId==='love'),'delete only selected completion history');
eq(JSON.stringify(state),unchanged,'pure deletion does not mutate input');
eq(deleteHabit(state,'not-found'),state,'unknown habit is a no-op');
eq(deleteHabit(erased,'read'),erased,'repeat deletion idempotent');

const ids=MOVE_EXERCISE_LIBRARY.map(x=>x.id);
eq(new Set(ids).size, ids.length, 'unique exercise IDs');
ok(ids.length>=110,'expanded library is substantially larger');
for(const x of MOVE_EXERCISE_LIBRARY){
 ok(x.cue && x.easier && MOVE_EXERCISE_BY_ID[x.swapWith], 'each exercise has guidance and valid swap: '+x.id);
}
for(const [group,groupIds] of Object.entries(MOVE_MUSCLE_EXERCISE_IDS)){
 for(const id of groupIds)ok(Boolean(MOVE_EXERCISE_BY_ID[id]), 'muscle map '+group+' unknown '+id);
}
for(const id of ['db-neutral-press','band-chest-press','db-chest-fly-floor','db-rear-delt-fly','db-lateral-raise','db-hammer-curl','band-biceps-curl','db-kickback','db-glute-bridge','side-leg-raise','seated-knee-extension','heel-slide-core','db-suitcase-march']){
 ok(ids.includes(id), 'new movement accessible from library: '+id);
}
const prefs=sanitizeMovePreferences({
 ...DEFAULT_MOVE_PREFERENCES, goal:'fuerza', focus:'fuerza', trainingStyle:'series', experience:'intermedio',
 targetMuscles:['pecho','espalda','biceps','piernas','core'],
 equipment:{...DEFAULT_MOVE_PREFERENCES.equipment, dumbbellsKg:5,bench:true}
});
const first=previewForDuration(30,prefs,'moderada');
const lastIds=first.map(x=>x.id);
const second=previewForDuration(30,prefs,'moderada',{
  previousExerciseIds:lastIds,lastFeedback:'Bien',lastEndedEarly:false,
});
ok(first.length===4 && second.length===4,'30min preview remains realistic four exercises');
ok(second.some(x=>!lastIds.includes(x.id)), 'next session cycles through fresh compatible movements');
const eligible=new Set(compatibleTargetedExercises(prefs,'moderada').map(x=>x.id));
ok(second.every(x=>eligible.has(x.id)), 'variation obeys equipment and muscle constraints');
const noDumbbells=sanitizeMovePreferences({
 ...prefs,equipment:DEFAULT_MOVE_PREFERENCES.equipment,targetMuscles:['biceps']
});
const safe=routineForDuration(30,noDumbbells,'suave');
ok(safe.steps.every(step=>!step.exercise.equipment || !step.exercise.equipment.includes('dumbbells')),
 'never prescribe dumbbells without recorded equipment');
console.log('Habit delete + expanded Move exercise library and variation tests passed.');
