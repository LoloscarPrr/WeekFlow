const fs = require('fs');
const read = p => fs.readFileSync(p,'utf8');
const ok = (v,m) => { if (!v) throw Error(m); };
const controller = read('src/presentation/assistant/useAssistantController.ts');
const planner = read('src/brain/weeklyPlanner.ts');
const persistence = read('src/brain/weeklyPlanPersistence.ts');
const screen = read('app/assistant.tsx');
const parser = read('src/assistant/weeklyIntent.ts');
const pkg=JSON.parse(read('package.json'));
const lock=JSON.parse(read('package-lock.json'));
ok(controller.includes('parseWeeklyPlanningIntent(input)'), 'Assistant interprets preview requests');
ok(controller.includes('proposeWeeklyPlan({') && controller.includes('loadDailyEnergy()') && controller.includes('loadHabitsState()') && controller.includes('loadWeekState()'),
  'reads canonical week, energy, habits');
ok(controller.includes('confirmWeeklyProposal(pendingWeekly, { expectedCurrent: previousConfirmedWeekly })'), 'confirm validates old plan snapshot');
ok(controller.includes('undoConfirmedWeeklyProposal(weeklyUndo.applied, weeklyUndo.previous)'), 'undo guarded by latest saved value');
ok(controller.includes('syncLivePlanReminders()'), 'notifications reconciled after confirmation/undo');
ok(screen.includes('pendingWeekly.slots.map') && screen.includes('pendingWeekly.warnings.map') && screen.includes('Confirmar semana'), 'user can examine full proposal and warnings');
ok(screen.includes('Organizar mi semana · Vista previa') && screen.includes('↶ Deshacer planificación semanal'), 'local interactive entrypoint and undo');
ok(screen.includes('no cambia turnos laborales') || screen.includes('No cambia turnos laborales'), 'clear plan scope');
ok(planner.includes('protectedIntervals') && planner.includes('recoveryDates'), 'canonical planner protects work and night recovery');
ok(persistence.includes('JSON.stringify(loadConfirmedWeeklyPlan()) !== JSON.stringify(options.expectedCurrent)'), 'no stale plan overwrite');
ok(persistence.includes('JSON.stringify(loadConfirmedWeeklyPlan()) !== JSON.stringify(confirmed)'), 'no stale plan undo');
ok(!parser.includes('saveWeekState') && !parser.includes('sqlite'), 'parser is pure');
ok(pkg.dependencies['expo-linking']==='~57.0.13' && lock.packages[''].dependencies['expo-linking']==='~57.0.13'
  && lock.packages['node_modules/expo-linking'].version==='57.0.13', 'Metro bundle missing expo-linking package fixed with lockfile');
console.log('Assistant weekly confirmation and Android bundling guards passed.');
