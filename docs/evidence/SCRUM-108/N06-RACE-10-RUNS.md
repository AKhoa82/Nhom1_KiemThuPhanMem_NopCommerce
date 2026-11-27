# N03 CHK-RACE-01 — SQL before/after and frequency (N06-20261127)

Source commit: `6f702568b0885528e81ecced13422f4cf831d398`. Runs found: 10 of 10 requested. Defect: SCRUM-100 (B02).
Config read from SQL: minimumorderplacementinterval=1, onepagecheckoutenabled=False, placeorderwithlock=False, regenerateorderguidinterval=180.

| Run | POST gap (ms) | Tab A | Tab B | Orders before→after | New OrderGuid | OrderItem | Stock before→after | Cart rows before→after | Verdict |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| run01 | 7.9 | 302 | 200 | 0→1 (Δ1) | DB49371B-681A-4E2D-9A18-1A8A9C745081 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run02 | 16.3 | 200 | 302 | 1→2 (Δ1) | B1A046DC-4BF7-41A1-9904-E6F25B1E2D7B | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run03 | 12.2 | 200 | 302 | 2→3 (Δ1) | FB4532BD-6B90-4B8A-8C5F-A32CBC9DE6F0 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run04 | 16.8 | 200 | 302 | 3→4 (Δ1) | 04F38061-D493-4989-8BFC-E07D7B823D74 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run05 | 21.6 | 302 | 200 | 4→5 (Δ1) | 063A6CDC-870D-4A9B-B712-370F920FC12A | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run06 | 11.5 | 200 | 302 | 5→6 (Δ1) | 00676552-03BA-4ECA-98B1-D317B091371F | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run07 | 19.5 | 200 | 302 | 6→7 (Δ1) | F2AC0F4F-5745-40B1-AB37-2C9BDCEE1B70 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run08 | 18.7 | 302 | 200 | 7→8 (Δ1) | 5387CA1A-C743-4C2A-8D1C-EFC1B00DE350 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run09 | 15.8 | 302 | 200 | 8→9 (Δ1) | E7801308-DFB0-4B3D-B608-B20E3E4B596B | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run10 | 25.7 | 302 | 200 | 9→10 (Δ1) | 77976728-0366-4E7F-98F3-89CEEC749E45 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |

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
