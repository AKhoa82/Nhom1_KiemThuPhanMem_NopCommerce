# N03 CHK-RACE-01 — SQL before/after and frequency (BEFORE-FIX)

Source commit: `9d57731321fe5d60ed4a42f9837189c0e45ac879`. Runs found: 10 of 10 requested. Defect: SCRUM-100 (B02).
Config read from SQL: minimumorderplacementinterval=1, onepagecheckoutenabled=False, placeorderwithlock=False, regenerateorderguidinterval=180.

| Run | POST gap (ms) | Tab A | Tab B | Orders before→after | New OrderGuid | OrderItem | Stock before→after | Cart rows before→after | Verdict |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| run01 | 32.0 | 200 SQL-error | 302 | 1→2 (Δ1) | 2847559A-67F6-4C32-AFB4-267E9E5D6195 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run02 | 2.8 | 200 SQL-error | 302 | 2→3 (Δ1) | 3E39CC93-8085-4D7A-B1D9-FE4F4B409E15 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run03 | 17.3 | 302 | 200 SQL-error | 3→4 (Δ1) | 33CEC073-18A9-4844-9D9E-4B4678533139 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run04 | 32.6 | 302 | 200 SQL-error | 4→5 (Δ1) | 1FFFF9D7-BB2B-40FC-A873-B9CAF850069F | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run05 | 22.0 | 200 SQL-error | 302 | 5→6 (Δ1) | ABD610B0-81A9-49AE-B2C6-542986C8367C | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run06 | 2.7 | 302 | 200 SQL-error | 6→7 (Δ1) | 4C1BAE3D-9FC1-42E3-A02F-029FF18E1BD8 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run07 | 3.3 | 302 | 200 SQL-error | 7→8 (Δ1) | 4BD51393-FD34-4318-8C17-31B855877CAE | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run08 | 18.9 | 200 SQL-error | 302 | 8→9 (Δ1) | 6124B9F9-591A-4CED-BDDB-8231E4B8BED1 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run09 | 26.1 | 200 SQL-error | 302 | 9→10 (Δ1) | 3F36E08A-1CD6-4AA5-860A-94A032460CA0 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run10 | 10.2 | 302 | 200 SQL-error | 10→11 (Δ1) | 8C678D08-DD97-4558-96A9-F762EBB79C83 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |

## Frequency

- Verdict counts: REPRODUCED_B02=10.
- Runs with a valid concurrent dispatch and an order: **10**. SQL error exposed (SCRUM-100 reproduced): **10/10** (Wilson 95% interval 72%–100%).
- Double-order runs (Δ orders ≥ 2 or duplicate OrderGuid): **0**.
- Excluded from the denominator: 0 run(s) that were blocked, had invalid timing, created no order, or were incomplete.

## Limits of this evidence

- The rate applies only to this machine, this build/commit, this configuration and this dispatch gap; it is not a general probability.
- `NOT_REPRODUCED_THIS_RUN` means no SQL error was seen and the data was consistent in that run. It does not prove the defect is fixed; Pass for the second tab also needs a reviewed screenshot showing a safe business message or the same order.
- A verdict computed from SQL alone cannot see what a tab displayed; tab columns come from Playwright's `n03-attempt.json`.
- Raw traces, HTML and screenshots stay local and are not committed.
