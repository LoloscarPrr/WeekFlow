import { upsertHabit, setHabitDayRule, skipHabitOnDate, sanitizeHabitsState } from '../src/habits/core';
import { parseHabitConstraintIntent } from '../src/assistant/habitConstraints';
import { proposeHabitConstraintChange } from '../src/brain/habitConstraintChange';
import { proposeWeeklyPlan } from '../src/brain/weeklyPlanner';
import { defaultDayState, defaultWeekState } from '../src/domain/defaults';
import { DEFAULT_MOVE_PREFERENCES } from '../src/move/adaptation';
import type { ConfirmedWeeklyPlan } from '../src/brain/weeklyPlanPersistence';

const ok=(x:unknown,msg:string)=>{if(!x)throw Error(msg)};
const eq=(a:unknown,b:unknown,msg:string)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(msg+': '+JSON.stringify(a))};
const now=new Date(2026,9,28,13,15);
let habits=upsertHabit({habits:[],completions:[]},{name:'Relación amorosa',targetPerWeek:2},{id:'love',now});
habits=upsertHabit(habits,{name:'Leer un rato',targetPerWeek:3},{id:'read',now});
const original=JSON.stringify(habits);
const dayRule=parseHabitConstraintIntent('Necesito que mi relación amorosa se organice sólo para los días libres',habits,now);
ok(dayRule && dayRule.kind==='off-days' && dayRule.habitId==='love','recognizes user example without cloud model');
const skip=parseHabitConstraintIntent('Mañana no voy a leer porque estoy donde un amigo ahora',habits,now);
ok(skip && skip.kind==='skip-date' && skip.date==='2026-10-29' && skip.habitId==='read',
  'tomorrow exception respects local date, not the word ahora');
eq(parseHabitConstraintIntent('Quiero borrar relación amorosa',habits,now),null,'delete never disguised as availability');
eq(parseHabitConstraintIntent('No quiero que relación amorosa se organice solo para días libres',habits,now),null,'negation no false positive');
eq(parseHabitConstraintIntent('Mi trabajo mañana cambia',habits,now),null,'non habit requests ignored');
eq(parseHabitConstraintIntent('Hoy estoy en casa de un amigo',habits,now),null,'chatter not silently scheduled');
eq(parseHabitConstraintIntent('Que relación amorosa se organice solo para días libres y leer también',habits,now),null,'two mentioned habits are ambiguous');
const changed=setHabitDayRule(habits,'love','off-days',now);
eq(changed.habits.find(x=>x.id==='love')?.dayRule,'off-days','saves persistent off-day rule');
eq(changed.habits.find(x=>x.id==='read')?.dayRule,undefined,'other habit unchanged');
const skipped=skipHabitOnDate(habits,'read','2026-10-29',now);
eq(skipped.habits.find(x=>x.id==='read')?.skipDates,['2026-10-29'],'single date skip is saved');
eq(skipped.habits.find(x=>x.id==='read')?.targetPerWeek,3,'skip does not decrease weekly goal');
eq(skipped.completions,habits.completions,'skip never forges completion');
eq(skipHabitOnDate(habits,'read','2026-10-27',now),habits,'cannot skip past date');
eq(skipHabitOnDate(skipped,'read','2026-10-29',now),skipped,'skip idempotent');
eq(sanitizeHabitsState(changed).habits[0].dayRule,'off-days','saved rule survives canonical sanitizer');
eq(JSON.stringify(habits),original,'core functions are pure');

const shifts={...defaultWeekState,shifts:defaultWeekState.shifts.map(x=>x.day===2
  ? {...x,type:'afternoon' as const,start:'13:00',end:'22:00'}
  : {...x,type:'off' as const})};
const confirmed:ConfirmedWeeklyPlan={
  weekStart:'2026-10-26',createdAt:now.toISOString(),confirmedAt:now.toISOString(),status:'confirmed',
  moveSlots:[{id:'move@2026-10-30',date:'2026-10-30',start:'15:00',end:'15:30',durationMin:30,
    intensity:'moderada',muscles:'Pecho',sampleExercises:['Flexiones'],explanation:'Move'}],
  moveSummary:{requested:1,completed:0,scheduled:1},
  slots:[
    {id:'love@2026-10-28',habitId:'love',title:'Relación amorosa',date:'2026-10-28',start:'10:00',end:'10:30',durationMin:30,variant:'full',explanation:'test'},
    {id:'love@2026-10-30',habitId:'love',title:'Relación amorosa',date:'2026-10-30',start:'10:00',end:'10:30',durationMin:30,variant:'full',explanation:'test'},
    {id:'read@2026-10-29',habitId:'read',title:'Leer',date:'2026-10-29',start:'12:00',end:'12:30',durationMin:30,variant:'full',explanation:'test'},
  ],shortfalls:[],warnings:[],
};
if(!dayRule||!skip)throw Error('required parsers failed');
const off=proposeHabitConstraintChange(habits,confirmed,shifts,dayRule,now);
eq(off.removed,1,'off day rule removes conflicting booked workday session');
eq(off.nextPlan?.slots.map(s=>s.id),['love@2026-10-30','read@2026-10-29'],'keeps other sessions');
eq(off.nextPlan?.moveSlots,confirmed.moveSlots,'never touches Move');
const skipPlan=proposeHabitConstraintChange(habits,confirmed,shifts,skip,now);
eq(skipPlan.removed,1,'skip tomorrow removes one confirmed reading slot');
eq(skipPlan.nextPlan?.slots.map(s=>s.id),['love@2026-10-28','love@2026-10-30'],'skipping does not remove other days or habits');
eq(skipPlan.nextState.habits.length,2,'no habit deleted');

const week=proposeWeeklyPlan({
 now:new Date(2026,9,26,8),week:shifts,habits:setHabitDayRule(habits,'love','off-days'),
 settings:defaultDayState.settings,energy:'bien',weekOffset:0,
 move:{preferences:{...DEFAULT_MOVE_PREFERENCES,weeklyTargetSessions:0},history:[]},
});
ok(week.slots.filter(s=>s.habitId==='love').every(s=>s.date!=='2026-10-28'),
  'replanner never puts off-day habit on Wednesday workday');
const skipWeek=proposeWeeklyPlan({
 now:new Date(2026,9,26,8),week:shifts,habits:skipHabitOnDate(habits,'read','2026-10-29',new Date(2026,9,26,8)),
 settings:defaultDayState.settings,energy:'bien',weekOffset:0,
 move:{preferences:{...DEFAULT_MOVE_PREFERENCES,weeklyTargetSessions:0},history:[]},
});
ok(skipWeek.slots.filter(s=>s.habitId==='read').every(s=>s.date!=='2026-10-29'),
  'tomorrow exception is excluded on future weekly replanning');
console.log('Habit availability and one-day-exception regression tests passed.');
