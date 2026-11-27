// Fails CI when Playwright exits 0 after skipping or silently omitting a case.
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { resolve, join } = require('node:path');

const [group, reportDir] = process.argv.slice(2);
if (!['PW', 'ADV'].includes(group) || !reportDir) {
  throw new Error('Usage: node qa/ci/verify-results.cjs PW|ADV <report-directory>');
}
const root = resolve(__dirname, '../automation');
const catalog = JSON.parse(readFileSync(join(root, 'test-data/cart-case-catalog.json'), 'utf8'));
const expected = catalog.filter(row => row.group === group).map(row => row.caseId).sort();
const summaryPath = resolve(reportDir, group === 'PW' ? 'pairwise-summary.json' : 'adv-cart-summary.json');
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const actual = summary.map(row => row.caseId).sort();
const junit = readFileSync(resolve(reportDir, 'junit.xml'), 'utf8');
const results = JSON.parse(readFileSync(resolve(reportDir, 'results.json'), 'utf8'));
const errors = [];
if (expected.length !== (group === 'PW' ? 14 : 11)) errors.push(`catalog has ${expected.length} ${group} cases`);
if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`expected IDs ${expected.join(',')}; got ${actual.join(',')}`);
if (summary.some(row => row.status !== 'passed' || row.classification !== 'PASSED')) {
  errors.push('one or more cases failed, skipped, blocked, or have an unknown classification');
}
const junitHeader = junit.match(/<testsuites\b[^>]*\btests="(\d+)"[^>]*\bfailures="(\d+)"[^>]*\bskipped="(\d+)"[^>]*\berrors="(\d+)"/);
const junitCases = (junit.match(/<testcase\b/g) || []).length;
if (!junitHeader || Number(junitHeader[1]) !== expected.length || Number(junitHeader[2]) !== 0
    || Number(junitHeader[3]) !== 0 || Number(junitHeader[4]) !== 0
    || junitCases !== expected.length || !Array.isArray(results.suites)
    || results.stats?.expected !== expected.length || results.stats?.skipped !== 0
    || results.stats?.unexpected !== 0 || results.stats?.flaky !== 0) {
  errors.push('JUnit or Playwright JSON count/status is incomplete');
}
if (group === 'PW' && !['PW-002', 'PW-006', 'PW-007', 'PW-009'].every(id => actual.includes(id))) {
  errors.push('required Checkout cases are missing');
}
const receipt = {
  group, sourceSha: process.env.GITHUB_SHA || 'LOCAL', expected: expected.length,
  passed: summary.filter(row => row.status === 'passed' && row.classification === 'PASSED').length,
  skipped: summary.filter(row => row.status === 'skipped').length,
  missing: expected.filter(id => !actual.includes(id)), errors,
};
mkdirSync(resolve(reportDir), { recursive: true });
writeFileSync(resolve(reportDir, 'n04-gate.json'), JSON.stringify(receipt, null, 2) + '\n');
process.stdout.write(`${group} gate: ${receipt.passed}/${receipt.expected}; ${receipt.skipped} skipped; ${errors.length} errors\n`);
if (errors.length) {
  for (const error of errors) process.stderr.write(`${error}\n`);
  process.exitCode = 1;
}
