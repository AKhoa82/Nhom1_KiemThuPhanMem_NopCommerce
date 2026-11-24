# SCRUM-86 — N02 Cart automation results

| Case | Playwright result | Run and evidence | Defect |
| --- | --- | --- | --- |
| `CART-MERGE-01 / MERGE-OVER` | Fail: guest quantity 2 silently lost | [Merge run](RUN-20261118-CART-MERGE.md) | [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96) |
| `CART-MERGE-01 / MERGE-VALID` | Pass | [Merge run](RUN-20261118-CART-MERGE.md) | — |
| `CART-MERGE-01 / MERGE-EXACT` | Pass | [Merge run](RUN-20261118-CART-MERGE.md) | — |
| `CART-MERGE-01 / MERGE-VARIANT` | Pass | [Merge run](RUN-20261118-CART-MERGE.md) | — |
| `CART-REPEAT-01 / REPEAT-SAME` | Pass | [Repeat run](RUN-20261118-CART-REPEAT.md) | — |
| `CART-REPEAT-01 / REPEAT-DIFFERENT` | Pass | [Repeat run](RUN-20261118-CART-REPEAT.md) | — |

All six automated UI cases were run on local Chromium on 2026-11-18. The two groups were separate runs with independent resets. Trang reported checking all six cases manually on 2026-11-18: the 4+2 case still lost the guest's 2 items, and the other five cases behaved as expected. This manual result is user-reported; no separate manual screenshots or exact run time were supplied. Selected automated screenshots and SQL snapshots are linked in the run reports; other generated attachments remain local outside Git. Khoa's oracle review and Linh's fixture/SQL confirmation remain outstanding. The over-stock defect is still reproducible; no post-fix retest is claimed. These N02 cases are separate from the 14 PW pairwise cases and 253-pair coverage.

The later combined six-case run had five Pass results and one environment interruption (`MERGE-OVER` navigation returned `ERR_NETWORK_IO_SUSPENDED`). The over-stock product failure was reproduced in two separate isolated runs, including `AUTO-20261118133939262`; the table uses those isolated results for `MERGE-OVER`. The report does not count the interrupted attempt as a product failure.

## Post-fix B01 retest, 24/11/2026

The historical 18/11 Fail above remains the pre-fix result. After the uncommitted B01 patch, run `AUTO-20261124075047802` passed **7/7** N02 UI cases: `MERGE-OVER`, `MERGE-MIXED`, valid/exact/variant controls, and both repeat-add cases. In `MERGE-OVER`, SQL showed account quantity 4 and guest quantity 2 after the rejected login, then account 5 and guest 0 after the buyer reduced the guest quantity and signed in again. See the [post-fix B01 run](../SCRUM-96/RUN-20261124-B01/RESULTS.md). SCRUM-96 remains In Progress until review and handoff; these results do not change the original 14 PW cases or 253-pair coverage.

The subsequent run `AUTO-20261124081257059` added `MERGE-MULTISTORE` and passed **8/8** with no skipped or failed cases. Its SQL snapshots confirm that a valid item from store 2 moved once while the rejected item stayed in the guest cart of store 1, then both stores reached the expected state after retry. The temporary store was removed after evidence capture. See the same B01 report for the run manifest and UI/SQL evidence.

The final full N02 rerun `AUTO-20261124151151736` included the activation recovery case and passed **9/9**, with 0 failures, 0 skipped and 0 errors. Both `REPEAT-SAME` and `REPEAT-DIFFERENT` passed in that same run. See the [JUnit result](../SCRUM-96/RUN-20261124-B01-FULL-9OF9/junit.xml) and [manifest](../SCRUM-96/RUN-20261124-B01-FULL-9OF9/run-manifest.json).
