'use strict';

const fs = require('node:fs');
const { evaluateAudit } = require('./security-audit-report.cjs');

function parseTriage(raw, exitCode) {
  const totals = evaluateAudit(raw, exitCode);
  const document = JSON.parse(raw);
  if (!document.vulnerabilities || typeof document.vulnerabilities !== 'object' ||
    Array.isArray(document.vulnerabilities)) {
    throw new Error('npm audit report has no vulnerability detail map');
  }
  const findings = Object.entries(document.vulnerabilities).map(([name, value]) => {
    if (!value || typeof value !== 'object' || !name || !value.severity ||
      !['info','low','moderate','high','critical'].includes(value.severity)) {
      throw new Error('Invalid npm audit vulnerability detail');
    }
    const advisoryIds = (Array.isArray(value.via) ? value.via : []).filter(v =>
      v && typeof v === 'object').map(v => v.url || v.name || v.title)
      .filter(v => typeof v === 'string');
    let remedy = 'unknown';
    if (value.fixAvailable === false) remedy = 'none-advertised';
    else if (value.fixAvailable === true) remedy = 'within-current-ranges';
    else if (value.fixAvailable && typeof value.fixAvailable === 'object') {
      remedy = String(value.fixAvailable.name || name) + '@' + String(value.fixAvailable.version || '?') +
        (value.fixAvailable.isSemVerMajor ? ' (semver-major)' : '');
    }
    return {
      name,
      severity: value.severity,
      range: typeof value.range === 'string' ? value.range : 'unknown',
      direct: Boolean(value.isDirect),
      remedy,
      advisoryIds: advisoryIds.slice(0, 4),
      viaPackages: Array.isArray(value.via) ?
        value.via.filter(v => typeof v === 'string').slice(0, 8) : [],
    };
  }).sort((a, b) => ({ critical: 0, high: 1, moderate: 2, low: 3, info: 4 })[a.severity] -
    ({ critical: 0, high: 1, moderate: 2, low: 3, info: 4 })[b.severity] || a.name.localeCompare(b.name));
  if (findings.length !== totals.total) {
    throw new Error('Count differs between vulnerability detail and metadata');
  }
  return { totals, findings };
}

function formatTriage(result, label) {
  const lines = [
    '## WeekFlow audit triage — ' + label,
    '',
    '**' + result.totals.total + '** vulnerable dependency package entries; **' +
      result.totals.highOrCritical + '** high/critical. No exploitability assertion for Android.',
    '',
    '| Package | Severity | Direct | Reported vulnerable range | npm fix availability |',
    '| --- | --- | --- | --- | --- |',
    ...result.findings.map(f => '| `' + f.name.replace(/\|/g, '') +
      '` | ' + f.severity + ' | ' + (f.direct ? 'yes' : 'transitive') +
      ' | `' + f.range.replace(/\|/g, '') + '` | ' + f.remedy.replace(/\|/g, '') + ' |'),
    '',
    'This is an npm advisory inventory, NOT an OWASP MASVS certification or an Android reachability assessment.',
    '',
  ];
  return lines.join('\n');
}

if (require.main === module) {
  const [source, label, exit] = process.argv.slice(2);
  try {
    const result = parseTriage(fs.readFileSync(source, 'utf8'), Number(exit));
    const content = formatTriage(result, label || 'inventory');
    console.log(content);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, content + '\n');
    const output = source.replace(/\.json$/, '-triage.json');
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Triage scan invalid: ' + (e instanceof Error ? e.message : String(e)));
    process.exitCode = 1;
  }
}

module.exports = { parseTriage, formatTriage };
