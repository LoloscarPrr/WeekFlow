import { defaultWeekState } from '../src/domain/defaults';
import { advanceWeekWindow, addWeek, emptyWeek, mondayKey, nextWeekSchedule, type WeekWindow } from '../src/domain/services/weekWindow';
import { shiftContextForDate, nextWorkingShift } from '../src/domain/services/shiftSchedule';
import { buildLivePlanReminders } from '../src/domain/services/reminderPlan';
import { defaultDayState } from '../src/domain/defaults';
import type { WeekSchedule } from '../src/domain/entities/Shift';

const yes = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const eq = (a: unknown, b: unknown, message: string) => {
  if (!Object.is(a, b)) throw new Error(message + ': ' + String(a) + ' !== ' + String(b));
};
const shift = (day: number, start: string, end: string, type: 'morning' | 'afternoon' | 'night' | 'off', breakMinutes=30) =>
  ({ day, start, end, type, breakMinutes });
const current: WeekSchedule = {
  ...emptyWeek(),
  shifts: defaultWeekState.shifts.map(s => s.day === 6 ? shift(6, '22:00', '06:00', 'night') : s.day === 0
    ? shift(0,'13:00','22:00','afternoon') : { ...s }),
  importantMoments: [{ id:'event-a', date:'2026-11-04', day:2, time:'18:00', title:'Compromiso' }],
  organizedAt:'2026-10-26T10:00:00.000Z',
};
const following: WeekSchedule = {
  ...emptyWeek(),
  shifts: defaultWeekState.shifts.map(s => s.day === 0 ? shift(0,'07:00','16:00','morning',45)
    : s.day === 6 ? shift(6,'13:00','22:00','afternoon') : { ...s }),
};
eq(mondayKey(new Date(2026, 10, 1, 23, 59)), '2026-10-26', 'Sunday is prior Monday');
eq(mondayKey(new Date(2026, 10, 2, 0, 0)), '2026-11-02', 'Monday rollover at local midnight');
eq(addWeek('2026-10-26'), '2026-11-02', 'next Monday correctly computed across months');
eq(addWeek('2026-11-02', -1), '2026-10-26', 'previous Monday');
const window: WeekWindow = { currentMonday:'2026-10-26', previous:null, next:{weekStart:'2026-11-02', week:following} };
eq(nextWeekSchedule(window,current).shifts[0].start,'07:00','next Monday independent of current Monday');
eq(current.shifts[0].start,'13:00','editing next cannot change current source');
eq(nextWeekSchedule(window,current).importantMoments[0].id,'event-a','dated moments available in next view');
const before = advanceWeekWindow(window,current,new Date(2026,10,1,23,59));
eq(before.rotated,false,'Sunday does not rotate');
const after = advanceWeekWindow(window,current,new Date(2026,10,2,0,0));
eq(after.rotated,true,'next week promotes automatically at Monday');
eq(after.current.shifts[0].start,'07:00','Monday uses prepared next roster');
eq(after.current.shifts[0].breakMinutes,45,'break preserved on rollover');
eq(after.window.next,null,'following next slot becomes empty');
eq(after.window.previous?.weekStart,'2026-10-26','previous Sunday retained');
eq(after.current.importantMoments[0].date,'2026-11-04','dated event preserved');
yes(Boolean(after.current.organizedAt),'prepared roster automatically organized without new ritual');
eq(advanceWeekWindow(after.window,after.current,new Date(2026,10,2,3)).rotated,false,'repeated load is idempotent');
const missed = advanceWeekWindow({currentMonday:'2026-10-26',next:null,previous:null},current,new Date(2026,10,2,0));
eq(missed.current.shifts[0].type,'off','missing next plan does not fabricate repeating roster');
eq(missed.current.organizedAt,null,'unprepared next needs organization');
eq(missed.current.importantMoments[0].id,'event-a','empty schedule still preserves dated events');
const skipped = advanceWeekWindow(window,current,new Date(2026,10,16,12));
eq(skipped.current.shifts[0].type,'off','stale next roster not promoted two weeks later');
eq(skipped.window.previous,null,'previous week not falsely retained after long absence');

const mondayNight = new Date(2026,10,2,4);
const carry = shiftContextForDate(after.current,mondayNight,0,after.window.previous?.week);
eq(carry.overnightCarry,true,'Sunday night carried over past Monday boundary');
eq(carry.shift.start,'22:00','Sunday carry sourced from prior week');
const later = shiftContextForDate(after.current,new Date(2026,10,2,8),0,after.window.previous?.week);
eq(later.overnightCarry,false,'after Sunday shift ends Monday follows its own roster');
eq(later.shift.start,'07:00','current Monday shift is separate from Sunday carry');

const nextWorking = nextWorkingShift(current,new Date(2026,10,1,18),following);
eq(nextWorking?.startAt.slice(0,10),'2026-11-02','Rest finds next Monday shift');
eq(nextWorking?.shift.start,'07:00','Rest chooses next week's real start');
const notify = buildLivePlanReminders(defaultDayState,current,new Date(2026,10,1,11),4,following);
yes(notify.some(item=>item.id==='shift-2026-11-02-07:00'),'future reminder uses next-week shift');
yes(!notify.some(item=>item.id==='shift-2026-11-02-13:00'),'future reminder never reuses stale current-week Monday');
console.log('Week two-roster rollover, local Monday, Sunday carry and future reminder tests passed.');
