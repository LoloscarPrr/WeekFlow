'use strict';

const fs = require('node:fs');

const LEVELS = ['info', 'low', 'moderate', 'high', 'critical'];

function evaluateAudit(raw, exitCode = 0) {
  let report;
  try {
    report = JSON.parse(raw);
  } catch {
    throw new Error('npm audit did not produce valid JSON');
  }
  if (!report || typeof report !== 'object' || report.error) {
    throw new Error('npm audit returned an error instead of dependency findings');
  }
  const values = report.metadata?.vulnerabilities;
  if (!values || typeof values !== 'object') {
    throw new Error('npm audit report has no vulnerability metadata');
  }
  const counts = {};
  for (const severity of LEVELS) {
    const count = values[severity];
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('npm audit has an invalid count for ' + severity);
    }
    counts[severity] = count;
  }
  const total = LEVELS.reduce((sum, severity) => sum + counts[severity], 0);
  if (values.total !== undefined && values.total !== total) {
    throw new Error('npm audit severity totals do not agree');
  }
  if (!Number.isInteger(exitCode) || exitCode < 0 || exitCode > 1 ||
      (exitCode === 1 && total === 0)) {
    throw new Error('npm audit execution failed or returned an inconsistent status');
  }
  return { counts, total, highOrCritical: counts.high + counts.critical };
}

function auditDecision(result, enforce = false) {
  return enforce && result.highOrCritical > 0 ? 'blocked' : 'inventory-only';
}

function formatSummary(result) {
  const c = result.counts;
  const status = result.total === 0
    ? 'No vulnerabilities reported by npm audit at this snapshot.'
    : 'Findings require review; they have NOT been remediated by this scan.';
  return [
    '## WeekFlow — OWASP-aligned dependency inventory',
    '',
    '> Informational baseline. This is NOT an OWASP MASVS certification, a mobile penetration test, or proof of a secure APK.',
    '',
    '| Severity | Production dependency findings |',
    '| --- | ---: |',
    ...['critical', 'high', 'moderate', 'low', 'info'].map(s => '| ' + s + ' | ' + c[s] + ' |'),
    '| **Total** | **' + result.total + '** |',
    '',
    status,
    'Source: \u0060npm audit --omit=dev --json\u0060. No secrets or user telemetry uploaded by this workflow.',
    '',
  ].join('\n');
}

if (require.main === module) {
  const [reportPath, summaryPath, code, ...flags] = process.argv.slice(2);
  try {
    if (!reportPath || !summaryPath || code === undefined || !/^\d+$/.test(code)) {
      throw new Error('Missing or invalid report, summary or exit status');
    }
    if (flags.length > 1 || (flags.length === 1 && flags[0] !== '--enforce')) {
      throw new Error('Unknown security audit option');
    }
    const enforce = flags.includes('--enforce');
    const parsed = evaluateAudit(fs.readFileSync(reportPath, 'utf8'), Number(code));
    const decision = auditDecision(parsed, enforce);
    const summary = formatSummary(parsed) + '\nRelease dependency policy: ' +
      (enforce ? (decision === 'blocked' ? 'BLOCKED: high/critical findings remain.' :
        'PASS: no high/critical npm findings reported; not full release approval.') :
        'Inventory only (not a release approval).') + '\n';
    fs.appendFileSync(summaryPath, summary + '\n');
    process.stdout.write('Security audit completed: ' + parsed.total + ' reported findings.\n');
    if (parsed.highOrCritical > 0) {
      process.stdout.write('::warning title=OWASP dependency review::' +
        parsed.highOrCritical + ' high/critical production dependency findings need triage.\n');
    }
    if (decision === 'blocked') {
      console.error('Release dependency gate blocked: high/critical findings require remediation.');
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown audit error';
    if (summaryPath) fs.appendFileSync(summaryPath,
      '## WeekFlow security audit\n\nAudit unavailable or invalid: ' + message + '\n');
    console.error('Security audit could not be verified: ' + message);
    process.exitCode = 1;
  }
}

module.exports = { evaluateAudit, formatSummary, auditDecision };
