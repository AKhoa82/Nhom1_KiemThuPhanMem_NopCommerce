# S2-ADV-CART-AUTO - implementation and verification

Local date: 26/11/2026 (Asia/Bangkok). Source base: `e21ff4471fbe5a612e8dcda91868ec88cf08457e`.
Branch: `feat/S2-ADV-CART-AUTO`. Runs used the modified working tree; source fingerprints are in `source-files.sha256.json`.

## Result

- TypeScript: `npx tsc --noEmit` passed.
- Offline checks: 6 passed (USD cents/grouping/sign parsing; malformed catalog IDs; failure classification; line/total arithmetic; missing total; partial UI/SQL diagnostics).
- Discovery: exactly 14 PW + 11 ADV (8 N02 model rows and 3 existing regressions).
- Live attempt: **14 PW + 11 ADV BLOCKED_ENVIRONMENT**, no business assertions reached. `/cart` returned `ERR_EMPTY_RESPONSE`, socket reset or navigation timeout. A skipped Playwright run is not a business pass.
- Final order-check: 76 invocations / 150 blocked observations, zero status/classification differences and zero failed Playwright invocations. See `order-check.md/json`. Exit 1 (`NOT_PROVEN`) is intentional; blocked observations cannot prove business independence.
- Original PICT model/generated CSV/coverage remain unchanged: 253/253 pairs. N02 regenerated using Microsoft PICT 3.7.4: 8 rows, 30/30 feasible pairs. Generated pair coverage is not execution coverage.

## Evidence

- [PW summary](pairwise-summary.md), [PW JSON](pairwise-summary.json)
- [ADV summary](adv-cart-summary.md), [ADV JSON](adv-cart-summary.json)
- [JUnit](junit.xml), [run metadata](run-manifest.json)
- [Order-check receipt](order-check.json), [order-check status](order-check.md)
- [Source fingerprints](source-files.sha256.json)

Exports contain no passwords, cookies or session traces. Runtime screenshots,
HTML reports, traces and full per-invocation outputs stay in ignored local
`qa/automation/artifacts` and `qa/automation/reports` directories. Failure-log
collection is verified offline with unavailable totals/SQL and a real browser
screenshot; no live failure artifact is claimed for skipped cases.

The final order-check receipt records source commits observed during the working-tree run and the implementation commit. The original plan file remains unchanged.

## What changed

- Added versioned monetary manifest and 25-case catalog with preconditions,
  input, expected state, outcomes and invariants; discovery validates exact IDs.
- Added strict USD reader, shared state/line/quantity/variant/price/total assertions,
  unchanged SQL/cart checks after rejected stock updates, annotations and diagnostic attachments.
- Fixed PW-004/PW-014 to contain Red/S 1 plus Simple 1 before attempting Simple 11.
  Expected subtotal is 300; PW-014 discount is 30 and total is 270. This repairs
  fidelity to `MultipleLines`; it does not change the PICT model.
- Added REPEAT-BELOW (1+2 => qty3/600) and REPEAT-OVER (4+2 rejected => qty4/800).
  ADV reports are separate from the original 14 PW and from CART-01..14 risk results.
- Order runner uses actual per-case invocation order, a recorded seed, isolated
  cases and repeat-each=2. Each invocation has a fresh report directory.
- Multi-store reset now clears the dedicated account/guest fixture in store 2
  before its baseline check. N02/activation/store setup support SQL tools 17/18.
- Store readiness is bounded below the overall test timeout so unavailable
  storefronts are reported as blocked instead of exhausting a business test.

## Oracle verification and remaining acceptance work

SQL confirmed existing prices Simple=100, Shirt=200, active subtotal coupon
`DiscountTypeId=20`, percentage=10. Zero Ground rate is defined by the existing
seed script. The current store uses `/pw-shirt-variants`, supplied via
`QA_CONFIGURABLE_PRODUCT_PATH`. Selectors were checked against Razor views,
including per-line `.message-error` and `.product-unit-price/.product-subtotal`.
Live coupon totals, rejected-update behavior and checkout order total remain
unverified because `/cart` could not be used reliably. No expected result was
changed to match a product failure. No product defect is inferred from these
blocked attempts.

Containers were initially stopped and were started for this task. A dedicated
synthetic `qa.n02.s2.*@example.test` account was registered for the live attempt;
its password was held in the local runner process and was not exported.
The SQL password was read from the existing local container configuration and
was not copied to files. Store 2 was not created because the suite was blocked
before that scenario. Restoring reliable storefront responses is required
before running the full live order-check.

Implementation is ready for review, but acceptance is incomplete: restore the
store, verify the manifest on UI, rerun PW/ADV and order-check until passed,
then record review. Jira publication requires the target issue and a connected
Atlassian account. PR should remain draft until live verification is complete.
