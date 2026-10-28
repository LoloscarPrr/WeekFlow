const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/move/useMoveController.ts'), 'utf8');
assert.ok(source.includes('nextMoveClockDelayMs('), 'controller must use elapsed-second-aligned clock');
assert.ok(source.includes('setTimeout(() => setClockMs(Date.now()), delayMs)'), 'timer uses absolute Date.now');
assert.ok(source.includes('clearTimeout(timer)'), 'pending timeout is cancelled on pause/unmount/phase change');
assert.ok(source.includes('clockMs]'), 'clock update re-arms next one-second tick');
assert.doesNotMatch(source, /setInterval\(\(\) => setClockMs\(Date\.now\(\)\), 500\)/, '500ms polling must not return');
assert.match(source, /const minuteBucket = Math\.floor\(clockMs \/ 60_000\)/, 'shift derived by minute');
assert.match(source, /\[weekState, minuteBucket\]/, 'shift memoization must respect week changes');
assert.match(source, /\[lastRecord, localDay\]/, 'doneToday must update on calendar day change');
assert.match(source, /if \(!activeSession \|\| activeSession\.paused \|\| !runtime\) return/, 'no ticking while paused or inactive');
assert.match(source, /Date\.now\(\)/, 'stopwatch clock uses actual timestamps');
console.log('Move timer cadence integration structure checks passed.');
