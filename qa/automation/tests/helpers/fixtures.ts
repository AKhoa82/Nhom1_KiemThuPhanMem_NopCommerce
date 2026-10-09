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

  await page.goto('/cart');
  await clearCart(page);
  return {};
}

export async function clearCart(page: Page): Promise<void> {
  const removeCheckboxes = page.locator('input[name="removefromcart"]');
  const count = await removeCheckboxes.count();
  if (count === 0) return;
  for (let index = 0; index < count; index += 1) await removeCheckboxes.nth(index).check();
  await page.locator('#updatecart').click();
  await page.waitForLoadState('domcontentloaded');
}
