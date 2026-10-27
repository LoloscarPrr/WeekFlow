// Prevent release-only Metro failures caused by optional Expo Router peers.
// npm ci can pass even if expo-linking isn't declared in the lockfile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = require(path.join(root, 'package.json'));
const lockfile = require(path.join(root, 'package-lock.json'));
assert.equal(manifest.dependencies['expo-linking'], '~57.0.11', 'Keep the SDK-57 compatible linking dependency explicit');
assert.equal(lockfile.version, manifest.version, 'Lockfile root version must match app version');
assert.equal(lockfile.packages[''].version, manifest.version, 'Lockfile package version must match app version');
assert.equal(lockfile.packages[''].dependencies['expo-linking'], manifest.dependencies['expo-linking'], 'Manifest/lockfile linking dependency mismatch');
assert.ok(lockfile.packages['node_modules/expo-linking'], 'Expo Linking must be resolved in the lockfile');

const packagePath = path.join(root, 'node_modules', 'expo-linking', 'package.json');
assert.ok(fs.existsSync(packagePath), 'npm ci did not install expo-linking');
const linking = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
assert.equal(Number(linking.version.split('.')[0]), 57, 'Expo Linking major version must match SDK 57');
assert.ok(require.resolve('expo-linking'), 'Expo Router must resolve expo-linking from root');

console.log('Android Expo Router dependency guard passed:', linking.version);
