# T07 - Output, scenario mapping and pairwise review

Review date: 2026-10-08

## Result

| Review item | Result | Evidence |
| --- | --- | --- |
| Output structure and CaseId | PASS | `generated-cases.csv` has 14 rows, the 10 model factors, and the unique contiguous IDs `PW-001` to `PW-014`. |
| Generated rows and constraints | PASS | `validate-generated-rows.ps1`: 14 valid rows, 0 invalid rows. `validate-invalid-combinations.ps1`: 0 violations. |
| Feasible exhaustive membership | PASS | Every generated row occurs in `exhaustive-raw.tsv`; the feasible exhaustive set has 420 rows. |
| Scenario mapping linkage | PASS | `scenario-mapping.csv` has 14 rows and a 1-to-1, ordered link to the generated CaseIds; all rows state `Mapped` and include a reason and expected path. |
| Pair coverage | PASS | `calculate-pairwise-coverage.ps1`: 253 feasible pairs, 253 covered, 0 missing, 0 unexpected pairs, 100.00%. |
| Reduction calculation | PASS | 420 feasible exhaustive cases - 14 pairwise cases = 406 removed cases; `406 / 420 = 96.67%`. |
| Reproducibility metadata | PASS | `generation.log` records PICT 3.7.4, tool/model/output SHA-256 values, seed `10380`, `/o:2` and `/o:max` commands, and generation commit `2c1a309ac80d2e57e52549e40b79eef27c6ca06f`. Current model and output hashes match the log. |

## Statistics

| Metric | Value |
| --- | ---: |
| Raw exhaustive assignments before constraints | 6912 |
| Feasible exhaustive assignments after constraints | 420 |
| Pairwise cases | 14 |
| Reduced cases | 406 |
| Reduction against feasible exhaustive | 96.67% |
| Total feasible pairs | 253 |
| Covered feasible pairs | 253 |
| Pair coverage | 100.00% |

The reduction denominator is the 420 feasible assignments, not the 6912 raw assignments.

## Scenario-mapping traceability note

The mapping file is structurally complete and its reasons are consistent with the factor values and stopping rules in `model.pict`. The Cart references can be traced to `docs/cart-checkout-scenarios.md` and `CART-14` is defined in `docs/pict-pairwise.md`; `SHP-01` and the Checkout/Address/Local-payment IDs are defined in `T05_DacTa_Checkout_Payment_Shipping_PaymentFailure_TonKho.md`. All scenario IDs used by the current mapping now have a local source specification.

This is a traceability follow-up, not a defect in the generated pairwise output or its constraint coverage.

## Re-run commands

```powershell
.\qa\pairwise\validate.ps1
.\qa\pairwise\validate-generated-rows.ps1
.\qa\pairwise\validate-invalid-combinations.ps1
.\qa\pairwise\calculate-pairwise-coverage.ps1
```
