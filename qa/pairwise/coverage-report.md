# T06/T07 - Feasible-pair coverage report

## Run information

- Model: `qa/pairwise/model.pict`
- Generated cases: `qa/pairwise/generated-cases.csv`
- PICT: `3.7.4`
- Seed: `10380`
- Model SHA-256: `36322F452859DBDE32ABB6F2588769B33B0EF07704B03658E9452D2CA5F5A144`
- Generated CSV SHA-256: `FBAB645C5DC70C070EF9A40201C13D6D0E57070E8EB3B8D40997EDEA78D6DDC4`

## Result

| Metric | Value |
| --- | ---: |
| Factors | 10 |
| Raw full assignments | 6912 |
| Feasible full assignments | 420 |
| Generated pairwise tests | 14 |
| Raw candidate pairs | 279 |
| Total feasible pairs | 253 |
| Covered feasible pairs | 253 |
| Missing feasible pairs | 0 |
| Unexpected actual pairs | 0 |
| Infeasible generated rows | 0 |
| Coverage | 100% |

Coverage được tính trên các pair có thể mở rộng thành ít nhất một full assignment
thỏa constraint, không tính các pair đã bị constraint loại bỏ. Kết quả được đối chiếu
độc lập bởi `validate.ps1` và `calculate-pairwise-coverage.ps1`.

Overall result: **PASS**.
