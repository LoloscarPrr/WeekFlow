const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const controller = read('src/presentation/week/useWeekController.ts');
const weekScreen = read('app/week.tsx');
const updateWeek = read('src/application/useCases/updateWeekSchedule.ts');

assert(controller.includes('completeWeekRitual'), 'Week controller must reuse completeWeekRitual');
assert(controller.includes('const completeRitual = useCallback'), 'Week controller must expose a ritual completion action');
assert(controller.includes('new Date().toISOString()'), 'Ritual completion must persist a current ISO timestamp');
assert(controller.includes('saveWeekState(next)'), 'Ritual completion must persist the completed week');
assert(controller.includes('refreshScheduledReminders()'), 'Ritual completion must refresh live reminders');
assert(controller.includes('completeRitual,'), 'Controller return value must expose completeRitual');

assert(updateWeek.includes('organizedAt: null'), 'Manual week changes must still reopen the week');
assert(updateWeek.includes('export function completeWeekRitual'), 'Canonical ritual use case must remain available');

assert(weekScreen.includes("week.organizedAt ? 'SEMANA ORGANIZADA' : 'RITUAL DE LA SEMANA'"), 'Week screen must render compact open/done ritual states');
assert(weekScreen.includes('Listo. Tu semana ya está organizada.'), 'Week screen must show the canonical completion copy');
assert(weekScreen.includes('Listo, organizar semana'), 'Open week must expose exactly one clear completion action');
assert(weekScreen.includes('onPress={completeRitual}'), 'Completion button must call the controller action');
assert(weekScreen.includes('summary.workDays'), 'Ritual must reuse the existing work-day summary');
assert(weekScreen.includes('summary.freeDays'), 'Ritual must reuse the existing free-day summary');
assert(weekScreen.includes('summary.total'), 'Ritual must reuse the existing programmed-time summary');
assert(weekScreen.indexOf('<ImportantEventCard') < weekScreen.indexOf('RITUAL DE LA SEMANA'), 'Ritual closure must remain after the compact important-event control');
assert(!weekScreen.includes('Importar horario'), 'Legacy schedule import entry must stay hidden until Brain smart import returns');
assert(!weekScreen.includes("router.push('/import')"), 'Semana must not route users into the frozen legacy import flow');

console.log('week ritual flow regression: PASS');
