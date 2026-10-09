import { expect, type Page } from '@playwright/test';
import type { PairwiseCase } from './pairwise-data';
import { runtimeConfig } from './runtime-config';

const validCoupon = 'PW-CART-10PCT';
const invalidCoupon = 'PW-NOT-EXIST';

export function requestedQuantity(row: PairwiseCase): number {
  if (row.quantityClass === 'One') return 1;
  if (row.quantityClass === 'ManyWithinStock') return 2;
  if (row.quantityClass === 'AtAvailableLimit') return row.productType === 'ConfigurablePhysical' ? 3 : 10;
  return row.productType === 'ConfigurablePhysical' ? 6 : 11;
}

export async function loginRegisteredCustomer(page: Page): Promise<void> {
  await page.goto('/login');
  await page.locator('#Email').fill(runtimeConfig.registeredEmail);
  await page.locator('#Password').fill(runtimeConfig.registeredPassword);
  await page.locator('button.login-button').click();
  await expect(page.locator('.account')).toContainText(/My account/i);
}

async function addProduct(page: Page, path: string, quantity: number, variant = false): Promise<void> {
  await page.goto(path);
  await expect(page.locator('.product-details-page')).toBeVisible();
  if (variant) {
    const attributes = page.locator('select[name^="product_attribute_"]');
    await expect(attributes).toHaveCount(2);
    await attributes.nth(0).selectOption({ label: quantity === 3 ? 'Blue' : 'Red' });
    await attributes.nth(1).selectOption({ label: quantity === 3 ? 'M' : 'S' });
  }
  await page.locator('input.qty-input').fill(String(quantity));
  await page.locator('button[id^="add-to-cart-button-"]').click();
}

export async function prepareCartForRow(page: Page, row: PairwiseCase): Promise<void> {
  const quantity = requestedQuantity(row);
  const path = row.inventoryState === 'OutOfStock'
    ? runtimeConfig.outOfStockProductPath
    : row.productType === 'ConfigurablePhysical'
      ? runtimeConfig.configurableProductPath
      : runtimeConfig.simpleProductPath;

  if (row.cartAction === 'Update') {
    await addProduct(page, path, 1, row.productType === 'ConfigurablePhysical');
    return;
  }

  await addProduct(page, path, quantity, row.productType === 'ConfigurablePhysical');
  if (row.cartComposition === 'MultipleLines' && row.inventoryState === 'InStock') {
    const otherPath = row.productType === 'ConfigurablePhysical'
      ? runtimeConfig.simpleProductPath
      : runtimeConfig.configurableProductPath;
    await addProduct(page, otherPath, 1, row.productType !== 'ConfigurablePhysical');
  }
}

export async function updatePrimaryCartLine(page: Page, quantity: number): Promise<void> {
  await page.goto('/cart');
  const quantityInput = page.locator('#shopping-cart-form input.qty-input').first();
  await expect(quantityInput).toBeVisible();
  await quantityInput.fill(String(quantity));
  await page.locator('#updatecart').click();
  await page.waitForLoadState('domcontentloaded');
}

export async function removePrimaryCartLine(page: Page): Promise<void> {
  await page.goto('/cart');
  const checkbox = page.locator('input[name="removefromcart"]').first();
  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await page.locator('#updatecart').click();
  await page.waitForLoadState('domcontentloaded');
}

export async function applyCoupon(page: Page, coupon: 'Valid' | 'Invalid'): Promise<void> {
  await page.goto('/cart');
  await page.locator('#discountcouponcode').fill(coupon === 'Valid' ? validCoupon : invalidCoupon);
  await page.locator('#applydiscountcouponcode').click();
  await page.waitForLoadState('domcontentloaded');
}

export async function beginCheckout(page: Page): Promise<void> {
  await page.goto('/cart');
  await page.locator('#checkout').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/checkout/i);
}

export async function submitMissingRequiredBillingAddress(page: Page): Promise<void> {
  await expect(page.locator('#billing-form')).toBeVisible();
  await page.locator('#BillingNewAddress_FirstName').fill('');
  await page.locator('#billingaddress-next-button').click();
}
