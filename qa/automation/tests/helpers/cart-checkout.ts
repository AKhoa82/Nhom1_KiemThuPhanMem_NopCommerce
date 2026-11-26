import { expect, type Page } from '@playwright/test';
import type { PairwiseCase } from './pairwise-data';
import { runtimeConfig } from './runtime-config';

export const validCoupon = 'PW-CART-10PCT';
export const invalidCoupon = 'PW-NOT-EXIST';

export function requestedQuantity(row: PairwiseCase): number {
  if (row.quantityClass === 'One') return 1;
  if (row.quantityClass === 'ManyWithinStock') return 2;
  if (row.quantityClass === 'AtAvailableLimit') return row.productType === 'ConfigurablePhysical' ? 3 : 10;
  return row.productType === 'ConfigurablePhysical' ? 6 : 11;
}

/**
 * The local store shows VND (rate 1, DisplayOrder 0) to new visitors while the
 * oracle is USD. The working currency is stored per customer, so every new
 * guest, every login and every logout needs USD selected. Navigates only when
 * the current page shows another currency, so an already-USD page (and its
 * transient notifications) is left untouched.
 */
export async function ensureUsdCurrency(page: Page): Promise<void> {
  await ensureSelectorOption(page, '#customerCurrency', usdCurrencyValue, 'USD working currency');
}
/** Matched by currency Id (not display name, which may be localized). */
export const usdCurrencyValue = /\/changecurrency\/1(?:\?|$)/i;

/**
 * The SCRUM-96 merge warning is Vietnamese only when the guest's working
 * language is vi-VN; new visitors default to English. Select it explicitly for
 * cases that assert the Vietnamese text. Matched by language Id 2 (vi-VN).
 */
export async function ensureVietnameseLanguage(page: Page): Promise<void> {
  await ensureSelectorOption(page, '#customerlanguage', vietnameseLanguageValue, 'Vietnamese working language');
}
export const vietnameseLanguageValue = /\/changelanguage\/2(?:\?|$)/i;

async function ensureSelectorOption(page: Page, selectId: string, valuePattern: RegExp, label: string): Promise<void> {
  const selector = page.locator(selectId);
  if (await selector.count() === 0) return;
  const selectedValue = await selector.locator('option:checked').getAttribute('value');
  if (selectedValue && valuePattern.test(selectedValue)) return;
  const values = await selector.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value));
  const target = values.find(value => valuePattern.test(value));
  if (!target) throw new Error(`FAILED_AUTOMATION: ${selectId} has no option for ${label}.`);
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  const now = await page.locator(`${selectId} option:checked`).getAttribute('value');
  if (!now || !valuePattern.test(now)) throw new Error(`FAILED_AUTOMATION: could not select ${label}.`);
}

export async function loginRegisteredCustomer(
  page: Page,
  options: { switchCurrency?: boolean; email?: string; password?: string } = {},
): Promise<void> {
  await page.goto('/login');
  await page.locator('#Email').fill(options.email ?? runtimeConfig.registeredEmail);
  await page.locator('#Password').fill(options.password ?? runtimeConfig.registeredPassword);
  await page.locator('button.login-button').click();
  await expect(page.locator('a.ico-account')).toBeVisible();
  await expect(page.locator('a.ico-logout')).toBeVisible();
  if (options.switchCurrency !== false) await ensureUsdCurrency(page);
}

async function addProduct(page: Page, path: string, quantity: number, variant = false): Promise<void> {
  await page.goto(path);
  await expect(page.locator('.product-details-page')).toBeVisible();
  await ensureUsdCurrency(page);
  if (variant) {
    const attributes = page.locator('select[name^="product_attribute_"]');
    await expect(attributes).toHaveCount(2);
    await attributes.nth(0).selectOption({ label: quantity === 3 ? 'Blue' : 'Red' });
    await attributes.nth(1).selectOption({ label: quantity === 3 ? 'M' : 'S' });
  }
  await page.locator('input.qty-input').fill(String(quantity));
  await page.locator('button[id^="add-to-cart-button-"]').click();
  await expect(page.locator('.bar-notification.success')).toBeVisible();
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
  await setCartQuantity(page, quantityInput, quantity);
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
  if (await page.locator('#termsofservice').count()) await page.locator('#termsofservice').check();
  await page.locator('#checkout').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/checkout|login/i);

  // nopCommerce redirects anonymous users to Login before letting them enter
  // the checkout flow. Select the built-in guest path when it is available.
  const checkoutAsGuest = page.locator('.checkout-as-guest-button');
  if (await checkoutAsGuest.count()) {
    await checkoutAsGuest.click();
    await page.waitForLoadState('domcontentloaded');
  }

  await expect(page).toHaveURL(/checkout/i);
}

export async function submitMissingRequiredBillingAddress(page: Page): Promise<void> {
  await expect(page.locator('#billing-form')).toBeVisible();
  await page.locator('#BillingNewAddress_FirstName').fill('');
  await page.locator('#billingaddress-next-button').click();
}

async function addConfiguredProduct(page: Page, path: string, quantity: number, color: 'Red' | 'Blue', size: 'S' | 'M'): Promise<void> {
  await page.goto(path);
  await expect(page.locator('.product-details-page')).toBeVisible();
  await ensureUsdCurrency(page);
  const attributes = page.locator('select[name^="product_attribute_"]');
  await expect(attributes).toHaveCount(2);
  const colorOptions = await attributes.nth(0).locator('option').allTextContents();
  const actualColor = colorOptions.find(value => value.trim().toLowerCase() === color.toLowerCase());
  if (!actualColor) throw new Error(`Configured product is missing color '${color}'.`);
  await attributes.nth(0).selectOption({ label: actualColor });
  await attributes.nth(1).selectOption({ label: size });
  await page.locator('input.qty-input').fill(String(quantity));
  await page.locator('button[id^="add-to-cart-button-"]').click();
  await expect(page.locator('.bar-notification.success')).toBeVisible();
}

export async function addSimpleProduct(page: Page, quantity: number): Promise<void> {
  await addProduct(page, runtimeConfig.simpleProductPath, quantity);
}

export async function addVariantProduct(page: Page, quantity: number, variant: 'RedS' | 'BlueM'): Promise<void> {
  await addConfiguredProduct(
    page,
    runtimeConfig.configurableProductPath,
    quantity,
    variant === 'RedS' ? 'Red' : 'Blue',
    variant === 'RedS' ? 'S' : 'M',
  );
}

export async function addOutOfStockProduct(page: Page): Promise<void> {
  await page.goto(runtimeConfig.outOfStockProductPath);
  await expect(page.locator('.product-details-page')).toBeVisible();
  await ensureUsdCurrency(page);
  await page.locator('input.qty-input').fill('1');
  await page.locator('button[id^="add-to-cart-button-"]').click();
  await expect(page.locator('.bar-notification.error, .bar-notification.warning, .message-error, .message-failure').filter({ hasText: /\S/ }).first()).toBeVisible();
}

export async function updateCartLine(page: Page, productName: string, quantity: number): Promise<void> {
  await page.goto('/cart');
  const line = page.locator('table.cart tbody tr').filter({ hasText: productName });
  await expect(line).toHaveCount(1);
  await setCartQuantity(page, line.locator('input.qty-input'), quantity);
  await page.waitForLoadState('domcontentloaded');
}

async function setCartQuantity(page: Page, input: ReturnType<Page['locator']>, quantity: number): Promise<void> {
  await input.fill(String(quantity));
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    input.evaluate((element) => {
      const form = element.closest('form');
      if (!form) throw new Error('Cart update form is missing.');
      let submitter = form.querySelector<HTMLInputElement>('input[name="updatecart"]');
      if (!submitter) {
        submitter = document.createElement('input');
        submitter.type = 'hidden';
        submitter.name = 'updatecart';
        form.append(submitter);
      }
      submitter.value = 'Update shopping cart';
      form.submit();
    }),
  ]);
}

export async function removeCartLine(page: Page, productName: string): Promise<void> {
  await page.goto('/cart');
  const line = page.locator('table.cart tbody tr').filter({ hasText: productName });
  await expect(line).toHaveCount(1);
  await line.locator('button.remove-btn').click();
  await page.waitForLoadState('domcontentloaded');
}

export async function applyCouponCode(page: Page, couponCode: string): Promise<void> {
  await page.goto('/cart');
  await page.locator('#discountcouponcode').fill(couponCode);
  await page.locator('#applydiscountcouponcode').click();
  await page.waitForLoadState('domcontentloaded');
}

async function completeAddressStep(page: Page, prefix: 'BillingNewAddress' | 'ShippingNewAddress', selectId: string, nextButton: string): Promise<void> {
  const existingAddress = page.locator(selectId);
  if (await existingAddress.count()) {
    const options = await existingAddress.locator('option').count();
    if (options > 1) {
      await existingAddress.selectOption({ index: 1 });
      await page.locator(nextButton).click();
      await expect(page).toHaveURL(/checkout\/(shippingaddress|shippingmethod|paymentmethod)/i);
      return;
    }
  }
  await page.locator(`#${prefix}_FirstName`).fill(runtimeConfig.billing.firstName);
  await page.locator(`#${prefix}_LastName`).fill(runtimeConfig.billing.lastName);
  await page.locator(`#${prefix}_Email`).fill(runtimeConfig.billing.email);
  await page.locator(`#${prefix}_City`).fill(runtimeConfig.billing.city);
  await page.locator(`#${prefix}_Address1`).fill(runtimeConfig.billing.address1);
  await page.locator(`#${prefix}_ZipPostalCode`).fill(runtimeConfig.billing.zip);
  const phone = page.locator(`#${prefix}_PhoneNumber`);
  if (await phone.count()) await phone.fill(runtimeConfig.billing.phone);
  const country = page.locator(`#${prefix}_CountryId`);
  if (await country.count()) {
    const statesResponse = page.waitForResponse(
      response => response.url().toLowerCase().includes('getstatesbycountryid') && response.ok(),
      { timeout: 5_000 },
    ).catch(() => undefined);
    await country.selectOption({ label: runtimeConfig.billing.country });
    await statesResponse;
  }
  const state = page.locator(`#${prefix}_StateProvinceId`);
  if (await state.count()) {
    await state.selectOption({ label: runtimeConfig.billing.state });
    await expect(state.locator('option:checked')).toHaveText(runtimeConfig.billing.state);
  }
  await page.locator(nextButton).click();
  await expect(page).toHaveURL(/checkout\/(shippingaddress|shippingmethod|paymentmethod)/i);
}

export async function reachShippingMethod(page: Page): Promise<void> {
  await completeAddressStep(page, 'BillingNewAddress', '#billing-address-select', '#billingaddress-next-button');
  if (await page.locator('#shipping-address-select').count()) {
    await completeAddressStep(page, 'ShippingNewAddress', '#shipping-address-select', '#shippingaddress-next-button');
  }
  await page.goto('/checkout/shippingmethod', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[name="shippingoption"]').first()).toBeVisible();
}

export async function completeLocalCheckout(page: Page): Promise<void> {
  await completeAddressStep(page, 'BillingNewAddress', '#billing-address-select', '#billingaddress-next-button');
  if (await page.locator('#shipping-address-select').count()) {
    await completeAddressStep(page, 'ShippingNewAddress', '#shipping-address-select', '#shippingaddress-next-button');
  }
  if (await page.locator('input[name="shippingoption"]').count()) {
    await page.locator('input[name="shippingoption"]').first().check();
    await page.locator('.shipping-method-next-step-button').click();
    await expect(page).toHaveURL(/checkout\/(paymentmethod|paymentinfo|confirm|completed)/i);
  }
  if (await page.locator('input[name="paymentmethod"]').count()) {
    await page.locator('input[name="paymentmethod"]').first().check();
    await page.locator('.payment-method-next-step-button').click();
    await expect(page).toHaveURL(/checkout\/(paymentinfo|confirm|completed)/i);
  }
  if (await page.locator('.payment-info-next-step-button').count()) {
    await page.locator('.payment-info-next-step-button').click();
    await expect(page).toHaveURL(/checkout\/(confirm|completed)/i);
  }
  await page.locator('.confirm-order-next-step-button').click();
  await expect(page).toHaveURL(/checkout\/completed/i);
}
