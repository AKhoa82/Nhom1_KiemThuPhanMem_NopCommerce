import { expect, test, type Page } from '@playwright/test';
import { assertCartState, assertCheckoutOrderCountUnchanged, assertAddressValidationBlocked, assertCartEmpty, assertCartLine, assertCartLineCount, assertCheckoutCompleted, assertCheckoutOrderEvidence, assertCouponResult, assertStockBlocked } from './helpers/assertions';
import { addOutOfStockProduct, addSimpleProduct, addVariantProduct, applyCouponCode, beginCheckout, completeLocalCheckout as completeCheckoutSteps, invalidCoupon, loginRegisteredCustomer, removeCartLine, submitMissingRequiredBillingAddress, updateCartLine, validCoupon } from './helpers/cart-checkout';
import { FixtureBlockedError, resetFixture } from './helpers/fixtures';
import { loadPairwiseCases, type PairwiseCase } from './helpers/pairwise-data';
import { blockedReason, runtimeConfig } from './helpers/runtime-config';
import { queryCartFixtureState, queryCheckoutEvidence, queryOrderPlacementWait } from './helpers/sql-fixture';

import { cartCase, cartManifest } from './helpers/cart-catalog';
import { attachFailureLog, step } from './helpers/case-log';

test.beforeAll(async ({ request }) => {
  test.skip(!runtimeConfig.sqlPassword, 'FIXTURE_BLOCKED: QA_SQL_PASSWORD is required.');
  try {
    const response = await request.get('/cart', { timeout: 30_000 });
    test.skip(!response.ok(), `FIXTURE_BLOCKED: storefront /cart returned ${response.status()}.`);
  } catch (error) {
    test.skip(true, `FIXTURE_BLOCKED: storefront /cart is unavailable: ${String(error)}`);
  }
});

test.afterEach(async ({ page }, info) => attachFailureLog(page, info, () => queryCartFixtureState()));

const pairwiseCases = loadPairwiseCases();
const simple = 'PW-Simple-Stock';
const variant = 'PW-Shirt-Variants';

async function runCase(page: Page, row: PairwiseCase): Promise<void> {
  if (row.customerType === 'Registered') {
    await loginRegisteredCustomer(page, { email: runtimeConfig.pwRegisteredEmail, password: runtimeConfig.pwRegisteredPassword });
  }

  // Registered checkout cases reuse one account; respect the store's
  // per-customer order placement interval so repeats do not depend on timing.
  const completeLocalCheckout = async (checkoutPage: Page) => {
    if (row.customerType === 'Registered') {
      await step(`${row.caseId} wait for order placement interval`, async () => {
        const wait = await queryOrderPlacementWait(runtimeConfig.pwRegisteredEmail);
        test.info().annotations.push({ type: 'order-interval', description: JSON.stringify(wait) });
        if (wait.waitMs > 0) await checkoutPage.waitForTimeout(wait.waitMs);
      });
    }
    await completeCheckoutSteps(checkoutPage);
  };

  const expected = cartCase(row.caseId).expected;
  const checkpoint = () => step(`${row.caseId} cart oracle before terminal action`, async () => {
    await page.goto('/cart');
    await assertCartState(page, expected, row.caseId);
  });
  const rejectedUpdate = async (product: string, quantity: number) => {
    await page.goto('/cart');
    await assertCartState(page, { ...expected, warning: null }, row.caseId);
    const before = await queryCartFixtureState();
    await step(`${row.caseId} rejected stock update`, async () => {
      await updateCartLine(page, product, quantity);
      await assertStockBlocked(page, expected, row.caseId);
      expect(await queryCartFixtureState(), `[${row.caseId}] rejected update leaves SQL cart/stock unchanged`).toBe(before);
    });
  };

  switch (row.caseId) {
    case 'PW-001':
      await addSimpleProduct(page, 1);
      await updateCartLine(page, simple, 2);
      await assertCartLine(page, simple, 2);
      await applyCouponCode(page, invalidCoupon);
      await assertCouponResult(page, 'Invalid');
      await checkpoint();
      await beginCheckout(page);
      await submitMissingRequiredBillingAddress(page);
      await assertAddressValidationBlocked(page);
      return;
    case 'PW-002':
      await addVariantProduct(page, 1, 'RedS');
      await addSimpleProduct(page, 1);
      await assertCartLineCount(page, 2);
      await assertCartLine(page, variant, 1, ['Red', 'S']);
      await applyCouponCode(page, invalidCoupon);
      await assertCouponResult(page, 'Invalid');
      await checkpoint();
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-003':
      await addVariantProduct(page, 2, 'RedS');
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await checkpoint();
      await removeCartLine(page, variant);
      await assertCartEmpty(page);
      await assertCartState(page, { lines: [], subtotal: 0, discount: 0, total: 0 }, row.caseId);
      return;
    case 'PW-004':
      await addVariantProduct(page, 1, 'RedS');
      await addSimpleProduct(page, 1);
      await rejectedUpdate(simple, 11);
      return;
    case 'PW-005':
      await addSimpleProduct(page, 1);
      await checkpoint();
      await removeCartLine(page, simple);
      await assertCartEmpty(page);
      await assertCartState(page, { lines: [], subtotal: 0, discount: 0, total: 0 }, row.caseId);
      return;
    case 'PW-006':
      await addSimpleProduct(page, 10);
      await assertCartLine(page, simple, 10);
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await checkpoint();
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-007':
      await addVariantProduct(page, 2, 'RedS');
      await addSimpleProduct(page, 1);
      await assertCartLineCount(page, 2);
      await checkpoint();
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-008':
      await addVariantProduct(page, 3, 'BlueM');
      await applyCouponCode(page, invalidCoupon);
      await assertCouponResult(page, 'Invalid');
      await checkpoint();
      await removeCartLine(page, variant);
      await assertCartEmpty(page);
      await assertCartState(page, { lines: [], subtotal: 0, discount: 0, total: 0 }, row.caseId);
      return;
    case 'PW-009':
      await addVariantProduct(page, 1, 'BlueM');
      await addSimpleProduct(page, 1);
      await updateCartLine(page, variant, 3);
      await assertCartLine(page, variant, 3, ['Blue', 'M']);
      await checkpoint();
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-010':
      await addOutOfStockProduct(page);
      await assertStockBlocked(page);
      await page.goto('/cart');
      await checkpoint();
      return;
    case 'PW-011':
      await addSimpleProduct(page, 1);
      await addVariantProduct(page, 1, 'RedS');
      await updateCartLine(page, simple, 1);
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await checkpoint();
      await beginCheckout(page);
      await submitMissingRequiredBillingAddress(page);
      await assertAddressValidationBlocked(page);
      return;
    case 'PW-012':
      await addVariantProduct(page, 3, 'BlueM');
      await assertCartLine(page, variant, 3, ['Blue', 'M']);
      await checkpoint();
      await beginCheckout(page);
      await submitMissingRequiredBillingAddress(page);
      await assertAddressValidationBlocked(page);
      return;
    case 'PW-013':
      await addVariantProduct(page, 1, 'RedS');
      await applyCouponCode(page, invalidCoupon);
      await assertCouponResult(page, 'Invalid');
      await rejectedUpdate(variant, 6);
      return;
    case 'PW-014':
      await addVariantProduct(page, 1, 'RedS');
      await addSimpleProduct(page, 1);
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await rejectedUpdate(simple, 11);
      return;
    default:
      throw new Error(`No implementation exists for ${row.caseId}.`);
  }
}

for (const row of pairwiseCases) {
  const title = `${row.caseId} ${row.expectedPath}: ${row.reason}`;
  const blocked = blockedReason(row);

  test.describe(() => {
    if (blocked) test.skip(true, blocked);

    test(title, { annotation: Object.entries({ caseId: row.caseId, precondition: cartCase(row.caseId).precondition, input: cartCase(row.caseId).input, expected: JSON.stringify(cartCase(row.caseId).expected), invariant: cartCase(row.caseId).invariants.join(', '), 'expected-path': row.expectedPath }).map(([type, description]) => ({ type, description })) }, async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'scenario', description: row.scenarioId });
      try {
        const baseline = await step(`${row.caseId} reset and preflight`, () => resetFixture(page, row));
        await testInfo.attach('manifest-preflight.txt', { body: baseline.preflightReceipt ?? '', contentType: 'text/plain' });
        if (baseline.checkoutEvidenceBefore) {
          await testInfo.attach('checkout-before.sql.txt', {
            body: baseline.checkoutEvidenceBefore,
            contentType: 'text/plain',
          });
        }
        await step(`${row.caseId} execute scenario`, () => runCase(page, row));

        if (baseline.checkoutEvidenceBefore) {
          const customerEmail = row.customerType === 'Registered'
            ? runtimeConfig.pwRegisteredEmail
            : process.env.QA_BILLING_EMAIL?.trim();
          if (!customerEmail) throw new Error(`Checkout evidence email is missing for ${row.caseId}.`);
          const after = await queryCheckoutEvidence(customerEmail);
          await testInfo.attach('checkout-after.sql.txt', { body: after, contentType: 'text/plain' });
          if (row.address === 'Complete') {
            await assertCheckoutOrderEvidence(baseline.checkoutEvidenceBefore, after, cartCase(row.caseId).expected.total + cartManifest.checkout.groundShipping);
          } else {
            assertCheckoutOrderCountUnchanged(baseline.checkoutEvidenceBefore, after);
          }
        }
      } catch (error) {
        if (error instanceof FixtureBlockedError) {
          test.skip(true, error.message);
          return;
        }
        throw error;
      }
    });
  });
}
