const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = (p) => fs.readFileSync(p, 'utf8');

const animation = JSON.parse(read('assets/animations/weekflow-complete.json'));
const component = read('src/components/CompletionAnimation.tsx');
const moveController = read('src/move/useMoveController.ts');
const moveFeedback = read('src/move/MoveFeedback.tsx');
const week = read('app/week.tsx');
const pkg = JSON.parse(read('package.json'));
const app = JSON.parse(read('app.json'));

assert.equal(animation.fr, 30, 'low frame rate to avoid unnecessary work');
assert.ok(animation.op / animation.fr <= 1.5 && animation.op / animation.fr > 0, 'brief, finite animation');
assert.deepEqual(animation.assets, [], 'no remote images, fonts or media');
assert.equal(animation.layers.length, 2, 'simple ring and check; not a heavyweight scene');
assert.ok(animation.layers.every(layer => layer.ty === 4), 'vector shapes only');
assert.equal(pkg.dependencies['lottie-react-native'], '~7.3.8', 'native Lottie pinned for Expo SDK 57');
assert.equal(pkg.version, '0.5.44');
assert.equal(app.expo.version, '0.5.44');
assert.equal(app.expo.android.package, 'com.weekflow.app');

assert.match(component, /isReduceMotionEnabled\(\)/, 'respects Android reduce-motion setting');
assert.match(component, /reduceMotionChanged/, 'responds to accessibility changes');
assert.match(component, /loop=\{false\}/, 'one-shot only; never endless animation');
assert.match(component, /AppState\.addEventListener/, 'background pauses visual confirmation');
assert.match(component, /\{play && reduceMotion === false/, 'only play when triggered and motion allowed');
assert.match(component, /<Text style=\{styles\.staticTick\}>✓<\/Text>/, 'static fallback always available');

assert.match(moveController, /setCelebratingSessionId\(record\.endedEarly \? null : record\.id\)/,
  'only a full session can trigger celebration');
assert.match(moveController, /setActiveSession\(active\);\s*setCelebratingSessionId\(null\)/,
  'restored state cannot trigger a new celebration');
assert.match(moveFeedback, /play=\{!lastRecord\.endedEarly && celebratingSessionId === lastRecord\.id\}/,
  'feedback animation is bound to the completed session identity');
assert.match(moveFeedback, /onComplete=\{clearCompletionAnimation\}/, 'animation clears ephemeral trigger');

assert.match(week, /onPress=\{\(\) => \{ completeRitual\(\); setCelebratingWeek\(selectedMonday\); \}\}/,
  'animation only follows manual weekly ritual confirmation');
assert.match(week, /play=\{celebratingWeek === selectedMonday\}/, 'weekly motion tied to selected Monday');
assert.match(week, /useFocusEffect\(useCallback\(\(\) => \(\) => setCelebratingWeek\(null\), \[\]\)\)/,
  'returning to an already organized week does not replay');
assert.match(week, /onComplete=\{\(\) => setCelebratingWeek\(null\)\}/, 'animated week flag cleared');

console.log('Lottie completion asset, one-shot states, and accessibility structural tests passed.');
