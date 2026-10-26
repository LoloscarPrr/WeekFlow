const fs = require('fs');
function read(path) { return fs.readFileSync(path, 'utf8'); }
function ok(value, message) { if (!value) throw new Error(message); }
const store = read('src/data/local/sqlite/SQLiteStateStore.ts');
const persistence = read('src/state/persistence.ts');
const controller = read('src/presentation/assistant/useAssistantController.ts');
const screen = read('app/assistant.tsx');
const brain = read('src/brain/actions.ts');
ok(store.includes('withTransactionSync'), 'SQLite debe guardar ambas fuentes en una transacción');
ok(persistence.includes('sqliteStateStore.writeBatch'), 'Brain debe reutilizar una única escritura transaccional');
ok(persistence.includes('DAY_STATE_KEY') && persistence.includes('MOVE_PREFERENCES_KEY'),
  'escritura reutiliza claves canónicas');
ok(controller.includes("result.status === 'energy-move-intent'"), 'Asistente entiende acción conjunta');
ok(controller.includes('saveAssistantEnergyMove(result.state.dayState, result.state.movePreferences!)'),
  'confirmar guarda energía+Move mediante transacción');
ok(controller.includes("lastReceipt.before.target === 'day-move'"),
  'undo combinado también usa la transacción');
ok(controller.includes('loadActiveMoveSession()'), 'evita cambios de Move durante sesión activa');
ok(screen.includes("lastReceipt?.kind === 'set-energy-move'"), 'Asistente permite abrir Move tras confirmar');
ok(brain.includes("target: 'day-move'"), 'recibo conjunto verifica ambas fuentes de verdad');
console.log('Combined Energy+Move persistence structure tests passed.');
