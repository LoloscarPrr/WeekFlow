import { confirmedMomentsForNow } from '../src/brain/confirmedPlanMoments';
import { timelineAfterFeaturedMoment } from '../src/domain/services/nowTimeline';
import type { ConfirmedWeeklyPlan } from '../src/brain/weeklyPlanPersistence';
import { defaultWeekState, defaultDayState } from '../src/domain/defaults';
import { proposeWeeklyPlan } from '../src/brain/weeklyPlanner';
import { upsertHabit } from '../src/habits/core';
import { DEFAULT_MOVE_PREFERENCES } from '../src/move/adaptation';
function ok(value: unknown, message: string) { if (!value) throw Error(message); }
function equal(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw Error(message + ': '+JSON.stringify(actual));
}
const day = new Date(2026,9,28,2,8);
const slot = {
  id:'move@2026-10-28',date:'2026-10-28',start:'10:45',end:'11:15',
  durationMin:30,intensity:'suave' as const,muscles:'Piernas + Glúteos',
  targetMuscles:['piernas','gluteos'] as Array<'piernas'|'gluteos'>,
  sampleExercises:['Sentadilla'],explanation:'Sesión confirmada',
};
const friday = {...slot,id:'move@2026-10-30',date:'2026-10-30',start:'15:00',end:'15:30',muscles:'Espalda'};
const plan: ConfirmedWeeklyPlan={
  weekStart:'2026-10-26',createdAt:day.toISOString(),confirmedAt:day.toISOString(),
  status:'confirmed',slots:[],moveSlots:[slot,friday],moveSummary:{requested:2,completed:0,scheduled:2},
  shortfalls:[],warnings:[],
};
const habits = {habits:[],completions:[]};
const moment = confirmedMomentsForNow(plan,habits,day);
equal(moment.length,2,'scheduled Move appears from actual confirmed plan');
equal(moment[0].item.plannedMoveId,'move@2026-10-28','same-day row links exact slot');
equal(moment[0].item.time,'10:45','uses scheduled hour, not a fabricated time');
ok(moment[0].item.title.includes('Piernas'), 'focus included');
equal(timelineAfterFeaturedMoment(moment.map(x=>x.item),'before',false).length,2,
  'a Move featured in Ahora remains visible in Lo que viene');
equal(timelineAfterFeaturedMoment([{...moment[0].item,plannedMoveId:undefined},moment[1].item],'before',false).length,1,
  'generic featured card stays deduplicated');
const overdue = confirmedMomentsForNow(plan,habits,new Date(2026,9,28,12,0));
equal(overdue[0].item.plannedMoveId,slot.id,'today overdue still displayed as pending');
ok(overdue[0].item.detail.includes('pendiente de hoy'),'must distinguish overdue from future');
const completed = confirmedMomentsForNow(plan,habits,day,[{
 id:'a', startedAt:'2026-10-28T10:50:00', finishedAt:'2026-10-28T11:20:00',
 plannedMinutes:30,completedSteps:4,totalSteps:4,endedEarly:false,feedback:'Bien',
 scheduledMoveId:slot.id,
}]);
equal(completed.length,1,'completed weekly Move hidden, future Move stays');
equal(completed[0].item.plannedMoveId,friday.id,'only completed slot hidden');
equal(confirmedMomentsForNow(plan,habits,new Date(2026,10,2,8,0)).length,0,'expired week hidden');
equal(confirmedMomentsForNow({...plan,moveSlots:[]},habits,day).length,0,
 'no fake Move when not scheduled');
let saved = upsertHabit({habits:[],completions:[]},{name:'Leer',targetPerWeek:3,miniVersion:'Dos páginas'},{id:'read',now:day});
const shifts={...defaultWeekState,shifts:defaultWeekState.shifts.map(s=>
 s.day===2?{...s,type:'afternoon' as const,start:'13:00',end:'22:00'}:s)};
const weekly=proposeWeeklyPlan({
 now:day,week:shifts,habits:saved,settings:{
 ...defaultDayState.settings,commuteOutMin:75,commuteBackMin:75,bufferMin:15,prepMin:35
 },energy:'cansado',move:{preferences:DEFAULT_MOVE_PREFERENCES,history:[]},
});
ok(!weekly.slots.some(s=>s.date==='2026-10-28' && s.start<'13:00'),
 'no Leer at 10:30 while eating, waking or preparing for 13:00 shift');
ok(!weekly.moveSlots.some(s=>s.date==='2026-10-28' && s.start<'13:00'),
 'no Move before wake/prep/commute for 13:00 shift');
ok(weekly.slots.every(s=>s.date!=='2026-10-28'||s.start>='22:00'),
 'habits are not silently moved into protected pre-shift time');
console.log('Now confirmed Move visibility and pre-shift collision tests passed.');
