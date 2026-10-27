const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the production module against the SQLiteStateStore contract without
// loading Android's native SQLite module in Node.
const source = fs.readFileSync(path.join(__dirname, '../src/move/runtime.ts'), 'utf8');
assert.match(source, /import\s*\{\s*sqliteStateStore\s*\}\s*from/);
assert.doesNotMatch(source, /openDatabaseSync|CREATE TABLE IF NOT EXISTS|from\s*['"]expo-sqlite['"]/);
const js = ts.transpileModule(source, {
  fileName: 'runtime.ts',
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const values = new Map();
const operations = [];
const sqliteStateStore = {
  read(key) {
    operations.push(['read', key]);
    const json = values.get(key);
    return json === undefined ? null : JSON.parse(json);
  },
  write(key, value) {
    operations.push(['write', key]);
    values.set(key, JSON.stringify(value));
  },
  delete(key) {
    operations.push(['delete', key]);
    values.delete(key);
  },
};
const mod = { exports: {} };
vm.runInNewContext(js, {
  exports: mod.exports,
  module: mod,
  require(specifier) {
    assert.equal(specifier, '@/src/data/local/sqlite/SQLiteStateStore');
    return { sqliteStateStore };
  },
  Date,
});
const runtime = mod.exports;
const RT = 'move-runtime-v1';
const NOTES = 'move-feedback-notes-v1';
const unrelated = 'move-active-session';
values.set(unrelated, JSON.stringify({ id: 'ongoing', startedAt: '2026-10-27T10:00:00.000Z' }));
const start = new Date('2026-10-27T10:00:00.000Z');

const made = runtime.createMoveRuntime('session-a', 'routine-01', start);
assert.equal(made.sessionId, 'session-a');
assert.equal(made.routineId, 'routine-01');
assert.equal(made.phase, 'exercise');
assert.equal(made.phaseStartedAt, start.toISOString());
assert.equal(made.phasePausedTotalMs, 0);
runtime.saveMoveRuntime(made);
assert.equal(values.has(RT), true, 'writes keep the existing key');
assert.deepEqual(JSON.parse(values.get(RT)), JSON.parse(JSON.stringify(made)));
assert.equal(runtime.loadMoveRuntime('session-a').routineId, 'routine-01');
assert.equal(runtime.loadMoveRuntime('session-b'), null, 'other session cannot reuse runtime');

// Existing records with missing optional fields must keep all defaults.
values.set(RT, JSON.stringify({ sessionId: 'legacy', phaseStartedAt: start.toISOString(), phase: 'rest' }));
const legacy = runtime.loadMoveRuntime('legacy');
assert.equal(legacy.routineId, '');
assert.equal(legacy.phase, 'rest');
assert.equal(legacy.phasePausedAt, null);
assert.equal(legacy.phasePausedTotalMs, 0);
assert.deepEqual(JSON.parse(JSON.stringify(legacy.exerciseOverrides)), {});
assert.equal(runtime.loadMoveRuntime('session-a'), null);
values.set(RT, '{invalid-json');
assert.equal(runtime.loadMoveRuntime(), null, 'invalid JSON is non-fatal');
values.set(RT, JSON.stringify({ noSession: true }));
assert.equal(runtime.loadMoveRuntime(), null, 'invalid runtime record is ignored');
runtime.saveMoveRuntime(made);

const paused = { ...made, phasePausedAt: '2026-10-27T10:01:00.000Z', phasePausedTotalMs: 10000 };
assert.equal(runtime.phaseElapsedMs(paused, Date.parse('2026-10-27T10:02:00.000Z')), 50000);
assert.equal(runtime.phaseElapsedMs(made, Date.parse('2026-10-27T10:02:00.000Z')), 120000);

runtime.saveMoveFeedbackNote('s1', '  Primer comentario  ');
let list = JSON.parse(values.get(NOTES));
assert.equal(list.length, 1);
assert.equal(list[0].note, 'Primer comentario');
assert.equal(list[0].sessionId, 's1');
assert.ok(!Number.isNaN(Date.parse(list[0].savedAt)));
runtime.saveMoveFeedbackNote('s1', 'Comentario actualizado');
list = JSON.parse(values.get(NOTES));
assert.equal(list.length, 1);
assert.equal(list[0].note, 'Comentario actualizado');
for (let i = 0; i < 35; i += 1) runtime.saveMoveFeedbackNote('new-' + i, 'nota ' + i);
list = JSON.parse(values.get(NOTES));
assert.equal(list.length, 30, 'feedback history is capped at 30');
assert.equal(list[0].sessionId, 'new-34', 'newest notes are first');
assert.equal(list.some(note => note.sessionId === 's1'), false, 'oldest notes are trimmed');
runtime.saveMoveFeedbackNote('new-34', '  ');
list = JSON.parse(values.get(NOTES));
assert.equal(list.length, 29, 'blank note removes that session note');
assert.equal(list.some(note => note.sessionId === 'new-34'), false);

runtime.clearMoveRuntime();
assert.equal(values.has(RT), false);
assert.equal(runtime.loadMoveRuntime(), null);
assert.ok(values.has(NOTES), 'clearing runtime preserves feedback notes');
assert.ok(values.has(unrelated), 'clearing runtime preserves active session');
assert.deepEqual(JSON.parse(values.get(unrelated)), { id: 'ongoing', startedAt: start.toISOString() });
assert.ok(operations.every(([op, key]) =>
  ['read', 'write', 'delete'].includes(op) && [RT, NOTES].includes(key)),
  'runtime persistence must not touch unrelated state');

const storeSource = fs.readFileSync(path.join(__dirname, '../src/data/local/sqlite/SQLiteStateStore.ts'), 'utf8');
const migrations = fs.readFileSync(path.join(__dirname, '../src/data/migrations/databaseSchema.ts'), 'utf8');
assert.match(storeSource, /openDatabaseSync\(databaseName\)/);
assert.match(storeSource, /pendingDatabaseMigrations\(currentVersion\)/);
assert.match(migrations, /CREATE TABLE IF NOT EXISTS weekflow_state/);
assert.match(migrations, /currentDatabaseVersion = 1/);
console.log('Move canonical SQLite runtime persistence tests passed.');
