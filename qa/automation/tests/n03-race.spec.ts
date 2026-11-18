import { expect, test, type Page, type Response, type TestInfo } from '@playwright/test';
import { beginCheckout, loginRegisteredCustomer, reachShippingMethod } from './helpers/cart-checkout';
import { runtimeConfig } from './helpers/runtime-config';
import { executeReadonlySql, queryCheckoutEvidence } from './helpers/sql-fixture';

const product = 'PW-Shirt-Variants';
const expectedQuantity = 4;
const expectedStock = 5;
const maxDispatchGapMs = Number(process.env.QA_N03_MAX_DISPATCH_GAP_MS ?? '250');

type TabName = 'A' | 'B';
type RequestLog = {
  tab: TabName;
  startedAtUtc: string;
  startedAtMs: number;
  responseStatus?: number;
  responseUrl?: string;
};

function orderCount(snapshot: string): number {
  const value = snapshot.match(/^ORDER_COUNT\|(\d+)$/m)?.[1];
  if (!value) throw new Error('SQL snapshot does not contain ORDER_COUNT.');
  return Number(value);
}

function isConfirmPost(url: string, method: string): boolean {
  return method === 'POST' && /\/checkout\/confirm(?:\/|\?|$)/i.test(url);
}

async function redSmallStock(): Promise<number> {
  const sql = `
SET NOCOUNT ON;
DECLARE @ProductId int = (SELECT TOP 1 Id FROM Product WHERE Sku = 'PW-SHIRT' AND Deleted = 0);
DECLARE @RedId int = (
  SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
  INNER JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
  WHERE pam.ProductId = @ProductId AND pav.Name = 'Red'
);
DECLARE @SmallId int = (
  SELECT TOP 1 pav.Id FROM ProductAttributeValue pav
  INNER JOIN Product_ProductAttribute_Mapping pam ON pam.Id = pav.ProductAttributeMappingId
  WHERE pam.ProductId = @ProductId AND pav.Name = 'S'
);
SELECT CONCAT('RED_S_STOCK|', pac.StockQuantity)
FROM ProductAttributeCombination pac
WHERE pac.ProductId = @ProductId
  AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @RedId) + '</Value>%'
  AND pac.AttributesXml LIKE '%<Value>' + CONVERT(varchar(12), @SmallId) + '</Value>%';
`;
  const output = await executeReadonlySql(sql);
  const value = output.match(/^RED_S_STOCK\|(\d+)$/m)?.[1];
  if (!value) throw new Error('FIXTURE_BLOCKED: Red/S stock could not be read from the local fixture.');
  return Number(value);
}

async function attachPage(testInfo: TestInfo, page: Page, tab: TabName, stage: 'before' | 'after'): Promise<string> {
  await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined);
  await testInfo.attach(`tab-${tab}-${stage}.png`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  if (stage === 'after') {
    await testInfo.attach(`tab-${tab}-after.html`, {
      body: await page.content(),
      contentType: 'text/html',
    });
  }
  return page.locator('body').innerText().catch(() => '');
}

async function prepareConfirm(page: Page): Promise<void> {
  await beginCheckout(page);
  // The local N03 account already has a saved address. Use it rather than
  // creating another address or depending on billing fields from another suite.
  const savedBilling = page.locator('.select-billing-address-button').first();
  if (await savedBilling.count()) {
    await savedBilling.click();
    await expect(page).toHaveURL(/checkout\/(shippingaddress|shippingmethod)/i);
    const savedShipping = page.locator('.select-shipping-address-button').first();
    if (await savedShipping.count()) {
      await savedShipping.click();
      await expect(page).toHaveURL(/checkout\/shippingmethod/i);
    }
  } else {
    await reachShippingMethod(page);
  }
  await expect(page.locator('input[name="shippingoption"]').first()).toBeVisible();
  const ground = page.locator('input[name="shippingoption"][value*="Ground"]');
  await expect(ground, 'N03 requires the Ground shipping option.').toHaveCount(1);
  await ground.check();
  await page.locator('.shipping-method-next-step-button').click();
  await expect(page).toHaveURL(/checkout\/(paymentmethod|paymentinfo|confirm)/i);

  if (/\/checkout\/paymentmethod/i.test(page.url())) {
    const checkMoneyOrder = page.locator('input[name="paymentmethod"][value="Payments.CheckMoneyOrder"]');
    await expect(checkMoneyOrder, 'N03 requires Check / Money Order.').toHaveCount(1);
    await checkMoneyOrder.check();
    await page.locator('.payment-method-next-step-button').click();
  } else {
    // nopCommerce skips method selection when Check / Money Order is the only
    // active method and lands directly on its information page.
    await expect(page).toHaveURL(/checkout\/paymentinfo/i);
    await expect(page.locator('body')).toContainText(/money order/i);
  }
  if (await page.locator('.payment-info-next-step-button').count()) {
    await page.locator('.payment-info-next-step-button').click();
  }
  await expect(page).toHaveURL(/checkout\/confirm/i);
  await expect(page.locator('.confirm-order-next-step-button')).toBeVisible();
}

// Each attempt gets a separate local trace. Trace and full HTML can contain
// session data, so qa/automation/artifacts and reports must stay out of Git.
test.use({ trace: 'on' });

test.describe('SCRUM-90 N03 two-tab Confirm race', () => {

  test('CHK-RACE-01: submit Confirm from two tabs and record both outcomes', async ({ page, context }, testInfo) => {
    testInfo.annotations.push({ type: 'jira', description: 'SCRUM-90' });
    testInfo.annotations.push({ type: 'scenario', description: 'CHK-RACE-01' });
    testInfo.annotations.push({ type: 'defect', description: 'SCRUM-100' });

    const missing = [
      !runtimeConfig.registeredEmail && 'QA_REGISTERED_EMAIL',
      !runtimeConfig.registeredPassword && 'QA_REGISTERED_PASSWORD',
      !runtimeConfig.sqlPassword && 'QA_SQL_PASSWORD',
    ].filter(Boolean);
    test.skip(missing.length > 0, `FIXTURE_BLOCKED: missing ${missing.join(', ')}.`);
    test.skip(!Number.isFinite(maxDispatchGapMs) || maxDispatchGapMs <= 0,
      'FIXTURE_BLOCKED: QA_N03_MAX_DISPATCH_GAP_MS must be a positive number.');

    // This suite only reads Linh's fixture. A fresh cart and stock are needed
    // before every invocation; it deliberately does not seed or reset SQL.
    const before = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await testInfo.attach('before.sql.txt', { body: before, contentType: 'text/plain' });
    const stockBefore = await redSmallStock();
    const cartLines = before.split('\n').filter(line => line.startsWith('CART|'));
    const cartReady = cartLines.length === 1
      && cartLines[0].startsWith(`CART|PW-SHIRT|${expectedQuantity}|`)
      && /^CART_COUNT\|1$/m.test(before);
    test.skip(!cartReady || stockBefore !== expectedStock,
      `FIXTURE_BLOCKED: N03 needs one Red/S cart line of 4 and stock 5; cartReady=${cartReady}, stock=${stockBefore}.`);

    await loginRegisteredCustomer(page);
    await page.goto('/cart');
    const line = page.locator('table.cart tbody tr').filter({ hasText: product }).filter({ hasText: 'Red' }).filter({ hasText: 'S' });
    await expect(line).toHaveCount(1);
    await expect(line.locator('input.qty-input')).toHaveValue(String(expectedQuantity));
    await prepareConfirm(page);

    const secondTab = await context.newPage();
    await secondTab.goto('/checkout/confirm', { waitUntil: 'domcontentloaded' });
    await expect(secondTab).toHaveURL(/checkout\/confirm/i);
    await expect(secondTab.locator('.confirm-order-next-step-button')).toBeVisible();
    await attachPage(testInfo, page, 'A', 'before');
    await attachPage(testInfo, secondTab, 'B', 'before');

    const requests: Partial<Record<TabName, RequestLog>> = {};
    for (const [tab, currentPage] of [['A', page], ['B', secondTab]] as const) {
      currentPage.on('request', request => {
        if (!isConfirmPost(request.url(), request.method()) || requests[tab]) return;
        requests[tab] = { tab, startedAtUtc: new Date().toISOString(), startedAtMs: performance.now() };
      });
    }
    const responseA = page.waitForResponse(response => isConfirmPost(response.url(), response.request().method()), { timeout: 45_000 }).catch(() => undefined);
    const responseB = secondTab.waitForResponse(response => isConfirmPost(response.url(), response.request().method()), { timeout: 45_000 }).catch(() => undefined);

    // Start both browser actions without awaiting the first tab's result.
    const clicks = await Promise.allSettled([
      page.locator('.confirm-order-next-step-button').click({ timeout: 45_000 }),
      secondTab.locator('.confirm-order-next-step-button').click({ timeout: 45_000 }),
    ]);
    const [firstResponse, secondResponse] = await Promise.all([responseA, responseB]);
    for (const [tab, response] of [['A', firstResponse], ['B', secondResponse]] as const satisfies ReadonlyArray<readonly [TabName, Response | undefined]>) {
      if (requests[tab] && response) {
        requests[tab].responseStatus = response.status();
        requests[tab].responseUrl = response.url();
      }
    }

    const [textA, textB] = await Promise.all([
      attachPage(testInfo, page, 'A', 'after'),
      attachPage(testInfo, secondTab, 'B', 'after'),
    ]);
    const after = await queryCheckoutEvidence(runtimeConfig.registeredEmail);
    await testInfo.attach('after.sql.txt', { body: after, contentType: 'text/plain' });
    const countDelta = orderCount(after) - orderCount(before);
    const dispatchGapMs = requests.A && requests.B
      ? Math.abs(requests.A.startedAtMs - requests.B.startedAtMs)
      : null;
    const responseBodies = await Promise.all([
      firstResponse?.text().catch(() => '') ?? '',
      secondResponse?.text().catch(() => '') ?? '',
    ]);
    for (const [index, tab] of ['A', 'B'].entries()) {
      await testInfo.attach(`tab-${tab}-confirm-response.html`, {
        body: responseBodies[index], contentType: 'text/html',
      });
    }
    const sqlError = /Cannot insert duplicate key|AK_Order_OrderGuid|SqlException/i;
    const sqlErrorByTab = {
      A: sqlError.test(`${textA}\n${responseBodies[0]}`),
      B: sqlError.test(`${textB}\n${responseBodies[1]}`),
    };
    const leakedSql = sqlErrorByTab.A || sqlErrorByTab.B;
    const timingValid = dispatchGapMs !== null && dispatchGapMs <= maxDispatchGapMs;
    const classification = !timingValid || clicks.some(click => click.status === 'rejected')
      ? 'TIMING_OR_AUTOMATION_INCONCLUSIVE'
      : leakedSql ? 'REPRODUCED_B02'
        : countDelta > 1 ? 'OTHER_FINDING_DOUBLE_ORDER'
          : countDelta === 1 ? 'NOT_REPRODUCED_B02_THIS_ATTEMPT'
            : 'INCONCLUSIVE_NO_ORDER';
    testInfo.annotations.push({ type: 'n03-result', description: classification });

    const summary = {
      runId: `AUTO-${new Date().toISOString().replace(/\D/g, '').slice(0, 17)}`,
      issue: 'SCRUM-90', scenario: 'CHK-RACE-01', defect: 'SCRUM-100',
      fixture: { sku: 'PW-SHIRT', variant: 'Red/S', quantity: expectedQuantity, stockBefore },
      tabs: {
        A: { ...requests.A, finalUrl: page.url(), click: clicks[0].status, sqlErrorShown: sqlErrorByTab.A },
        B: { ...requests.B, finalUrl: secondTab.url(), click: clicks[1].status, sqlErrorShown: sqlErrorByTab.B },
      },
      dispatchGapMs, maxDispatchGapMs, orderCountBefore: orderCount(before),
      orderCountAfter: orderCount(after), orderDelta: countDelta, leakedSql, classification,
    };
    await testInfo.attach('n03-attempt.json', {
      body: JSON.stringify(summary, null, 2), contentType: 'application/json',
    });

    expect(requests.A && requests.B, 'Both tabs must send a Confirm POST.').toBeTruthy();
    expect(timingValid, `Confirm POSTs must be within ${maxDispatchGapMs} ms.`).toBe(true);
    expect(countDelta, 'The two Confirm requests should create exactly one order.').toBe(1);
    expect(leakedSql, 'The storefront must not expose SQL errors.').toBe(false);
  });
});
