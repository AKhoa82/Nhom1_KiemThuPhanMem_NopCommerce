# Pairwise invalid-combination validation report

## Run information

- Người thực hiện: Linh
- Ngày kiểm tra: 2026-10-07 (Asia/Bangkok)
- Source baseline under test: `674d0ceef6bd8a52fe74d6f4fff326960162cec0`
- Working branch HEAD khi kiểm tra: `3044939423`
- QA artifacts commit: `3044939423`
- Input: `qa/pairwise/generated-cases.csv`
- Generated CSV SHA-256:
  `07F2F48BE415263BC23EB9C5612BF18809B878BE3BF89274971948E06C121A0F`
- Validator: `qa/pairwise/validate-invalid-combinations.ps1`
- Validator SHA-256:
  `494A9F20AE2D6407D4E975F3C29ED6EAD16E2167FB3C02370BEB7598F368EEAB`
- Row validator: `qa/pairwise/validate-generated-rows.ps1`
- Row validator SHA-256:
  `C7B70EE46DD0AE09E3EA116B5883BA014033FB51E19FCA016C33E9DEC4851438`
- Total rows checked: `17`
- Validator exit code: `0`
- Total violations: `0`
- Overall result: **PASS**

## Model evidence

| Evidence | Nội dung chứng minh |
| --- | --- |
| `../../image/pairwise/linh/linh-11-model-constraints.png` | Constraint C01-C05, gồm các rule stock, Remove và address validation. |
| `../../image/pairwise/linh/linh-11b-model-constraints.png` | Constraint C06-C09, gồm shipping NA, payment success, một blocker chính và invalid coupon. |

## Environment and fixture decisions

| Decision | Value | Evidence/meaning |
| --- | --- | --- |
| Anonymous checkout allowed | `true` | `../../image/pairwise/linh/linh-04-anonymous-checkout-setting.png` |
| Inventory tracking | Both `SimplePhysical` and `ConfigurablePhysical` track inventory | `linh-05-simple-product-inventory.png` and `linh-06-variant-combination-stock.png` |
| Local shipping | `LocalOption1` is available | `linh-07-local-shipping-methods.png` |
| Fake decline processor | `false` | `SimulatedDecline` is Blocked; `linh-08-local-payment-methods.png` shows only Check/Money Order active. |
| Coupon and multiple lines | Available | `linh-09-coupon-and-cart-fixtures.png` |

All image names in the table are relative to `image/pairwise/linh/` unless a
full relative path is shown.

## Invalid-combination results

| Rule | Status | Violation count | Sample row IDs | Result explanation |
| --- | --- | ---: | --- | --- |
| `INV-01` | `N/A` | 0 | — | Anonymous checkout is enabled, so `Guest` is an included value. |
| `INV-02` | `PASS` | 0 | — | Both declared product fixtures track inventory. |
| `INV-03` | `PASS` | 0 | — | No `OutOfStock` row uses a quantity class other than `ExceedsAvailableStock`. |
| `INV-04` | `PASS` | 0 | — | Every `Remove` row has Address, ShippingMethod and PaymentMethod equal to `NA`. |
| `INV-05` | `PASS` | 0 | — | Every `MissingRequired` row has ShippingMethod and PaymentMethod equal to `NA`. |
| `INV-06` | `PASS` | 0 | — | No `LocalSuccess` row uses `ShippingMethod=NA`. |
| `INV-07` | `N/A` | 0 | — | No fake decline processor is available; `SimulatedDecline` is Blocked and absent. |
| `INV-08` | `PASS` | 0 | — | No row contains more than one primary blocker among stock, missing address and payment decline. |

`Coupon=Invalid` is not treated as a primary checkout blocker. A rejected coupon
may be followed by checkout without that coupon, as required by C09.

## Row-by-row validation

The row validator reads the factor/value domains directly from `model.pict` and
checks the following for every generated row:

- CSV columns exactly match the ten model factors;
- no value is blank or outside its factor domain;
- C01 through C09 and the checkout stopping sequence are satisfied;
- conditional fixtures are available for every value used;
- each negative row has at most one primary blocker.

| Case ID | Result | Primary blocker | Details |
| --- | --- | --- | --- |
| `PW-001` | `PASS` | Stock | OK |
| `PW-002` | `PASS` | None | OK |
| `PW-003` | `PASS` | None | OK |
| `PW-004` | `PASS` | None | OK |
| `PW-005` | `PASS` | None | OK |
| `PW-006` | `PASS` | None | OK |
| `PW-007` | `PASS` | Stock | OK |
| `PW-008` | `PASS` | None | OK |
| `PW-009` | `PASS` | Address | OK |
| `PW-010` | `PASS` | None | OK |
| `PW-011` | `PASS` | Address | OK |
| `PW-012` | `PASS` | Stock | OK |
| `PW-013` | `PASS` | None | OK |
| `PW-014` | `PASS` | Stock | OK |
| `PW-015` | `PASS` | Address | OK |
| `PW-016` | `PASS` | None | OK |
| `PW-017` | `PASS` | None | OK |

Row-validation summary:

```text
Expected columns: 10
Actual columns: 10
Total rows: 17
Valid rows: 17
Invalid rows: 0
Overall result: PASS
Row validator exit code: 0
```

## Reproduction command

Run from the repository root:

```powershell
& .\qa\pairwise\validate-invalid-combinations.ps1
$LASTEXITCODE

& .\qa\pairwise\validate-generated-rows.ps1
$LASTEXITCODE
```

The accepted result is:

```text
Total violations: 0
Overall result: PASS
0

Total rows: 17
Valid rows: 17
Invalid rows: 0
Overall result: PASS
0
```

## Scope of this report

This report completes both the `INV-01` through `INV-08` invalid-combination
check and detailed validation of all generated rows. Feasible-pair coverage is
calculated in the following workflow step; it is not inferred from either PASS
result above.
