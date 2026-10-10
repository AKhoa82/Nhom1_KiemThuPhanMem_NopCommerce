import { test, type Page } from '@playwright/test';
import { assertAddressValidationBlocked, assertCartEmpty, assertCartLine, assertCartLineCount, assertCheckoutCompleted, assertCouponResult, assertStockBlocked } from './helpers/assertions';
import { addOutOfStockProduct, addSimpleProduct, addVariantProduct, applyCouponCode, beginCheckout, completeLocalCheckout, invalidCoupon, loginRegisteredCustomer, removeCartLine, submitMissingRequiredBillingAddress, updateCartLine, validCoupon } from './helpers/cart-checkout';
import { FixtureBlockedError, resetFixture } from './helpers/fixtures';
import { loadPairwiseCases, type PairwiseCase } from './helpers/pairwise-data';
import { blockedReason } from './helpers/runtime-config';

const pairwiseCases = loadPairwiseCases();
const simple = 'PW-Simple-Stock';
const variant = 'PW-Shirt-Variants';

async function runCase(page: Page, row: PairwiseCase): Promise<void> {
  if (row.customerType === 'Registered') await loginRegisteredCustomer(page);

  switch (row.caseId) {
    case 'PW-001':
      await addSimpleProduct(page, 1);
      await updateCartLine(page, simple, 2);
      await assertCartLine(page, simple, 2);
      await applyCouponCode(page, invalidCoupon);
      await assertCouponResult(page, 'Invalid');
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
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-003':
      await addVariantProduct(page, 2, 'RedS');
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await removeCartLine(page, variant);
      await assertCartEmpty(page);
      return;
    case 'PW-004':
      await addSimpleProduct(page, 1);
      await updateCartLine(page, simple, 11);
      await assertStockBlocked(page);
      return;
    case 'PW-005':
      await addSimpleProduct(page, 1);
      await removeCartLine(page, simple);
      await assertCartEmpty(page);
      return;
    case 'PW-006':
      await addSimpleProduct(page, 10);
      await assertCartLine(page, simple, 10);
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-007':
      await addVariantProduct(page, 2, 'RedS');
      await addSimpleProduct(page, 1);
      await assertCartLineCount(page, 2);
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-008':
      await addVariantProduct(page, 3, 'BlueM');
      await applyCouponCode(page, invalidCoupon);
      await assertCouponResult(page, 'Invalid');
      await removeCartLine(page, variant);
      await assertCartEmpty(page);
      return;
    case 'PW-009':
      await addVariantProduct(page, 1, 'BlueM');
      await addSimpleProduct(page, 1);
      await updateCartLine(page, variant, 3);
      await assertCartLine(page, variant, 3, ['Blue', 'M']);
      await beginCheckout(page);
      await completeLocalCheckout(page);
      await assertCheckoutCompleted(page);
      return;
    case 'PW-010':
      await addOutOfStockProduct(page);
      await assertStockBlocked(page);
      return;
    case 'PW-011':
      await addSimpleProduct(page, 1);
      await addVariantProduct(page, 1, 'RedS');
      await updateCartLine(page, simple, 1);
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await beginCheckout(page);
      await submitMissingRequiredBillingAddress(page);
      await assertAddressValidationBlocked(page);
      return;
    case 'PW-012':
      await addVariantProduct(page, 3, 'BlueM');
      await assertCartLine(page, variant, 3, ['Blue', 'M']);
      await beginCheckout(page);
      await submitMissingRequiredBillingAddress(page);
      await assertAddressValidationBlocked(page);
      return;
    case 'PW-013':
      await addVariantProduct(page, 1, 'RedS');
      await applyCouponCode(page, invalidCoupon);
      await assertCouponResult(page, 'Invalid');
      await updateCartLine(page, variant, 6);
      await assertStockBlocked(page);
      return;
    case 'PW-014':
      await addSimpleProduct(page, 1);
      await applyCouponCode(page, validCoupon);
      await assertCouponResult(page, 'Valid');
      await updateCartLine(page, simple, 11);
      await assertStockBlocked(page);
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

    test(title, async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'scenario', description: row.scenarioId });
      testInfo.annotations.push({ type: 'expected-path', description: row.expectedPath });
      try {
        await resetFixture(page, row);
      } catch (error) {
        if (error instanceof FixtureBlockedError) {
          test.skip(true, error.message);
          return;
        }
        throw error;
      }
      await runCase(page, row);
    });
  });
}
