# T07 - PICT Pairwise Test Design

## 1. Phạm vi công việc

Subtask của Linh:

> `[Linh] Thiết kế model, cài PICT và sinh bộ test pairwise`

Các công việc đã thực hiện:

1. Thiết kế model PICT gồm factor, value và constraint.
2. Cài Microsoft PICT `3.7.4` và kiểm tra SHA-256.
3. Chuẩn bị script sinh và kiểm tra output.
4. Sinh bộ test pairwise, feasible exhaustive và gắn Case ID.
5. Kiểm tra constraint, reduction và pair coverage.

Phạm vi này không bao gồm thực thi toàn bộ test case trên storefront, kiểm tra fixture
thủ công hoặc xác nhận kết quả test thay cho thành viên khác.

## 2. Model đã thiết kế

Model nằm tại:

```text
qa/pairwise/model.pict
```

Model gồm tám factor:

| Factor | Value |
| --- | --- |
| `CustomerType` | `Registered` |
| `ProductType` | `SimplePhysical`, `ConfigurablePhysical` |
| `InventoryState` | `Sufficient`, `ExactLimit`, `OverLimit` |
| `CartAction` | `Add`, `Update`, `Remove` |
| `Coupon` | `None`, `Valid`, `Invalid` |
| `Address` | `Valid`, `Invalid`, `NA` |
| `Shipping` | `LocalAvailable`, `NA` |
| `Payment` | `CheckMoneyOrder`, `NA` |

Các constraint chính:

- `Remove` làm giỏ hàng rỗng nên Address, Shipping và Payment là `NA`.
- `OverLimit` bị chặn trước checkout nên Address, Shipping và Payment là `NA`.
- `Address=Valid` đi cùng `Shipping=LocalAvailable` và `Payment=CheckMoneyOrder`.
- `Address=Invalid` làm Shipping và Payment trở thành `NA`.
- Các reverse constraint ngăn giá trị checkout xuất hiện ngoài luồng hợp lệ.

Baseline chưa đưa `Guest`, `SimulatedDecline` và `NonShippable` vào model. Nếu phạm
vi thay đổi, phải sửa `model.pict`, sinh lại toàn bộ output và chạy validation lại.

## 3. Cài PICT

Script cài đặt:

```text
qa/pairwise/install-pict.ps1
```

Chạy từ thư mục gốc repository:

```powershell
.\qa\pairwise\install-pict.ps1
```

Kết quả hiện tại:

| Nội dung | Giá trị |
| --- | --- |
| Phiên bản | Microsoft PICT `3.7.4` |
| Vị trí | `qa/pairwise/tools/pict.exe` |
| SHA-256 | `80ABA862739CF18B4FAA13D408163324D188A1C4EFCCDD977D9C5BA3F8950BBD` |

`pict.exe` bị Git bỏ qua. Máy mới chạy `install-pict.ps1` để tải lại đúng phiên bản
và kiểm tra checksum.

## 4. Sinh và kiểm tra bộ test

Chạy hai lệnh:

```powershell
.\qa\pairwise\generate.ps1
.\qa\pairwise\validate.ps1
```

`generate.ps1` sinh pairwise output, feasible exhaustive output và gắn Case ID từ
`PW-001` đến `PW-011`. `validate.ps1` kiểm tra Case ID, constraint, tập feasible,
reduction và pair coverage.

Kết quả:

| Chỉ số | Giá trị |
| --- | ---: |
| Raw exhaustive trước constraint | 648 |
| Feasible exhaustive sau constraint | 62 |
| Pairwise test cases | 11 |
| Số test giảm | 51 |
| Reduction | 82.26% |
| Total valid pairs | 135 |
| Covered valid pairs | 135 |
| Pair coverage | 100.00% |
| Validation | PASS |

Thông số sinh:

```text
PICT version: 3.7.4
Seed: 10380
Pairwise command: pict.exe model.pict /o:2 /r:10380
Exhaustive command: pict.exe model.pict /o:max
```

## 5. File bàn giao

| File | Nội dung |
| --- | --- |
| `qa/pairwise/model.pict` | Model factor, value và constraint |
| `qa/pairwise/install-pict.ps1` | Cài PICT và kiểm tra checksum |
| `qa/pairwise/generate.ps1` | Sinh pairwise/exhaustive output và Case ID |
| `qa/pairwise/validate.ps1` | Kiểm tra output và coverage |
| `qa/pairwise/test-data/pairwise-raw.tsv` | Pairwise output nguyên bản |
| `qa/pairwise/test-data/generated-cases.csv` | 11 test case có Case ID |
| `qa/pairwise/test-data/exhaustive-raw.tsv` | 62 tổ hợp khả thi |
| `qa/pairwise/test-data/coverage-report.csv` | Chi tiết coverage của 135 valid pair |
| `qa/pairwise/test-data/generation.log` | Phiên bản, hash, seed và lệnh sinh |
| `qa/pairwise/test-data/summary.md` | Thống kê và kết quả validation |

Không sửa tay các file output. Khi model thay đổi, luôn chạy lại `generate.ps1` và
`validate.ps1`.

## 6. Nội dung

```text
Đã hoàn thành:
- Thiết kế model PICT gồm 8 factor và các constraint.
- Cài Microsoft PICT 3.7.4 và kiểm tra SHA-256.
- Sinh 11 test case pairwise từ 62 tổ hợp khả thi.
- Gắn Case ID từ PW-001 đến PW-011.
- Kiểm tra coverage 135/135 valid pairs = 100.00%.
- Validation result: PASS, không có validation error.

File chính:
- qa/pairwise/model.pict
- qa/pairwise/test-data/generated-cases.csv
- qa/pairwise/test-data/coverage-report.csv
- qa/pairwise/test-data/generation.log
- qa/pairwise/test-data/summary.md

Nhờ Khoa review factor, value và constraint của model.
Trang đã kiểm tra output, mapping PW-xxx với scenario phù hợp và thống kê Pairwise.

### 7. Review của Trang

Kết quả kiểm tra ngày 05/10/2026:

| Hạng mục | Kết quả |
| --- | --- |
| Validation output | PASS; không có row vi phạm constraint |
| Case ID | `PW-001` đến `PW-011`, duy nhất và liên tục |
| Feasible exhaustive | `62` tổ hợp |
| Pairwise output | `11` case |
| Reduction | `51` case, tương đương `82.26%` so với feasible exhaustive |
| Pair coverage | `135/135 = 100.00%` |
| Mapping | Ghi tại `qa/pairwise/test-data/scenario-mapping.csv` |

Các case `PW-002`, `PW-003`, `PW-009` và `PW-010` được đánh dấu `Needs clarification`
vì bộ scenario hiện tại chưa có ID mô tả đúng toàn bộ tổ hợp factor của chúng. Không
gán các case này vào scenario gần giống để tránh làm sai traceability. Các case còn lại
đã được mapping theo hành vi Cart/Shipping tương ứng. Payment `CheckMoneyOrder` được ghi
nhận là value local success; T05 hiện chưa có scenario ID riêng cho payment success.

File mapping chỉ bổ sung liên kết review, không chỉnh sửa các file output do PICT sinh.

```
