const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { resolve, join } = require('node:path');

const automationRoot = resolve(__dirname, '..');
const repositoryRoot = resolve(automationRoot, '..', '..');
const report = JSON.parse(readFileSync(join(automationRoot, 'reports', 'results.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(automationRoot, 'reports', 'run-manifest.json'), 'utf8'));
if (!/^AUTO-\d+$/.test(manifest.runId)) throw new Error('Unexpected N02 run ID.');
const outputRoot = join(repositoryRoot, 'docs', 'evidence', 'SCRUM-87', manifest.runId);
mkdirSync(outputRoot, { recursive: true });

const exported = [];
function visit(suite) {
  for (const spec of suite.specs || []) {
    const match = /^(CART-(?:MERGE|REPEAT)-01) ([A-Z-]+):/.exec(spec.title);
    if (!match) continue;
    const caseName = match[2];
    const test = spec.tests?.[0];
    const result = test?.results?.at(-1);
    if (!result) throw new Error(`Missing result for ${caseName}`);
    const caseDirectory = join(outputRoot, caseName);
    mkdirSync(caseDirectory, { recursive: true });
    const attachments = [];
    for (const attachment of result.attachments || []) {
      if (!/^[a-z0-9-]+\.sql\.txt$/.test(attachment.name)) continue;
      if (!attachment.body) throw new Error(`N02 SQL attachment ${attachment.name} has no body.`);
      const lines = Buffer.from(attachment.body, 'base64').toString('utf8').split(/\r?\n/)
        .map(line => line.trim()).filter(line => line.startsWith('N02_'));
      if (lines.length === 0 || lines.some(line => !/^N02_(PRODUCT|VARIANT|CUSTOMER|CART|COUPON)\|/.test(line))) {
        throw new Error(`Unexpected SQL evidence in ${caseName}/${attachment.name}`);
      }
      writeFileSync(join(caseDirectory, attachment.name), `${lines.join('\n')}\n`);
      attachments.push(attachment.name);
    }
    exported.push({ caseName, caseId: match[1], status: result.status, attachments });
  }
  for (const child of suite.suites || []) visit(child);
}
for (const suite of report.suites || []) visit(suite);
if (exported.length !== 6) throw new Error(`Expected 6 N02 cases, found ${exported.length}.`);
writeFileSync(join(outputRoot, 'manifest.json'), `${JSON.stringify({
  runId: manifest.runId,
  startedAt: manifest.startedAt,
  finishedAt: manifest.finishedAt,
  sourceCommit: manifest.sourceCommit,
  fixtureVersion: manifest.fixtureVersion,
  status: manifest.status,
  cases: exported,
}, null, 2)}\n`);
process.stdout.write(`Exported ${exported.length} N02 cases to ${outputRoot}\n`);
