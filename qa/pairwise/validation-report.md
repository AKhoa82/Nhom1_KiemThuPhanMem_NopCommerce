# T06/T07 - Constraint and generated-row validation report

## Run information

- Model: `qa/pairwise/model.pict`
- Input: `qa/pairwise/generated-cases.csv`
- PICT: `3.7.4`
- Seed: `10380`
- Total factors: `10`
- Total rows: `14`
- Model SHA-256: `36322F452859DBDE32ABB6F2588769B33B0EF07704B03658E9452D2CA5F5A144`
- Generated CSV SHA-256: `FBAB645C5DC70C070EF9A40201C13D6D0E57070E8EB3B8D40997EDEA78D6DDC4`

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

- Expected columns: `10`
- Actual columns: `10`
- Valid rows: `14`
- Invalid rows: `0`
- Blank/out-of-domain values: `0`
- Rows outside feasible exhaustive set: `0`

Overall result: **PASS**.
