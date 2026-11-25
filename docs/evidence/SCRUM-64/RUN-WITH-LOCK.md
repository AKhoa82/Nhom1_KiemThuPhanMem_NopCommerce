# N03 CHK-RACE-01 — SQL before/after and frequency (WITH-LOCK)

Source commit: `79a55569253e21f52747d70500a83065976eed72`. Runs found: 10 of 10 requested. Defect: SCRUM-100 (B02).
Config read from SQL: minimumorderplacementinterval=1, onepagecheckoutenabled=False, placeorderwithlock=True, regenerateorderguidinterval=180.

| Run | POST gap (ms) | Tab A | Tab B | Orders before→after | New OrderGuid | OrderItem | Stock before→after | Cart rows before→after | Verdict |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| run01 | 14.5 | 200 | 302 | 0→1 (Δ1) | D6688D0F-2384-4E6F-BFC2-3432F6873473 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run02 | 2.2 | 302 | 200 | 1→2 (Δ1) | ABD7E111-89A1-4C7D-AB12-AD41284E0131 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run03 | 2.3 | 200 | 302 | 2→3 (Δ1) | 760E1469-94FD-4BC8-810A-07B42510F55C | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run04 | 32.9 | 302 | 200 | 3→4 (Δ1) | 78AE9021-9D3B-427A-A54E-B6BC38C51872 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run05 | 4.2 | 302 | 200 | 4→5 (Δ1) | 2935A109-CBAD-4CA3-A9A1-D3FCD2222DB4 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run06 | 35.6 | 302 | 200 | 5→6 (Δ1) | F5C41EA9-126E-4BC1-9DE4-E4387478FDF8 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run07 | 2.3 | 302 | 200 | 6→7 (Δ1) | BFB4E674-30E3-465F-A483-A3C72E580BBA | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run08 | 2.1 | 302 | 200 | 7→8 (Δ1) | 4465827E-BF53-46B0-A4F2-EF261FA3FA5D | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run09 | 6.5 | 302 | 200 | 8→9 (Δ1) | 46205C3E-71E6-41B0-B924-B1233F5782FD | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run10 | 3.1 | 200 | 302 | 9→10 (Δ1) | 57850CCC-A6A9-4054-BB73-FB4AC51A570C | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |

## Frequency

- Verdict counts: NOT_REPRODUCED_THIS_RUN=10.
- Runs with a valid concurrent dispatch and an order: **10**. SQL error exposed (SCRUM-100 reproduced): **0/10** (Wilson 95% interval 0%–28%).
- Double-order runs (Δ orders ≥ 2 or duplicate OrderGuid): **0**.
- Excluded from the denominator: 0 run(s) that were blocked, had invalid timing, created no order, or were incomplete.

## Limits of this evidence

- The rate applies only to this machine, this build/commit, this configuration and this dispatch gap; it is not a general probability.
- `NOT_REPRODUCED_THIS_RUN` means no SQL error was seen and the data was consistent in that run. It does not prove the defect is fixed; Pass for the second tab also needs a reviewed screenshot showing a safe business message or the same order.
- A verdict computed from SQL alone cannot see what a tab displayed; tab columns come from Playwright's `n03-attempt.json`.
- Raw traces, HTML and screenshots stay local and are not committed.
