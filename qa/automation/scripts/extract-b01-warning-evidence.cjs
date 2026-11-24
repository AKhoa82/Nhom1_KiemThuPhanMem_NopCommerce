const fs = require('node:fs');
const path = require('node:path');

const qaRoot = path.resolve(__dirname, '..');
const destination = path.resolve(__dirname, '../../../docs/evidence/SCRUM-96/RUN-20261124-B01-WARNING');
const report = JSON.parse(fs.readFileSync(path.join(qaRoot, 'reports/results.json'), 'utf8'));
const found = [];
function visit(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      if (spec.title.includes('MERGE-OVER')) found.push(spec);
    }
    visit(suite.suites);
  }
}
visit(report.suites);
if (found.length !== 1) throw new Error(`Expected one MERGE-OVER test, found ${found.length}`);
const result = found[0].tests[0].results[0];
if (result.status !== 'passed') throw new Error(`MERGE-OVER status is ${result.status}`);
fs.mkdirSync(destination, { recursive: true });
for (const name of ['after-login.png', 'after-login-mobile.png', 'login-feedback.txt', 'guest-after-rejected-login.png']) {
  const attachment = result.attachments.find(item => item.name === name);
  if (!attachment) throw new Error(`Missing attachment ${name}`);
  const target = path.join(destination, name);
  if (attachment.body) fs.writeFileSync(target, Buffer.from(attachment.body, 'base64'));
  else if (attachment.path) fs.copyFileSync(attachment.path, target);
  else throw new Error(`Missing body/path for ${name}`);
  process.stdout.write(`${name}\n`);
}
for (const name of ['run-manifest.json', 'junit.xml'])
  fs.copyFileSync(path.join(qaRoot, 'reports', name), path.join(destination, name));
