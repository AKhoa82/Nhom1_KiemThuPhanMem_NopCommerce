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

For the current local N02 fixture, use a registered account created only for
N02. The reset accepts `qa.n02.*@example.test`, not the `qa.pairwise.*` account
shown above for the ordinary PW cases. Register it once with
`node scripts/register-local-qa.cjs` after setting the email and password.
The default `/pw-shirt-variants-2` path returns 404 in this store.

```powershell
$env:NOP_BASE_URL = 'http://localhost/'
$env:QA_CONFIGURABLE_PRODUCT_PATH = '/pw-shirt-variants'
$env:QA_REGISTERED_EMAIL = 'qa.n02.your-unique-name@example.test'
$env:QA_REGISTERED_PASSWORD = '<mat-khau-customer-n02>'
$env:QA_FIXTURE_VERSION = 'SCRUM-87-N02-v1'
node scripts/register-local-qa.cjs
npm run test:n02-cart
```

`CART-REPEAT-01` needs `QA_SQL_PASSWORD`; `CART-MERGE-01` also needs the
registered account email and password. `QA_N02_STORE_ID` defaults to `1` and
must name the current test store.

N02 uses `scripts/reset-n02-fixture.ps1`, scoped to the current guest customer
cookie and the synthetic registered account. It clears only their `PW-SHIRT`
Cart rows in the selected store. Existing coupon or gift-card codes block the
run without being deleted. It restores Red/S stock 5 and Blue/M stock 3, then
restarts the local store to clear cached inventory. The ordinary
`PW-*` reset script is not used by N02. The N02 test attaches SQL snapshots
with `CustomerId`, `StoreId`, variant and quantity for both carts; the UI
assertions check subtotal and total. Product price is verified as 200 by the
reset preflight, while the SQL snapshot records the current tax setting.

`MERGE-MULTISTORE` needs a temporary second local store at `127.0.0.1`.
Before the full N02 run, use `node --env-file=.env scripts/b01-second-store.cjs setup`,
restart the `nopcommerce` container, and wait for `/cart` to respond. After
capturing evidence, use `node --env-file=.env scripts/b01-second-store.cjs cleanup`.
The case is skipped with `FIXTURE_BLOCKED` when that second store is absent.
The setup and cleanup scripts only accept the named local database and the
dedicated N02 account; cleanup refuses unrelated cart rows or orders.

Generate and validate the independent N02 PICT model with:

```powershell
powershell -ExecutionPolicy Bypass -File ../pairwise/install-pict.ps1
node ../pairwise/n02-cart/generate.mjs
```

Read `../pairwise/n02-cart/coverage-report.md` for generated pair coverage.
The CSV records UI results from `execution.json`; two additional rows remain
`NotCoded/NotRun` and generated coverage is separate from UI pass rate.

Without required local values, every `PW-xxx` test is deliberately skipped as
`Blocked: environment/fixture` rather than reported as a product failure.

## Outputs

- `reports/results.json`: machine-readable results.
- `reports/junit.xml`: CI/JUnit results.
- `reports/html/`: Playwright HTML report.
- `reports/pairwise-summary.md` and `reports/pairwise-summary.json`: one result per Pairwise ID, classified as environment, product, or automation failure.
- `reports/cart-risk-summary.md` and `reports/cart-risk-summary.json`: result for `CART-01`–`CART-14` and `CART-REPEAT-01`.
- `tests/n02-cart.spec.ts`: SCRUM-86 cases for cart merge over stock, valid and exact-stock controls, variant separation, and repeat-add behavior. Run them with `npm run test:n02-cart`; read the per-test result in `reports/html/`, `reports/junit.xml`, or `reports/results.json`. This suite is separate from the 14 PW pairwise cases and does not change their 253-pair coverage.
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
