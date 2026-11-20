'use strict';

const assert = require('node:assert/strict');
const { evaluateAudit, formatSummary } = require('../scripts/security-audit-report.cjs');

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
console.log('OWASP-aligned dependency audit report regression tests passed.');
