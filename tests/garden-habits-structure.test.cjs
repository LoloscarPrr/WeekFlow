const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const garden = fs.readFileSync(path.join(root, 'app/garden.tsx'), 'utf8');
const habits = fs.readFileSync(path.join(root, 'app/habits.tsx'), 'utf8');
const summary = fs.readFileSync(path.join(root, 'src/garden/summary.ts'), 'utf8');
const gardenPreferences = fs.readFileSync(path.join(root, 'src/garden/preferences.ts'), 'utf8');
const persistence = fs.readFileSync(path.join(root, 'src/habits/persistence.ts'), 'utf8');

assert.match(garden, /Tu jardín esta semana/);
assert.match(garden, /TUS PILARES/);
assert.match(garden, /Hábitos flexibles/);
assert.match(garden, /router\.push\('\/habits'\)/);
assert.match(garden, /buildGardenPillars/);
assert.doesNotMatch(garden, /score global|porcentaje de vida|fallaste|perdiste|atrasad|deuda|racha perdida|streak/i);

assert.match(garden, /styles\.pillarHeader/);
assert.match(garden, /styles\.pillarMetaRow/);
assert.match(garden, /flexWrap: 'wrap'/);
assert.match(garden, /noData && styles\.pillarCardCompact/);
assert.match(garden, /pillarCardCompact: \{ minHeight: 82/);
assert.match(garden, /flexShrink: 0/);

assert.match(garden, />Configurar</);
assert.match(garden, /PLAN SEMANAL/);
assert.match(garden, /Editar pilares/);
assert.match(garden, /saveGardenPillarPlan/);
assert.match(garden, /editorLocation === 'tools'/);
assert.match(garden, /Es una intención flexible, no una obligación/);
assert.match(summary, /'Planificado'/);
assert.match(gardenPreferences, /GARDEN_PREFERENCES_KEY = 'garden-pillar-preferences'/);
assert.match(gardenPreferences, /sqliteStateStore\.write/);
assert.match(gardenPreferences, /formatGardenDays/);

for (const pillar of [
  'Descanso',
  'Alimentación',
  'Movimiento',
  'Relaciones',
  'Bienestar',
  'Hogar',
  'Responsabilidades',
  'Tiempo personal',
]) {
  assert.match(summary, new RegExp(`'${pillar}'`));
}

assert.match(habits, /PILARES · HÁBITOS/);
assert.match(habits, /Mini-versión \(opcional\)/);
assert.match(habits, /placeholder="Ej\. leer 2 páginas"/);
assert.match(habits, /maxLength=\{120\}/);
assert.match(habits, /Versión mini/);
assert.match(habits, /Deshacer/);
assert.match(habits, /KeyboardAwareScrollView/);
assert.match(habits, /KeyboardAwareTextInput as TextInput/);
assert.match(habits, /keyboardShouldPersistTaps="handled"/);
assert.match(habits, /keyboardDismissMode="on-drag"/);
assert.match(habits, /nextHabitPlanDates\(new Date\(\), 7\)/);
assert.match(habits, /'Mover'/);
assert.match(habits, /'Cambiar día'/);
assert.match(habits, /PRÓXIMA OCASIÓN/);
assert.match(habits, /Es una referencia, no una obligación/);
assert.match(habits, /Dejar flexible/);
assert.match(habits, /Hecho/);
assert.doesNotMatch(habits, /fallaste|perdiste|atrasad|deuda|racha perdida|streak/i);
assert.match(persistence, /HABITS_STATE_KEY = 'habits-state'/);
assert.match(persistence, /sqliteStateStore\.write/);

console.log('✓ Jardín configura pilares inline, mueve la edición a Herramientas y conserva Hábitos');
