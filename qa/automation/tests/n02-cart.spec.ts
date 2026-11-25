import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { assertCartLine, assertCartLineCount, assertCartState, readCartTotals, cartWarnings } from './helpers/assertions';
import { addVariantProduct, loginRegisteredCustomer, updateCartLine } from './helpers/cart-checkout';
import { FixtureBlockedError } from './helpers/fixtures';
import { currentCustomerGuid, n02StoreId, resetN02Fixture } from './helpers/n02-fixture';
import { runtimeConfig } from './helpers/runtime-config';
import { executeReadonlySql, queryN02CartState } from './helpers/sql-fixture';

import { cartCase, validateCatalogIds } from './helpers/cart-catalog';
import { annotateCase, attachFailureLog, step } from './helpers/case-log';
import { verifyCartManifest } from './helpers/cart-preflight';
import { readFileSync } from 'node:fs';
import { parseCsv } from './helpers/pairwise-data';

const n02Rows = parseCsv(readFileSync(resolve(__dirname, '../../pairwise/n02-cart/generated-cases.csv'), 'utf8'), 'N02 generated CSV');
if (n02Rows.length !== 8 || n02Rows.some((row, i) => row.CaseId !== `N02-PW-${String(i + 1).padStart(3, '0')}`)) throw new Error('FAILED_AUTOMATION: N02 generated case IDs differ');
validateCatalogIds('ADV', [...n02Rows.map(row => row.ExistingUiTest), 'MERGE-MIXED', 'MERGE-MULTISTORE', 'MERGE-ACTIVATION']);

const product = 'PW-Shirt-Variants';
const unitPrice = 200; // Existing PW-SHIRT local fixture; check the fixture version before a run.
const baseURL = process.env.NOP_BASE_URL ?? 'http://localhost/';
const guestGuidByTest = new Map<string, string>();

type Variant = 'RedS' | 'BlueM';

async function screenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(`${name}.png`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

async function cartSnapshot(testInfo: TestInfo, name: string): Promise<void> {
  const guestGuid = guestGuidByTest.get(testInfo.testId);
  if (!guestGuid) throw new FixtureBlockedError('FIXTURE_BLOCKED: guest GUID was not captured for N02 SQL evidence.');
  await testInfo.attach(`${name}.sql.txt`, {
    body: await queryN02CartState(
      guestGuid,
      testInfo.title.startsWith('CART-MERGE-01') ? runtimeConfig.registeredEmail : '',
      n02StoreId,
    ),
    contentType: 'text/plain',
  });
}

async function expectAmount(page: Page, rowClass: string, amount: number): Promise<void> {
  const totals = await readCartTotals(page);
  expect(totals[rowClass === 'order-subtotal' ? 'subtotal' : 'total'], `[${test.info().title}] ${rowClass}: expected ${amount}`).toBe(amount);
  expect(totals.discount, `[${test.info().title}] discount: expected 0, actual ${totals.discount}`).toBe(0);
}

async function cartLine(page: Page, variant: Variant) {
  const attributes = variant === 'RedS' ? ['Red', 'S'] : ['Blue', 'M'];
  let line = page.locator('table.cart tbody tr').filter({ hasText: product });
  for (const attribute of attributes) line = line.filter({ hasText: attribute });
  return line;
}

async function assertN02State(page: Page, quantities: [Variant, number][], caseId: string): Promise<void> {
  const lines = quantities.map(([variant, quantity]) => ({
    product, quantity, unitPrice, attributes: variant === 'RedS' ? ['Red', 'S'] : ['Blue', 'M'],
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * unitPrice, 0);
  await assertCartState(page, { lines, subtotal, discount: 0, total: subtotal }, caseId);
}

async function prepareMerge(
  page: Page,
  testInfo: TestInfo,
  accountQuantity: number,
  guestQuantity: number,
  guestVariant: Variant = 'RedS',
  expectRejectedLogin = false,
): Promise<{ guestCookie: string; feedback: string }> {
  await loginRegisteredCustomer(page);
  await addVariantProduct(page, accountQuantity, 'RedS');
  await page.goto('/cart');
  await assertCartLine(page, product, accountQuantity, ['Red', 'S']);
  await assertN02State(page, [['RedS', accountQuantity]], 'MERGE/account-before');
  await screenshot(page, testInfo, 'account-before-login');
  await cartSnapshot(testInfo, 'account-before-login');

  await page.locator('a.ico-logout').click();
  await addVariantProduct(page, guestQuantity, guestVariant);
  await page.goto('/cart');
  const guestCookie = (await page.context().cookies()).find(cookie => cookie.name === '.Nop.Customer');
  if (!guestCookie) throw new FixtureBlockedError('FIXTURE_BLOCKED: guest customer cookie is unavailable.');
  guestGuidByTest.set(testInfo.testId, guestCookie.value);
  await assertCartLine(page, product, guestQuantity, guestVariant === 'RedS' ? ['Red', 'S'] : ['Blue', 'M']);
  await assertN02State(page, [[guestVariant, guestQuantity]], 'MERGE/guest-before');
  await screenshot(page, testInfo, 'guest-before-login');
  await cartSnapshot(testInfo, 'guest-before-login');

  if (expectRejectedLogin) {
    await page.goto('/login');
    await page.locator('#Email').fill(runtimeConfig.registeredEmail);
    await page.locator('#Password').fill(runtimeConfig.registeredPassword);
    await page.locator('button.login-button').click();
    await expect(page).toHaveURL(/\/cart/i);
    await expect(page.locator('a.ico-login')).toBeVisible();
    await expect(page.locator('.bar-notification.warning')).toHaveCSS('opacity', '1');
  } else {
    await loginRegisteredCustomer(page);
  }
  const notices = await page.locator(
    '.bar-notification.error, .bar-notification.warning, .message-error, .message-failure',
  ).all();
  const feedback = (await Promise.all(notices.map(async notice => (
    await notice.isVisible() ? (await notice.innerText()).trim() : ''
  )))).filter(Boolean).join('\n');
  await testInfo.attach('login-feedback.txt', { body: feedback || '(no visible error/warning text)', contentType: 'text/plain' });
  await screenshot(page, testInfo, 'after-login');
  if (expectRejectedLogin) {
    const originalViewport = page.viewportSize();
    await page.setViewportSize({ width: 390, height: 844 });
    const warningFits = await page.locator('.bar-notification.warning').evaluate(element =>
      element.scrollWidth <= element.clientWidth + 1);
    expect(warningFits, 'Warning should fit a 390px mobile viewport without horizontal overflow.').toBe(true);
    await screenshot(page, testInfo, 'after-login-mobile');
    if (originalViewport) await page.setViewportSize(originalViewport);
  }
  if (expectRejectedLogin) expect(feedback, '[MERGE-OVER] stock warning must name limit 5').toMatch(/\b5\b/);
  await page.goto('/cart');
  await screenshot(page, testInfo, expectRejectedLogin ? 'guest-after-rejected-login' : 'account-after-login');
  await cartSnapshot(testInfo, expectRejectedLogin ? 'guest-after-rejected-login' : 'account-after-login');
  return { guestCookie: guestCookie.value, feedback };
}

async function inspectOriginalGuestCart(
  browser: Browser,
  testInfo: TestInfo,
  cookieValue: string,
  variant: Variant = 'RedS',
): Promise<number> {
  const context = await browser.newContext({ baseURL });
  try {
    await context.addCookies([{ name: '.Nop.Customer', value: cookieValue, url: baseURL }]);
    const guestPage = await context.newPage();
    await guestPage.goto('/cart');
    await screenshot(guestPage, testInfo, 'original-guest-after-login');
    const line = await cartLine(guestPage, variant);
    if (await line.count() === 0) return 0;
    return Number(await line.locator('input.qty-input').inputValue());
  } finally {
    await context.close();
  }
}

test.describe('SCRUM-86 N02 Cart UI and automation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    annotateCase(testInfo, testInfo.title.match(/(?:MERGE|REPEAT)-[A-Z]+/)![0]);
    testInfo.annotations.push({ type: 'jira', description: 'SCRUM-86' });
    const needsRegisteredCustomer = testInfo.title.startsWith('CART-MERGE-01');
    const missing = [
      !runtimeConfig.sqlPassword && 'QA_SQL_PASSWORD',
      needsRegisteredCustomer && !runtimeConfig.registeredEmail && 'QA_REGISTERED_EMAIL',
      needsRegisteredCustomer && !runtimeConfig.registeredPassword && 'QA_REGISTERED_PASSWORD',
    ].filter(Boolean);
    test.skip(missing.length > 0, `FIXTURE_BLOCKED: missing ${missing.join(', ')}.`);
    let response;
    try {
      response = await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout: 10_000 });
    } catch (error) {
      test.skip(true, `FIXTURE_BLOCKED: N02 storefront is unavailable: ${String(error)}`);
      return;
    }
    expect(response?.ok(), 'N02 storefront /cart must respond successfully.').toBeTruthy();
    try {
      const guestGuid = await currentCustomerGuid(page);
      guestGuidByTest.set(testInfo.testId, guestGuid);
      const resetReceipt = await step('N02 reset isolated fixture', () => resetN02Fixture(page, guestGuid, needsRegisteredCustomer));
      const manifestReceipt = await step('N02 manifest preflight', () => verifyCartManifest(false, true));
      await testInfo.attach('manifest-preflight.txt', { body: manifestReceipt, contentType: 'text/plain' });
      await testInfo.attach('n02-reset.txt', { body: resetReceipt, contentType: 'text/plain' });
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }
    await cartSnapshot(testInfo, 'reset-baseline');
  });

  test.afterEach(async ({ page }, info) => {
    const sql = () => queryN02CartState(guestGuidByTest.get(info.testId)!, info.title.startsWith('CART-MERGE-01') ? runtimeConfig.registeredEmail : '', n02StoreId);
    try {
      if (info.status === 'passed') {
        const id = info.annotations.find(a => a.type === 'caseId')!.description!;
        await step(`${id} final cart oracle`, () => assertCartState(page, cartCase(id).expected, id));
      }
    } catch (error) {
      await attachFailureLog(page, info, sql, true);
      throw error;
    } finally {
      await attachFailureLog(page, info, sql);
      guestGuidByTest.delete(info.testId);
    }
  });

  test('CART-MERGE-01 MERGE-OVER: guest items are not silently lost above stock', async ({ page, browser }, testInfo) => {
    testInfo.annotations.push({ type: 'defect', description: 'SCRUM-96' });
    const { guestCookie, feedback } = await prepareMerge(page, testInfo, 4, 2, 'RedS', true);
    const guestQuantity = await inspectOriginalGuestCart(browser, testInfo, guestCookie);
    await assertCartLine(page, product, 2, ['Red', 'S']);
    await assertN02State(page, [['RedS', 2]], 'MERGE-OVER/rejected-guest');
    const accountContext = await browser.newContext({ baseURL });
    let accountQuantity: number;
    try {
      const accountPage = await accountContext.newPage();
      await loginRegisteredCustomer(accountPage);
      await accountPage.goto('/cart');
      const accountLine = await cartLine(accountPage, 'RedS');
      await expect(accountLine).toHaveCount(1);
      accountQuantity = Number(await accountLine.locator('input.qty-input').inputValue());
      await assertN02State(accountPage, [['RedS', 4]], 'MERGE-OVER/rejected-account');
    } finally {
      await accountContext.close();
    }
    await testInfo.attach('merge-over-quantities.txt', {
      body: `account=${accountQuantity}\noriginalGuest=${guestQuantity}\nstock=5`,
      contentType: 'text/plain',
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await cartSnapshot(testInfo, 'after-refresh');

    expect(accountQuantity, 'The account cart must not exceed stock 5.').toBeLessThanOrEqual(5);
    expect(accountQuantity + guestQuantity, 'The login merge must not silently discard either cart.').toBe(6);
    expect(feedback, 'The Vietnamese storefront must explain that sign-in was not completed.').toMatch(/Chưa đăng nhập/);
    expect(feedback, 'The stock reason must use understandable Vietnamese.').toMatch(/Số lượng vượt tồn kho/);
    expect(feedback).not.toMatch(/cổ phiếu trên tay/i);

    //The rejected guest item remains usable: reduce it to the available stock and retry login.
    await updateCartLine(page, product, 1);
    await assertCartLine(page, product, 1, ['Red', 'S']);
    await loginRegisteredCustomer(page);
    await page.goto('/cart');
    await assertCartLine(page, product, 5, ['Red', 'S']);
    expect(await inspectOriginalGuestCart(browser, testInfo, guestCookie),
      'The guest item must be removed after a successful retry.').toBe(0);
    await cartSnapshot(testInfo, 'after-retry');
  });

  test('CART-MERGE-01 MERGE-MIXED: accepted line moves while rejected line remains usable', async ({ page, browser }, testInfo) => {
    testInfo.annotations.push({ type: 'defect', description: 'SCRUM-96' });
    await loginRegisteredCustomer(page);
    await addVariantProduct(page, 4, 'RedS');
    await page.locator('a.ico-logout').click();
    await addVariantProduct(page, 2, 'RedS');
    await addVariantProduct(page, 1, 'BlueM');
    await page.goto('/cart');
    const guestCookie = (await page.context().cookies()).find(cookie => cookie.name === '.Nop.Customer');
    if (!guestCookie) throw new FixtureBlockedError('FIXTURE_BLOCKED: guest customer cookie is unavailable.');
    guestGuidByTest.set(testInfo.testId, guestCookie.value);
    await assertCartLineCount(page, 2);
    await cartSnapshot(testInfo, 'mixed-before-login');

    await page.goto('/login');
    await page.locator('#Email').fill(runtimeConfig.registeredEmail);
    await page.locator('#Password').fill(runtimeConfig.registeredPassword);
    await page.locator('button.login-button').click();
    await expect(page).toHaveURL(/\/cart/i);
    await expect(page.locator('a.ico-login')).toBeVisible();
    await expect(page.locator('.bar-notification.warning')).toContainText(/\b5\b/);
    await assertCartLineCount(page, 1);
    await assertCartLine(page, product, 2, ['Red', 'S']);
    await assertN02State(page, [['RedS', 2]], 'MERGE-MIXED/rejected-guest');
    await cartSnapshot(testInfo, 'mixed-after-rejected-login');
    await screenshot(page, testInfo, 'mixed-after-rejected-login');

    const accountContext = await browser.newContext({ baseURL });
    try {
      const accountPage = await accountContext.newPage();
      await loginRegisteredCustomer(accountPage);
      await accountPage.goto('/cart');
      await assertCartLineCount(accountPage, 2);
      await assertCartLine(accountPage, product, 4, ['Red', 'S']);
      await assertCartLine(accountPage, product, 1, ['Blue', 'M']);
      await assertN02State(accountPage, [['RedS', 4], ['BlueM', 1]], 'MERGE-MIXED/accepted-account');
    } finally {
      await accountContext.close();
    }

    await updateCartLine(page, product, 1);
    await loginRegisteredCustomer(page);
    await page.goto('/cart');
    await assertCartLineCount(page, 2);
    await assertCartLine(page, product, 5, ['Red', 'S']);
    await assertCartLine(page, product, 1, ['Blue', 'M']);
    expect(await inspectOriginalGuestCart(browser, testInfo, guestCookie.value)).toBe(0);
    await cartSnapshot(testInfo, 'mixed-after-retry');
  });

  for (const [caseId, accountQuantity, guestQuantity] of [
    ['MERGE-VALID', 2, 2],
    ['MERGE-EXACT', 2, 3],
  ] as const) {
    test(`CART-MERGE-01 ${caseId}: same variant merges within stock`, async ({ page, browser }, testInfo) => {
      const { guestCookie, feedback } = await prepareMerge(page, testInfo, accountQuantity, guestQuantity);
      const totalQuantity = accountQuantity + guestQuantity;
      await assertCartLineCount(page, 1);
      await assertCartLine(page, product, totalQuantity, ['Red', 'S']);
      await expectAmount(page, 'order-subtotal', totalQuantity * unitPrice);
      await expectAmount(page, 'order-total', totalQuantity * unitPrice);
      expect(feedback, 'Successful merge should not show an error or warning.').toBe('');
      expect(await inspectOriginalGuestCart(browser, testInfo, guestCookie),
        'Successfully migrated guest items should no longer remain in the source cart.').toBe(0);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await assertCartLine(page, product, totalQuantity, ['Red', 'S']);
      await screenshot(page, testInfo, 'after-refresh');
      await cartSnapshot(testInfo, 'after-refresh');
    });
  }

  test('CART-MERGE-01 MERGE-VARIANT: different variants remain separate', async ({ page, browser }, testInfo) => {
    const { guestCookie, feedback } = await prepareMerge(page, testInfo, 1, 1, 'BlueM');
    await assertCartLineCount(page, 2);
    await assertCartLine(page, product, 1, ['Red', 'S']);
    await assertCartLine(page, product, 1, ['Blue', 'M']);
    await expectAmount(page, 'order-subtotal', 2 * unitPrice);
    await expectAmount(page, 'order-total', 2 * unitPrice);
    expect(feedback, 'Successful merge should not show an error or warning.').toBe('');
    expect(await inspectOriginalGuestCart(browser, testInfo, guestCookie, 'BlueM'),
      'Successfully migrated guest variant should no longer remain in the source cart.').toBe(0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertCartLineCount(page, 2);
    await assertCartLine(page, product, 1, ['Red', 'S']);
    await assertCartLine(page, product, 1, ['Blue', 'M']);
    await screenshot(page, testInfo, 'after-refresh');
    await cartSnapshot(testInfo, 'after-refresh');
  });

  test('CART-MERGE-01 MERGE-MULTISTORE: each store retains its own cart state across retry', async ({ page, browser }, testInfo) => {
    testInfo.annotations.push({ type: 'defect', description: 'SCRUM-96' });
    expect(n02StoreId, 'The local multi-store case requires store 1 as the baseline.').toBe(1);
    const secondStoreUrl = 'http://127.0.0.1/';
    const secondStoreId = 2;
    const storeProbe = await executeReadonlySql("SET NOCOUNT ON; SELECT COUNT(*) FROM Store WHERE Id = 2 AND Name = 'SCRUM-96 B01 local second store' AND Hosts = '127.0.0.1' AND Deleted = 0;");
    test.skip(!/^1$/m.test(storeProbe.trim()), 'FIXTURE_BLOCKED: run b01-second-store.cjs setup before the multi-store UI case.');
    await resetN02Fixture(page, guestGuidByTest.get(testInfo.testId)!, true, secondStoreId);
    const secondBefore = await queryN02CartState(guestGuidByTest.get(testInfo.testId)!, runtimeConfig.registeredEmail, secondStoreId);
    expect(secondBefore).toMatch(/N02_CUSTOMER\|Account\|[^\r\n]*\|cartRows=0\|quantity=0/);

    await loginRegisteredCustomer(page);
    await addVariantProduct(page, 4, 'RedS');
    await page.locator('a.ico-logout').click();
    await addVariantProduct(page, 2, 'RedS');
    await page.goto('/cart');
    const guestCookie = (await page.context().cookies()).find(cookie => cookie.name === '.Nop.Customer' && cookie.domain === 'localhost');
    if (!guestCookie) throw new FixtureBlockedError('FIXTURE_BLOCKED: store 1 guest cookie is unavailable.');
    guestGuidByTest.set(testInfo.testId, guestCookie.value);
    await cartSnapshot(testInfo, 'multistore-before-store2-store1');

    const secondContext = await browser.newContext({ baseURL: secondStoreUrl });
    await secondContext.addCookies([
      { name: '.Nop.Customer', value: guestCookie.value, url: secondStoreUrl },
      { name: '.Nop.Customer', value: guestCookie.value, url: 'http://localhost/' },
    ]);
    const secondPage = await secondContext.newPage();
    await secondPage.goto('/cart');
    await addVariantProduct(secondPage, 1, 'BlueM');
    await secondPage.goto('/cart');
    await assertCartLineCount(secondPage, 1);
    await assertCartLine(secondPage, product, 1, ['Blue', 'M']);
    await screenshot(secondPage, testInfo, 'multistore-store2-before-login');
    await testInfo.attach('multistore-store2-before-login.sql.txt', {
      body: await queryN02CartState(guestCookie.value, runtimeConfig.registeredEmail, secondStoreId),
      contentType: 'text/plain',
    });

    await secondPage.goto('/login');
    await secondPage.locator('#Email').fill(runtimeConfig.registeredEmail);
    await secondPage.locator('#Password').fill(runtimeConfig.registeredPassword);
    await secondPage.locator('button.login-button').click();
    await expect(secondPage.locator('a.ico-login')).toBeVisible();
    await expect(secondPage.locator('.bar-notification.warning')).toHaveCSS('opacity', '1');
    const feedback = await secondPage.locator('.bar-notification.error, .bar-notification.warning, .message-error, .message-failure').allTextContents();
    expect(feedback.join('\n')).toMatch(/Chưa đăng nhập/);
    expect(feedback.join('\n'), '[MERGE-MULTISTORE] stock limit 5').toMatch(/\b5\b/);
    expect(feedback.join('\n')).toContain(product);
    expect(feedback.join('\n')).toContain('Red');
    expect(feedback.join('\n')).toContain('S');
    const rejectedStoreCart = secondPage.locator('.bar-notification.warning a[href="http://localhost/cart"]');
    await expect(rejectedStoreCart).toBeVisible();
    await testInfo.attach('multistore-login-feedback.txt', { body: feedback.join('\n'), contentType: 'text/plain' });
    await screenshot(secondPage, testInfo, 'multistore-store2-rejected-login');
    await rejectedStoreCart.click();
    await expect(secondPage).toHaveURL('http://localhost/cart');
    await testInfo.attach('multistore-store1-after-link.sql.txt', {
      body: await queryN02CartState(guestCookie.value, runtimeConfig.registeredEmail, 1),
      contentType: 'text/plain',
    });
    const recoveredLine = secondPage.locator('table.cart tbody tr');
    expect(await recoveredLine.count()).toBe(1);
    const recoveredText = await recoveredLine.innerText();
    expect(recoveredText).toContain(product);
    expect(recoveredText).toContain('Red');
    expect(recoveredText).toContain('S');
    expect(await recoveredLine.locator('input.qty-input').inputValue()).toBe('2');
    await assertN02State(secondPage, [['RedS', 2]], 'MERGE-MULTISTORE/rejected-store1-guest');
    await screenshot(secondPage, testInfo, 'multistore-store1-recovery-link');
    await secondPage.goto(`${secondStoreUrl}cart`);
    await assertCartLineCount(secondPage, 0);
    const store1AfterRejection = await queryN02CartState(guestCookie.value, runtimeConfig.registeredEmail, 1);
    const store2AfterRejection = await queryN02CartState(guestCookie.value, runtimeConfig.registeredEmail, secondStoreId);
    await testInfo.attach('multistore-store1-after-rejection.sql.txt', { body: store1AfterRejection, contentType: 'text/plain' });
    await testInfo.attach('multistore-store2-after-rejection.sql.txt', { body: store2AfterRejection, contentType: 'text/plain' });
    expect(store1AfterRejection).toMatch(/N02_CUSTOMER\|Guest\|[^\r\n]*\|cartRows=1\|quantity=2/);
    expect(store1AfterRejection).toMatch(/N02_CUSTOMER\|Account\|[^\r\n]*\|cartRows=1\|quantity=4/);
    expect(store2AfterRejection).toMatch(/N02_CUSTOMER\|Guest\|[^\r\n]*\|cartRows=0\|quantity=0/);
    expect(store2AfterRejection).toMatch(/N02_CUSTOMER\|Account\|[^\r\n]*\|cartRows=1\|quantity=1/);

    await secondContext.close();
    await page.goto('/cart');
    await assertCartLine(page, product, 2, ['Red', 'S']);
    await updateCartLine(page, product, 1);
    await loginRegisteredCustomer(page);
    await page.goto('/cart');
    await assertCartLine(page, product, 5, ['Red', 'S']);
    await cartSnapshot(testInfo, 'multistore-store1-after-retry');
    const store2AfterRetry = await queryN02CartState(guestCookie.value, runtimeConfig.registeredEmail, secondStoreId);
    await testInfo.attach('multistore-store2-after-retry.sql.txt', { body: store2AfterRetry, contentType: 'text/plain' });
    expect(store2AfterRetry).toMatch(/N02_CUSTOMER\|Guest\|[^\r\n]*\|cartRows=0\|quantity=0/);
    expect(store2AfterRetry).toMatch(/N02_CUSTOMER\|Account\|[^\r\n]*\|cartRows=1\|quantity=1/);

    const accountContext = await browser.newContext({ baseURL: secondStoreUrl });
    try {
      const accountPage = await accountContext.newPage();
      await loginRegisteredCustomer(accountPage);
      await accountPage.goto(`${secondStoreUrl}cart`);
      await assertCartLineCount(accountPage, 1);
      await assertCartLine(accountPage, product, 1, ['Blue', 'M']);
      await assertN02State(accountPage, [['BlueM', 1]], 'MERGE-MULTISTORE/store2-account');
      await screenshot(accountPage, testInfo, 'multistore-store2-after-retry');
    } finally {
      await accountContext.close();
    }
  });

  test('CART-MERGE-01 MERGE-ACTIVATION: activation preserves rejected guest cart and returns to recovery', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'defect', description: 'SCRUM-96' });
    await loginRegisteredCustomer(page);
    await addVariantProduct(page, 4, 'RedS');
    await page.locator('a.ico-logout').click();
    await addVariantProduct(page, 2, 'RedS');
    await page.goto('/cart');
    const guestGuid = await currentCustomerGuid(page);
    guestGuidByTest.set(testInfo.testId, guestGuid);

    const token = randomUUID();
    const fixtureScript = resolve(__dirname, '../scripts/b01-activation-token.cjs');
    const setupReceipt = execFileSync(process.execPath, [fixtureScript, 'setup', token], { encoding: 'utf8' });
    await testInfo.attach('activation-fixture.txt', { body: setupReceipt, contentType: 'text/plain' });
    try {
      const activationUrl = new URL('/customer/activation', baseURL);
      activationUrl.searchParams.set('token', token);
      activationUrl.searchParams.set('email', runtimeConfig.registeredEmail);
      await page.goto(activationUrl.toString());
      await expect(page).toHaveURL(/\/cart/i);
      await expect(page.locator('a.ico-login')).toBeVisible();
      await expect(page.locator('.bar-notification.warning')).toContainText('Chưa đăng nhập');
      await expect(page.locator('.bar-notification.warning')).toContainText(/\b5\b/);
      await assertCartLine(page, product, 2, ['Red', 'S']);
      await assertN02State(page, [['RedS', 2]], 'MERGE-ACTIVATION/rejected-guest');
      await screenshot(page, testInfo, 'activation-rejected-login');
      await cartSnapshot(testInfo, 'activation-rejected-login');
    } finally {
      const cleanupReceipt = execFileSync(process.execPath, [fixtureScript, 'cleanup', token], { encoding: 'utf8' });
      await testInfo.attach('activation-cleanup.txt', { body: cleanupReceipt, contentType: 'text/plain' });
    }
  });

  test('CART-REPEAT-01 REPEAT-SAME: adding 2 then 3 makes one line with correct total', async ({ page }, testInfo) => {
    await addVariantProduct(page, 2, 'RedS');
    await page.goto('/cart');
    await cartSnapshot(testInfo, 'after-first-add');
    await assertCartLineCount(page, 1);
    await assertCartLine(page, product, 2, ['Red', 'S']);
    await expectAmount(page, 'order-subtotal', 2 * unitPrice);
    await expectAmount(page, 'order-total', 2 * unitPrice);
    await screenshot(page, testInfo, 'after-first-add');
    await addVariantProduct(page, 3, 'RedS');
    await page.goto('/cart');
    await screenshot(page, testInfo, 'after-repeat-add');
    await cartSnapshot(testInfo, 'after-repeat-add');
    await assertCartLineCount(page, 1);
    await assertCartLine(page, product, 5, ['Red', 'S']);
    await expectAmount(page, 'order-subtotal', 5 * unitPrice);
    await expectAmount(page, 'order-total', 5 * unitPrice);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertCartLineCount(page, 1);
    await assertCartLine(page, product, 5, ['Red', 'S']);
    await cartSnapshot(testInfo, 'after-refresh');
  });

  test('CART-REPEAT-01 REPEAT-DIFFERENT: another variant remains a separate line', async ({ page }, testInfo) => {
    await addVariantProduct(page, 2, 'RedS');
    await page.goto('/cart');
    await cartSnapshot(testInfo, 'after-first-add');
    await addVariantProduct(page, 3, 'RedS');
    await page.goto('/cart');
    await cartSnapshot(testInfo, 'after-repeat-add');
    await addVariantProduct(page, 1, 'BlueM');
    await page.goto('/cart');
    await screenshot(page, testInfo, 'different-variant-after-add');
    await cartSnapshot(testInfo, 'different-variant-after-add');
    await assertCartLineCount(page, 2);
    await assertCartLine(page, product, 5, ['Red', 'S']);
    await assertCartLine(page, product, 1, ['Blue', 'M']);
    await expectAmount(page, 'order-subtotal', 6 * unitPrice);
    await expectAmount(page, 'order-total', 6 * unitPrice);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertCartLineCount(page, 2);
    await assertCartLine(page, product, 5, ['Red', 'S']);
    await assertCartLine(page, product, 1, ['Blue', 'M']);
    await cartSnapshot(testInfo, 'after-refresh');
  });
  for (const [id, first, second] of [
    ['REPEAT-BELOW', 1, 2], ['REPEAT-OVER', 4, 2],
  ] as const) {
    test(`CART-REPEAT-01 ${id}: repeat add respects variant stock`, async ({ page }, info) => {
      await step(`${id} first add`, () => addVariantProduct(page, first, 'RedS'));
      await page.goto('/cart');
      await assertCartState(page, { lines: [{ product, attributes: ['Red', 'S'], quantity: first, unitPrice }], subtotal: first * unitPrice, discount: 0, total: first * unitPrice }, id);
      const before = await queryN02CartState(guestGuidByTest.get(info.testId)!, '', n02StoreId);
      await step(`${id} second add`, async () => {
        if (id === 'REPEAT-BELOW') {
          await addVariantProduct(page, second, 'RedS');
        } else {
          await page.goto(runtimeConfig.configurableProductPath);
          const attributes = page.locator('select[name^="product_attribute_"]');
          await attributes.nth(0).selectOption({ label: 'Red' });
          await attributes.nth(1).selectOption({ label: 'S' });
          await page.locator('input.qty-input').fill(String(second));
          await page.locator('button[id^="add-to-cart-button-"]').click();
          const warning = page.locator(cartWarnings).filter({ hasText: /\b5\b/ }).first();
          await expect(warning, `[${id}] stock warning: maximum 5`).toBeVisible();
          await expect(warning).toContainText(/stock|tồn kho|tối đa|maximum/i);
          await info.attach('repeat-over-warning.txt', { body: await warning.innerText(), contentType: 'text/plain' });
          expect(await queryN02CartState(guestGuidByTest.get(info.testId)!, '', n02StoreId), `[${id}] rejected add leaves DB quantity/stock unchanged`).toBe(before);
        }
      });
      await page.goto('/cart');
      await assertCartState(page, cartCase(id).expected, id);
      await page.reload();
      await assertCartState(page, cartCase(id).expected, id);
      await cartSnapshot(info, 'repeat-final');
    });
  }

});
