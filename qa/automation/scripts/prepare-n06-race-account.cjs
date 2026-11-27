const { chromium } = require('@playwright/test');

if (require('node:fs').existsSync('.env')) process.loadEnvFile('.env');

const email = process.env.QA_N06_RACE_EMAIL;
const password = process.env.QA_N06_RACE_PASSWORD || process.env.QA_REGISTERED_PASSWORD;
if (!/^qa\.n03\.[a-z0-9._%+-]+@example\.test$/i.test(email || '') || !password) {
  throw new Error('FIXTURE_BLOCKED: set QA_N06_RACE_EMAIL (qa.n03.*@example.test) and QA_N06_RACE_PASSWORD or QA_REGISTERED_PASSWORD.');
}

async function fillIfPresent(page, selector, value) {
  if (await page.locator(selector).count()) await page.locator(selector).fill(value);
}

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL: process.env.NOP_BASE_URL || 'http://localhost/' });
    await page.goto('/login');
    await page.locator('#Email').fill(email);
    await page.locator('#Password').fill(password);
    await page.locator('button.login-button').click();
    if (!await page.locator('a.ico-account').count()) {
      await page.goto('/register');
      await page.locator('#FirstName').fill('QA');
      await page.locator('#LastName').fill('N06');
      await page.locator('#Email').fill(email);
      await page.locator('#Password').fill(password);
      await page.locator('#ConfirmPassword').fill(password);
      await page.locator('#register-button').click();
      if (!await page.locator('a.ico-account').count()) throw new Error('FIXTURE_BLOCKED: N06 race account could not be registered.');
    }

    await page.goto('/customer/addresses');
    if (!await page.locator('.address-list .address-item').count()) {
      await page.goto('/customer/addressadd');
      await page.locator('#Address_FirstName').fill('QA');
      await page.locator('#Address_LastName').fill('N06');
      await page.locator('#Address_Email').fill(email);
      await fillIfPresent(page, '#Address_City', process.env.QA_BILLING_CITY || 'Ho Chi Minh City');
      await fillIfPresent(page, '#Address_Address1', process.env.QA_BILLING_ADDRESS1 || '1 Test Street');
      await fillIfPresent(page, '#Address_ZipPostalCode', process.env.QA_BILLING_ZIP || '700000');
      await fillIfPresent(page, '#Address_PhoneNumber', process.env.QA_BILLING_PHONE || '0900000000');
      if (await page.locator('#Address_CountryId').count()) {
        const states = page.waitForResponse(response => response.url().toLowerCase().includes('getstatesbycountryid'), { timeout: 5000 }).catch(() => undefined);
        await page.locator('#Address_CountryId').selectOption({ label: process.env.QA_BILLING_COUNTRY || 'Vietnam' });
        await states;
      }
      if (await page.locator('#Address_StateProvinceId').count()) {
        await page.locator('#Address_StateProvinceId').selectOption({ label: process.env.QA_BILLING_STATE || 'Hồ Chí Minh' });
      }
      await page.locator('.save-address-button').click();
      await page.waitForLoadState('domcontentloaded');
      await page.goto('/customer/addresses');
    }
    if (await page.locator('.address-list .address-item').count() < 1) throw new Error('FIXTURE_BLOCKED: N06 race account has no saved address.');
    process.stdout.write('N06 race account and saved address are ready.\n');
  } finally {
    await browser.close();
  }
})().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
