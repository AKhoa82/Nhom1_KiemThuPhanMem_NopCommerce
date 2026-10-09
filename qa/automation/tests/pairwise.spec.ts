import { test } from '@playwright/test';
import { assertAddressValidationBlocked, assertCartEmpty, assertCartHasItems, assertCouponResult, assertNoCheckoutContinuation, assertStockBlocked } from './helpers/assertions';
import { applyCoupon, beginCheckout, loginRegisteredCustomer, prepareCartForRow, removePrimaryCartLine, requestedQuantity, submitMissingRequiredBillingAddress, updatePrimaryCartLine } from './helpers/cart-checkout';
import { FixtureBlockedError, resetFixture } from './helpers/fixtures';
import { loadPairwiseCases } from './helpers/pairwise-data';
import { blockedReason } from './helpers/runtime-config';

const pairwiseCases = loadPairwiseCases();

for (const row of pairwiseCases) {
  const title = `${row.caseId} ${row.expectedPath}: ${row.reason}`;
  const blocked = blockedReason(row);

  test.describe(() => {
    if (blocked) {
      // Skip at discovery time so a missing local fixture never asks Playwright
      // to launch Chromium or becomes a misleading product-test failure.
      test.skip(true, blocked);
    }

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

    if (row.customerType === 'Registered') await loginRegisteredCustomer(page);
    await prepareCartForRow(page, row);

    const stockBlocked = row.inventoryState === 'OutOfStock' || row.quantityClass === 'ExceedsAvailableStock';
    if (row.cartAction === 'Update') await updatePrimaryCartLine(page, requestedQuantity(row));
    if (stockBlocked) {
      await assertStockBlocked(page);
      await assertNoCheckoutContinuation(page);
      return;
    }

    await assertCartHasItems(page);
    if (row.coupon !== 'None') {
      await applyCoupon(page, row.coupon);
      await assertCouponResult(page, row.coupon);
    }

    if (row.cartAction === 'Remove') {
      await removePrimaryCartLine(page);
      await assertCartEmpty(page);
      return;
    }

    if (row.address === 'MissingRequired') {
      await beginCheckout(page);
      await submitMissingRequiredBillingAddress(page);
      await assertAddressValidationBlocked(page);
      return;
    }

    if (row.address === 'NA') {
      await assertNoCheckoutContinuation(page);
      return;
    }

    // The reset endpoint is a prerequisite for this branch. The checkout UI is
    // reached only after every cart/coupon assertion above has passed.
    await beginCheckout(page);
    throw new Error('Blocked: checkout completion needs the environment-owned local address/shipping/payment fixture.');
    });
  });
}
