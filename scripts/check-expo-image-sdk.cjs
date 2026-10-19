#!/usr/bin/env node
// Fail before Gradle if a nested package brings Expo Image from another SDK.
const fs = require('node:fs');
const path = require('node:path');

function findInstalledExpoImages(nodeModulesPath) {
  const found = [];
  const visited = new Set();
  function scanPackages(dir) {
    if (!fs.existsSync(dir)) return;
    const resolved = path.resolve(dir);
    if (visited.has(resolved)) return;
    visited.add(resolved);

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const entryPath = path.join(dir, entry.name);
      if (entry.name.startsWith('@')) {
        scanPackages(entryPath);
        continue;
      }
      const pkgPath = path.join(entryPath, 'package.json');
      if (entry.name === 'expo-image' && fs.existsSync(pkgPath)) {
        const installed = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        found.push({ path: entryPath, version: String(installed.version ?? '') });
      }
      scanPackages(path.join(entryPath, 'node_modules'));
    }
  }
  scanPackages(nodeModulesPath);
  return found;
}

function checkExpoImageCompatibility(expoVersion, images) {
  const expectedMajor = Number(String(expoVersion).split('.')[0]);
  if (!Number.isInteger(expectedMajor) || expectedMajor < 1) {
    throw new Error('Cannot identify Expo SDK major from version: ' + expoVersion);
  }
  const wrong = images.filter((item) => Number(String(item.version).split('.')[0]) !== expectedMajor);
  if (wrong.length) {
    throw new Error('Expo SDK ' + expoVersion + ' cannot build with incompatible expo-image versions:\n' +
      wrong.map((item) => '  ' + item.path + ': ' + item.version + ' (expected major ' + expectedMajor + ')').join('\n'));
  }
  return images.length;
}

function main() {
  const expoPath = path.join(process.cwd(), 'node_modules', 'expo', 'package.json');
  if (!fs.existsSync(expoPath)) throw new Error('expo package is not installed; run npm install first');
  const expoVersion = JSON.parse(fs.readFileSync(expoPath, 'utf8')).version;
  const packages = findInstalledExpoImages(path.join(process.cwd(), 'node_modules'));
  const count = checkExpoImageCompatibility(expoVersion, packages);
  console.log('Expo SDK ' + expoVersion + ': ' + count + ' compatible expo-image installation(s)');
  packages.forEach((item) => console.log('  ' + item.path + ': ' + item.version));
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { findInstalledExpoImages, checkExpoImageCompatibility };
