const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const weekScreen = fs.readFileSync(path.join(root, 'app/week.tsx'), 'utf8');
const eventCard = fs.readFileSync(path.join(root, 'src/components/ImportantEventCard.tsx'), 'utf8');
const foodScreen = fs.readFileSync(path.join(root, 'app/food.tsx'), 'utf8');

assert.match(weekScreen, /<KeyboardAvoidingView/);
assert.match(weekScreen, /behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/);
assert.match(weekScreen, /keyboardDismissMode="on-drag"/);
assert.doesNotMatch(weekScreen, /scrollToEnd/);
assert.doesNotMatch(weekScreen, /keepImportantEventVisible/);
assert.doesNotMatch(weekScreen, /onTitleFocus=/);
assert.doesNotMatch(eventCard, /onTitleFocus/);

assert.match(foodScreen, /<KeyboardAvoidingView/);
assert.match(foodScreen, /behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/);
assert.match(foodScreen, /keyboardDismissMode="on-drag"/);
assert.doesNotMatch(foodScreen, /scrollToEnd/);
assert.doesNotMatch(foodScreen, /keepInputVisible/);

console.log('Week/Food keyboard focus structure passed.');
