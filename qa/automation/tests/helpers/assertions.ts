import { expect, type Page } from '@playwright/test';
import type { PairwiseCase } from './pairwise-data';

const errorMessages = '.message-error, .validation-summary-errors, .field-validation-error, .notifications-error';

export async function assertCartHasItems(page: Page): Promise<void> {
  await page.goto('/cart');
  await expect(page.locator('#shopping-cart-form input.qty-input').first()).toBeVisible();
}

export async function assertCartEmpty(page: Page): Promise<void> {
  await expect(page.locator('#shopping-cart-form input.qty-input')).toHaveCount(0);
  await expect(page.locator('.no-data')).toBeVisible();
}

export async function assertCouponResult(page: Page, coupon: PairwiseCase['coupon']): Promise<void> {
  if (coupon === 'None') return;
  if (coupon === 'Valid') {
    await expect(page.locator('.discount-box, .order-summary')).toContainText('PW-CART-10PCT');
    return;
  }
  await expect(page.locator(errorMessages)).toBeVisible();
}

export async function assertStockBlocked(page: Page): Promise<void> {
  await expect(page.locator(errorMessages)).toBeVisible();
  await expect(page).not.toHaveURL(/checkout\/billing|checkout\/shipping|checkout\/payment|checkout\/confirm/i);
}

export async function assertAddressValidationBlocked(page: Page): Promise<void> {
  await expect(page.locator(errorMessages)).toBeVisible();
  await expect(page).not.toHaveURL(/checkout\/shipping|checkout\/payment|checkout\/confirm/i);
}

export async function assertNoCheckoutContinuation(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/checkout\/shipping|checkout\/payment|checkout\/confirm/i);
}
