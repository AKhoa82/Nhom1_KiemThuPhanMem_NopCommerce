import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import type { PairwiseCase } from './pairwise-data';
import { runtimeConfig } from './runtime-config';

const execFile = promisify(execFileCallback);
const resetScript = resolve(__dirname, '../../scripts/reset-fixture.ps1');

export interface FixtureBaseline {
  orderCountBefore?: number;
}

export class FixtureBlockedError extends Error {}

export async function resetFixture(page: Page, row: PairwiseCase): Promise<FixtureBaseline> {
  try {
    await execFile('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', resetScript,
      '-CaseId', row.caseId,
      '-Container', runtimeConfig.databaseContainer,
      '-Database', runtimeConfig.databaseName,
      '-StoreContainer', runtimeConfig.storeContainer,
    ], {
      env: process.env,
      windowsHide: true,
      timeout: 30_000,
    });
  } catch (error) {
    const detail = error instanceof Error
      ? `${error.message}\n${'stdout' in error ? String(error.stdout ?? '') : ''}\n${'stderr' in error ? String(error.stderr ?? '') : ''}`
      : String(error);
    if (detail.includes('FIXTURE_BLOCKED:')) throw new FixtureBlockedError(detail.trim());
    throw new Error(`Fixture reset failed for ${row.caseId}: ${detail.trim()}`);
  }

  await openCartWhenStoreReady(page);
  await verifyRuntimeFixture(page, row);
  return {};
}

async function openCartWhenStoreReady(page: Page): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout: 5_000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1_000);
    }
  }
  throw new FixtureBlockedError(`FIXTURE_BLOCKED: Store did not become ready after fixture reset: ${String(lastError)}`);
}

async function verifyRuntimeFixture(page: Page, row: PairwiseCase): Promise<void> {
  const productPath = row.inventoryState === 'OutOfStock'
    ? runtimeConfig.outOfStockProductPath
    : row.productType === 'ConfigurablePhysical'
      ? runtimeConfig.configurableProductPath
      : runtimeConfig.simpleProductPath;
  const response = await page.goto(productPath, { waitUntil: 'domcontentloaded' });
  if (!response?.ok() || await page.locator('.product-details-page').count() !== 1) {
    throw new FixtureBlockedError(`FIXTURE_BLOCKED: Product slug '${productPath}' is unavailable for ${row.caseId}.`);
  }

  if (row.productType !== 'ConfigurablePhysical') return;

  const attributes = page.locator('select[name^="product_attribute_"]');
  if (await attributes.count() !== 2) {
    throw new FixtureBlockedError(`FIXTURE_BLOCKED: ${row.caseId} requires exactly two PW-SHIRT variant selectors.`);
  }
  const [colors, sizes] = await Promise.all([
    attributes.nth(0).locator('option').allTextContents(),
    attributes.nth(1).locator('option').allTextContents(),
  ]);
  if (!colors.includes('Red') || !colors.includes('Blue') || !sizes.includes('S') || !sizes.includes('M')) {
    throw new FixtureBlockedError(`FIXTURE_BLOCKED: ${row.caseId} requires Red/Blue and S/M values on PW-SHIRT.`);
  }
}
