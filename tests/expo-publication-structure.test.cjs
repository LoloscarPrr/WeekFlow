const assert = require('node:assert/strict');
const fs = require('node:fs');
const { normalizeAndroidPublications } = require('../scripts/normalize-expo-publications.cjs');

const direct = { android: { publication: { groupId: 'host.exp.exponent', artifactId: 'expo.modules.sample', repository: 'local-maven-repo' } } };
assert.equal(normalizeAndroidPublications(direct, '57.0.8'), 1);
assert.equal(direct.android.publication.version, '57.0.8');

const projects = { android: { projects: [
  { publication: { groupId: 'foo', artifactId: 'bar', version: '' } },
  { publication: { groupId: 'baz', artifactId: 'qux', version: '3.2.1' } },
] } };
assert.equal(normalizeAndroidPublications(projects, '1.1.0'), 1);
assert.equal(projects.android.projects[0].publication.version, '1.1.0');
assert.equal(projects.android.projects[1].publication.version, '3.2.1');

const unaffected = { android: { modules: ['ExampleModule'] } };
assert.equal(normalizeAndroidPublications(unaffected, '1.2.3'), 0);
assert.throws(() => normalizeAndroidPublications({ android: { publication: { artifactId: 'unknown' } } }, ''), /no usable package version/);

const workflow = fs.readFileSync('.github/workflows/build-weekflow-native.yml', 'utf8');
assert.match(workflow, /run: node scripts\/normalize-expo-publications\.cjs/);
assert.doesNotMatch(workflow, /config\.android\?\.projects \?\? \[\]/, 'old partial normalizer must not return');
assert.doesNotMatch(workflow, /require\.resolve\('expo-modules-autolinking\/build\/index\.js'\)/, 'do not execute library module instead of CLI');

console.log('Expo publication normalizer regression tests passed.');
