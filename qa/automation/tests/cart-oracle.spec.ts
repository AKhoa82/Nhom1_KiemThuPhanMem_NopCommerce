import { expect, test } from '@playwright/test';
import { parseUsd } from './helpers/money';
import { cartCatalog, validateCatalogIds } from './helpers/cart-catalog';
import { assertCartState, readCartTotals } from './helpers/assertions';
import { classify } from '../reporters/pairwise-summary-reporter';
import { attachFailureLog } from './helpers/case-log';
import type { TestInfo } from '@playwright/test';

test('USD parser preserves cents, grouping and discount signs', () => {
  for (const [input, expected] of [['$1,234.56', 1234.56], ['-$40.00', -40], ['$0.01', 0.01], ['200.00 USD', 200], ['$10', 10]] as const) {
    expect(parseUsd(input)).toBe(expected);
  }
  for (const invalid of ['', 'Calculated during checkout', '$1.234,56', '$1,23.00', 'NaN', '$12.345']) {
    expect(() => parseUsd(invalid)).toThrow(/invalid USD/);
  }
});

test('catalog rejects missing, extra and duplicate case IDs', () => {
  const ids = cartCatalog.filter(item => item.group === 'PW').map(item => item.caseId);
  validateCatalogIds('PW', ids);
  for (const bad of [ids.slice(1), [...ids, 'PW-015'], [...ids.slice(1), ids[1]]]) {
    expect(() => validateCatalogIds('PW', bad)).toThrow(/catalog IDs differ/);
  }
});

test('report classification distinguishes blocked, harness and business failure', () => {
  expect(classify('skipped', 'FIXTURE_BLOCKED')).toBe('BLOCKED_ENVIRONMENT');
  expect(classify('skipped', '')).toBe('BLOCKED_ENVIRONMENT');
  expect(classify('failed', 'page.goto: net::ERR_EMPTY_RESPONSE at http://localhost/cart')).toBe('FAILED_ENVIRONMENT');
  expect(classify('failed', 'FAILED_AUTOMATION: missing total selector')).toBe('FAILED_AUTOMATION');
  expect(classify('failed', 'subtotal expected 300 actual 200')).toBe('FAILED_PRODUCT');
});

test('cart helper reads actual cents and rejects wrong line arithmetic', async ({ page }) => {
  await page.setContent(`<table class="cart"><tbody><tr><td><a class="product-name">Example</a><input class="qty-input" value="2"><span class="product-unit-price">$100.25</span><span class="product-subtotal">$200.50</span></td></tr></tbody></table>
    <table class="cart-total"><tr class="order-subtotal"><td class="value-summary">$200.50</td></tr><tr class="order-subtotal-discount"><td class="value-summary">-$20.05</td></tr><tr class="order-total"><td class="value-summary">$180.45</td></tr></table>`);
  const state = { lines: [{ product: 'Example', quantity: 2, unitPrice: 100.25, attributes: [] }], subtotal: 200.5, discount: 20.05, total: 180.45 };
  await assertCartState(page, state, 'OFFLINE');
  await page.locator('.product-subtotal').evaluate(node => { node.textContent = '$200.00'; });
  await expect(assertCartState(page, state, 'OFFLINE')).rejects.toThrow(/line total/);
});

test('non-USD working currency is reported as an automation failure', async ({ page }) => {
  await page.setContent(`<select id="customerCurrency"><option selected>Vietnamese Dong</option><option>US Dollar</option></select>
    <table class="cart-total"><tr class="order-subtotal"><td class="value-summary">200 ₫</td></tr><tr class="order-total"><td class="value-summary">200 ₫</td></tr></table>`);
  await expect(readCartTotals(page)).rejects.toThrow(/FAILED_AUTOMATION: working currency is 'Vietnamese Dong'/);
});

test('missing cart total never becomes a fabricated zero', async ({ page }) => {
  await page.setContent('<table class="cart"><tbody><tr><td>Item</td></tr></tbody></table>');
  await expect(readCartTotals(page)).rejects.toThrow(/FAILED_AUTOMATION/);
});

test('failure log keeps partial UI evidence when totals and SQL are unavailable', async ({ page }) => {
  await page.setContent('<div class="bar-notification error">Stock warning 5</div>');
  const attachments: Record<string, any> = {};
  const info = {
    status: 'failed', expectedStatus: 'passed', testId: 'offline-diagnostic',
    annotations: [{ type: 'caseId', description: 'PW-004' }], errors: [{ message: 'rejected stock update' }],
    attach: async (name: string, options: unknown) => { attachments[name] = options; },
  } as unknown as TestInfo;
  await attachFailureLog(page, info, async () => { throw new Error('offline SQL'); });
  const log = JSON.parse(attachments['failure-log.json'].body);
  expect(log.caseId).toBe('PW-004');
  expect(log.actual.warnings).toEqual(['Stock warning 5']);
  expect(log.actual.totalsError).toContain('FAILED_AUTOMATION');
  expect(log.sqlSnapshot.collectionError).toContain('offline SQL');
  expect(attachments['failure-cart.png'].body.length).toBeGreaterThan(0);
});
