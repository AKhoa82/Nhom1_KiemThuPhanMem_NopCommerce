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
