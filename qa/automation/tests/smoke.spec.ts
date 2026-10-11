import { expect, test } from '@playwright/test';

test('HARNESS-001 nopCommerce storefront is ready', async ({ page }) => {
  const response = await page.goto('/');

  expect(response, 'Storefront did not return an HTTP response').not.toBeNull();
  expect(response!.ok(), `Storefront returned HTTP ${response!.status()}`).toBeTruthy();
  expect(new URL(page.url()).pathname.toLowerCase()).not.toContain('/install');
});
