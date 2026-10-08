const fs = require('fs');

const actions = fs.readFileSync('src/brain/actions.ts', 'utf8');

function ok(value, message) {
  if (!value) throw new Error(message);
}

ok(actions.includes("updateNowEnergy"), 'Brain actions debe reutilizar updateNowEnergy');
ok(actions.includes("updateWeekShift"), 'Brain actions debe reutilizar updateWeekShift');
ok(actions.includes("confirmation-required"), 'contrato debe representar confirmación pendiente');
ok(actions.includes("status: 'conflict'"), 'undo debe representar conflicto');
ok(actions.includes("status: 'reverted'"), 'undo debe representar reversión');
ok(actions.includes('before: BrainActionTargetSnapshot'), 'recibo debe guardar before');
ok(actions.includes('after: BrainActionTargetSnapshot'), 'recibo debe guardar after');

for (const forbidden of [
  'sqliteStateStore',
  'saveDayState',
  'saveWeekState',
  'AsyncStorage',
  'expo-sqlite',
]) {
  ok(!actions.includes(forbidden), `foundation puro no debe persistir mediante ${forbidden}`);
}

console.log('Brain action foundation structure tests passed.');
