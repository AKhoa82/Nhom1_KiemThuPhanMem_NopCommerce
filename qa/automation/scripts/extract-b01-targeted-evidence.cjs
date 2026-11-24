const fs = require('node:fs');
const path = require('node:path');

const key = process.argv[2];
const destination = process.argv[3] && path.resolve(__dirname, process.argv[3]);
if (!/^MERGE-[A-Z]+$/.test(key ?? '') || !destination)
  throw new Error('Use MERGE-CASE and a destination path');
const qaRoot = path.resolve(__dirname, '..');
const report = JSON.parse(fs.readFileSync(path.join(qaRoot, 'reports/results.json'), 'utf8'));
const found = [];
function visit(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) if (spec.title.includes(key)) found.push(spec);
    visit(suite.suites);
  }
}
visit(report.suites);
if (found.length !== 1) throw new Error(`Expected one ${key} test, found ${found.length}`);
const result = found[0].tests[0].results[0];
if (result.status !== 'passed') throw new Error(`${key} status is ${result.status}`);
fs.mkdirSync(destination, { recursive: true });
for (const attachment of result.attachments) {
  if (!attachment.name.endsWith('.png') && !attachment.name.endsWith('.txt')) continue;
  const target = path.join(destination, attachment.name);
  if (attachment.body) fs.writeFileSync(target, Buffer.from(attachment.body, 'base64'));
  else if (attachment.path) fs.copyFileSync(attachment.path, target);
  else throw new Error(`Missing body/path for ${attachment.name}`);
  process.stdout.write(`${attachment.name}\n`);
}
for (const name of ['run-manifest.json', 'junit.xml'])
  fs.copyFileSync(path.join(qaRoot, 'reports', name), path.join(destination, name));
