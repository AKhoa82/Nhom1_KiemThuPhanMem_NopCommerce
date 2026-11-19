# N02 Cart model

This model covers static input relations for `CART-MERGE-01` and
`CART-REPEAT-01`. It is independent of the original `model.pict` and its
14 PW rows / 253 pairs. The sequence of login, repeat addition and refresh is
checked by `qa/automation/tests/n02-cart.spec.ts`.

Run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File qa/pairwise/install-pict.ps1
node qa/pairwise/n02-cart/generate.mjs
```

`generate.mjs` runs Microsoft PICT 3.7.4 with a fixed seed, validates domains,
constraints and concrete quantities, enumerates feasible assignments to check
pair coverage, and writes `generated-cases.csv` and `coverage-report.md`.
PICT 3.7.4 cannot read this repository's non-ASCII Windows path, so the
generator copies the model to an ASCII temp path while running it and removes
the temp file afterward.

Each CSV row maps to a concrete fixture. `ExistingUiTest` links the six
already coded business cases. `NotCoded` marks two additional RepeatAdd
combinations from the model. `ConfirmedFixtureRun=NotRun` remains until a
separate run on a confirmed local fixture is recorded; pair coverage alone
does not imply a UI Pass.
