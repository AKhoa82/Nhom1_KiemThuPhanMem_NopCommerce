import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  assertCartEmpty,
  assertCartLine,
  assertCartLineCount,
  assertCouponResult,
  assertStockBlocked,
} from './helpers/assertions';
import {
  addOutOfStockProduct,
  addSimpleProduct,
  addVariantProduct,
  applyCouponCode,
  invalidCoupon,
  loginRegisteredCustomer,
  removeCartLine,
  updateCartLine,
  validCoupon,
} from './helpers/cart-checkout';
import { FixtureBlockedError, resetFixture } from './helpers/fixtures';
import { loadPairwiseCases } from './helpers/pairwise-data';
import { queryCartFixtureState } from './helpers/sql-fixture';
import { runtimeConfig } from './helpers/runtime-config';

const simple = 'PW-Simple-Stock';
const variant = 'PW-Shirt-Variants';
const resetRow = loadPairwiseCases().find((row) => row.caseId === 'PW-001');

if (!resetRow) throw new Error('PW-001 is required as the local Cart fixture reset row.');

const priorityByCase: Record<string, string> = {
  'CART-01': 'P2',
  'CART-02': 'P1',
  'CART-03': 'P2',
  'CART-04': 'P1',
  'CART-05': 'P1',
  'CART-06': 'P2',
  'CART-07': 'P1',
  'CART-08': 'P2',
  'CART-09': 'P2',
  'CART-10': 'P1',
  'CART-11': 'P1',
  'CART-12': 'P2',
  'CART-13': 'P1',
  'CART-14': 'P1',
  'CART-REPEAT-01': 'P1',
};

function amountText(page: Page, rowClass: string): ReturnType<Page['locator']> {
  return page.locator(`.cart-total .${rowClass} .value-summary`);
}

async function expectAmount(page: Page, rowClass: string, expected: number): Promise<void> {
  const variants = [
    String(expected),
    expected.toLocaleString('en-US'),
    expected.toLocaleString('de-DE'),
  ].map((value) => value.replace(/[.,]/g, '[.,]?'));
  await expect(amountText(page, rowClass)).toContainText(new RegExp(`(?:${variants.join('|')})(?:\\.00)?`));
}

async function assertFixtureContains(testInfo: TestInfo, pattern: RegExp): Promise<void> {
  const state = await queryCartFixtureState();
  await testInfo.attach('cart-fixture-sql.txt', { body: state, contentType: 'text/plain' });
  expect(state).toMatch(pattern);
}

test.describe('SCRUM-82 Cart risk acceptance', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const caseId = testInfo.title.match(/\bCART-(?:0[1-9]|1[0-4])\b|\bCART-REPEAT-01\b/)?.[0] ?? '';
    testInfo.annotations.push({ type: 'scenario', description: caseId });
    testInfo.annotations.push({ type: 'priority', description: priorityByCase[caseId] ?? 'P1' });
    testInfo.annotations.push({ type: 'case-link', description: 'qa/automation/tests/cart-risk.spec.ts' });

    test.skip(!runtimeConfig.sqlPassword, 'Blocked: QA_SQL_PASSWORD is not configured.');
    test.skip(!runtimeConfig.registeredEmail, 'Blocked: QA_REGISTERED_EMAIL is not configured.');
    test.skip(!runtimeConfig.registeredPassword, 'Blocked: QA_REGISTERED_PASSWORD is not configured.');

    try {
      await resetFixture(page, resetRow);
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }
    await loginRegisteredCustomer(page);
  });

  test('CART-01: thêm sản phẩm hợp lệ', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 2);
    await assertCartLine(page, simple, 2);
    await expectAmount(page, 'order-subtotal', 200);
    await expectAmount(page, 'order-total', 200);
    await assertFixtureContains(testInfo, /PRODUCT\|PW-SIMPLE-001\|10/);
    await assertFixtureContains(testInfo, /CART\|PW-SIMPLE-001\|2\|/);
  });

  test('CART-02: thêm sản phẩm có biến thể', async ({ page }, testInfo) => {
    await addVariantProduct(page, 2, 'RedS');
    await assertCartLine(page, variant, 2, ['Red', 'S']);
    await expectAmount(page, 'order-subtotal', 400);
    await assertFixtureContains(testInfo, /VARIANT\|PW-SHIRT\|5\|/);
    await assertFixtureContains(testInfo, /CART\|PW-SHIRT\|2\|/);
  });

  test('CART-03: thêm sản phẩm với quantity bằng 1', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 1);
    await assertCartLine(page, simple, 1);
    await expectAmount(page, 'order-subtotal', 100);
    await assertFixtureContains(testInfo, /CART\|PW-SIMPLE-001\|1\|/);
  });

  test('CART-04: thêm nhiều sản phẩm khác nhau', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 1);
    await addVariantProduct(page, 1, 'BlueM');
    await assertCartLineCount(page, 2);
    await assertCartLine(page, simple, 1);
    await assertCartLine(page, variant, 1, ['Blue', 'M']);
    await expectAmount(page, 'order-subtotal', 300);
    await assertFixtureContains(testInfo, /CART\|PW-SIMPLE-001\|1\|/);
    await assertFixtureContains(testInfo, /CART\|PW-SHIRT\|1\|/);
  });

  test('CART-05: cập nhật quantity trong tồn kho', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 2);
    await updateCartLine(page, simple, 4);
    await assertCartLine(page, simple, 4);
    await expectAmount(page, 'order-subtotal', 400);
    await assertFixtureContains(testInfo, /CART\|PW-SIMPLE-001\|4\|/);
  });

  test('CART-06: xóa một item và giữ lại item còn lại', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 1);
    await addVariantProduct(page, 1, 'BlueM');
    await removeCartLine(page, simple);
    await assertCartLineCount(page, 1);
    await assertCartLine(page, variant, 1, ['Blue', 'M']);
    await expectAmount(page, 'order-subtotal', 200);
    await assertFixtureContains(testInfo, /CART\|PW-SHIRT\|1\|/);
    await assertFixtureContains(testInfo, /PRODUCT\|PW-SIMPLE-001\|10/);
  });

  test('CART-07: từ chối quantity vượt tồn kho', async ({ page }, testInfo) => {
    await addVariantProduct(page, 4, 'RedS');
    await updateCartLine(page, variant, 6);
    await assertStockBlocked(page);
    await assertCartLine(page, variant, 4, ['Red', 'S']);
    await assertFixtureContains(testInfo, /VARIANT\|PW-SHIRT\|5\|/);
    await assertFixtureContains(testInfo, /CART\|PW-SHIRT\|4\|/);
  });

  test('CART-08: xóa item cuối cùng làm cart rỗng', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 1);
    await removeCartLine(page, simple);
    await assertCartEmpty(page);
    await assertFixtureContains(testInfo, /PRODUCT\|PW-SIMPLE-001\|10/);
    await expect((await queryCartFixtureState()).match(/^CART\|/gm) ?? []).toHaveLength(0);
  });

  test('CART-09: mở cart khi chưa có sản phẩm', async ({ page }, testInfo) => {
    await page.goto('/cart');
    await assertCartEmpty(page);
    await assertFixtureContains(testInfo, /PRODUCT\|PW-SIMPLE-001\|10/);
    await expect((await queryCartFixtureState()).match(/^CART\|/gm) ?? []).toHaveLength(0);
  });

  test('CART-10: chặn thêm sản phẩm hết hàng', async ({ page }, testInfo) => {
    await addOutOfStockProduct(page);
    await assertStockBlocked(page);
    await page.goto('/cart');
    await assertCartEmpty(page);
    await assertFixtureContains(testInfo, /PRODUCT\|PW-OOS-001\|0/);
    await expect((await queryCartFixtureState()).match(/^CART\|PW-OOS-001\|/gm) ?? []).toHaveLength(0);
  });

  test('CART-11: áp dụng coupon hợp lệ', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 2);
    await applyCouponCode(page, validCoupon);
    await assertCouponResult(page, 'Valid');
    await expectAmount(page, 'order-subtotal', 200);
    await expectAmount(page, 'order-total', 180);
    await assertFixtureContains(testInfo, /DISCOUNT\|PW-CART-10PCT\|10(?:\.0+)?\|1/);
    await assertFixtureContains(testInfo, /COUPON\|.*PW-CART-10PCT/i);
  });

  test('CART-12: từ chối coupon không hợp lệ', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 2);
    await page.goto('/cart');
    await expectAmount(page, 'order-subtotal', 200);
    await expectAmount(page, 'order-total', 200);
    await applyCouponCode(page, invalidCoupon);
    await assertCouponResult(page, 'Invalid');
    await expectAmount(page, 'order-subtotal', 200);
    await expectAmount(page, 'order-total', 200);
    await assertFixtureContains(testInfo, /DISCOUNT\|PW-CART-10PCT\|10(?:\.0+)?\|1/);
  });

  test('CART-13: đối chiếu subtotal, discount và total', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 1);
    await addVariantProduct(page, 2, 'RedS');
    await page.goto('/cart');
    await expectAmount(page, 'order-subtotal', 500);
    await applyCouponCode(page, validCoupon);
    await assertCouponResult(page, 'Valid');
    await expectAmount(page, 'order-subtotal', 500);
    await expectAmount(page, 'order-subtotal-discount', 50);
    await expectAmount(page, 'order-total', 450);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectAmount(page, 'order-total', 450);
    await assertFixtureContains(testInfo, /CART\|PW-SIMPLE-001\|1\|/);
    await assertFixtureContains(testInfo, /CART\|PW-SHIRT\|2\|/);
    await assertFixtureContains(testInfo, /COUPON\|.*PW-CART-10PCT/i);
  });

  test('CART-14: thêm sản phẩm đúng bằng tồn kho', async ({ page }, testInfo) => {
    await addSimpleProduct(page, 10);
    await assertCartLine(page, simple, 10);
    await expectAmount(page, 'order-subtotal', 1000);
    await assertFixtureContains(testInfo, /PRODUCT\|PW-SIMPLE-001\|10/);
    await assertFixtureContains(testInfo, /CART\|PW-SIMPLE-001\|10\|/);
  });

  test('CART-REPEAT-01: gộp cùng variant và tách khác variant', async ({ page }, testInfo) => {
    await addVariantProduct(page, 2, 'RedS');
    await addVariantProduct(page, 3, 'RedS');
    await page.goto('/cart');
    const redLines = page.locator('table.cart tbody tr').filter({ hasText: variant }).filter({ hasText: 'Red' });
    const stateAfterRepeat = await queryCartFixtureState();
    await testInfo.attach('cart-repeat-sql.txt', { body: stateAfterRepeat, contentType: 'text/plain' });
    await expect(redLines, 'Cùng product + variant phải gộp thành một dòng.').toHaveCount(1);
    await expect(redLines.locator('input.qty-input')).toHaveValue('5');

    await addVariantProduct(page, 1, 'BlueM');
    await assertCartLineCount(page, 2);
    await assertCartLine(page, variant, 5, ['Red', 'S']);
    await expect(page.locator('table.cart tbody tr').filter({ hasText: variant }).filter({ hasText: 'Blue' })).toHaveCount(1);
    const state = await queryCartFixtureState();
    await testInfo.attach('cart-repeat-sql.txt', { body: state, contentType: 'text/plain' });
    expect(state.match(/^CART\|PW-SHIRT\|/gm) ?? []).toHaveLength(2);
  });

  test.afterEach(async ({}, testInfo) => {
    try {
      const state = await queryCartFixtureState();
      await testInfo.attach('cart-fixture-sql-final.txt', { body: state, contentType: 'text/plain' });
    } catch {
      // Keep the primary test assertion as the useful failure signal.
    }
  });
});
