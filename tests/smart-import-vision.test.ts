import { normalizeVisionSchedule } from '../src/import/visionContract';
import { prepareSmartImport } from '../src/brain/smartImport';
import { defaultWeekState } from '../src/domain/defaults';

function equal<T>(a:T,b:T,msg:string){if(!Object.is(a,b))throw new Error(msg+': '+String(a)+' != '+String(b));}
function ok(v:unknown,msg:string){if(!v)throw new Error(msg);}
const days = Array.from({length:7},(_,day)=>({
  day,
  start: day===0||day===6 ? null : day===3 ? '22:00' : '07:00',
  end: day===0||day===6 ? null : day===3 ? '06:00' : '15:00',
  breakMinutes: day===0||day===6 ? 0 : 30,
  off:day===0||day===6,
  confidence:'high',
  issue:null,
  sourceText: day===0||day===6 ? 'LIBRE' : '07:00 00:30 15:00',
}));
const valid={matchedName:'OSCAR URRUTIA',rowMatchCount:1,shifts:days,warnings:[]};
const parsed=normalizeVisionSchedule(valid,'OSCAR');
equal(parsed.nameFound,true,'single uniquely matching row');
equal(parsed.shifts.length,7,'all 7 days');
equal(parsed.shifts[3].type,'night','overnight time');
equal(parsed.shifts[3].breakMinutes,30,'break duration');
equal(parsed.shifts[0].off,true,'off day');
equal(prepareSmartImport(defaultWeekState,parsed.shifts,'library',parsed.matchedNameText).status,
  'ready','valid visual review can be confirmed through canonical Brain');
const invalidPerson=normalizeVisionSchedule({...valid,matchedName:'DANIELA'},'OSCAR');
equal(invalidPerson.nameFound,false,'must not import someone else');
equal(prepareSmartImport(defaultWeekState,invalidPerson.shifts,'camera',invalidPerson.matchedNameText).status,
  'review-required','wrong person cannot save');
equal(normalizeVisionSchedule({...valid,rowMatchCount:2},'OSCAR').nameFound,false,
  'duplicate row cannot be assigned');
equal(normalizeVisionSchedule({...valid,rowMatchCount:0},'OSCAR').nameFound,false,
  'unfound row is invalid');
const missingDay=normalizeVisionSchedule({...valid,shifts:days.slice(1)},'OSCAR');
ok(Boolean(missingDay.shifts[0].issue),'partial images remain unknown');
equal(prepareSmartImport(defaultWeekState,missingDay.shifts,'library',missingDay.matchedNameText).status,
  'review-required','partial image never silently imported');
const duplicatedDay=normalizeVisionSchedule({...valid,shifts:[...days.slice(0,6),{...days[5]}]},'OSCAR');
ok(Boolean(duplicatedDay.shifts[5].issue),'duplicate day blocked');
const missingBreak=normalizeVisionSchedule({...valid,shifts:days.map((d,i)=>i===2?{...d,breakMinutes:null}:d)},'OSCAR');
equal(missingBreak.shifts[2].breakMinutes,null,'missing colación is NOT zero');
ok(Boolean(missingBreak.shifts[2].issue),'missing colación requires review');
const contradictions=normalizeVisionSchedule({...valid,shifts:days.map((d,i)=>i===0?{...d,start:'09:00',end:'17:00'}:d)},'OSCAR');
equal(contradictions.shifts[0].off,false,'OFF plus hours is NOT safely off');
ok(Boolean(contradictions.shifts[0].issue),'contradiction flagged');
const malformed=normalizeVisionSchedule({...valid,shifts:days.map((d,i)=>i===2?{...d,start:'99:88'}:d)},'OSCAR');
ok(Boolean(malformed.shifts[2].issue),'bad clock blocked');
const unsupported=normalizeVisionSchedule({bad:'data'},'OSCAR');
equal(unsupported.nameFound,false,'malformed model JSON fails closed');
equal(unsupported.shifts.length,7,'malformed model never invents week');
const invalidDuration=normalizeVisionSchedule({...valid,shifts:days.map((d,i)=>i===3?{...d,breakMinutes:300}:d)},'OSCAR');
equal(invalidDuration.shifts[3].breakMinutes,null,'oversize break is unknown');
ok(Boolean(invalidDuration.shifts[3].issue),'oversize break requires human correction');
equal(normalizeVisionSchedule({...valid,shifts:days.map((d,i)=>i===1?{...d,confidence:'low'}:d)},'OSCAR').shifts[1].confidence,
  'low','low confidence preserved');
console.log('Smart Import multimodal response contract tests passed.');
