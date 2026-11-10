const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const player = fs.readFileSync(path.join(__dirname, '../src/move/MovePlayer.tsx'), 'utf8');
const preview = fs.readFileSync(path.join(__dirname, '../src/move/nextStepPreview.ts'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../src/move/styles.ts'), 'utf8');

assert.match(player, /getMoveNextStepPreview\(routine\.steps, currentStepIndex, preferences, runtime\.exerciseOverrides\)/,
  'rest preview reads the current runtime swap map');
assert.match(player, /const upcoming = resting\s*\? getMoveNextStepPreview/,
  'preparation guidance only renders while resting');
assert.match(player, /\{upcoming\.title\}/, 'next exercise title visible');
assert.match(player, /\{upcoming\.detail\}/, 'next workout prescription visible');
assert.match(player, /\{upcoming\.instruction\}/, 'technique cue visible');
assert.match(player, /\{upcoming\.equipment\}/, 'registered equipment visible');
assert.match(player, /upcoming\.circuit\.map/, 'next circuit items visible');
assert.match(player, /resting \? advanceToNextExercise : completeCurrentExercise/,
  'rest skip and workout completion remain wired as before');
assert.match(player, /onPress=\{togglePause\}/, 'pause action unchanged');
assert.match(player, /onPress=\{switchExercise\}/, 'exercise swap action unchanged');
assert.doesNotMatch(player, /Math\.min\(currentStepIndex \+ 1, routine\.steps\.length - 1\)/,
  'must not invent a next step on the final exercise');

assert.match(preview, /const nextIndex = currentStepIndex \+ 1/, 'the actual next index is previewed');
assert.match(preview, /if \(!next\) return null/, 'missing next step is handled');
assert.match(preview, /exerciseById\(exerciseOverrides\[String\(nextIndex\)\], next\.exercise\)/,
  'next saved exercise replacement is respected');
assert.match(preview, /moveExerciseEquipmentLabel\(exercise, preferences\)/,
  'equipment label is derived from actual user profile');
assert.doesNotMatch(preview, /steps\.(push|splice|pop|shift|sort)\(/,
  'preview never reorders or mutates session steps');

for (const key of ['nextPreviewCard', 'nextPreviewLabel', 'nextPreviewTitle',
  'nextPreviewMeta', 'nextPreviewCue', 'nextPreviewCircuitRow']) {
  assert.ok(styles.includes(key + ':'), key + ' style exists');
}
assert.match(player, /<ScrollView/, 'session remains scrollable for small phones');
console.log('Move next-step rest preview integration checks passed.');
