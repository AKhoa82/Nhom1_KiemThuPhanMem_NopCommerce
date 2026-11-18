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
npm run test:cart-risk
npm run test:n03-race
npm run report
```

Without required local values, every `PW-xxx` test is deliberately skipped as
`Blocked: environment/fixture` rather than reported as a product failure.

## Outputs

- `reports/results.json`: machine-readable results.
- `reports/junit.xml`: CI/JUnit results.
- `reports/html/`: Playwright HTML report.
- `reports/pairwise-summary.md` and `reports/pairwise-summary.json`: one result per Pairwise ID, classified as environment, product, or automation failure.
- `reports/cart-risk-summary.md` and `reports/cart-risk-summary.json`: result for `CART-01`–`CART-14` and `CART-REPEAT-01`.
- `artifacts/`: screenshot and trace for failed tests.

These generated folders and `.env` are ignored by Git.

## SCRUM-90: two tabs at Confirm

`npm run test:n03-race` runs one `CHK-RACE-01` attempt on Chromium. It signs in
once, opens two tabs in the same browser context, brings both to Confirm, and
sends both Confirm clicks concurrently. The test records the two POST times,
statuses, final pages, screenshots, HTML, SQL snapshots, and a trace. The
machine-readable attempt summary is attached as `n03-attempt.json` in
`reports/results.json` and visible in the HTML report.

Before **each** invocation, prepare the dedicated local registered account with
one `PW-SHIRT` Red/S cart line of quantity 4 and Red/S stock of 5. The account
needs a saved billing address. Ground shipping and Check / Money Order must be
available. Set `QA_REGISTERED_EMAIL`, `QA_REGISTERED_PASSWORD`, and
`QA_SQL_PASSWORD`; `NOP_BASE_URL` defaults to `http://localhost/`. The test
checks the fixture and skips with `FIXTURE_BLOCKED` if it does not match. A
successful Confirm consumes the cart and stock, so prepare the fixture anew
before the next invocation. `--repeat-each` alone does not reset it.

The test intentionally fails if a tab exposes a SQL error, if two orders are
created, or if the two POSTs are farther apart than
`QA_N03_MAX_DISPATCH_GAP_MS` (default 250 ms). A failed test can therefore be
valid evidence of a product defect. Keep the generated `reports/` and
`artifacts/` local: HTML, traces, and screenshots can contain session data.
