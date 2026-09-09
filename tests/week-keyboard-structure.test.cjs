const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const weekScreen = fs.readFileSync(path.join(root, 'app/week.tsx'), 'utf8');
const eventCard = fs.readFileSync(path.join(root, 'src/components/ImportantEventCard.tsx'), 'utf8');

assert.match(weekScreen, /<KeyboardAvoidingView/);
assert.match(weekScreen, /behavior=\{Platform\.OS === 'ios' \? 'padding' : 'height'\}/);
assert.match(weekScreen, /ref=\{scrollRef\}/);
assert.match(weekScreen, /keyboardDismissMode="on-drag"/);
assert.match(weekScreen, /scrollRef\.current\?\.scrollToEnd\(\{ animated: true \}\)/);
assert.match(weekScreen, /onTitleFocus=\{keepImportantEventVisible\}/);
assert.match(eventCard, /onFocus=\{onTitleFocus\}/);

console.log('Week keyboard visibility structure passed.');
