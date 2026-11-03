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
  let line = page.locator('table.cart tbody tr').filter({ hasText: productName });
  for (const attribute of attributes) {
    line = line.filter({ hasText: attribute });
  }
  await expect(line, `Expected one cart line for ${productName}.`).toHaveCount(1);
  await expect(line.locator('input.qty-input')).toHaveValue(String(quantity));
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

function markerLines(snapshot: string, marker: string): string[] {
  return snapshot.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith(`${marker}|`));
}

function markerCount(snapshot: string, marker: string): number {
  const line = markerLines(snapshot, marker)[0];
  if (!line) throw new Error(`Checkout SQL evidence is missing marker '${marker}'.`);
  const value = Number(line.slice(marker.length + 1));
  if (!Number.isFinite(value)) throw new Error(`Checkout SQL evidence has invalid '${line}'.`);
  return value;
}

/**
 * Confirms the database invariant for a successful local checkout. The
 * snapshot is intentionally passed in by the test so the before/after pair
 * is attached to the Playwright report.
 */
export async function assertCheckoutOrderEvidence(before: string, after: string): Promise<void> {
  const beforeOrderCount = markerCount(before, 'ORDER_COUNT');
  const afterOrderCount = markerCount(after, 'ORDER_COUNT');
  expect(afterOrderCount - beforeOrderCount, 'Successful checkout must create exactly one order.').toBe(1);

  const orders = markerLines(after, 'ORDER');
  expect(orders, 'Checkout SQL evidence must contain the newly-created order.').toHaveLength(beforeOrderCount + 1);
  const latestOrder = orders[orders.length - 1].split('|');
  expect(latestOrder[2], 'OrderStatus must be Pending for Check/Money Order.').toBe('10');
  expect(latestOrder[3], 'PaymentStatus must be Pending for Check/Money Order.').toBe('10');
  expect(latestOrder[4], 'Payment method must be Payments.CheckMoneyOrder.').toBe('Payments.CheckMoneyOrder');

  const cartCount = markerCount(after, 'CART_COUNT');
  expect(cartCount, 'Successful checkout must clear the customer cart.').toBe(0);
}

export function assertCheckoutOrderCountUnchanged(before: string, after: string): void {
  expect(markerCount(after, 'ORDER_COUNT'), 'Negative checkout case must not create an order.')
    .toBe(markerCount(before, 'ORDER_COUNT'));
}

export function assertCheckoutCartCount(after: string, expected: number): void {
  expect(markerCount(after, 'CART_COUNT'), 'Checkout cart count does not match expected state.')
    .toBe(expected);
}
