# SCRUM-96 B01 — implementation and verification, 22/11/2026

## Baseline and decision

- Source HEAD before these edits: `0247c71ab2abab7218813ea89a411b5dec44cf01`. Changes in this workspace are uncommitted.
- Owner: Trang, assignee of SCRUM-96. The old three-subtask split is not used for B01.
- Reproduction already recorded on 18/11/2026 in [N02 results](../SCRUM-86/N02-RESULTS.md) and SCRUM-96 comments: account 4 + guest 2 of the same variant, stock 5, no backorders; the guest's 2 items were lost without a warning.
- Implemented policy: for each source item, delete it only after `AddToCartAsync` succeeds. If any item is rejected, keep that item in the guest cart, leave the customer signed out, redirect to the accessible guest cart, and show a warning with the underlying validation reason. The customer can adjust the guest quantity and retry sign-in. Successfully transferred lines are not transferred again on retry.

## Changes

- `ShoppingCartService.MigrateShoppingCartAsync` now returns warnings and retains rejected guest rows. Coupon, checkout attribute and selected vendor transfer runs only when all source rows have moved.
- `CustomerRegistrationService.SignInCustomerAsync` keeps the guest session on a migration warning and displays a warning on the cart page.
- `ShoppingCartMigrationTests` checks the 4+2 rejection, recovery by reducing the guest quantity and retrying, 2+2 and 2+3 successes, and a mixed cart with one accepted and one rejected line.
- `n02-cart.spec.ts` checks the rejected-login warning, account/guest quantities and recovery by reducing the guest quantity to 1 before retrying login. Existing valid and different-variant cases remain in the suite.

## Verification performed

| Check | Result |
| --- | --- |
| `dotnet build src/Libraries/Nop.Services/Nop.Services.csproj --configuration Release` | Pass: 0 errors; one existing `CS0108` warning in generated VAT client. |
| `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --configuration Release --filter FullyQualifiedName~ShoppingCartMigrationTests --no-restore` | Pass: 5/5 tests. |
| `npx tsc --noEmit` in `qa/automation` | Pass. |
| `npx playwright test tests/n02-cart.spec.ts --list` | Pass: six cases discovered. Discovery is not an E2E Pass. |
| `git diff --check` | Pass. |

## Runtime verification status on 22/11/2026

Local Docker daemon was unavailable (`docker ps` could not connect), `http://localhost/cart` did not respond, and QA credentials were absent from this shell. Therefore **no post-fix Playwright/UI/SQL run was performed**. `MERGE-OVER`, valid and exact merge, variant, repeat-add and login retry remain **Not Run after the fix**. Keep SCRUM-96 In Progress and the historical Fail evidence; do not mark the defect resolved from the service tests alone.

When the local QA stack is available, reset only the scoped N02 fixture, then run `npm run test:n02-cart` in `qa/automation`. Save the run ID, SHA, sanitized HTML/trace/screenshots, SQL rows for both CustomerIds and stock by variant. Review the warning and recovery flow with the group lead before moving SCRUM-96 to Code Review or Done.

## Post-fix retest on 24/11/2026

Docker and the local store became available. The [B01 retest run](RUN-20261124-B01/RESULTS.md) now records **7/7 Playwright cases passed**, including `MERGE-OVER`, the mixed-line case, valid/exact/variant controls, and repeat-add cases. SQL snapshots cover both customer IDs before and after the rejected login and recovery. Service tests passed **6/6**, including a coupon and gift-card retry check; TypeScript and `git diff --check` passed. The patch and evidence remain uncommitted as requested. Review and PR/commit handoff are still pending.
