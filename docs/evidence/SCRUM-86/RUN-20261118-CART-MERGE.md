# SCRUM-86 — N02 live Chromium run, CART-MERGE-01

- Run ID: `AUTO-20261118132928100`
- Time: 2026-11-18 13:29:28–13:31:32 UTC
- Store: `http://localhost/`; local Docker `nopcommerce` and `nopcommerce_mssql_server`
- Browser: Playwright Chromium, one worker
- Source HEAD: `ab2e730dd9f0e382b1d5d0e13af5f43fe46f35fd` with uncommitted N02 test changes
- Fixture version: `UNSPECIFIED` in generated manifest; Linh's fixture confirmation remains pending
- Command, from `qa/automation`, with SQL and registered customer credentials set in the local environment:

  ```powershell
  $env:QA_CONFIGURABLE_PRODUCT_PATH = '/pw-shirt-variants'
  npx playwright test tests/n02-cart.spec.ts --grep CART-MERGE-01
  ```

| Case | Input | Result | Observed UI and SQL |
| --- | --- | --- | --- |
| `MERGE-OVER` | Account Red/S 4 + guest Red/S 2; variant stock 5 | **Fail** | Before login both carts had the expected quantities. After login, the account cart had Red/S 4 with total 800 ₫, the original guest cart had 0, and no error or warning was visible. The guest's 2 items were silently lost. Related defect: [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96). |
| `MERGE-VALID` | Account Red/S 2 + guest Red/S 2 | Pass | One Red/S line of 4; subtotal and total 800 ₫; quantity persisted after refresh. |
| `MERGE-EXACT` | Account Red/S 2 + guest Red/S 3 | Pass | One Red/S line of 5; subtotal and total 1,000 ₫; quantity persisted after refresh. |
| `MERGE-VARIANT` | Account Red/S 1 + guest Blue/M 1 | Pass | Two separate variant lines of 1 each; subtotal and total 400 ₫; lines persisted after refresh. |

The [run evidence directory](RUN-20261118-CART-MERGE) contains selected screenshots and SQL snapshots. For `MERGE-OVER`, compare the [account cart before login](RUN-20261118-CART-MERGE/merge-over-account-before-login.png), [guest cart before login](RUN-20261118-CART-MERGE/merge-over-guest-before-login.png), [account cart after login](RUN-20261118-CART-MERGE/merge-over-account-after-login.png), and [original guest cart after login](RUN-20261118-CART-MERGE/merge-over-original-guest-after-login.png). The [guest SQL snapshot before login](RUN-20261118-CART-MERGE/merge-over-guest-before-login.sql.txt), [account SQL snapshot after login](RUN-20261118-CART-MERGE/merge-over-account-after-login.sql.txt), [quantity comparison](RUN-20261118-CART-MERGE/merge-over-merge-over-quantities.txt), and [captured login feedback](RUN-20261118-CART-MERGE/merge-over-login-feedback.txt) support the same finding. For the passing controls, see the account cart after login for [MERGE-VALID](RUN-20261118-CART-MERGE/merge-valid-account-after-login.png), [MERGE-EXACT](RUN-20261118-CART-MERGE/merge-exact-account-after-login.png), and [MERGE-VARIANT](RUN-20261118-CART-MERGE/merge-variant-account-after-login.png). The remaining generated attachments are kept locally outside Git.

The four `MERGE-OVER` before/after screenshots were also attached to [SCRUM-86](https://anhkhoa080205.atlassian.net/browse/SCRUM-86), where the run summary is comment `10037`. The defect reproduction is noted on [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96), comment `10038`.

The generated Playwright JSON, JUnit, HTML report and failure trace remain under `qa/automation/reports/` and `qa/automation/artifacts/` locally. These directories are ignored by Git; the trace may include entered credentials and should not be committed. The run status is **failed** because `MERGE-OVER` failed; the other three cases passed. This is a reproducible finding, not a completed defect retest after a fix. Khoa still needs to review the final oracle; Linh still needs to confirm the fixture and SQL baseline.

The same product failure was reproduced in a subsequent isolated run, `AUTO-20261118133939262`: expected conserved quantity 6, observed account 4 plus original guest 0. A separate full six-case run produced five Pass results; its `MERGE-OVER` attempt stopped earlier at `page.goto` with `net::ERR_NETWORK_IO_SUSPENDED`, so that attempt is an environment interruption rather than another product result. The isolated runs provide the product finding above.
