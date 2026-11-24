'use strict';
const assert = require('node:assert/strict');
const { parseTriage, formatTriage } = require('../scripts/security-triage.cjs');
const sample = (entries, metadata) => JSON.stringify({
  auditReportVersion: 2,
  metadata: { vulnerabilities: metadata },
  vulnerabilities: entries,
});
const none = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
assert.equal(parseTriage(sample({}, none), 0).totals.total, 0);
const details = {
  expo: { severity: 'high', range: '<1', isDirect: true, fixAvailable:
    { name: 'expo', version: '2', isSemVerMajor: true },
    via: [{ title: 'example advisory', url: 'https://github.com/advisories/example' }] },
  dep: { severity: 'moderate', range: '1.0.0', isDirect: false,
    fixAvailable: false, via: ['expo'] },
};
const result = parseTriage(sample(details, { ...none, moderate: 1, high: 1, total: 2 }), 1);
assert.equal(result.findings.length, 2);
assert.equal(result.findings[0].name, 'expo');
assert.match(result.findings[0].remedy, /semver-major/);
assert.equal(result.findings[1].viaPackages[0], 'expo');
assert.match(formatTriage(result, 'before'), /No exploitability assertion/);
assert.throws(() => parseTriage(sample(details, none), 0), /Count differs/);
assert.throws(() => parseTriage('{}', 0), /metadata/);
assert.throws(() => parseTriage('not json', 1), /valid JSON/);
console.log('Security triage parser tests passed.');
