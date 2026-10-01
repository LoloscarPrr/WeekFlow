const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const garden = fs.readFileSync(path.join(root, 'app/garden.tsx'), 'utf8');
const persistence = fs.readFileSync(path.join(root, 'src/habits/persistence.ts'), 'utf8');

assert.match(garden, /HÁBITOS FLEXIBLES/);
assert.match(garden, /Mini-versión \(opcional\)/);
assert.match(garden, /placeholder="Ej\. leer 2 páginas"/);
assert.doesNotMatch(garden, /placeholder="Mini-versión opcional · Ej\. leer 2 páginas"/);
assert.match(garden, /maxLength=\{120\}/);
assert.match(garden, /Frecuencia flexible/);
assert.match(garden, /Versión mini/);
assert.match(garden, /Deshacer/);
assert.match(garden, /KeyboardAwareScrollView/);
assert.match(garden, /KeyboardAwareTextInput as TextInput/);
assert.match(garden, /keyboardShouldPersistTaps="handled"/);
assert.match(garden, /keyboardDismissMode="on-drag"/);
assert.match(garden, /Equilibrio sin puntajes/);
assert.doesNotMatch(garden, /racha|streak|fallaste|perdiste/i);
assert.match(garden, /title: 'Descanso'/);
assert.match(garden, /title: 'Alimentación'/);
assert.match(garden, /title: 'Tu semana'/);
assert.match(persistence, /HABITS_STATE_KEY = 'habits-state'/);
assert.match(persistence, /sqliteStateStore\.write/);

console.log('✓ Jardín integra hábitos flexibles con mini-versión legible, teclado seguro y shortcuts intactos');
