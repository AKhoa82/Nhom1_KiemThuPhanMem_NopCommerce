const fs = require('node:fs');
const path = require('node:path');

const qaRoot = path.resolve(__dirname, '..');
const destination = path.resolve(__dirname,
  process.argv[2] ?? '../../../docs/evidence/SCRUM-96/RUN-20261124-B01/MERGE-MULTISTORE');
const report = JSON.parse(fs.readFileSync(path.join(qaRoot, 'reports/results.json'), 'utf8'));
const found = [];
function visit(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      if (spec.title.includes('MERGE-MULTISTORE')) found.push(spec);
    }
    visit(suite.suites);
  }
}
visit(report.suites);
if (found.length !== 1) throw new Error(`Expected one multi-store test, found ${found.length}`);
const result = found[0].tests[0].results[0];
if (result.status !== 'passed') throw new Error(`Multi-store test status is ${result.status}`);
fs.mkdirSync(destination, { recursive: true });
for (const attachment of result.attachments) {
  if (!attachment.name.startsWith('multistore-')) continue;
  const target = path.join(destination, attachment.name);
  if (attachment.body) fs.writeFileSync(target, Buffer.from(attachment.body, 'base64'));
  else if (attachment.path) fs.copyFileSync(attachment.path, target);
  else throw new Error(`Missing body/path for ${attachment.name}`);
  process.stdout.write(`${attachment.name}\n`);
}
fs.copyFileSync(path.join(qaRoot, 'reports/run-manifest.json'), path.join(destination, 'run-manifest.json'));
fs.copyFileSync(path.join(qaRoot, 'reports/junit.xml'), path.join(destination, 'junit.xml'));
