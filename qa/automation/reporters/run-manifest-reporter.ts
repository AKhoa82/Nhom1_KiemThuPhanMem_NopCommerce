import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FullResult, Reporter } from '@playwright/test/reporter';

import { cartManifest } from '../tests/helpers/cart-catalog';

function sourceCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'UNKNOWN';
  }
}

export default class RunManifestReporter implements Reporter {
  private startedAt = new Date().toISOString();

  onBegin(): void {
    this.startedAt = new Date().toISOString();
  }

  onEnd(result: FullResult): void {
    const outputDirectory = resolve(process.env.QA_REPORT_DIR ?? 'reports');
    mkdirSync(outputDirectory, { recursive: true });
    const finishedAt = new Date().toISOString();
    const runId = process.env.QA_RUN_ID?.trim() || `AUTO-${this.startedAt.replace(/[-:.TZ]/g, '')}`;
    const manifest = {
      runId,
      startedAt: this.startedAt,
      finishedAt,
      status: result.status,
      sourceCommit: sourceCommit(),
      workingTreeDirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
      baseUrl: process.env.NOP_BASE_URL ?? 'http://localhost/',
      checkoutMode: process.env.QA_CHECKOUT_MODE ?? 'UNSPECIFIED',
      fixtureVersion: process.env.QA_FIXTURE_VERSION ?? cartManifest.version,
      n02FixtureVersion: cartManifest.n02Version,
      fixtureVerification: cartManifest.verification.status,
      databaseContainer: process.env.QA_DB_CONTAINER ?? 'nopcommerce_mssql_server',
      databaseName: process.env.QA_DB_NAME ?? 'nopcommerce',
      storeContainer: process.env.QA_STORE_CONTAINER ?? 'nopcommerce',
      hasSqlPassword: Boolean(process.env.QA_SQL_PASSWORD?.trim()),
      hasRegisteredCredential: Boolean(
        process.env.QA_REGISTERED_EMAIL?.trim() && process.env.QA_REGISTERED_PASSWORD?.trim(),
      ),
      hasBillingFixture: Boolean(process.env.QA_BILLING_EMAIL?.trim()),
    };
    writeFileSync(resolve(outputDirectory, 'run-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }
}
