import { expect, type Page } from '@playwright/test';
import type { PairwiseCase } from './pairwise-data';
import { cartManifest, type CartState } from './cart-catalog';
import { parseUsd } from './money';

export { parseUsd } from './money';
export const cartWarnings = '.message-error, .message-failure, .bar-notification.error, .bar-notification.warning, .cart .warnings';

export async function readCartTotals(page: Page): Promise<{ subtotal: number; discount: number; total: number }> {
  if (await page.locator('table.cart tbody tr').count() === 0 && await page.locator('.no-data:visible').count() &&
      await page.locator('.cart-total').count() === 0) {
    return { subtotal: 0, discount: 0, total: 0 };
  }
  const currency = page.locator('#customerCurrency option:checked');
  if (await currency.count()) {
    const name = (await currency.textContent())?.trim();
    const value = (await currency.getAttribute('value')) ?? '';
    // Match by currency Id from the manifest; the display name may be localized.
    if (!new RegExp(`/changecurrency/${cartManifest.workingCurrencyId}(?:\\?|$)`, 'i').test(value)) {
      throw new Error(`FAILED_AUTOMATION: working currency is '${name}', expected '${cartManifest.workingCurrencyName}'; call ensureUsdCurrency after each new guest/login/logout.`);
    }
  }
  const amount = async (selector: string) => {
    const element = page.locator(selector);
    if (await element.count() !== 1) throw new Error(`FAILED_AUTOMATION: expected one money selector '${selector}'`);
    return parseUsd(await element.innerText());
  };
  let discount = 0;
  for (const element of await page.locator(cartManifest.selectors.discount).all()) {
    discount += Math.abs(parseUsd(await element.innerText()));
  }
  return { subtotal: await amount(cartManifest.selectors.subtotal), discount, total: await amount(cartManifest.selectors.total) };
}

/** Read the current page without navigation, preserving transient warnings and checkout errors. */
interface CartSnapshot {
  lines: { product: string; attributes: string[]; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  total: number;
  warnings: string[];
}
export function readCartState(page: Page): Promise<CartSnapshot>;
export function readCartState(page: Page, partial: true): Promise<Omit<CartSnapshot, 'subtotal' | 'discount' | 'total'> & {
  subtotal: number | null; discount: number | null; total: number | null; totalsError?: string;
}>;
export async function readCartState(page: Page, partial = false) {
  const lines = [];
  const read = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch (error) { if (!partial) throw error; return fallback; }
  };
  for (const line of await page.locator('table.cart tbody tr').all()) {
    lines.push({
      product: (await read(() => line.locator('.product-name').innerText({ timeout: 2000 }), '(unavailable)')).trim(),
      attributes: await line.locator('.attributes').allInnerTexts(),
      quantity: Number(await read(() => line.locator('input.qty-input').inputValue({ timeout: 2000 }), 'NaN')),
      unitPrice: await read(async () => parseUsd(await line.locator('.product-unit-price').innerText({ timeout: 2000 })), NaN),
      lineTotal: await read(async () => parseUsd(await line.locator('.product-subtotal').innerText({ timeout: 2000 })), NaN),
    });
  }
  const warnings = [];
  for (const warning of await page.locator(cartWarnings).all()) {
    if (await warning.isVisible()) warnings.push((await warning.innerText()).trim());
  }
  try { return { lines, ...await readCartTotals(page), warnings }; }
  catch (error) {
    if (!partial) throw error;
    return { lines, subtotal: null, discount: null, total: null, warnings, totalsError: String(error) };
  }
}

export async function assertCartState(page: Page, expected: CartState, caseId = 'cart'): Promise<void> {
  const check = (field: string, actual: unknown, wanted: unknown) =>
    expect(actual, `[${caseId}] ${field}: expected ${JSON.stringify(wanted)}, actual ${JSON.stringify(actual)}`).toEqual(wanted);
  await expect(page.locator('table.cart tbody tr'), `[${caseId}] line count: expected ${expected.lines.length}`).toHaveCount(expected.lines.length);
  const actual = await readCartState(page);
  for (const wanted of expected.lines) {
    const matches = actual.lines.filter(line => line.product === wanted.product &&
      wanted.attributes.every(attribute => line.attributes.join(' ').toLowerCase().split(/\s*[:\s]+/).includes(attribute.toLowerCase())));
    check(`${wanted.product}/${wanted.attributes.join('/')} matches`, matches.length, 1);
    const line = matches[0];
    check(`${wanted.product}/${wanted.attributes.join('/')} quantity`, line.quantity, wanted.quantity);
    check(`${wanted.product} unit price`, line.unitPrice, wanted.unitPrice);
    check(`${wanted.product} line total INV-CART-04`, line.lineTotal, wanted.unitPrice * wanted.quantity);
  }
  check('subtotal INV-CART-05', actual.subtotal, actual.lines.reduce((sum, line) => sum + line.lineTotal, 0));
  for (const field of ['subtotal', 'discount', 'total'] as const) check(field, actual[field], expected[field]);
  expect(actual.discount, `[${caseId}] discount >= 0`).toBeGreaterThanOrEqual(0);
  expect(actual.discount, `[${caseId}] discount <= subtotal`).toBeLessThanOrEqual(actual.subtotal);
  check('total INV-CART-08', actual.total, Math.round((actual.subtotal - actual.discount + cartManifest.cart.tax + cartManifest.cart.shipping + cartManifest.cart.paymentFee) * 100) / 100);
  expect(actual.total, `[${caseId}] total >= 0`).toBeGreaterThanOrEqual(0);
  if (expected.warning) {
    const line = page.locator('table.cart tbody tr').filter({ hasText: expected.warning.product });
    await expect(line.locator('.message-error, .warnings'), `[${caseId}] stock warning on rejected line`).toContainText(new RegExp(expected.warning.pattern, 'i'));
  } else {
    check('cart line warnings', (await page.locator('table.cart .message-error, table.cart .warnings').allTextContents()).filter(text => text.trim()), []);
  }
}

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

export async function assertStockBlocked(page: Page, before?: CartState, caseId = 'cart'): Promise<void> {
  await expect(visibleError(page)).toBeVisible();
  await expect(page).not.toHaveURL(/checkout\/billing|checkout\/shipping|checkout\/payment|checkout\/confirm/i);
  if (before) await assertCartState(page, before, caseId);
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
export async function assertCheckoutOrderEvidence(
  before: string, after: string, expectedTotal?: number,
  expectedItems?: { sku: string; quantity: number }[],
): Promise<void> {
  const beforeOrderCount = markerCount(before, 'ORDER_COUNT');
  const afterOrderCount = markerCount(after, 'ORDER_COUNT');
  expect(afterOrderCount - beforeOrderCount, 'Successful checkout must create exactly one order.').toBe(1);

  const orders = markerLines(after, 'ORDER');
  expect(orders, 'Checkout SQL evidence must contain the newly-created order.').toHaveLength(beforeOrderCount + 1);
  const latestOrder = orders[orders.length - 1].split('|');
  expect(latestOrder[2], 'OrderStatus must be Pending for Check/Money Order.').toBe('10');
  expect(latestOrder[3], 'PaymentStatus must be Pending for Check/Money Order.').toBe('10');
  expect(latestOrder[4], 'Payment method must be Payments.CheckMoneyOrder.').toBe('Payments.CheckMoneyOrder');
  if (expectedTotal !== undefined) expect(Number(latestOrder[5]), 'Order total equals cart total plus fixture Ground shipping.').toBe(expectedTotal);
  if (expectedItems) {
    const actualItems = markerLines(after, 'ORDER_ITEM').map(line => {
      const [_, orderId, sku, quantity] = line.split('|');
      expect(orderId, 'Order item must belong to the newly created order.').toBe(latestOrder[1]);
      return { sku, quantity: Number(quantity) };
    });
    expect(actualItems.sort((a, b) => a.sku.localeCompare(b.sku)), 'Order items must match the pre-confirm cart.')
      .toEqual([...expectedItems].sort((a, b) => a.sku.localeCompare(b.sku)));

    const itemQuantity = (sku: string) => expectedItems
      .filter(item => item.sku === sku).reduce((sum, item) => sum + item.quantity, 0);
    const simpleStock = (snapshot: string) => {
      const line = markerLines(snapshot, 'PRODUCT').find(value => value.startsWith('PRODUCT|PW-SIMPLE-001|'));
      if (!line) throw new Error('Checkout SQL evidence is missing simple-product stock.');
      return Number(line.split('|')[2]);
    };
    const variantStock = (snapshot: string) => markerLines(snapshot, 'VARIANT')
      .filter(value => value.startsWith('VARIANT|PW-SHIRT|'))
      .reduce((sum, value) => sum + Number(value.split('|')[2]), 0);
    expect(simpleStock(before) - simpleStock(after), 'Simple stock must decrease by ordered quantity.')
      .toBe(itemQuantity('PW-SIMPLE-001'));
    expect(variantStock(before) - variantStock(after), 'Variant stock must decrease by ordered quantity.')
      .toBe(itemQuantity('PW-SHIRT'));
  }

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
