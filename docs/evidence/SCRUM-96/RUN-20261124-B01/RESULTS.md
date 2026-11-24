# SCRUM-96 B01 — post-fix retest, 24/11/2026

## Run identity and environment

- Playwright runs: original seven-case run `AUTO-20261124075047802` (07:50:47–07:54:26 UTC), then complete eight-case run `AUTO-20261124081257059` after adding `MERGE-MULTISTORE`. The [eight-case machine manifest](MERGE-MULTISTORE/run-manifest.json) and [JUnit result](MERGE-MULTISTORE/junit.xml) are preserved.
- Source base: `9d57731321fe5d60ed4a42f9837189c0e45ac879` on `test/SCRUM-87-n02-fixture`, with the uncommitted B01 patch. The base SHA alone does **not** identify the tested patch.
- Local stores during the eight-case run: store 1 at `http://localhost/` and temporary store 2 at `http://127.0.0.1/`; Docker containers `nopcommerce` and `nopcommerce_mssql_server`, SQL Server 2019, fixture `SCRUM-87-N02-v1`. `PW-SHIRT` price 200, Red/S stock 5, Blue/M stock 3, no backorders. Tests used a synthetic `qa.n02.*@example.test` account. Store 2 was removed after the run.
- The existing web container was started, and the locally built `Nop.Services.dll` was copied into it and restarted. The tested DLL SHA-256 was `B7665DB99C23098172E2BB4ABE8C421BD05906A4C241EAE9B55EAD7BCEF37406`. Rebuilding the Docker image from the eventual commit is still needed for deployment.
- Automation: Playwright 1.64.0 on Chromium, .NET SDK 10.0.401. Command from `qa/automation`: `node --env-file=.env node_modules/@playwright/test/cli.js test tests/n02-cart.spec.ts`. Each case used the scoped `reset-n02-fixture.ps1` and captured UI plus SQL for both customer IDs.

## Results

| Case | Result | Observed UI and SQL |
| --- | --- | --- |
| `MERGE-OVER` 4+2 > 5 | **Pass** | Login stayed on accessible guest cart with stock warning; account Red/S 4, guest Red/S 2 after rejection and refresh. After reducing guest to 1 and signing in again: account 5, guest 0. [Rejected SQL](MERGE-OVER/guest-after-rejected-login.sql.txt), [retry SQL](MERGE-OVER/after-retry.sql.txt), [warning](MERGE-OVER/login-feedback.txt), [UI](MERGE-OVER/guest-after-rejected-login.png). |
| `MERGE-MIXED` | **Pass** | Account Red/S 4; guest Red/S 2 and Blue/M 1. After rejected login: account Red/S 4 and Blue/M 1; guest Red/S 2. After reducing guest to 1 and retrying: account Red/S 5 and Blue/M 1; guest empty. [Rejected SQL](MERGE-MIXED/mixed-after-rejected-login.sql.txt), [retry SQL](MERGE-MIXED/mixed-after-retry.sql.txt), [UI](MERGE-MIXED/mixed-after-rejected-login.png). |
| `MERGE-VALID` 2+2 < 5 | **Pass** | One account Red/S line quantity 4, guest 0, correct subtotal and total; persisted after refresh. [SQL](MERGE-VALID/after-refresh.sql.txt). |
| `MERGE-EXACT` 2+3 = 5 | **Pass** | One account Red/S line quantity 5, guest 0, no false warning; persisted after refresh. [SQL](MERGE-EXACT/after-refresh.sql.txt). |
| `MERGE-VARIANT` | **Pass** | Separate Red/S and Blue/M lines, quantity 1 each; guest 0; persisted after refresh. [SQL](MERGE-VARIANT/after-refresh.sql.txt). |
| `MERGE-MULTISTORE` | **Pass** | On store 1 (`localhost`), account Red/S 4 and guest Red/S 2 exceeded stock. On store 2 (`127.0.0.1`), guest Blue/M 1 was valid. Login at store 2 showed a stock warning and stayed signed out; Blue/M moved once to account store 2 while Red/S 2 remained with guest store 1. After reducing Red/S to 1 and retrying at store 1, account store 1 had Red/S 5, account store 2 still had Blue/M 1, and both guest carts were empty. [Store 1 rejected SQL](MERGE-MULTISTORE/multistore-store1-after-rejection.sql.txt), [store 2 rejected SQL](MERGE-MULTISTORE/multistore-store2-after-rejection.sql.txt), [store 1 retry SQL](MERGE-MULTISTORE/multistore-store1-after-retry.sql.txt), [store 2 retry SQL](MERGE-MULTISTORE/multistore-store2-after-retry.sql.txt), [UI](MERGE-MULTISTORE/multistore-store2-rejected-login.png), [run manifest](MERGE-MULTISTORE/run-manifest.json). |
| `REPEAT-SAME` | **Pass** | Adding Red/S 2 then 3 produced one line quantity 5, correct totals, stable after refresh. [SQL](REPEAT-SAME/after-refresh.sql.txt). |
| `REPEAT-DIFFERENT` | **Pass** | Red/S remained 5 and Blue/M appeared as a separate line quantity 1, correct totals, stable after refresh. [SQL](REPEAT-DIFFERENT/after-refresh.sql.txt). |

The complete eight-case Playwright run passed **8/8** with 0 skipped and 0 failed. `ShoppingCartMigrationTests` passed **6/6** after adding a service test for discount coupon and gift-card transfer only after a successful retry. `npx tsc --noEmit` and `git diff --check` passed.

The isolated `MERGE-MULTISTORE` run `AUTO-20261124080840977` also passed **1/1** before the complete run. Both used temporary store 2 (ID 2), the same synthetic N02 account and guest identity, and SQL snapshots scoped to each store. To reproduce the full run on this local Docker fixture: run `node --env-file=.env scripts/b01-second-store.cjs setup`, restart `nopcommerce`, wait for `/cart` to return 200, run the Playwright command above, extract evidence with `node scripts/extract-b01-multistore-evidence.cjs`, then run `node --env-file=.env scripts/b01-second-store.cjs cleanup`.

The earlier single-case `MERGE-OVER` run timed out because the test tried to click `#updatecart`, a button absent from this storefront. The test now uses the existing `updateCartLine` helper; the isolated retry passed, then the seven-case run above passed. This was an automation selector error, not a product failure.

## Handoff limits

The general `cart-risk.spec.ts` / `PW-*` reset was not run: its reset script deletes cart rows for **all** customers with PW fixture products, beyond B01's scoped test customers. The N02 suite covers the related repeat-add regression with a customer-scoped reset. Coupon and gift-card transfer were verified at service level, not through the UI.

In the multi-store case, the rejected line stayed in store 1 while login was attempted on store 2, whose guest cart was then empty. The warning did not identify which store contained the remaining item. Data was preserved, but the buyer-facing recovery path and wording need review.

The English warning and mistranslated stock reason were corrected in an uncommitted follow-up patch. The [warning retest](../RUN-20261124-B01-WARNING/RESULTS.md) records Vietnamese text, desktop/mobile screenshots, and isolated `MERGE-OVER` and `MERGE-MULTISTORE` results. The original eight-case run above predates that wording change.

The [independent B01 review](../REVIEW-20261124.md) still requests changes to the multi-store recovery path and identifies untested sign-in caller and checkout-state paths. Passing UI/SQL data checks do not close those findings. This evidence is local and uncommitted; SCRUM-96 remains In Progress until the findings are resolved, the patch and evidence are committed or proposed in a PR, and the group lead accepts the retest.
