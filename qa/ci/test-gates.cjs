// Local contract checks for the CI case-count gate. No store or credentials required.
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const catalog = require('../automation/test-data/cart-case-catalog.json');
const directory = mkdtempSync(join(tmpdir(), 'n04-gates-'));
function run(group, rows, junit = `<testsuites tests="${rows.length}" failures="0" skipped="0" errors="0">${rows.map(() => '<testcase/>').join('')}</testsuites>`) {
  writeFileSync(join(directory, group === 'PW' ? 'pairwise-summary.json' : 'adv-cart-summary.json'),
    JSON.stringify(rows));
  writeFileSync(join(directory, 'junit.xml'), junit);
  writeFileSync(join(directory, 'results.json'), JSON.stringify({ suites: [],
    stats: { expected: rows.length, skipped: 0, unexpected: 0, flaky: 0 } }));
  return spawnSync(process.execPath, [resolve(__dirname, 'verify-results.cjs'), group, directory],
    { encoding: 'utf8' });
}
try {
  for (const group of ['PW', 'ADV']) {
    const rows = catalog.filter(row => row.group === group)
      .map(row => ({ caseId: row.caseId, status: 'passed', classification: 'PASSED' }));
    assert.equal(run(group, rows).status, 0, `${group} complete suite must pass`);
    assert.notEqual(run(group, rows.slice(1)).status, 0, `${group} missing case must fail`);
    assert.notEqual(run(group, [{ ...rows[0], status: 'skipped' }, ...rows.slice(1)]).status, 0,
      `${group} skipped case must fail`);
    assert.notEqual(run(group, [{ ...rows[0], status: 'failed', classification: 'FAILED_PRODUCT' }, ...rows.slice(1)]).status, 0,
      `${group} failed assertion must fail`);
    assert.notEqual(run(group, rows, '').status, 0, `${group} missing JUnit must fail`);
  }
  process.stdout.write('N04_GATE_CONTRACT|PASS|complete pass, missing/skip/failure/report fail for PW and ADV\n');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
