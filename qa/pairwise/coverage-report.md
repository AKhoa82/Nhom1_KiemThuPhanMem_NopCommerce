# Pairwise feasible-pair coverage report

## Run information

- Người thực hiện: Linh
- Ngày tính coverage: 2026-10-07 (Asia/Bangkok)
- Source baseline under test: `674d0ceef6bd8a52fe74d6f4fff326960162cec0`
- Working branch HEAD khi kiểm tra: `3044939423`
- QA artifacts commit: `3044939423`
- Model: `qa/pairwise/model.pict`
- Model SHA-256:
  `96102280AC25AAA5A89191AA45F7BA2B6E761398D76962CF3F555088F41791B1`
- Generated cases: `qa/pairwise/generated-cases.csv`
- Generated CSV SHA-256:
  `07F2F48BE415263BC23EB9C5612BF18809B878BE3BF89274971948E06C121A0F`
- Coverage checker: `qa/pairwise/calculate-pairwise-coverage.ps1`
- Coverage checker SHA-256:
  `A84D7B9C7EEEE434DA4560FE10AEA66F1B82854C4B796F63AE6A1D6C401358E4`
- PICT release: `v3.7.4`
- Generation command: `pict.exe .\qa\pairwise\model.pict /o:2`
- Strength: `2` (pairwise)
- Seed: `N/A` (no randomization option used)

## Calculation method

The checker does not infer coverage from the number of generated tests. It:

1. reads all factor/value domains from `model.pict`;
2. enumerates all `6,912` full assignments in the unconstrained Cartesian
   product;
3. applies C01 through C09 and the fixed fixture/configuration decisions;
4. retains `600` feasible full assignments;
5. marks a value pair feasible only when it appears in at least one feasible
   full assignment;
6. extracts all value pairs covered by the 17 generated tests; and
7. compares the generated pair set with the feasible pair set.

## Coverage result

| Metric | Result |
| --- | ---: |
| Factors | 10 |
| Generated Pairwise tests | 17 |
| Raw full assignments before constraints | 6,912 |
| Feasible full assignments | 600 |
| Raw candidate pairs before constraints | 279 |
| Pairs excluded as infeasible | 23 |
| Total feasible pairs | 256 |
| Covered feasible pairs | 256 |
| Missing feasible pairs | 0 |
| Unexpected actual pairs | 0 |
| Infeasible generated rows | 0 |
| Coverage | **256/256 = 100%** |
| Overall result | **PASS** |
| Coverage checker exit code | 0 |

## Missing feasible pairs

None.

## Conditional values

| Value | Status | Coverage decision | Reason/evidence |
| --- | --- | --- | --- |
| `CustomerType=Guest` | `Included` | Counted | Anonymous checkout is enabled; `linh-04-anonymous-checkout-setting.png`. |
| `ShippingMethod=LocalOption1` | `Included` | Counted | `Shipping.FixedByWeightByTotal` is active; `linh-07-local-shipping-methods.png`. |
| `ShippingMethod=LocalOption2` | `Excluded` | Not counted | No second verified local shipping method. |
| `PaymentMethod=LocalSuccess` | `Included` | Counted | Check/Money Order is active; `linh-08-local-payment-methods.png`. |
| `PaymentMethod=SimulatedDecline` | `Blocked` | Not counted | No verified local fake decline processor; Check/Money Order cannot simulate decline. |
| `Coupon=Valid` | `Included` | Counted | `PW-CART-10PCT` was verified. |
| `CartComposition=MultipleLines` | `Included` | Counted | Two different product lines were verified; `linh-09-coupon-and-cart-fixtures.png`. |

All image names above are relative to `image/pairwise/linh/`.

## Exhaustive tests

The exhaustive sets below are intentionally not included in the numerator or
denominator of Pairwise coverage. Their execution status is tracked separately
from this constraint-validation task.

| Exhaustive set | Coverage treatment |
| --- | --- |
| Quantity boundaries for simple/configurable products | Separate result; not counted in 256 pairs |
| Each missing required address field | Separate result; not counted in 256 pairs |
| Coupon apply/remove and total/state checks | Separate result; not counted in 256 pairs |
| Every local shipping option and invalid request | Separate result; not counted in 256 pairs |
| Local payment success/decline/retry | Separate result; not counted in 256 pairs |
| Stock reduced before Confirm | Separate result; not counted in 256 pairs |

This table records coverage treatment only. Exhaustive status does not change
Pairwise coverage `256/256`.

## Reproduction command

Run from the repository root:

```powershell
& .\qa\pairwise\calculate-pairwise-coverage.ps1
$LASTEXITCODE
```

The accepted summary is:

```text
Total feasible pairs: 256
Covered feasible pairs: 256
Missing feasible pairs: 0
Unexpected actual pairs: 0
Infeasible generated rows: 0
Coverage: 256/256 = 100%
Overall result: PASS
0
```

If `model.pict`, fixture decisions or the generated CSV change, regenerate the
tests and rerun this checker. The hashes in this report must then be updated.
