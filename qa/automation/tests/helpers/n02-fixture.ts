import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { FixtureBlockedError } from './fixtures';
import { runtimeConfig } from './runtime-config';

const execFile = promisify(execFileCallback);
const resetScript = resolve(__dirname, '../../scripts/reset-n02-fixture.ps1');
const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const n02StoreId = Number(process.env.QA_N02_STORE_ID ?? '1');

export async function currentCustomerGuid(page: Page): Promise<string> {
  const cookie = (await page.context().cookies()).find(item => item.name === '.Nop.Customer');
  if (!cookie || !guidPattern.test(cookie.value)) {
    throw new FixtureBlockedError('FIXTURE_BLOCKED: .Nop.Customer guest cookie is missing or invalid.');
  }
  return cookie.value;
}

export async function resetN02Fixture(page: Page, guestGuid: string, withAccount: boolean, storeId = n02StoreId): Promise<string> {
  if (!Number.isSafeInteger(storeId) || storeId < 1) {
    throw new FixtureBlockedError('FIXTURE_BLOCKED: QA_N02_STORE_ID must be a positive integer.');
  }
  if (!guidPattern.test(guestGuid)) {
    throw new FixtureBlockedError('FIXTURE_BLOCKED: invalid N02 guest customer GUID.');
  }
  if (withAccount && !runtimeConfig.registeredEmail) {
    throw new FixtureBlockedError('FIXTURE_BLOCKED: QA_REGISTERED_EMAIL is required for merge fixture reset.');
  }

  let output: string;
  try {
    ({ stdout: output } = await execFile('powershell.exe', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resetScript,
      '-GuestGuid', guestGuid,
      '-AccountEmail', withAccount ? runtimeConfig.registeredEmail : '',
      '-StoreId', String(storeId),
      '-Container', runtimeConfig.databaseContainer,
      '-Database', runtimeConfig.databaseName,
      '-StoreContainer', runtimeConfig.storeContainer,
    ], { env: process.env, windowsHide: true, timeout: 90_000 }));
  } catch (error) {
    const detail = error instanceof Error
      ? `${error.message}\n${'stdout' in error ? String(error.stdout ?? '') : ''}\n${'stderr' in error ? String(error.stderr ?? '') : ''}`
      : String(error);
    throw new FixtureBlockedError(`FIXTURE_BLOCKED: N02 fixture reset failed: ${detail.trim()}`);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout: 5_000 });
      return output.trim();
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1_000);
    }
  }
  throw new FixtureBlockedError(`FIXTURE_BLOCKED: store did not restart after N02 reset: ${String(lastError)}`);
}
