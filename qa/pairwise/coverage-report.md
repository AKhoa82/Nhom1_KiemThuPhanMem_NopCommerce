# T06/T07 - Feasible-pair coverage report

## Run information

- Model: `qa/pairwise/model.pict`
- Generated cases: `qa/pairwise/test-data/generated-cases.csv`
- Scenario mapping: `qa/pairwise/test-data/scenario-mapping.csv`
- Generation log: `qa/pairwise/test-data/generation.log`
- PICT: `3.7.4`
- Seed: `10380`
- Model SHA-256: `70DDF6677F992FE6317A43B8CEE5CAFFCF4DB14BB8041C3B2F16FB85644AAB5F`
- Generated CSV SHA-256: `9DBFCD743BA359DBEC9BE756AA2BAB7B8E1225CB7A3893C577F45FE960240DFA`
- Generation command: `pict.exe model.pict /o:2 /r:10380`

## Result

| Metric | Value |
| --- | ---: |
| Factors | 10 |
| Raw full assignments | 6912 |
| Feasible full assignments | 420 |
| Generated pairwise tests | 14 |
| CaseId column | Present (`PW-001` ... `PW-014`) |
| CaseId-to-scenario mapping | 14/14, 1-to-1 |
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
