# S2-ADV-CART-AUTO - implementation and verification

Local date: 26/11/2026 (Asia/Bangkok). Source base: `e21ff4471fbe5a612e8dcda91868ec88cf08457e`.
Branch: `feat/S2-ADV-CART-AUTO`. Live evidence: [`live-20261126/`](live-20261126/).

## Result

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript `npx tsc --noEmit` | passed | - |
| Offline oracle checks (`tests/cart-oracle.spec.ts`) | 7/7 passed | [offline-results.json](offline-results.json) (earlier 6-test run) |
| Discovery | 14 PW + 11 ADV (8 N02 model rows + 3 regressions) | - |
| UI oracle check (USD) | 6/6 checks match manifest | [screenshots/usd-4-*.png](screenshots/), [step4-results-usd.json](screenshots/step4-results-usd.json) |
| PW live, 14 original pairwise cases | **14/14 PASSED** | [final-pw-newbuild](live-20261126/final-pw-newbuild/) (11) + [final-pw-rerun3](live-20261126/final-pw-rerun3/) (PW-001/003/004) |
| ADV live, CART-MERGE-01 + CART-REPEAT-01 | **11/11 PASSED** | [final-adv-newbuild2](live-20261126/final-adv-newbuild2/) (7) + [final-adv-rerun4](live-20261126/final-adv-rerun4/) (4) |
| Order independence | 130/132 passed; dependency found in PW-006, fixed, PW-006 4/4 back-to-back | [order-check-final3](live-20261126/order-check-final3/order-check.md), [pw006-interval-fix](live-20261126/pw006-interval-fix/) |
| Pair coverage | original model 253/253; N02 model 30/30 (PICT 3.7.4) | `qa/pairwise/` |

ADV results are reported separately from the 14 PW cases (`adv-cart-summary.*`
vs `pairwise-summary.*`) and do not change the 253-pair coverage.

Reruns in the PW/ADV rows were needed for environment reasons (cold start after
store restart, add-to-cart spinner timeout), not for changed expectations. No
expected result was changed to match a product failure.

### Order-check status

The full order-check on the final code was **not** completed. The live run
(default, isolated, reverse ×2, 16/25 seeded ×2) found that PW-006 failed on its
second back-to-back repeat: the store rejects a second order by the same customer
within `MinimumOrderPlacementInterval` (1 minute). The test now waits for that
interval before a registered checkout (read-only SQL; setting unchanged), and
PW-006 then passed 4/4 back-to-back. By decision, only PW-006 was rerun after
the fix, so the overall order-check is recorded as
`STOPPED_AFTER_ORDER_DEPENDENCE_FOUND`, not `PASSED`. A full rerun takes about
1h45: `scripts/run-order-check.ps1 -OutputDirectory reports/order-check`.

The top-level `order-check.*`, `pairwise-summary.*`, `adv-cart-summary.*`,
`junit.xml` and `run-manifest.json` are from the earlier attempt on 26/11 when the
store was unavailable (all BLOCKED_ENVIRONMENT); they are kept for history.

## Environment changes made for the live runs

- **Store image rebuilt** from the current source (the running image dated 23/11
  lacked the SCRUM-96 merge fix). Old image tagged `backup-20261123`; `App_Data`
  backed up and restored.
- **Working currency:** new visitors default to VND (rate 1). Tests select USD
  per customer (`ensureUsdCurrency`, currency Id 1); the money reader fails as
  `FAILED_AUTOMATION` for any other currency. Store configuration unchanged.
- **Language:** SCRUM-96 merge warnings are Vietnamese only for vi-VN. MERGE-OVER,
  MERGE-MULTISTORE and MERGE-ACTIVATION select Tiếng Việt (Id 2) first.
- **vi-VN resource:** the local pack lacked `ShoppingCart.QuantityExceedsStock`,
  so the warning showed the raw key. Added with
  `qa/automation/scripts/seed-vi-stock-resource.sql` (test data). See
  [DEFECT-NOTE-vi-missing-stock-resource.md](DEFECT-NOTE-vi-missing-stock-resource.md).
- **Accounts:** PW uses `QA_PW_REGISTERED_*` (`qa.pairwise.*`), ADV uses
  `qa.n02.*`. A shared account fails because PW-014 leaves a coupon, which blocks
  the N02 reset. Passwords were held only in the local runner environment.
- **Second store** (Id 2, `127.0.0.1`) was created for MERGE-MULTISTORE and
  removed afterwards (`b01-second-store.cjs cleanup`).

## What changed in automation

- Versioned monetary manifest and 25-case catalog (precondition, input,
  expected, invariants INV-CART-01..13); discovery validates exact IDs.
- Shared assertions for product, variant, quantity, unit price, line total,
  subtotal, discount and total; stock-warning checks; SQL before/after for checkout.
- Failure log: SQL snapshot, partial UI state, screenshot and trace; classification
  `PASSED / FAILED_PRODUCT / FAILED_AUTOMATION / FAILED_ENVIRONMENT / BLOCKED_ENVIRONMENT`.
- Deterministic SQL ordering in fixture snapshots; bounded store-readiness wait
  (150 s) after resets; per-session USD and vi-VN selection; order-placement-interval
  wait for registered checkout.

Exports contain no passwords, cookies or session traces (scanned). Runtime
screenshots, HTML reports and traces stay in ignored `qa/automation/artifacts`
and `qa/automation/reports`.

## Remaining

- Optional: full order-check on the final code for a `PASSED` receipt.
- Jira update and team notice (rebuilt image, vi-VN resource) are done outside this repo.
