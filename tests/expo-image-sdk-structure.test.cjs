const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { findInstalledExpoImages, checkExpoImageCompatibility } = require('../scripts/check-expo-image-sdk.cjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'weekflow-expo-sdk-'));
try {
  const modules = path.join(root, 'node_modules');
  const direct = path.join(modules, 'expo-image');
  const nested = path.join(modules, '@infinitered', 'react-native-mlkit-text-recognition', 'node_modules', 'expo-image');
  for (const [dir, version] of [[direct, '57.0.5'], [nested, '58.0.15']]) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({name:'expo-image', version}));
  }
  const installed = findInstalledExpoImages(modules);
  assert.equal(installed.length, 2, 'discover root and nested installations');
  assert.throws(() => checkExpoImageCompatibility('57.0.8', installed), /58\.0\.15/, 'SDK 58 image is rejected for SDK 57');
  assert.throws(() => checkExpoImageCompatibility('57.0.8', installed), /react-native-mlkit-text-recognition/, 'error names nested owner');
  fs.writeFileSync(path.join(nested, 'package.json'), JSON.stringify({name:'expo-image', version:'57.0.5'}));
  assert.equal(checkExpoImageCompatibility('57.0.8', findInstalledExpoImages(modules)), 2, 'nested versions aligned');
  assert.throws(() => checkExpoImageCompatibility('unknown', []), /Cannot identify Expo SDK/, 'invalid Expo version fails');
} finally {
  fs.rmSync(root, { recursive:true, force:true });
}

const manifest = require('../package.json');
assert.equal(manifest.dependencies.expo, '~57.0.8');
assert.equal(manifest.overrides['expo-image'], '57.0.5', 'indirect image pinned to Expo SDK 57');
for (const file of ['.github/workflows/typecheck.yml', '.github/workflows/build-weekflow-native.yml']) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, /node scripts\/check-expo-image-sdk\.cjs/, file + ' must run preflight');
}
console.log('Expo image nested SDK compatibility regression tests passed.');
