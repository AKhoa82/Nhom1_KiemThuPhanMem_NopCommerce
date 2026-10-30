const { chromium } = require('@playwright/test');

process.loadEnvFile('.env');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL: process.env.NOP_BASE_URL || 'http://localhost/' });
    await page.goto('/register');
    await page.locator('#FirstName').fill('QA');
    await page.locator('#LastName').fill('Sprint81');
    await page.locator('#Email').fill(process.env.QA_REGISTERED_EMAIL);
    await page.locator('#Password').fill(process.env.QA_REGISTERED_PASSWORD);
    await page.locator('#ConfirmPassword').fill(process.env.QA_REGISTERED_PASSWORD);
    await page.locator('#register-button').click();
    await page.waitForLoadState('domcontentloaded');
    const result = (await page.locator('.result, .message-error, .field-validation-error').allTextContents())
      .map(x => x.trim()).filter(Boolean).join(' | ');
    const loggedIn = await page.locator('a.ico-account').count() > 0;
    console.log(`Registration result: ${result || '(no message)'}; loggedIn=${loggedIn}; URL=${page.url()}`);
    if (!loggedIn) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
