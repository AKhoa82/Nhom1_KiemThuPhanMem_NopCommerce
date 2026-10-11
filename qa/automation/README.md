# Pairwise automation

This folder runs the generated Pairwise cases without copying their source data.
`tests/helpers/pairwise-data.ts` reads and validates the two CSV files in
`../pairwise/test-data/`; a malformed or mismatched source file fails test
discovery instead of silently running an incomplete suite.

## Local setup

1. Copy `.env.example` values into your local shell/environment. Do not commit
   the registered-customer password or SQL Server password.
2. Set `QA_SQL_PASSWORD` for the local `nopcommerce` Docker database.
   `scripts/reset-fixture.ps1` then resets only the `PW-*` cart fixtures,
   coupon/checkout state of affected test carts, and known stock baselines. It
   restarts the configured local storefront after a real reset so nopCommerce
   does not retain stale inventory in memory; the test waits for `/cart` to be
   ready before continuing.
   It refuses any database/container other than the explicitly named local
   test targets and stops without mutation when a required fixture is missing.
3. Start the already-installed local store, then run the commands below.

```powershell
npm ci
npx playwright install chromium
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
$env:NOP_BASE_URL = 'http://localhost:8080/'
$env:QA_SQL_PASSWORD = '<mat-khau-SQL-cuc-bo>'
$env:QA_BILLING_EMAIL = 'qa.guest@example.test'
$env:QA_REGISTERED_EMAIL = 'qa.pairwise.registered@example.test'
$env:QA_REGISTERED_PASSWORD = '<mat-khau-customer-fixture>'
npm run test:list
npm run test:case -- 'PW-001\b'
npm run test:all
npm run report
```

Without required local values, every `PW-xxx` test is deliberately skipped as
`Blocked: environment/fixture` rather than reported as a product failure.

## Outputs

- `reports/results.json`: machine-readable results.
- `reports/junit.xml`: CI/JUnit results.
- `reports/html/`: Playwright HTML report.
- `reports/pairwise-summary.md` and `reports/pairwise-summary.json`: one result per Pairwise ID, classified as environment, product, or automation failure.
- `artifacts/`: screenshot and trace for failed tests.

These generated folders and `.env` are ignored by Git.
