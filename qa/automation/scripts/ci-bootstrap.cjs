// SCRUM-92: bootstrap only the disposable Docker environment in qa/ci/compose.yml.
const { chromium } = require('@playwright/test');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
const powershell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
const baseURL = process.env.NOP_BASE_URL || 'http://localhost/';
const required = [
  'QA_SQL_PASSWORD', 'QA_ADMIN_EMAIL', 'QA_ADMIN_PASSWORD',
  'QA_PW_REGISTERED_EMAIL', 'QA_PW_REGISTERED_PASSWORD',
  'QA_REGISTERED_EMAIL', 'QA_REGISTERED_PASSWORD', 'QA_BILLING_EMAIL',
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`CI_BOOTSTRAP_BLOCKED: ${name} is missing.`);
}
if (!/^qa\.pairwise\.[a-z0-9._%+-]+@example\.test$/i.test(process.env.QA_PW_REGISTERED_EMAIL)
    || !/^qa\.n02\.[a-z0-9._%+-]+@example\.test$/i.test(process.env.QA_REGISTERED_EMAIL)) {
  throw new Error('CI_BOOTSTRAP_BLOCKED: dedicated synthetic PW/N02 emails are required.');
}
if (process.env.QA_PW_REGISTERED_EMAIL === process.env.QA_REGISTERED_EMAIL) {
  throw new Error('CI_BOOTSTRAP_BLOCKED: PW and N02 must use separate accounts.');
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function run(command, args, input) {
  const result = spawnSync(command, args, { input, encoding: 'utf8', windowsHide: true, timeout: 180_000 });
  if (result.error || result.status !== 0) {
    const detail = `${result.error?.message || ''} ${result.stderr || ''} ${result.stdout || ''}`;
    const masked = [process.env.QA_SQL_PASSWORD, process.env.QA_ADMIN_PASSWORD,
      process.env.QA_PW_REGISTERED_PASSWORD, process.env.QA_REGISTERED_PASSWORD]
      .reduce((value, secret) => value.replaceAll(secret, '***'), detail);
    throw new Error(`${command} failed: ${masked.trim()}`);
  }
  return result.stdout.trim();
}
function sql(query) {
  return run(docker, [
    'exec', '-i', 'nopcommerce_mssql_server', 'sh', '-c',
    'S=/opt/mssql-tools18/bin/sqlcmd; [ -x "$S" ] || S=/opt/mssql-tools/bin/sqlcmd; exec "$S" "$@"', 'sh',
    '-C', '-S', 'localhost', '-U', 'sa', '-P', process.env.QA_SQL_PASSWORD,
    '-d', 'nopcommerce', '-b', '-h', '-1', '-W', '-f', '65001',
  ], query);
}
async function waitForStore(page, expectedInstall, seconds = 360) {
  const deadline = Date.now() + seconds * 1000;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const response = await page.goto('/cart', { waitUntil: 'domcontentloaded', timeout: 15_000 });
      const installing = new URL(page.url()).pathname.toLowerCase().startsWith('/install');
      if (response?.ok() && installing === expectedInstall) return;
      last = `HTTP ${response?.status()}, path=${new URL(page.url()).pathname}`;
    } catch (error) { last = error.message; }
    await sleep(3_000);
  }
  throw new Error(`CI_BOOTSTRAP_BLOCKED: store did not reach expected state (install=${expectedInstall}): ${last}`);
}
async function install(page) {
  await waitForStore(page, true);
  await page.goto('/install');
  await page.locator('#AdminEmail').fill(process.env.QA_ADMIN_EMAIL);
  await page.locator('#AdminPassword').fill(process.env.QA_ADMIN_PASSWORD);
  await page.locator('#ConfirmPassword').fill(process.env.QA_ADMIN_PASSWORD);
  await page.locator('#DataProvider').selectOption('1');
  await page.locator('#ServerName').fill('nopcommerce_database');
  await page.locator('#DatabaseName').fill('nopcommerce');
  await page.locator('#Username').fill('sa');
  await page.locator('#Password').fill(process.env.QA_SQL_PASSWORD);
  await page.locator('#CreateDatabaseIfNotExists').check();
  if (await page.locator('#InstallSampleData').count()) await page.locator('#InstallSampleData').uncheck();
  if (await page.locator('#SubscribeNewsletters').count()) await page.locator('#SubscribeNewsletters').uncheck();
  try { await page.locator('#installation-form button[type="submit"]').click({ timeout: 8 * 60_000 }); }
  catch (error) {
    // nopCommerce can end the HTTP request by stopping the web process after installation.
    if (!/ERR_CONNECTION|Target page|Navigation failed|net::/i.test(String(error))) throw error;
  }
  const deadline = Date.now() + 8 * 60_000;
  while (Date.now() < deadline) {
    try {
      if (Number(sql("SET NOCOUNT ON; SELECT COUNT(*) FROM Store;")) >= 1) break;
    } catch { /* installer is still creating the database or schema */ }
    await sleep(5_000);
  }
  if (Date.now() >= deadline) throw new Error('CI_BOOTSTRAP_BLOCKED: nopCommerce installation did not finish.');
  if (run(docker, ['inspect', '-f', '{{.State.Running}}', 'nopcommerce']) === 'false') {
    run(docker, ['start', 'nopcommerce']);
  }
  await waitForStore(page, false);
}
async function register(browser, email, password) {
  const context = await browser.newContext({ baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/register');
    await page.locator('#FirstName').fill('QA');
    await page.locator('#LastName').fill('N04');
    await page.locator('#Email').fill(email);
    await page.locator('#Password').fill(password);
    await page.locator('#ConfirmPassword').fill(password);
    await page.locator('#register-button').click();
    if (await page.locator('a.ico-account').count() !== 1) {
      throw new Error(`CI_BOOTSTRAP_BLOCKED: QA account registration failed for ${email}.`);
    }
  } finally { await context.close(); }
}
async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL });
    await install(page);
    for (const file of ['seed-n03-pw-shirt.sql', 'seed-n04-ci.sql']) {
      const receipt = sql(readFileSync(resolve(__dirname, file), 'utf8'));
      process.stdout.write(`${file}: ${receipt.slice(-180)}\n`);
    }
    run(docker, ['restart', 'nopcommerce']);
    await waitForStore(page, false);
    await register(browser, process.env.QA_PW_REGISTERED_EMAIL, process.env.QA_PW_REGISTERED_PASSWORD);
    await register(browser, process.env.QA_REGISTERED_EMAIL, process.env.QA_REGISTERED_PASSWORD);
    const pwReset = resolve(__dirname, 'reset-fixture.ps1');
    run(powershell, ['-NoProfile', '-File', pwReset, '-CaseId', 'PW-001', '-ValidateOnly']);
    await page.goto('/cart');
    const guestGuid = (await page.context().cookies()).find(cookie => cookie.name === '.Nop.Customer')?.value;
    if (!guestGuid) throw new Error('CI_BOOTSTRAP_BLOCKED: guest cookie is missing.');
    const n02Reset = resolve(__dirname, 'reset-n02-fixture.ps1');
    run(powershell, ['-NoProfile', '-File', n02Reset, '-GuestGuid', guestGuid,
      '-AccountEmail', process.env.QA_REGISTERED_EMAIL, '-ValidateOnly']);
    run(process.execPath, [resolve(__dirname, 'b01-second-store.cjs'), 'setup']);
    run(docker, ['restart', 'nopcommerce']);
    await waitForStore(page, false);
    process.stdout.write('CI_BOOTSTRAP|PASS|fresh store, fixture, accounts, second store\n');
  } finally { await browser.close(); }
}
main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
