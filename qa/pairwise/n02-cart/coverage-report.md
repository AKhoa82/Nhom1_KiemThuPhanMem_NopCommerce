# SCRUM-87 — N02 Cart PICT coverage

- Model SHA-256: `9c8330ea736992bb48425c48baa14e5c7c16ca926948f94e94256bc30e770a7c`
- PICT command: `pict.exe model.pict /o:2 /r:10387`
- Feasible full assignments: 8
- Generated rows: 8
- Feasible pairs: 30
- Pairs in generated rows: 30
- Generated pair coverage: 30/30 (100%)
- Latest automation attempt: AUTO-202611261326 at 5756d2bac2b77682ad3e86335625446e0d30ac18; 8 passed, 0 failed, 0 skipped/blocked. Status is taken from execution.json; skipped means blocked, not passed. Generated coverage is not a UI test result.
- Existing UI cases: MERGE-VALID, MERGE-EXACT, MERGE-OVER, MERGE-VARIANT, REPEAT-SAME, REPEAT-DIFFERENT, REPEAT-BELOW, REPEAT-OVER.
- All eight PICT rows have UI automation; generated coverage is independent of runtime status.
- Values are relation labels. Concrete quantities in generated-cases.csv must be checked against stock before execution.
- This model is independent of the original 14 PW rows and 253 pairs.

## Constraints

- LoginMerge requires GuestToRegistered; RepeatAdd requires SameSession.
- Different variants use PerVariant stock checks; Same variants use BelowStock, AtStock or AboveStock.
- For LoginMerge/AboveStock, each source cart is valid independently: 4 and 2 with Red/S stock 5.
