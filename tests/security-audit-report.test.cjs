'use strict';

const assert = require('node:assert/strict');
const { evaluateAudit, formatSummary, auditDecision } = require('../scripts/security-audit-report.cjs');

function report(levels = {}) {
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, ...levels };
  return JSON.stringify({
    auditReportVersion: 2,
    metadata: { vulnerabilities: { ...counts, total: Object.values(counts).reduce((sum, n) => sum + n, 0) } },
  });
}

const clear = evaluateAudit(report(), 0);
assert.equal(clear.total, 0, 'empty audit is readable, not a mobile security certification');
assert.equal(clear.highOrCritical, 0);
const flagged = evaluateAudit(report({ low: 2, high: 1, critical: 1 }), 1);
assert.equal(flagged.total, 4);
assert.equal(flagged.highOrCritical, 2);
assert.match(formatSummary(flagged), /have NOT been remediated/);
assert.match(formatSummary(flagged), /NOT an OWASP MASVS certification/);
assert.ok(!formatSummary(flagged).includes('some-secret'), 'summary only includes counts and public guidance');
assert.throws(() => evaluateAudit('not-json', 1), /valid JSON/);
assert.throws(() => evaluateAudit(JSON.stringify({ error: { code: 'ENOAUDIT' } }), 1), /returned an error/);
assert.throws(() => evaluateAudit('{}', 0), /metadata/);
assert.throws(() => evaluateAudit(report({ critical: -1 }), 1), /invalid count/);
assert.throws(() => evaluateAudit(report(), 1), /inconsistent status/);
assert.throws(() => evaluateAudit(report({ high: 1 }), 2), /execution failed/);
assert.throws(() => evaluateAudit(JSON.stringify({
  metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 5 } },
}), 1), /totals do not agree/);
// Inventory stays informational, but explicit release mode blocks high and critical findings.
assert.equal(auditDecision(flagged, false), 'inventory-only');
assert.equal(auditDecision(flagged, true), 'blocked');
assert.notEqual(auditDecision(clear, true), 'blocked');
assert.notEqual(auditDecision(evaluateAudit(report({ moderate: 1 }), 1), true), 'blocked');
assert.equal(auditDecision(evaluateAudit(report({ critical: 1 }), 1), true), 'blocked');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'weekflow-security-'));
try {
  const input = path.join(temp, 'audit.json');
  const summary = path.join(temp, 'summary.md');
  const reporter = path.resolve(__dirname, '../scripts/security-audit-report.cjs');
  function run(raw, code, ...flags) {
    fs.writeFileSync(input, raw);
    fs.writeFileSync(summary, '');
    const result = spawnSync(process.execPath, [reporter, input, summary, ...[code, ...flags].filter(v => v !== undefined)], { encoding: 'utf8' });
    assert.ifError(result.error);
    return { status: result.status, summary: fs.readFileSync(summary, 'utf8') };
  }
  let outcome = run(report({ high: 1 }), '1');
  assert.equal(outcome.status, 0);
  assert.match(outcome.summary, /Inventory only/);
  outcome = run(report({ high: 1 }), '1', '--enforce');
  assert.equal(outcome.status, 1);
  assert.match(outcome.summary, /BLOCKED/);
  outcome = run(report({ critical: 1 }), '1', '--enforce');
  assert.equal(outcome.status, 1);
  outcome = run(report({ moderate: 1 }), '1', '--enforce');
  assert.equal(outcome.status, 0);
  assert.match(outcome.summary, /not full release approval/);
  assert.equal(run(report(), '0', '--enforce').status, 0);
  assert.equal(run('invalid JSON', '1', '--enforce').status, 1);
  assert.equal(run(report(), '0', '--typo').status, 1);
  assert.equal(run(report(), undefined).status, 1);
  assert.equal(run(report(), '').status, 1);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log('OWASP-aligned dependency audit report regression tests passed.');
