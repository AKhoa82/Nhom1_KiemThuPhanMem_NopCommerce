# Pairwise automation

## SCRUM-92: N04 CI gate

`.github/workflows/dotnet.yml` now has separate .NET, Pairwise-model and real
Chromium E2E jobs for PRs and pushes to `develop`. The model job installs pinned
PICT 3.7.4, compares fresh model output with the checked-in rows, validates
constraints/coverage, and checks the independent N02 model. Model coverage is
reported separately from UI pass rate.

The E2E job runs on an Ubuntu GitHub runner with Docker. It builds the web image
from the PR SHA, installs a new nopCommerce database, seeds only synthetic QA
products/accounts, and runs `smoke.spec.ts`, all 14 `PW-*` cases (including
Checkout), then all 11 ADV Cart cases. `qa/ci/verify-results.cjs` rejects a
missing, skipped, blocked or failed case even if Playwright exits successfully.
The race test and QA-decline payment test remain separate; they are not hidden
inside the stable gate. Reports and failure screenshots/traces are uploaded with
`always()` to the Actions run as `n04-model-*` and `n04-e2e-*` artifacts for seven
days. The runner's store/database are destroyed after the run.

The job reads credentials from GitHub Actions secrets when configured:
`N04_QA_SQL_PASSWORD`, `N04_QA_ADMIN_EMAIL`, `N04_QA_ADMIN_PASSWORD`,
`N04_QA_PW_REGISTERED_EMAIL`, `N04_QA_PW_REGISTERED_PASSWORD`,
`N04_QA_REGISTERED_EMAIL`, and `N04_QA_REGISTERED_PASSWORD`. Customer emails
must use the `qa.pairwise.*@example.test` and `qa.n02.*@example.test` patterns.
Missing secrets (including on fork pull requests) are replaced with fresh,
masked per-run credentials because the workflow creates a disposable store and
database for each run. No production account is used.

For a disposable **fresh** local environment only, set `QA_SQL_PASSWORD`,
`QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_PW_REGISTERED_EMAIL`,
`QA_PW_REGISTERED_PASSWORD`, `QA_REGISTERED_EMAIL`, `QA_REGISTERED_PASSWORD`
and `QA_BILLING_EMAIL`, then run from the repository root:

```powershell
docker compose -f qa/ci/compose.yml up -d --build
cd qa/automation
npm ci
npx playwright install chromium
node scripts/ci-bootstrap.cjs
$env:QA_REPORT_DIR = 'reports/n04-pw'; $env:QA_ARTIFACT_DIR = 'artifacts/n04-pw'
npm run test:pw
node ../ci/verify-results.cjs PW reports/n04-pw
$env:QA_REPORT_DIR = 'reports/n04-adv'; $env:QA_ARTIFACT_DIR = 'artifacts/n04-adv'
npm run test:adv-cart
node ../ci/verify-results.cjs ADV reports/n04-adv
cd ../..
docker compose -f qa/ci/compose.yml down --volumes --remove-orphans
```

The bootstrap refuses missing credentials and non-dedicated test emails. It
expects the named CI containers and a fresh empty nopCommerce database; never
run it against an existing local store. To read a CI result, open the GitHub
Actions run and download the artifacts. `pairwise/test-data/summary.md` and the
N02 coverage report describe model coverage. `reports/n04-pw/` and
`reports/n04-adv/` each contain JSON, JUnit, HTML and `n04-gate.json` for actual
UI outcomes. A `BLOCKED_ENVIRONMENT` or skipped case is not a Pass.

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

When PW and N02 run in one command (`npm run test:order-check`), set the PW
account separately with `QA_PW_REGISTERED_EMAIL` and `QA_PW_REGISTERED_PASSWORD`
(falls back to `QA_REGISTERED_*`). PW-014 leaves a coupon on its account, which
blocks the N02 reset if both suites share one account.

The store shows VND to new visitors. Tests select USD per customer with
`ensureUsdCurrency` (currency Id 1) and the money reader fails as
`FAILED_AUTOMATION` for any other working currency. SCRUM-96 merge warnings are
Vietnamese only for the vi-VN language; the merge cases call
`ensureVietnameseLanguage` (language Id 2). The local vi-VN pack needs
`scripts/seed-vi-stock-resource.sql` (see `test-data/cart-fixture-manifest.json`).

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

## SCRUM-91: N03 fixture, SQL and repeated runs

- `scripts/reset-n03-fixture.ps1 -AccountEmail qa.n03.<name>@example.test [-ValidateOnly]` restores the N03 fixture (one `PW-SHIRT` Red/S cart line of 4, Red/S stock 5) for that single account. It leaves historical orders and other customers' data alone and stops if the account holds any other cart row, coupon or gift card.
- `scripts/run-n03-series.ps1 -Runs 10 -AccountEmail ... -Label BEFORE-FIX` repeats reset, SQL snapshot, `n03-race.spec.ts` and SQL snapshot. Output goes to `n03-local-evidence/` (git-ignored).
- `scripts/summarize-n03-runs.cjs <seriesDir> [--md file]` builds the before/after table and the frequency with a 95% interval. See `docs/evidence/SCRUM-91/N03-FIXTURE-SQL-RESULTS.md`.
- `scripts/seed-n03-pw-shirt.sql` is a one-time seed for a **fresh** install with no sample data: it creates only `PW-SHIRT` (Red/Blue x S/M, stock 5/4/6/3) and the Ground fixed rate. Run it with `docker exec -i nopcommerce_mssql_server <sqlcmd> -S localhost -U sa -P <password> -d nopcommerce -b < scripts/seed-n03-pw-shirt.sql`. N03 also needs One-page checkout disabled (`ordersettings.onepagecheckoutenabled = False`).
- The SQL helpers pick `/opt/mssql-tools18/bin/sqlcmd` or fall back to `/opt/mssql-tools/bin/sqlcmd`, so they work with older SQL Server images such as `2019-CU18`.


## S2-ADV-CART-AUTO - cart monetary oracle and ADV report

Run from `qa/automation`:

```powershell
npm run test:offline      # parser, catalog guards, cart arithmetic, diagnostic collection; no store/SQL
npm run test:pw           # original 14 PW cases
npm run test:adv-cart     # 11 merge/repeat cases, including REPEAT-BELOW and REPEAT-OVER
npm run test:order-check  # default, each isolated, reverse x2, seeded shuffle x2
```

`test-data/cart-fixture-manifest.json` defines expected USD prices, stock,
subtotal coupon (`DiscountTypeId=20`, 10%, unlimited), tax/fees and Ground rate.
SQL preflight runs after reset and rejects mismatches with `FIXTURE_BLOCKED`.
It never changes the expected values to match the storefront. The selectors
are verified against the checked-in Razor views; live verification remains
pending until the local nopCommerce/SQL fixture is available. A missing Total
or an unparseable amount is an explicit automation failure, never an inferred
subtotal-minus-discount amount. The zero Ground rate is also defined by the
existing `seed-n03-pw-shirt.sql` fixture.

`cart-case-catalog.json` supplies Case ID, path, precondition, input, expected
checkpoint state and invariants. PW discovery validates the exact 14 IDs against
CSV. ADV validates all eight N02 generated mappings plus the three existing
regressions (mixed, multi-store, activation). PW-004/PW-014 now add Red/S 1 and
Simple 1 before rejecting Simple 11, faithfully implementing `MultipleLines`.
The PICT model and the original 253/253 pair coverage are unchanged.

Reports are separate: `reports/pairwise-summary.md/json` contains PW only;
`reports/adv-cart-summary.md/json` contains CART-MERGE-01/CART-REPEAT-01 only.
ADV lies outside the original 14 PW cases. Removing one line from a multi-line
cart is covered by `cart-risk.spec.ts` outside the original pair coverage.
Each summary includes metadata, classification and a failure-log link. A
skipped fixture is `BLOCKED_ENVIRONMENT`, not a pass. HTML/JSON/JUnit remain
available. Failed cases attach `failure-log.json` with expected/actual, failed
step, URL without query parameters, visible warnings, SQL evidence and totals
HTML; screenshot/trace remain local runtime artifacts.

Order-check saves each execution under `reports/order-check`, including all
repeat results, reverse order and shuffle seed (default 10387). It invokes
one case at a time to enforce the chosen order: a grep alternation alone does
not reorder Playwright tests. It returns nonzero for inconsistent outcomes or
when independence is `NOT_PROVEN` because one or more cases were blocked or
failed. Windows PowerShell 5.1 is supported. Never run two fixture suites
concurrently: each reset owns the same local inventory.

To refresh N02 execution metadata, take the eight mapped outcomes from the
latest ADV summary and run `node ../pairwise/n02-cart/generate.mjs`. Install
PICT first with `../pairwise/install-pict.ps1` if needed. Do not edit generated
CSV by hand. Keep historical evidence in its existing directory.

Committed evidence goes in `docs/evidence/S2-ADV-CART-AUTO/`. Export only
sanitized summaries, JUnit, order-check receipt and run metadata; cookies,
passwords and traces with sessions must stay out of Git. The current local
run is blocked; restoring reliable `/cart` responses and supplying QA credentials is required before
marking live oracle verification or order independence complete.
