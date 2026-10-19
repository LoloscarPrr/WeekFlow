#!/usr/bin/env node
// Repair malformed third-party Expo publication metadata before Android prebuild.
// The source of truth for a missing publication.version is the installed package's
// package.json; this does not alter any committed application metadata.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function normalizeAndroidPublications(config, packageVersion) {
  if (!config || typeof config !== 'object') return 0;
  const android = config.android;
  if (!android || typeof android !== 'object') return 0;
  let changes = 0;
  const targets = [android, ...(Array.isArray(android.projects) ? android.projects : [])];
  for (const target of targets) {
    if (!target || typeof target !== 'object') continue;
    const publication = target.publication;
    if (!publication || typeof publication !== 'object') continue;
    if (typeof publication.version === 'string' && publication.version.trim()) continue;
    if (typeof packageVersion !== 'string' || !packageVersion.trim()) {
      throw new Error('Expo module declares a publication without version and has no usable package version');
    }
    publication.version = packageVersion.trim();
    changes += 1;
  }
  return changes;
}

function expoCliPath() {
  const pkgPath = require.resolve('expo-modules-autolinking/package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const executable = typeof pkg.bin === 'string'
    ? pkg.bin : pkg.bin?.['expo-modules-autolinking'] ?? Object.values(pkg.bin ?? {})[0];
  if (typeof executable !== 'string') throw new Error('Expo Autolinking executable not declared in package.json');
  return path.resolve(path.dirname(pkgPath), executable);
}

function cliJson(cli, command) {
  const output = execFileSync(process.execPath, [cli, command, '--platform', 'android'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (!output.trim()) throw new Error('Expo autolinking ' + command + ' returned empty JSON');
  try { return JSON.parse(output); }
  catch (error) { throw new Error('Invalid Expo autolinking ' + command + ' JSON: ' + error.message); }
}

function main() {
  const cli = expoCliPath();
  const discovered = cliJson(cli, 'search');
  let count = 0;
  let touched = 0;
  for (const [name, entry] of Object.entries(discovered)) {
    if (!entry || typeof entry.path !== 'string') continue;
    const configPath = path.join(entry.path, 'expo-module.config.json');
    if (!fs.existsSync(configPath)) continue;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const pkgPath = path.join(entry.path, 'package.json');
    const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : null;
    const version = pkg?.version ?? entry.version;
    const changes = normalizeAndroidPublications(config, version);
    if (!changes) continue;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    count += changes;
    touched += 1;
    console.log('Fixed Expo Android publication version:', name, '=>', version, '(' + changes + ' field(s))');
  }
  console.log('Expo publication metadata: corrected', count, 'field(s) in', touched, 'module(s)');

  const resolved = cliJson(cli, 'resolve');
  if (!Array.isArray(resolved.modules)) {
    throw new Error('Unexpected Expo Android autolinking resolve structure: missing modules array');
  }
  const malformed = [];
  resolved.modules.forEach((mod, i) => {
    (mod.projects ?? []).forEach((project, j) => {
      const pub = project.publication;
      if (pub && (typeof pub.version !== 'string' || !pub.version.trim())) {
        malformed.push((mod.packageName ?? mod.name ?? 'module[' + i + ']')
          + '/projects[' + j + '].publication.version');
      }
    });
  });
  if (malformed.length) {
    throw new Error('Invalid Expo Android publication metadata after normalization: ' + malformed.join(', '));
  }
  console.log('Expo Android autolinking verified:', resolved.modules.length, 'module(s)');
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error('Expo publication metadata check failed:', error.message);
    process.exitCode = 1;
  }
}

module.exports = { normalizeAndroidPublications };
