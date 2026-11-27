const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.resolve(root, '..', '..', 'docs', 'evidence', 'SCRUM-108');
fs.mkdirSync(output, { recursive: true });

function specsIn(suite) {
  return [...(suite.specs || []), ...(suite.suites || []).flatMap(specsIn)];
}

function exportPng(report, titlePart, attachmentName, outputName) {
  const data = JSON.parse(fs.readFileSync(path.resolve(root, report), 'utf8'));
  const spec = data.suites.flatMap(specsIn).find(item => item.title.includes(titlePart));
  if (!spec) throw new Error(`Missing test: ${titlePart}`);
  const results = spec.tests.flatMap(test => test.results || []);
  const attachment = results.flatMap(result => result.attachments || [])
    .find(item => item.name === attachmentName && item.contentType === 'image/png');
  if (!attachment) throw new Error(`Missing PNG: ${attachmentName}`);
  const bytes = attachment.body
    ? Buffer.from(attachment.body, 'base64')
    : fs.readFileSync(path.resolve(root, attachment.path));
  const target = path.join(output, outputName);
  fs.writeFileSync(target, bytes);
  process.stdout.write(`${path.relative(root, target)} (${bytes.length} bytes)\n`);
}

exportPng('reports/n06-20261127-n02-final/results.json', 'MERGE-OVER:', 'guest-before-login.png', 'N06-merge-over-before.png');
exportPng('reports/n06-20261127-n02-final/results.json', 'MERGE-OVER:', 'guest-after-rejected-login.png', 'N06-merge-over-after.png');
exportPng('reports/n06-20261127-n02-final/results.json', 'REPEAT-SAME:', 'after-repeat-add.png', 'N06-repeat-same-after.png');
exportPng('n03-local-evidence/N06-20261127/run01/results.json', 'CHK-RACE-01:', 'tab-B-after.png', 'N06-race-run01-tab-B.png');
