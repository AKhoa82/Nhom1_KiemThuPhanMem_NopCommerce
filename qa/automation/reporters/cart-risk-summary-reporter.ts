import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

interface RiskSummary {
  caseId: string;
  status: TestResult['status'];
  priority: string;
  scenario: string;
  evidence: string;
  attachments: string[];
}

export default class CartRiskSummaryReporter implements Reporter {
  private readonly summaries: RiskSummary[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const caseId = test.title.match(/\bCART-(?:0[1-9]|1[0-4])\b|\bCART-REPEAT-01\b/)?.[0];
    if (!caseId) return;

    const annotation = (type: string) => test.annotations.find((item) => item.type === type)?.description ?? '';
    this.summaries.push({
      caseId,
      status: result.status,
      priority: annotation('priority'),
      scenario: annotation('scenario'),
      evidence: result.errors.map((error) => error.message ?? error.stack ?? '').find(Boolean) ?? annotation('skip'),
      attachments: result.attachments.map((attachment) => attachment.path).filter((path): path is string => Boolean(path)),
    });
  }

  onEnd(_result: FullResult): void {
    if (this.summaries.length === 0) return;

    const outputDirectory = resolve(process.cwd(), 'reports');
    mkdirSync(outputDirectory, { recursive: true });
    const summaries = this.summaries.sort((left, right) => left.caseId.localeCompare(right.caseId));
    writeFileSync(resolve(outputDirectory, 'cart-risk-summary.json'), `${JSON.stringify(summaries, null, 2)}\n`, 'utf8');
    const rows = summaries.map((item) => [
      item.caseId,
      item.status,
      item.priority || '-',
      item.scenario || '-',
      item.evidence.replaceAll('|', '\\|') || 'Pass',
      item.attachments.join(', ') || '-',
    ]);
    const markdown = [
      '# SCRUM-82 Cart risk execution',
      '',
      '| Case | Status | Priority | Scenario | Evidence | Attachments |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows.map((row) => `| ${row.join(' | ')} |`),
      '',
    ];
    writeFileSync(resolve(outputDirectory, 'cart-risk-summary.md'), `${markdown.join('\n')}\n`, 'utf8');
  }
}
