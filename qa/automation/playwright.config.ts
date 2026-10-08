import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  outputDir: './artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/html', open: 'never' }],
    ['junit', { outputFile: './reports/junit.xml' }],
    ['json', { outputFile: './reports/results.json' }],
  ],
  use: {
    baseURL: process.env.NOP_BASE_URL ?? 'http://localhost/',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
