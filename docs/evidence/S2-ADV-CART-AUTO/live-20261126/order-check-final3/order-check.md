# Cart order independence — live run 26/11/2026

Status: **STOPPED_AFTER_ORDER_DEPENDENCE_FOUND** (seed 10387, run group `RUN-20261126140015607`).
Store: rebuilt image with SCRUM-96 fix, USD working currency, vi-VN stock resource present.

| Phase | Invocations | Case results | Passed | Not passed |
| --- | --- | --- | --- | --- |
| default (25 cases, one run) | 1 | 25 | 25 | 0 |
| isolated (each case alone) | 25 | 25 | 25 | 0 |
| reverse (each case, repeat-each=2) | 25 | 50 | 49 | 1 (PW-006 repeat 2) |
| seeded shuffle (repeat-each=2) | 16 of 25 | 32 of 50 | 31 | 1 (PW-006 repeat 2) |
| **Total** | **67** | **132** | **130** | **2** |

The run was stopped manually at 22:39 after the dependency was confirmed, so the
runner did not write its own `order-check.json`. `order-check-aggregate.json` is
built from the per-invocation summaries.

## Finding: PW-006 depended on the time since the previous order

Both failures are the second back-to-back repeat of PW-006 (registered customer,
valid coupon, checkout). The cart oracle before checkout passed
(subtotal 1000, discount 100, total 900). Confirm then showed:

```text
Please wait several seconds before placing a new order (already placed another order several seconds ago).
```

`OrderSettings.MinimumOrderPlacementInterval` is 1 minute in this store, per customer.
The second repeat reached Confirm less than a minute after the first order for the
same registered account. This is intended store behaviour, not a cart defect; the
reporter labelled it `FAILED_PRODUCT` because it is an assertion failure.

## Fix and verification

- `tests/helpers/sql-fixture.ts` `queryOrderPlacementWait` reads the setting and the
  account's last order time (read-only).
- `tests/pairwise.spec.ts` waits until interval + 5 s before a registered checkout and
  records the wait as an `order-interval` annotation. The store setting is unchanged.
- Rerun `../pw006-interval-fix/`: `PW-006 --repeat-each=4`, **4/4 PASSED**; the 2nd repeat
  waited 23 s (42 s since the previous order).

Not done: a complete order-check on the fixed code (option B chosen to save ~1h45).
The full receipt `PASSED` is therefore not claimed.
