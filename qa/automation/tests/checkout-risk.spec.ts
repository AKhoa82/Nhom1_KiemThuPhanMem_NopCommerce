import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import {
  assertCheckoutCartCount,
  assertCheckoutOrderCountUnchanged,
} from './helpers/assertions';
import {
  addSimpleProduct,
  addVariantProduct,
  beginCheckout,
  loginRegisteredCustomer,
  reachShippingMethod,
} from './helpers/cart-checkout';
import { FixtureBlockedError, resetFixture, type FixtureBaseline } from './helpers/fixtures';
import { loadPairwiseCases } from './helpers/pairwise-data';
import { runtimeConfig } from './helpers/runtime-config';
import { executeReadonlySql, queryCheckoutEvidence } from './helpers/sql-fixture';

const resetRow = loadPairwiseCases().find(row => row.caseId === 'PW-006');
if (!resetRow) throw new Error('PW-006 is required for checkout shipping-risk fixture reset.');
const execFile = promisify(execFileCallback);

const missingEnvironment = (): string | undefined => {
  const missing: string[] = [];
  if (!runtimeConfig.sqlPassword) missing.push('QA_SQL_PASSWORD');
  if (!runtimeConfig.registeredEmail) missing.push('QA_REGISTERED_EMAIL');
  if (!runtimeConfig.registeredPassword) missing.push('QA_REGISTERED_PASSWORD');
  if (!runtimeConfig.billing.email) missing.push('QA_BILLING_EMAIL');
  return missing.length ? `Blocked: environment/fixture is not configured: ${missing.join(', ')}.` : undefined;
};

async function prepareShipping(page: Page): Promise<FixtureBaseline> {
  const baseline = await resetFixture(page, resetRow!);
  await loginRegisteredCustomer(page);
  await addSimpleProduct(page, 1);
  await beginCheckout(page);
  await reachShippingMethod(page);
  return baseline;
}

async function submitShippingValue(page: Page, value: string): Promise<void> {
  const form = page.locator('form').filter({ has: page.locator('input[name="shippingoption"]') }).first();
  await expect(form).toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    form.evaluate((element, selectedValue) => {
      const shipping = element.querySelector<HTMLInputElement>('input[name="shippingoption"]');
      if (!shipping) throw new Error('Shipping option input is missing.');
      shipping.checked = true;
      shipping.value = selectedValue;
      let next = element.querySelector<HTMLInputElement>('input[name="nextstep"]');
      if (!next) {
        next = document.createElement('input');
        next.type = 'hidden';
        next.name = 'nextstep';
        element.append(next);
      }
      next.value = 'Next';
      (element as HTMLFormElement).submit();
    }, value),
  ]);
}

async function attachEvidence(testInfo: TestInfo, name: string, snapshot: string): Promise<void> {
  await testInfo.attach(name, { body: snapshot, contentType: 'text/plain' });
}

test.describe('SCRUM-112 checkout shipping risks', () => {
  test.beforeEach(async ({}, testInfo) => {
    const blocked = missingEnvironment();
    test.skip(Boolean(blocked), blocked ?? 'Environment is not configured.');
    testInfo.annotations.push({ type: 'checkout-mode', description: process.env.QA_CHECKOUT_MODE ?? 'UNSPECIFIED' });
  });

  test('SHP-01: selected local shipping option survives returning to the step', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'scenario', description: 'SHP-01' });
    let baseline: FixtureBaseline;
    try {
      baseline = await prepareShipping(page);
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }

    const before = baseline.checkoutEvidenceBefore;
    if (!before) throw new Error('SHP-01 requires checkout SQL baseline evidence.');
    await attachEvidence(testInfo, 'shp-01-before.sql.txt', before);

    const ground = page.locator('input[name="shippingoption"][value^="Ground___"]');
    await expect(ground).toHaveCount(1);
    const selectedValue = await ground.inputValue();
    await ground.check();
    await page.locator('.shipping-method-next-step-button').click();
    await expect(page).toHaveURL(/checkout\/(paymentmethod|paymentinfo|confirm)/i);

    await page.goto('/checkout/shippingmethod', { waitUntil: 'domcontentloaded' });
    const selectedGround = page.locator('input[name="shippingoption"][value^="Ground___"]');
    await expect(selectedGround).toBeChecked();
    await expect(selectedGround).toHaveValue(selectedValue);

    const after = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await attachEvidence(testInfo, 'shp-01-after.sql.txt', after);
    assertCheckoutOrderCountUnchanged(before, after);
    assertCheckoutCartCount(after, 1);
  });

  for (const [caseId, value] of [
    ['SHP-02-DS01', ''],
    ['SHP-02-DS02', 'invalid-value'],
    ['SHP-02-DS03', 'Unknown___Shipping.FixedByWeightByTotal'],
  ] as const) {
    test(`${caseId}: invalid shipping option is not accepted`, async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'scenario', description: caseId.startsWith('SHP-02') ? 'SHP-02' : caseId });
      let baseline: FixtureBaseline;
      try {
        baseline = await prepareShipping(page);
      } catch (error) {
        if (error instanceof FixtureBlockedError) {
          test.skip(true, error.message);
          return;
        }
        throw error;
      }

      const before = baseline.checkoutEvidenceBefore;
      if (!before) throw new Error(`${caseId} requires checkout SQL baseline evidence.`);
      await attachEvidence(testInfo, `${caseId}-before.sql.txt`, before);

      await submitShippingValue(page, value);
      await expect(page).toHaveURL(/checkout\/shippingmethod/i);
      await expect(page).not.toHaveURL(/checkout\/(paymentmethod|paymentinfo|confirm|completed)/i);

      const after = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
      await attachEvidence(testInfo, `${caseId}-after.sql.txt`, after);
      assertCheckoutOrderCountUnchanged(before, after);
      assertCheckoutCartCount(after, 1);
      expect(after).not.toContain(`ATTR|SelectedShippingOption|${value}`);
    });
  }

  test('PAY-FAIL-01: local decline keeps cart and does not create an order', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'scenario', description: 'PAY-FAIL-01' });
    let baseline: FixtureBaseline;
    try {
      baseline = await prepareShipping(page);
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }

    const before = baseline.checkoutEvidenceBefore;
    if (!before) throw new Error('PAY-FAIL-01 requires checkout SQL baseline evidence.');
    await attachEvidence(testInfo, 'pay-fail-01-before.sql.txt', before);

    const qaDecline = page.locator('input[name="paymentmethod"][value="Payments.QaDecline"]');
    if (await qaDecline.count() !== 1) {
      test.skip(true, 'FIXTURE_BLOCKED: Payments.QaDecline is not active. Install and activate the QA-only local plugin before this test.');
      return;
    }
    await qaDecline.check();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.locator('.payment-method-next-step-button').click(),
    ]);
    await expect(page).toHaveURL(/checkout\/confirm/i);

    const decline = async (name: string): Promise<string> => {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.locator('.confirm-order-next-step-button').click(),
      ]);
      await expect(page).toHaveURL(/checkout\/confirm/i);
      await expect(page.locator('.message-error')).toContainText('QA decline');
      const snapshot = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
      await attachEvidence(testInfo, name, snapshot);
      assertCheckoutOrderCountUnchanged(before, snapshot);
      assertCheckoutCartCount(snapshot, 1);
      return snapshot;
    };

    await decline('pay-fail-01-after-first-decline.sql.txt');
    await decline('pay-fail-01-after-retry.sql.txt');
  });

  test('INV-01: stock reduction before confirm blocks checkout', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'scenario', description: 'INV-01' });
    let baseline: FixtureBaseline;
    try {
      baseline = await resetFixture(page, resetRow!);
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }

    await loginRegisteredCustomer(page);
    await addSimpleProduct(page, 5);
    await beginCheckout(page);
    await reachShippingMethod(page);

    const shipping = page.locator('input[name="shippingoption"]').first();
    await shipping.check();
    await page.locator('.shipping-method-next-step-button').click();
    await expect(page).toHaveURL(/checkout\/(paymentmethod|paymentinfo|confirm)/i);

    if (await page.locator('input[name="paymentmethod"]').count()) {
      await page.locator('input[name="paymentmethod"][value="Payments.CheckMoneyOrder"]').check();
      await page.locator('.payment-method-next-step-button').click();
    }
    if (await page.locator('.payment-info-next-step-button').count()) {
      await page.locator('.payment-info-next-step-button').click();
    }
    await expect(page).toHaveURL(/checkout\/confirm/i);

    const before = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await attachEvidence(testInfo, 'inv-01-before.sql.txt', before);

    // Direct SQL changes bypass nopCommerce's inventory cache. Restart the local
    // web container so Confirm reads the new stock value, then verify the setup.
    await executeReadonlySql("UPDATE Product SET StockQuantity = 4 WHERE Sku = 'PW-SIMPLE-001'");
    await execFile('docker.exe', ['restart', runtimeConfig.storeContainer], {
      windowsHide: true,
      timeout: 30_000,
    });
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const response = await page.request.get('/', { timeout: 5_000 });
        if (response.ok()) break;
      } catch {
        // The local web container is still restarting.
      }
      await page.waitForTimeout(1_000);
    }
    const reducedStock = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await attachEvidence(testInfo, 'inv-01-stock-reduced.sql.txt', reducedStock);
    expect(reducedStock).toContain('PRODUCT|PW-SIMPLE-001|4');

    // Customer clicks Confirm
    await page.locator('.confirm-order-next-step-button').click();
    await page.waitForLoadState('domcontentloaded');

    // Expected: checkout does not complete, warning displayed or redirected to cart with warning
    await expect(page).not.toHaveURL(/checkout\/completed/i);
    await expect(
      page.locator('.message-error, .bar-notification.error, .bar-notification.warning, .order-summary-content')
        .filter({ hasText: /\S/ })
        .first()
    ).toBeVisible();

    const after = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await attachEvidence(testInfo, 'inv-01-after.sql.txt', after);
    assertCheckoutOrderCountUnchanged(before, after);
    assertCheckoutCartCount(after, 1);
    expect(after).toContain('PRODUCT|PW-SIMPLE-001|4');
  });

  test('CART-MERGE-01: guest cart merges correctly with registered user cart', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'scenario', description: 'CART-MERGE-01' });
    let baseline: FixtureBaseline;
    try {
      baseline = await resetFixture(page, resetRow!);
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }

    // 1. Prepare registered customer cart with 1 simple product and 1 variant (Blue M)
    await loginRegisteredCustomer(page);
    await addSimpleProduct(page, 1);
    await addVariantProduct(page, 1, 'BlueM');
    // Log out to return to anonymous guest session
    await page.locator('a.ico-logout').click();
    await page.waitForLoadState('domcontentloaded');

    // 2. Prepare guest cart with 1 simple product (duplicate SKU) and 1 different variant (Red S)
    await addSimpleProduct(page, 1);
    await addVariantProduct(page, 1, 'RedS');

    // 3. Log in as registered customer from guest session
    await page.goto('/login');
    await page.locator('#Email').fill(runtimeConfig.registeredEmail);
    await page.locator('#Password').fill(runtimeConfig.registeredPassword);
    await page.locator('button.login-button').click();
    await expect(page.locator('a.ico-account')).toBeVisible();

    // 4. Verify merged cart on /cart
    await page.goto('/cart');
    await expect(page.locator('table.cart tbody tr')).toHaveCount(3);

    // Simple product merged to quantity 2
    const simpleLine = page.locator('table.cart tbody tr').filter({ hasText: 'PW-Simple-Stock' });
    await expect(simpleLine.locator('input.qty-input')).toHaveValue('2');

    // Red S variant line has quantity 1
    const redLine = page.locator('table.cart tbody tr').filter({ hasText: 'Red' });
    await expect(redLine.locator('input.qty-input')).toHaveValue('1');

    // Blue M variant line has quantity 1
    const blueLine = page.locator('table.cart tbody tr').filter({ hasText: 'Blue' });
    await expect(blueLine.locator('input.qty-input')).toHaveValue('1');

    // Snapshot evidence
    const snapshot = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await attachEvidence(testInfo, 'cart-merge-01-after.sql.txt', snapshot);
    assertCheckoutCartCount(snapshot, 3);
  });

  test('CHK-RACE-01: concurrent confirm order requests prevent double order creation', async ({ page, request }, testInfo) => {
    testInfo.annotations.push({ type: 'scenario', description: 'CHK-RACE-01' });
    let baseline: FixtureBaseline;
    try {
      baseline = await resetFixture(page, resetRow!);
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }

    await loginRegisteredCustomer(page);
    await addSimpleProduct(page, 1);
    await beginCheckout(page);
    await reachShippingMethod(page);

    // Proceed to confirm order page
    const shipping = page.locator('input[name="shippingoption"]').first();
    await shipping.check();
    await page.locator('.shipping-method-next-step-button').click();
    await expect(page).toHaveURL(/checkout\/(paymentmethod|paymentinfo|confirm)/i);

    if (await page.locator('input[name="paymentmethod"]').count()) {
      await page.locator('input[name="paymentmethod"][value="Payments.CheckMoneyOrder"]').check();
      await page.locator('.payment-method-next-step-button').click();
    }
    if (await page.locator('.payment-info-next-step-button').count()) {
      await page.locator('.payment-info-next-step-button').click();
    }
    await expect(page).toHaveURL(/checkout\/confirm/i);

    const before = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await attachEvidence(testInfo, 'chk-race-01-before.sql.txt', before);

    // Extract cookies and form parameters for concurrent POST requests
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const token = await page.locator('input[name="__RequestVerificationToken"]').first().inputValue().catch(() => '');

    const confirmUrl = new URL('/checkout/confirm', process.env.NOP_BASE_URL ?? 'http://localhost/').toString();
    const headers = {
      'Cookie': cookieHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': await page.evaluate(() => navigator.userAgent),
    };
    const body = token ? `__RequestVerificationToken=${encodeURIComponent(token)}&nextstep=Confirm` : 'nextstep=Confirm';

    // Barrier: dispatch both requests concurrently
    const t0 = Date.now();
    const [res1, res2] = await Promise.all([
      request.post(confirmUrl, { headers, data: body }),
      request.post(confirmUrl, { headers, data: body }),
    ]);
    const elapsed = Date.now() - t0;
    const responseBodies = await Promise.all([res1.text(), res2.text()]);
    const exposedSqlError = responseBodies.map(text =>
      /Cannot insert duplicate key|AK_Order_OrderGuid|SqlException|Microsoft\.Data\.SqlClient/i.test(text));

    const responseLog = [
      `Request 1: Status ${res1.status()} (${res1.statusText()})`,
      `Request 2: Status ${res2.status()} (${res2.statusText()})`,
      `SQL error exposed in response 1: ${exposedSqlError[0]}`,
      `SQL error exposed in response 2: ${exposedSqlError[1]}`,
      `Elapsed: ${elapsed}ms`,
    ].join('\n');
    await attachEvidence(testInfo, 'chk-race-01-responses.txt', responseLog);

    const after = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await attachEvidence(testInfo, 'chk-race-01-after.sql.txt', after);

    // Database check: At most 1 order must be created
    const beforeCount = Number(before.split('\n').find(l => l.startsWith('ORDER_COUNT|'))?.split('|')[1] || '0');
    const afterCount = Number(after.split('\n').find(l => l.startsWith('ORDER_COUNT|'))?.split('|')[1] || '0');
    const orderDelta = afterCount - beforeCount;

    expect(orderDelta, `Expected exactly one order from the two valid Confirm requests, found ${orderDelta}.`).toBe(1);
    expect(exposedSqlError, 'A customer-facing response exposed a raw SQL exception.').toEqual([false, false]);
  });
});

