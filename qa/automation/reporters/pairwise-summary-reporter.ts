import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type Classification = 'PASSED' | 'BLOCKED_ENVIRONMENT' | 'FAILED_ENVIRONMENT' | 'FAILED_PRODUCT' | 'FAILED_AUTOMATION' | 'SKIPPED';

interface CaseSummary {
  caseId: string;
  status: TestResult['status'];
  classification: Classification;
  scenario: string;
  expectedPath: string;
  durationMs: number;
  evidence: string;
  artifacts: string[];
}

const environmentPattern = /FIXTURE_BLOCKED|ECONNREFUSED|ERR_EMPTY_RESPONSE|net::ERR|Docker container|SQLCMD|Store did not become ready|fixture reset failed/i;
const automationPattern = /No implementation exists|strict mode violation|TypeScript|Cannot find module|locator\.(check|click|fill)|page\.(goto|waitForURL)|browserContext/i;

function firstError(result: TestResult): string {
  return result.errors.map(error => error.message ?? error.stack ?? '').find(Boolean)?.replace(/\s+/g, ' ').trim() ?? '';
}

function classify(result: TestResult, evidence: string): Classification {
  if (result.status === 'passed') return 'PASSED';
  if (result.status === 'skipped') return /Blocked:|FIXTURE_BLOCKED/i.test(evidence) ? 'BLOCKED_ENVIRONMENT' : 'SKIPPED';
  if (environmentPattern.test(evidence)) return 'FAILED_ENVIRONMENT';
  if (automationPattern.test(evidence)) return 'FAILED_AUTOMATION';
  return 'FAILED_PRODUCT';
}

export default class PairwiseSummaryReporter implements Reporter {
  private readonly summaries: CaseSummary[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const caseId = test.title.match(/\bPW-\d{3}\b/)?.[0];
    if (!caseId) return;

    const annotation = (type: string) => test.annotations.find(item => item.type === type)?.description ?? '';
    const evidence = firstError(result) || annotation('skip');
    this.summaries.push({
      caseId,
      status: result.status,
      classification: classify(result, evidence),
      scenario: annotation('scenario'),
      expectedPath: annotation('expected-path'),
      durationMs: result.duration,
      evidence,
      artifacts: result.attachments.map(attachment => attachment.path).filter((path): path is string => Boolean(path)),
    });
  }

  onEnd(_result: FullResult): void {
    const outputDirectory = resolve(process.cwd(), 'reports');
    mkdirSync(outputDirectory, { recursive: true });
    const summaries = this.summaries.sort((left, right) => left.caseId.localeCompare(right.caseId));
    writeFileSync(resolve(outputDirectory, 'pairwise-summary.json'), `${JSON.stringify(summaries, null, 2)}\n`, 'utf8');

    const rows = summaries.map(item => [
      item.caseId,
      item.classification,
      item.status,
      item.expectedPath || '-',
      item.scenario || '-',
      item.evidence.replaceAll('|', '\\|') || '-',
    ]);
    const markdown = [
      '# Kết quả Pairwise',
      '',
      '| Case | Phân loại | Playwright | Expected path | Scenario | Bằng chứng |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows.map(row => `| ${row.join(' | ')} |`),
      '',
      'Phân loại: `BLOCKED_ENVIRONMENT`/`FAILED_ENVIRONMENT` là lỗi fixture, Docker, DB hoặc store; `FAILED_PRODUCT` là assertion nghiệp vụ không đạt; `FAILED_AUTOMATION` là lỗi harness/selector.',
    ];
    writeFileSync(resolve(outputDirectory, 'pairwise-summary.md'), `${markdown.join('\n')}\n`, 'utf8');
  }
}
