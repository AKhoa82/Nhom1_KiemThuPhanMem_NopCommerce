# B01 recovery retest — 24/11/2026

- Multi-store recovery: isolated `MERGE-MULTISTORE` passed 1/1. The warning names the rejected store/item and links to that store's cart. Evidence: `RUN-20261124-B01-RECOVERY-MULTISTORE/`.
- Activation recovery: isolated `MERGE-ACTIVATION` passed 1/1. Rejected activation redirects to cart, leaves the user signed out, shows the warning, and preserves the rejected line. Evidence: `RUN-20261124-B01-RECOVERY-ACTIVATION/`.
- Checkout selections: `ShoppingCartMigrationTests` passed 7/7, including preservation through a rejected merge and reset after successful retry.
- Full N02 suite initial run: 8/9 passed because `REPEAT-SAME` timed out waiting for a success notification during add-to-cart. Targeted rerun of `REPEAT-SAME` then passed 1/1 in 26.4s.
- Complete rerun `AUTO-20261124151151736`: **9/9 passed**, 0 failures, 0 skipped, 0 errors. This includes `REPEAT-SAME` and `REPEAT-DIFFERENT` in the same full run. [JUnit](RUN-20261124-B01-FULL-9OF9/junit.xml) and [run manifest](RUN-20261124-B01-FULL-9OF9/run-manifest.json) are preserved. Temporary store 2 was removed after the run.
- No commit or Jira status change was made; group-lead review remains required.
