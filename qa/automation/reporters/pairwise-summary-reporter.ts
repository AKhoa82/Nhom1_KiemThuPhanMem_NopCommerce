import { mkdirSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { cartCatalog, type CartCase } from '../tests/helpers/cart-catalog';

export function classify(status: string, evidence: string): string {
  if (status === 'passed') return 'PASSED';
  // Skipped = never reached business assertions; failed + environment signal = the run broke mid-test.
  if (status === 'skipped') return 'BLOCKED_ENVIRONMENT';
  if (/FIXTURE_BLOCKED|Blocked:|ECONNREFUSED|ERR_EMPTY_RESPONSE|net::ERR|Docker container|SQLCMD|Store did not become ready|fixture reset failed/i.test(evidence)) return 'FAILED_ENVIRONMENT';
  if (/FAILED_AUTOMATION|No implementation|strict mode violation|TypeScript|Cannot find module|locator\.(check|click|fill)|page\.(goto|waitForURL)|browserContext/i.test(evidence)) return 'FAILED_AUTOMATION';
  return 'FAILED_PRODUCT';
}

export default class PairwiseSummaryReporter implements Reporter {
  protected group: CartCase['group'] = 'PW';
  protected stem = 'pairwise-summary';
  private summaries: Record<string, any>[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const caseId = this.group === 'PW' ? test.title.match(/^PW-\d{3}\b/)?.[0]
      : test.title.match(/^CART-(?:MERGE|REPEAT)-01 ((?:MERGE|REPEAT)-[A-Z]+)\b/)?.[1];
    const spec = cartCatalog.find(item => item.group === this.group && item.caseId === caseId);
    if (!spec) return;
    const annotation = (type: string) => test.annotations.find(item => item.type === type)?.description ?? '';
    const evidence = (result.errors.map(error => error.message ?? error.stack ?? '').find(Boolean) || annotation('skip'))
      .replace(/\u001b\[[0-9;]*m/g, '').replace(/\s+/g, ' ').trim();
    if (result.status === 'skipped' && evidence) console.log(`[${caseId}] ${evidence.replace(/\s+/g, ' ').slice(0, 1200)}`);
    this.summaries.push({ ...spec, status: result.status, classification: classify(result.status, evidence),
      scenario: annotation('scenario'), expectedPath: spec.path, durationMs: result.duration,
      retry: result.retry, repeatEachIndex: test.repeatEachIndex, evidence,
      failureLog: result.attachments.find(a => a.name === 'failure-log.json')?.path ?? '',
      artifacts: result.attachments.map(a => a.path).filter(Boolean) });
  }

  onEnd(_result: FullResult): void {
    if (!this.summaries.length) return;
    const directory = resolve(process.env.QA_REPORT_DIR ?? 'reports');
    mkdirSync(directory, { recursive: true });
    const summaries = this.summaries.sort((a, b) => a.caseId.localeCompare(b.caseId));
    writeFileSync(resolve(directory, `${this.stem}.json`), JSON.stringify(summaries, null, 2) + '\n');
    const escape = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value)).replaceAll('|', '\\|').replace(/\r?\n/g, '<br>');
    const rows = summaries.map(item => [item.caseId, item.path, item.precondition, item.input, item.expected, item.invariants.join(', '), item.status, item.classification,
      item.failureLog ? `[failure-log.json](${relative(directory, item.failureLog).replaceAll('\\', '/')})` : '-', item.evidence || '-'].map(escape));
    writeFileSync(resolve(directory, `${this.stem}.md`), [
      this.group === 'PW' ? '# Pairwise Shopping Cart' : '# Advanced Shopping Cart', '',
      this.group === 'PW' ? 'Original model: 14 PW cases, 253/253 generated pairs. Runtime results below are separate from pair coverage.'
        : 'ADV lies outside the original 14 PW cases and 253 pairs until the official model/mapping changes.', '',
      '| Case ID | Path | Precondition | Input | Expected | Invariant | Result | Classification | Failure log | Evidence |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      ...rows.map(row => `| ${row.join(' | ')} |`), '',
      'FAILED_PRODUCT indicates a business assertion; FAILED_AUTOMATION indicates harness/selector failure; FAILED_ENVIRONMENT means the store/DB/Docker broke during the run; BLOCKED_ENVIRONMENT (skipped) is not a pass.', '',
    ].join('\n'));
  }
}
