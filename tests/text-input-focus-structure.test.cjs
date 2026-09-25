const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

const candidates = [
  ...walk(path.join(root, 'app')),
  ...walk(path.join(root, 'src')),
].filter((file) => file.endsWith('.tsx'));

const textInputFiles = candidates.filter((file) => {
  const source = fs.readFileSync(file, 'utf8');
  return source.includes('<TextInput');
});

assert.ok(textInputFiles.length > 0, 'Debe existir al menos un TextInput en la app.');

for (const file of textInputFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);

  assert.doesNotMatch(
    source,
    /scrollToEnd\s*\(/,
    relative + ' no debe forzar scrollToEnd en una vista que contiene TextInput.',
  );

  assert.doesNotMatch(
    source,
    /onFocus=\{[^}]*scroll/i,
    relative + ' no debe conectar el focus de un TextInput a un helper de scroll.',
  );
}

console.log('Global TextInput focus/scroll structure passed for ' + textInputFiles.length + ' files.');
