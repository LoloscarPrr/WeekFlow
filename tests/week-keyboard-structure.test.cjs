const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const weekScreen = fs.readFileSync(path.join(root, 'app/week.tsx'), 'utf8');
const eventCard = fs.readFileSync(path.join(root, 'src/components/ImportantEventCard.tsx'), 'utf8');
const foodScreen = fs.readFileSync(path.join(root, 'app/food.tsx'), 'utf8');

assert.match(weekScreen, /<KeyboardAvoidingView/);
assert.match(weekScreen, /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/);
assert.match(weekScreen, /keyboardDismissMode="on-drag"/);
assert.doesNotMatch(weekScreen, /scrollToEnd/);
assert.doesNotMatch(weekScreen, /keepImportantEventVisible/);
assert.doesNotMatch(weekScreen, /onTitleFocus=/);
assert.doesNotMatch(eventCard, /onTitleFocus/);
assert.doesNotMatch(eventCard, /\.blur\(/);
assert.doesNotMatch(eventCard, /Keyboard\.dismiss/);

assert.match(foodScreen, /<KeyboardAvoidingView/);
assert.match(foodScreen, /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/);
assert.match(foodScreen, /keyboardDismissMode="on-drag"/);
assert.doesNotMatch(foodScreen, /scrollToEnd/);
assert.doesNotMatch(foodScreen, /keepInputVisible/);
assert.doesNotMatch(foodScreen, /\.blur\(/);
assert.doesNotMatch(foodScreen, /Keyboard\.dismiss/);
assert.doesNotMatch(weekScreen, /\.blur\(/);
assert.doesNotMatch(weekScreen, /Keyboard\.dismiss/);

console.log('Week/Food keyboard focus structure passed.');
