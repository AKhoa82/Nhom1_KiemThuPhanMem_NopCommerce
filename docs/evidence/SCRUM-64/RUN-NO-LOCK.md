# N03 CHK-RACE-01 — SQL before/after and frequency (NO-LOCK)

Source commit: `79a55569253e21f52747d70500a83065976eed72`. Runs found: 10 of 10 requested. Defect: SCRUM-100 (B02).
Config read from SQL: minimumorderplacementinterval=1, onepagecheckoutenabled=False, placeorderwithlock=False, regenerateorderguidinterval=180.

| Run | POST gap (ms) | Tab A | Tab B | Orders before→after | New OrderGuid | OrderItem | Stock before→after | Cart rows before→after | Verdict |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| run01 | 35.2 | 302 | 200 SQL-error | 10→11 (Δ1) | 93C15966-B777-4CD9-9BF6-F97D7034D70C | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run02 | 41.9 | 302 | 200 SQL-error | 11→12 (Δ1) | E7964809-0D36-4E87-950B-AF49BFC04C80 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run03 | 2.7 | 200 SQL-error | 302 | 12→13 (Δ1) | 0CECDC1F-78E6-47F3-803A-300848F69980 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run04 | 3.1 | 302 | 200 SQL-error | 13→14 (Δ1) | 591CC2F1-7D3A-48C1-AF74-1656FA37E59D | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run05 | 2.2 | 200 SQL-error | 302 | 14→15 (Δ1) | A87EF4CD-52E3-48A0-8993-9321A36D7FAA | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run06 | 5.8 | 200 SQL-error | 302 | 15→16 (Δ1) | DB857918-04D4-4D9C-81AE-D32E1E5EE2AE | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run07 | 3.0 | 200 SQL-error | 302 | 16→17 (Δ1) | EB0DA980-6FF1-4EBC-89BF-AADC3475EDEA | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run08 | 3.7 | 302 | 200 SQL-error | 17→18 (Δ1) | BA762E91-D904-4EA4-AD1E-5338517E6875 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run09 | 5.1 | 302 | 200 SQL-error | 18→19 (Δ1) | 4F012B1F-80B0-46FB-8C7B-69D3E8E7B43C | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |
| run10 | 31.4 | 200 SQL-error | 302 | 19→20 (Δ1) | 6187AA30-326E-4F03-BFED-349CD9F966B4 | 1×PW-SHIRT×4 | 5→1 | 1→0 | REPRODUCED_B02 |

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
