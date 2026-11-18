# SCRUM-90 — N03 two-tab Confirm results (2026-11-18)

Scenario `CHK-RACE-01` for [SCRUM-90](https://anhkhoa080205.atlassian.net/browse/SCRUM-90); observed defect [SCRUM-100](https://anhkhoa080205.atlassian.net/browse/SCRUM-100). Local storefront: `http://localhost/`, Chromium, registered test account, `PW-SHIRT` Red/S, cart quantity 4, Red/S stock 5, Ground, Check / Money Order. The automation branch starts from `ab2e730dd9` (`origin/test/SCRUM-82-cart-risk`). The running Docker image's build SHA was not independently verified.

| Attempt | Confirm POSTs (UTC; gap) | Tab A | Tab B | SQL before → after | Result |
| --- | --- | --- | --- | --- | --- |
| Manual 1, user reported | Times and gap not recorded | Completed | Empty cart | One new order observed; stock 5 → 1 | Not Reproduced in UI; race timing unverified |
| Manual 2, user reported | Times and gap not recorded | Completed | Empty cart | Order 11 added; stock 5 → 1 | Not Reproduced in UI; race timing unverified |
| `AUTO-20261118152916203` | 15:29:14.544 / 15:29:14.546; 1.78 ms | HTTP 302, `/checkout/completed/12` | HTTP 200, SQL duplicate-key error on `/checkout/confirm` | Orders 4 → 5; cart 1 → 0; stock 5 → 1 | **Reproduced SCRUM-100** |
| `AUTO-20261118153817734` | 15:38:15.250 / 15:38:15.274; 24.74 ms | HTTP 200, SQL duplicate-key error on `/checkout/confirm` | HTTP 302, `/checkout/completed/14` | Orders 5 → 6; cart 1 → 0; stock 5 → 1 | **Reproduced SCRUM-100** |
| `AUTO-20261118154837774` | 15:48:35.999 / 15:48:36.019; 20.73 ms | HTTP 302, `/checkout/completed/16` | HTTP 200, SQL duplicate-key error on `/checkout/confirm` | Orders 6 → 7; cart 1 → 0; stock 5 → 1 | **Reproduced SCRUM-100 on final test commit `06e894101c`** |

The exposed error includes `Cannot insert duplicate key` for `AK_Order_OrderGuid`. Each automated attempt created **one** order, so this evidence does not show duplicate orders. The two manual outcomes were reported by the tester; there are no per-tab timestamps or saved traces for those attempts. Their absence of an SQL error cannot establish that the defect is fixed.

The automated attempts used a fresh cart and stock for each run. A narrow local reset restored only the Red/S stock after checking the test account, latest order, empty cart, and stock; the cart was added through the storefront. Historical orders were retained. This preparation was local and is not a replacement for Linh's SCRUM-91 fixture validation. The assertion uses the provisional one-order/no-SQL-error expectation pending Khoa's SCRUM-89 oracle review.

Run from `qa/automation` with `npm run test:n03-race` after preparing the fixture described in its README. The local Playwright reports contain both tab screenshots, HTML, response bodies, SQL snapshots, `n03-attempt.json`, and trace. The final run passed the timing and exactly-one-order assertions; Playwright failed on the SQL-error assertion at `n03-race.spec.ts:233`, as expected for this reproduced product defect.

For remote review of the final run, use the [structured attempt log](AUTO-20261118154837774.json), [tab A completed screenshot](AUTO-20261118154837774-tab-A-completed.png), and [tab B SQL-error screenshot](AUTO-20261118154837774-tab-B-sql-error.png). These images show only the synthetic QA customer details used in the local fixture. Raw results and traces for all three automated attempts are retained locally under `qa/automation/n03-local-evidence/run1`, `run2`, and `run3`; they remain outside Git because they may contain session data. Share the local trace with a reviewer through an approved channel if they need to inspect individual browser steps. Linh's fixture validation (SCRUM-91) and Khoa's oracle review (SCRUM-89) remain separate tasks.
