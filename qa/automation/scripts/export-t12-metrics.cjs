const fs = require('node:fs');
const path = require('node:path');

const [reportDir, outputFile] = process.argv.slice(2);
if (!reportDir || !outputFile) {
  throw new Error('Usage: node scripts/export-t12-metrics.cjs <report-dir> <output-json>');
}

const input = path.resolve(reportDir);
const report = JSON.parse(fs.readFileSync(path.join(input, 'results.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(input, 'run-manifest.json'), 'utf8'));

function collect(suite) {
  return [
    ...(suite.specs || []).flatMap(spec => (spec.tests || []).map(test => {
      const last = test.results?.at(-1);
      return {
        title: spec.title,
        status: last?.status ?? 'not-run',
        durationMs: last?.duration ?? 0,
        scenarios: (test.annotations || []).filter(item => item.type === 'scenario').map(item => item.description),
        skipReason: (test.annotations || []).find(item => item.type === 'skip')?.description ?? null,
      };
    })),
    ...(suite.suites || []).flatMap(collect),
  ];
}

const tests = (report.suites || []).flatMap(collect);
const counts = {
  pass: tests.filter(test => test.status === 'passed').length,
  fail: tests.filter(test => test.status === 'failed' || test.status === 'timedOut' || test.status === 'interrupted').length,
  skipped: tests.filter(test => test.status === 'skipped').length,
  notRun: tests.filter(test => test.status === 'not-run').length,
};
const started = Date.parse(manifest.startedAt);
const finished = Date.parse(manifest.finishedAt);
const data = {
  runId: manifest.runId,
  sourceCommit: manifest.sourceCommit,
  checkoutMode: manifest.checkoutMode,
  fixtureVersion: manifest.fixtureVersion,
  n02FixtureVersion: manifest.n02FixtureVersion,
  startedAt: manifest.startedAt,
  finishedAt: manifest.finishedAt,
  wallDurationSeconds: Number.isFinite(started) && Number.isFinite(finished)
    ? Math.round((finished - started) / 1000)
    : null,
  total: tests.length,
  counts,
  passRateOfAll: tests.length ? Number((counts.pass / tests.length * 100).toFixed(2)) : 0,
  failRateOfAll: tests.length ? Number((counts.fail / tests.length * 100).toFixed(2)) : 0,
  tests,
};

fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2) + '\n');
process.stdout.write(`${data.runId}: ${counts.pass} Pass, ${counts.fail} Fail, ${counts.skipped} Skipped, ${counts.notRun} Not Run; ${data.wallDurationSeconds}s\n`);
