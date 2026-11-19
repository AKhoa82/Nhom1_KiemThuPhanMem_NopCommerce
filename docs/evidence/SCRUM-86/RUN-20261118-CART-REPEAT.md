# SCRUM-86 — N02 live Chromium run, CART-REPEAT-01

- Run ID: `AUTO-20261118083411021`
- Time: 2026-11-18 08:34:11–08:34:59 UTC
- Store: `http://localhost/`; local Docker `nopcommerce` and `nopcommerce_mssql_server`
- Browser: Playwright Chromium
- Source HEAD: `ab2e730dd9f0e382b1d5d0e13af5f43fe46f35fd` with uncommitted N02 test changes
- Fixture version: `UNSPECIFIED` in generated manifest
- Command, from `qa/automation` (with credentials supplied through the local environment):

  ```powershell
  $env:QA_CONFIGURABLE_PRODUCT_PATH = '/pw-shirt-variants'
  npm run test:n02-cart -- --grep CART-REPEAT-01
  ```

| Case | Result | Observed UI and SQL |
| --- | --- | --- |
| `REPEAT-SAME` | Pass, 22.8 s | One Red/S line, quantity 5, subtotal and total 1,000 ₫; SQL has one Red/S Cart row with quantity 5. |
| `REPEAT-DIFFERENT` | Pass, 23.5 s | Two lines: Red/S quantity 5, Blue/M quantity 1; subtotal and total 1,200 ₫; SQL has two separate Cart rows. |

Selected evidence is in [RUN-20261118-CART-REPEAT](RUN-20261118-CART-REPEAT): [REPEAT-SAME screenshot](RUN-20261118-CART-REPEAT/repeat-same-after-repeat-add.png) and [SQL snapshot](RUN-20261118-CART-REPEAT/repeat-same-after-repeat-add.sql.txt), plus [REPEAT-DIFFERENT screenshot](RUN-20261118-CART-REPEAT/repeat-different-different-variant-after-add.png) and [SQL snapshot](RUN-20261118-CART-REPEAT/repeat-different-different-variant-after-add.sql.txt). Other generated attachments, Playwright JSON, JUnit, and HTML reports remain local outside Git.

The four `CART-MERGE-01` tests were not part of this run. The local environment had no `QA_REGISTERED_PASSWORD` for the existing registered customer. Their result is **not run**, not Pass or Fail. This run does not complete the full SCRUM-86 task or verify the `SCRUM-96` defect retest.
