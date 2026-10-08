# T06/T07 - Constraint and generated-row validation report

## Run information

- Model: `qa/pairwise/model.pict`
- Input: `qa/pairwise/test-data/generated-cases.csv`
- Scenario mapping: `qa/pairwise/test-data/scenario-mapping.csv`
- Generation log: `qa/pairwise/test-data/generation.log`
- PICT: `3.7.4`
- Seed: `10380`
- Total factors: `10`
- Total rows: `14`
- Model SHA-256: `70DDF6677F992FE6317A43B8CEE5CAFFCF4DB14BB8041C3B2F16FB85644AAB5F`
- Generated CSV SHA-256: `9C39B01B35380CA99DB817798B24C3DDC8A807F2390468289388E8CAFC1B8FA8`
- Generation command: `pict.exe model.pict /o:2 /r:10380`

## Invalid-combination rules

| Rule | Result | Violations | Note |
| --- | --- | ---: | --- |
| INV-01 | N/A | 0 | Anonymous checkout đã bật nên `Guest` được phép. |
| INV-02 | PASS | 0 | Hai product fixture đều theo dõi tồn kho. |
| INV-03 | PASS | 0 | `OutOfStock` luôn dùng `ExceedsAvailableStock`. |
| INV-04 | PASS | 0 | `Remove` chỉ dùng với `OneLine` và dừng trước Address/Shipping/Payment. |
| INV-05 | PASS | 0 | `MissingRequired` dừng trước Shipping/Payment. |
| INV-06 | PASS | 0 | `LocalSuccess` dùng `LocalOption1`; `NA` phải có bước chặn trước đó. |
| INV-07 | N/A | 0 | `SimulatedDecline` bị loại vì chưa có fake processor. |
| INV-08 | PASS | 0 | Không có row chứa nhiều primary blocker. |

## Generated-row validation

- Expected factor columns: `10`
- Actual CSV columns: `11` (`CaseId` + 10 factors)
- CaseId sequence: `PW-001` ... `PW-014`
- CaseId-to-scenario mapping: `14/14`, 1-to-1, all `Mapped`
- Valid rows: `14`
- Invalid rows: `0`
- Blank/out-of-domain values: `0`
- Rows outside feasible exhaustive set: `0`

Overall result: **PASS**.
