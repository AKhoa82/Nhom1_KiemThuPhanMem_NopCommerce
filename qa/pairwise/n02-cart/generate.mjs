import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const modelPath = join(directory, 'model.pict');
const pictPath = resolve(directory, '..', 'tools', 'pict.exe');
const seed = 10387;
const factors = {
  Action: ['LoginMerge', 'RepeatAdd'],
  VariantRelation: ['Same', 'Different'],
  QuantityRelation: ['BelowStock', 'AtStock', 'AboveStock', 'PerVariant'],
  CustomerContext: ['GuestToRegistered', 'SameSession'],
};
const columns = Object.keys(factors);

function feasible(row) {
  return (row.Action === 'LoginMerge' ? row.CustomerContext === 'GuestToRegistered' : row.CustomerContext === 'SameSession')
    && (row.VariantRelation === 'Different' ? row.QuantityRelation === 'PerVariant' : row.QuantityRelation !== 'PerVariant');
}

function pairKey(row, left, right) {
  return JSON.stringify([left, row[left], right, row[right]]);
}

function pairs(rows) {
  const result = new Set();
  for (const row of rows) {
    for (let i = 0; i < columns.length; i += 1) {
      for (let j = i + 1; j < columns.length; j += 1) result.add(pairKey(row, columns[i], columns[j]));
    }
  }
  return result;
}

function exhaustiveRows(index = 0, row = {}) {
  if (index === columns.length) return feasible(row) ? [{ ...row }] : [];
  const factor = columns[index];
  return factors[factor].flatMap(value => exhaustiveRows(index + 1, { ...row, [factor]: value }));
}

function fixture(row) {
  const { Action: action, VariantRelation: variant, QuantityRelation: quantity } = row;
  if (variant === 'Different') {
    return action === 'LoginMerge'
      ? { name: 'RedS_account1_BlueM_guest1', q1: 1, q2: 1, blueM: 0, ui: 'MERGE-VARIANT' }
      : { name: 'RedS_add2_then3_BlueM_add1', q1: 2, q2: 3, blueM: 1, ui: 'REPEAT-DIFFERENT' };
  }
  if (action === 'LoginMerge') {
    if (quantity === 'BelowStock') return { name: 'RedS_account2_guest2_stock5', q1: 2, q2: 2, blueM: 0, ui: 'MERGE-VALID' };
    if (quantity === 'AtStock') return { name: 'RedS_account2_guest3_stock5', q1: 2, q2: 3, blueM: 0, ui: 'MERGE-EXACT' };
    return { name: 'RedS_account4_guest2_stock5', q1: 4, q2: 2, blueM: 0, ui: 'MERGE-OVER' };
  }
  if (quantity === 'BelowStock') return { name: 'RedS_add1_then2_stock5', q1: 1, q2: 2, blueM: 0, ui: 'REPEAT-BELOW' };
  if (quantity === 'AtStock') return { name: 'RedS_add2_then3_stock5', q1: 2, q2: 3, blueM: 0, ui: 'REPEAT-SAME' };
  return { name: 'RedS_add4_then2_stock5', q1: 4, q2: 2, blueM: 0, ui: 'REPEAT-OVER' };
}

function validateFixture(row, data) {
  const redStock = 5;
  const blueStock = 3;
  if (data.q1 < 1 || data.q2 < 1 || data.q1 > redStock || data.q2 > redStock) {
    throw new Error(`N02 source quantity is invalid: ${data.name}`);
  }
  if (row.VariantRelation === 'Different') {
    if (row.Action === 'LoginMerge' && (data.q1 > redStock || data.q2 > blueStock)) {
      throw new Error(`N02 variant stock is invalid: ${data.name}`);
    }
    if (row.Action === 'RepeatAdd' && (data.q1 + data.q2 > redStock || data.blueM > blueStock)) {
      throw new Error(`N02 repeat variant stock is invalid: ${data.name}`);
    }
    return;
  }
  const sum = data.q1 + data.q2;
  const matches = row.QuantityRelation === 'BelowStock' ? sum < redStock
    : row.QuantityRelation === 'AtStock' ? sum === redStock : sum > redStock;
  if (!matches) throw new Error(`N02 quantity relation does not match numeric fixture: ${data.name}`);
}

function csv(value) {
  const string = String(value);
  return /[",\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

const model = readFileSync(modelPath);
const modelLines = model.toString('utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
const expectedDefinitions = columns.map(name => `${name}: ${factors[name].join(', ')}`);
const expectedConstraints = [
  'IF [Action] = "LoginMerge" THEN [CustomerContext] = "GuestToRegistered";',
  'IF [Action] = "RepeatAdd" THEN [CustomerContext] = "SameSession";',
  'IF [VariantRelation] = "Different" THEN [QuantityRelation] = "PerVariant";',
  'IF [VariantRelation] = "Same" THEN [QuantityRelation] <> "PerVariant";',
];
if (JSON.stringify(modelLines) !== JSON.stringify([...expectedDefinitions, ...expectedConstraints])) {
  throw new Error('N02 model definitions or constraints changed; update the validator before reporting coverage.');
}
// PICT 3.7.4 cannot open a model through this workspace's non-ASCII Windows path.
const pictInputPath = join(tmpdir(), `n02-cart-${process.pid}.pict`);
let run;
try {
  writeFileSync(pictInputPath, model);
  run = spawnSync(pictPath, [pictInputPath, '/o:2', `/r:${seed}`], { encoding: 'utf8', windowsHide: true });
} finally {
  unlinkSync(pictInputPath);
}
if (run.error || run.status !== 0) throw new Error(`PICT generation failed: ${run.error ?? run.stderr}`);
const lines = run.stdout.trim().split(/\r?\n/).filter(Boolean);
const header = lines.shift()?.split('\t');
if (JSON.stringify(header) !== JSON.stringify(columns)) throw new Error(`Unexpected PICT columns: ${header}`);
const generated = lines.map((line, index) => {
  const values = line.split('\t');
  if (values.length !== columns.length) throw new Error(`Invalid PICT row ${index + 1}: ${line}`);
  const row = Object.fromEntries(columns.map((name, i) => [name, values[i]]));
  for (const name of columns) if (!factors[name].includes(row[name])) throw new Error(`Out-of-domain ${name} in row ${index + 1}`);
  if (!feasible(row)) throw new Error(`Constraint violation in row ${index + 1}: ${line}`);
  return row;
});
if (generated.length === 0) throw new Error('PICT produced no N02 rows.');

const feasibleSet = pairs(exhaustiveRows());
const generatedSet = pairs(generated);
const missing = [...feasibleSet].filter(pair => !generatedSet.has(pair));
if (missing.length) throw new Error(`PICT missed ${missing.length} feasible pairs: ${missing.join(', ')}`);

const executionPath = join(directory, 'execution.json');
const execution = (() => {
  try { return JSON.parse(readFileSync(executionPath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
})();
if (execution) {
  if (!/^AUTO-\d+$/.test(execution.runId) || !/^[a-f0-9]{40}$/.test(execution.sourceCommit)) {
    throw new Error('Invalid N02 execution metadata.');
  }
  for (const [name, status] of Object.entries(execution.cases)) {
    if (!['passed', 'failed', 'skipped'].includes(status)) throw new Error(`Invalid N02 result for ${name}`);
  }
}

const csvHeader = ['CaseId', ...columns, 'ConcreteFixture', 'QuantityA', 'QuantityB', 'BlueMExtra',
  'RedSStock', 'BlueMStock', 'ExistingUiTest', 'ConfirmedFixtureRun'];
const dataRows = generated.map((row, index) => {
  const data = fixture(row);
  validateFixture(row, data);
  return [`N02-PW-${String(index + 1).padStart(3, '0')}`, ...columns.map(name => row[name]),
    data.name, data.q1, data.q2, data.blueM, 5, 3, data.ui || 'NotCoded',
    data.ui ? (execution?.cases[data.ui] ?? 'NotRun') : 'NotRun'].map(csv).join(',');
});
writeFileSync(join(directory, 'generated-cases.csv'), [csvHeader.join(','), ...dataRows].join('\n') + '\n');
const modelHash = createHash('sha256').update(model).digest('hex');
const report = [
  '# SCRUM-87 — N02 Cart PICT coverage',
  '',
  `- Model SHA-256: \`${modelHash}\``,
  `- PICT command: \`pict.exe model.pict /o:2 /r:${seed}\``,
  `- Feasible full assignments: ${exhaustiveRows().length}`,
  `- Generated rows: ${generated.length}`,
  `- Feasible pairs: ${feasibleSet.size}`,
  `- Pairs in generated rows: ${generatedSet.size}`,
  `- Generated pair coverage: ${generatedSet.size}/${feasibleSet.size} (100%)`,
  execution
    ? `- Latest automation attempt: ${execution.runId} at ${execution.sourceCommit}; ${Object.values(execution.cases).filter(x => x === 'passed').length} passed, ${Object.values(execution.cases).filter(x => x === 'failed').length} failed, ${Object.values(execution.cases).filter(x => x === 'skipped').length} skipped/blocked. Status is taken from execution.json; skipped means blocked, not passed. Generated coverage is not a UI test result.`
    : '- Confirmed-fixture execution: Not Run. Generated coverage is not a UI test result.',
  '- Existing UI cases: MERGE-VALID, MERGE-EXACT, MERGE-OVER, MERGE-VARIANT, REPEAT-SAME, REPEAT-DIFFERENT, REPEAT-BELOW, REPEAT-OVER.',
  '- All eight PICT rows have UI automation; generated coverage is independent of runtime status.',
  '- Values are relation labels. Concrete quantities in generated-cases.csv must be checked against stock before execution.',
  '- This model is independent of the original 14 PW rows and 253 pairs.',
  '',
  '## Constraints',
  '',
  '- LoginMerge requires GuestToRegistered; RepeatAdd requires SameSession.',
  '- Different variants use PerVariant stock checks; Same variants use BelowStock, AtStock or AboveStock.',
  '- For LoginMerge/AboveStock, each source cart is valid independently: 4 and 2 with Red/S stock 5.',
  '',
];
writeFileSync(join(directory, 'coverage-report.md'), report.join('\n'));
process.stdout.write(`N02 PICT: ${generated.length} rows, ${generatedSet.size}/${feasibleSet.size} feasible pairs.\n`);
