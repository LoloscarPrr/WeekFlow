const assert = require('node:assert/strict');
const fs = require('node:fs');
function read(path) { return fs.readFileSync(path, 'utf8'); }

const move = read('src/move/MovePlan.tsx');
const moveStyles = read('src/move/styles.ts');
const week = read('app/week.tsx');
const planner = read('src/components/WeeklyPlannerPreview.tsx');
const events = read('src/components/ImportantEventCard.tsx');
const now = read('app/index.tsx');
const food = read('app/food.tsx');
const rest = read('app/rest.tsx');

assert.ok(move.indexOf('Empezar sesión guiada') < move.indexOf('Ajustar entrenamiento'),
  'Move must show the primary training action before optional configuration');
assert.ok(move.indexOf('Ajustar entrenamiento') < move.indexOf('>Perfil</Text>'),
  'Move profile and session editor must be behind secondary settings');
assert.match(move, /\{detailsOpen \? \(/, 'Move settings folded by default');
assert.match(move, /\{previewOpen \? \(/, 'full exercise preview is folded');
assert.match(move, /\{!hasCompatibleTarget \? \(/, 'unavailable exercises explained before starting');
assert.match(move, /disabled=\{!hasCompatibleTarget\}/, 'safety gate preserved');
assert.match(move, /onPress=\{startSession\}/, 'training start remains available');
assert.match(move, /onPress=\{\(\) => router\.push\('\/move-library'\)\}/, 'exercise library is still reachable');
assert.match(moveStyles, /duration: \{ flex: 1, minHeight: 48/, 'duration options remain touchable');

assert.match(week, /\{summary\.workDays\} jornadas/, 'week summary stays visible in one compact line');
assert.match(week, /<WeeklyPlannerPreview week=\{currentWeek\} selectedWeek=\{selectedWeek\} \/>/,
  'planner receives current canonical tab selection');
assert.match(week, /accessibilityLabel="Duración de colación, entre 0 y 180 minutos"/,
  'compact meal break still exposes range to accessibility');
assert.match(week, /minHeight: 54, paddingHorizontal: 14/, 'day rows are compact but usable');
assert.doesNotMatch(planner, /setWeekOffset|weekChoice\}>/, 'duplicate nested week selector must not return');
assert.match(planner, /loadWeekStateForOffset\(selectedWeek\)/, 'planning follows selected canonical week');
assert.match(planner, /confirmedWeekNeedsReview\(selectedWeek\)/, 'stale plan warning follows selected week');
assert.match(planner, /\{settingsOpen \? \(/, 'weekly Move preferences collapsed by default');
assert.match(planner, /\{proposal \? \(/, 'full proposal review remains visible before confirmation');
assert.match(planner, /confirmWeeklyProposal\(proposal\)/, 'weekly approval remains explicit');

assert.match(events, /const \[adding, setAdding\] = useState\(false\)/, 'event form starts folded');
assert.match(events, /\{adding \? \(/, 'event editor is revealed on demand');
assert.match(events, /\{sortedMoments\.length \? \(/, 'existing events remain listed regardless of form');
assert.match(events, /onDelete\(moment\.id\)/, 'event deletion remains reachable');
assert.match(events, /setAdding\(false\)/, 'successful save closes event editor');

for (const energy of ['vigoroso', 'bien', 'cansado', 'agotado']) {
  assert.ok(now.includes("value: '" + energy + "'"), 'energy choice preserved: ' + energy);
}
assert.match(now, /energyButton: \{ flex: 1, minHeight: 60/, 'energy selector more compact, >44pt');
assert.match(now, /markActualExit/, 'actual exit action preserved');
assert.match(now, /confirmExitReplan/, 'real exit requires action confirmation');
assert.match(now, /timelineMoments\.map/, 'live timeline preserved');

assert.match(food, /foodDay\.entries\.length \? \(/, 'food log still renders when records exist');
assert.match(food, /Registrar una comida/, 'empty state now offers immediate action');
assert.match(food, /onPress=\{addManual\}/, 'food log can still be saved');
assert.match(food, /quickButton: \{ flex: 1, minHeight: 74/, 'Food quick links are denser');
assert.doesNotMatch(rest, />PILARES · REST<\/Text>/, 'Rest duplicate heading removed');
assert.match(rest, /content\.plan\.nap/, 'rest nap remains');
assert.match(rest, /content\.plan\.nextStart/, 'rest shift context remains');

console.log('WF-UX-003 compact action-first structure checks passed.');
