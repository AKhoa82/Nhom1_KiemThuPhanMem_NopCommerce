import { expect, type Page } from '@playwright/test';
import type { PairwiseCase } from './pairwise-data';

const errorMessages = '.message-error, .message-failure, .validation-summary-errors, .field-validation-error, .notifications-error, .bar-notification.error';
const visibleError = (page: Page) => page.locator(errorMessages).filter({ hasText: /\S/ }).first();

export async function assertCartHasItems(page: Page): Promise<void> {
  await page.goto('/cart');
  await expect(page.locator('#shopping-cart-form input.qty-input').first()).toBeVisible();
}

export async function assertCartLine(page: Page, productName: string, quantity: number, attributes: string[] = []): Promise<void> {
  await page.goto('/cart');
  const line = page.locator('table.cart tbody tr').filter({ hasText: productName });
  await expect(line, `Expected one cart line for ${productName}.`).toHaveCount(1);
  await expect(line.locator('input.qty-input')).toHaveValue(String(quantity));
  for (const attribute of attributes) await expect(line).toContainText(attribute);
}

export async function assertCartLineCount(page: Page, expected: number): Promise<void> {
  await page.goto('/cart');
  await expect(page.locator('table.cart tbody tr')).toHaveCount(expected);
}

export async function assertCartEmpty(page: Page): Promise<void> {
  await expect(page.locator('table.cart tbody tr')).toHaveCount(0);
  await expect(page.locator('.no-data')).toBeVisible();
}

export async function assertCouponResult(page: Page, coupon: PairwiseCase['coupon']): Promise<void> {
  if (coupon === 'None') return;
  if (coupon === 'Valid') {
    await expect(page.locator('.coupon-box .applied-discount-code')).toContainText('PW-CART-10PCT');
    return;
  }
  await expect(visibleError(page)).toBeVisible();
}

export async function assertStockBlocked(page: Page): Promise<void> {
  await expect(visibleError(page)).toBeVisible();
  await expect(page).not.toHaveURL(/checkout\/billing|checkout\/shipping|checkout\/payment|checkout\/confirm/i);
}

export async function assertAddressValidationBlocked(page: Page): Promise<void> {
  await expect(visibleError(page)).toBeVisible();
  await expect(page).not.toHaveURL(/checkout\/shipping|checkout\/payment|checkout\/confirm/i);
}

export async function assertNoCheckoutContinuation(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/checkout\/shipping|checkout\/payment|checkout\/confirm/i);
}

export async function assertCheckoutCompleted(page: Page): Promise<void> {
  await expect(page.locator('.order-completed-page')).toBeVisible();
  await expect(page.locator('.order-completed')).toBeVisible();
  await page.goto('/cart');
  await assertCartEmpty(page);
}
