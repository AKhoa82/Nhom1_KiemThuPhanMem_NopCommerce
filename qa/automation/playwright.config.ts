import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  outputDir: process.env.QA_ARTIFACT_DIR ?? './artifacts/default',
  reporter: [
    ['list'],
    ['html', { outputFolder: `${process.env.QA_REPORT_DIR ?? './reports'}/html`, open: 'never' }],
    ['junit', { outputFile: `${process.env.QA_REPORT_DIR ?? './reports'}/junit.xml` }],
    ['json', { outputFile: `${process.env.QA_REPORT_DIR ?? './reports'}/results.json` }],
    ['./reporters/run-manifest-reporter.ts'],
    ['./reporters/pairwise-summary-reporter.ts'],
    ['./reporters/cart-risk-summary-reporter.ts'],
    ['./reporters/adv-cart-summary-reporter.ts'],
  ],
  use: {
    baseURL: process.env.NOP_BASE_URL ?? 'http://localhost/',
    browserName: 'chromium',
    ignoreHTTPSErrors: process.env.NOP_IGNORE_HTTPS_ERRORS !== 'false',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
