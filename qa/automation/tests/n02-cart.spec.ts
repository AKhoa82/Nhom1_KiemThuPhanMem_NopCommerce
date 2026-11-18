import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test';
import { assertCartLine, assertCartLineCount } from './helpers/assertions';
import { addVariantProduct, loginRegisteredCustomer } from './helpers/cart-checkout';
import { FixtureBlockedError, resetFixture } from './helpers/fixtures';
import { loadPairwiseCases } from './helpers/pairwise-data';
import { runtimeConfig } from './helpers/runtime-config';
import { queryCartFixtureState } from './helpers/sql-fixture';

const resetRow = loadPairwiseCases().find(row => row.caseId === 'PW-001');
if (!resetRow) throw new Error('PW-001 is required to reset the N02 local Cart fixture.');

const product = 'PW-Shirt-Variants';
const unitPrice = 200; // Existing PW-SHIRT local fixture; check the fixture version before a run.
const baseURL = process.env.NOP_BASE_URL ?? 'http://localhost/';

type Variant = 'RedS' | 'BlueM';

async function screenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(`${name}.png`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

async function cartSnapshot(testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(`${name}.sql.txt`, {
    body: await queryCartFixtureState(),
    contentType: 'text/plain',
  });
}

async function expectAmount(page: Page, rowClass: string, amount: number): Promise<void> {
  const text = await page.locator(`.cart-total .${rowClass} .value-summary`).innerText();
  const displayed = text.match(/\d[\d.,]*/)?.[0];
  expect(displayed, `Missing ${rowClass} amount in '${text}'.`).toBeDefined();
  const integerAmount = Number(displayed!.replace(/[.,]00$/, '').replace(/[.,]/g, ''));
  expect(integerAmount, `Incorrect ${rowClass} amount in '${text}'.`).toBe(amount);
}

async function cartLine(page: Page, variant: Variant) {
  const attributes = variant === 'RedS' ? ['Red', 'S'] : ['Blue', 'M'];
  let line = page.locator('table.cart tbody tr').filter({ hasText: product });
  for (const attribute of attributes) line = line.filter({ hasText: attribute });
  return line;
}

async function prepareMerge(
  page: Page,
  testInfo: TestInfo,
  accountQuantity: number,
  guestQuantity: number,
  guestVariant: Variant = 'RedS',
): Promise<{ guestCookie: string; feedback: string }> {
  await loginRegisteredCustomer(page);
  await addVariantProduct(page, accountQuantity, 'RedS');
  await page.goto('/cart');
  await assertCartLine(page, product, accountQuantity, ['Red', 'S']);
  await screenshot(page, testInfo, 'account-before-login');
  await cartSnapshot(testInfo, 'account-before-login');

  await page.locator('a.ico-logout').click();
  await addVariantProduct(page, guestQuantity, guestVariant);
  await page.goto('/cart');
  await assertCartLine(page, product, guestQuantity, guestVariant === 'RedS' ? ['Red', 'S'] : ['Blue', 'M']);
  await screenshot(page, testInfo, 'guest-before-login');
  await cartSnapshot(testInfo, 'guest-before-login');

  const guestCookie = (await page.context().cookies()).find(cookie => cookie.name === '.Nop.Customer');
  if (!guestCookie) throw new FixtureBlockedError('FIXTURE_BLOCKED: guest customer cookie is unavailable.');

  await loginRegisteredCustomer(page);
  const notices = await page.locator(
    '.bar-notification.error, .bar-notification.warning, .message-error, .message-failure',
  ).all();
  const feedback = (await Promise.all(notices.map(async notice => (
    await notice.isVisible() ? (await notice.innerText()).trim() : ''
  )))).filter(Boolean).join('\n');
  await testInfo.attach('login-feedback.txt', { body: feedback || '(no visible error/warning text)', contentType: 'text/plain' });
  await screenshot(page, testInfo, 'after-login');
  await page.goto('/cart');
  await screenshot(page, testInfo, 'account-after-login');
  await cartSnapshot(testInfo, 'account-after-login');
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
    testInfo.annotations.push({ type: 'jira', description: 'SCRUM-86' });
    const needsRegisteredCustomer = testInfo.title.startsWith('CART-MERGE-01');
    const missing = [
      !runtimeConfig.sqlPassword && 'QA_SQL_PASSWORD',
      needsRegisteredCustomer && !runtimeConfig.registeredEmail && 'QA_REGISTERED_EMAIL',
      needsRegisteredCustomer && !runtimeConfig.registeredPassword && 'QA_REGISTERED_PASSWORD',
    ].filter(Boolean);
    test.skip(missing.length > 0, `FIXTURE_BLOCKED: missing ${missing.join(', ')}.`);
    try {
      await resetFixture(page, resetRow!);
    } catch (error) {
      if (error instanceof FixtureBlockedError) {
        test.skip(true, error.message);
        return;
      }
      throw error;
    }
    await cartSnapshot(testInfo, 'reset-baseline');
  });

  test('CART-MERGE-01 MERGE-OVER: guest items are not silently lost above stock', async ({ page, browser }, testInfo) => {
    testInfo.annotations.push({ type: 'defect', description: 'SCRUM-96' });
    const { guestCookie, feedback } = await prepareMerge(page, testInfo, 4, 2);
    const accountLine = await cartLine(page, 'RedS');
    await expect(accountLine).toHaveCount(1);
    const accountQuantity = Number(await accountLine.locator('input.qty-input').inputValue());
    const guestQuantity = await inspectOriginalGuestCart(browser, testInfo, guestCookie);
    await testInfo.attach('merge-over-quantities.txt', {
      body: `account=${accountQuantity}\noriginalGuest=${guestQuantity}\nstock=5`,
      contentType: 'text/plain',
    });

    expect(accountQuantity, 'The account cart must not exceed stock 5.').toBeLessThanOrEqual(5);
    expect(accountQuantity + guestQuantity, 'The login merge must not silently discard either cart.').toBe(6);
    expect(feedback, 'The buyer must be told why the over-stock merge was rejected.').not.toBe('');
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
  });

  test('CART-REPEAT-01 REPEAT-SAME: adding 2 then 3 makes one line with correct total', async ({ page }, testInfo) => {
    await addVariantProduct(page, 2, 'RedS');
    await page.goto('/cart');
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
  });

  test('CART-REPEAT-01 REPEAT-DIFFERENT: another variant remains a separate line', async ({ page }, testInfo) => {
    await addVariantProduct(page, 2, 'RedS');
    await addVariantProduct(page, 3, 'RedS');
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
  });
});
