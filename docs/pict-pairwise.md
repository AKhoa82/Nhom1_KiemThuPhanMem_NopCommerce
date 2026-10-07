# T06/T07 - PICT Pairwise Test Design

## 1. Phạm vi tích hợp

Tài liệu này mô tả bản tích hợp giữa:

- T06: bảng factor/value, constraint và các tổ hợp không hợp lệ đã được nhóm chốt.
- T07 của Linh: cài Microsoft PICT, sinh dữ liệu và kiểm tra khả năng tái lập.

Model T06 là nguồn chuẩn về nội dung nghiệp vụ. Script T07 là nguồn chuẩn về quy
trình cài đặt, sinh dữ liệu và validation.

## 2. Model chính thức

Model nằm tại `qa/pairwise/model.pict` và gồm 10 factor:

| Factor | Values |
| --- | --- |
| `CustomerType` | `Registered`, `Guest` |
| `ProductType` | `SimplePhysical`, `ConfigurablePhysical` |
| `CartComposition` | `OneLine`, `MultipleLines` |
| `QuantityClass` | `One`, `ManyWithinStock`, `AtAvailableLimit`, `ExceedsAvailableStock` |
| `InventoryState` | `InStock`, `OutOfStock` |
| `Coupon` | `None`, `Valid`, `Invalid` |
| `Address` | `Complete`, `MissingRequired`, `NA` |
| `ShippingMethod` | `LocalOption1`, `NA` |
| `PaymentMethod` | `LocalSuccess`, `NA` |
| `CartAction` | `Add`, `Update`, `Remove` |

Các quyết định môi trường:

- `Guest` được đưa vào vì anonymous checkout đã được xác nhận bật.
- `CartComposition=MultipleLines` được đưa vào vì fixture cart nhiều line đã được xác nhận.
- `LocalOption1` là shipping method local đã xác nhận.
- `LocalSuccess` là `Payments.CheckMoneyOrder`.
- `LocalOption2` và `SimulatedDecline` chưa được đưa vào vì chưa có fixture/plugin local phù hợp.

`CartAction=Remove` được định nghĩa là xóa line cuối cùng làm giỏ hàng rỗng, vì vậy
model bắt buộc `CartComposition=OneLine`. Trường hợp xóa một line khỏi cart nhiều line
là một hành vi khác và không được dùng chung với nhánh dừng checkout này.

Chín nhóm constraint C01-C09 được ghi trực tiếp trong model. C01, C02, C08 và C09
có một phần là quyết định fixture/invariant; các quan hệ có thể biểu diễn bằng cú pháp
PICT được khai báo thành constraint thực thi.

## 3. Cài PICT

Phiên bản chuẩn là Microsoft PICT `3.7.4`, SHA-256:

```text
80ABA862739CF18B4FAA13D408163324D188A1C4EFCCDD977D9C5BA3F8950BBD
```

Cài bản local trong repository:

```powershell
.\qa\pairwise\install-pict.ps1
```

`install-pict.ps1` tải đúng release và từ chối executable không khớp checksum.
`generate.ps1` ưu tiên `qa/pairwise/tools/pict.exe`; nếu chưa có, script dùng bản đã
cài tại `%LOCALAPPDATA%\Programs\PICT\pict.exe`.

## 4. Sinh và kiểm tra bộ test

Chạy từ thư mục gốc repository:

```powershell
.\qa\pairwise\generate.ps1 -Seed 10380
.\qa\pairwise\validate.ps1
```

Lệnh PICT tương ứng:

```text
pict.exe model.pict /o:2 /r:10380
pict.exe model.pict /o:max
```

Kết quả sinh ngày 2026-10-07:

| Chỉ số | Giá trị |
| --- | ---: |
| Factors | 10 |
| Raw exhaustive trước constraint | 6912 |
| Feasible exhaustive sau constraint | 420 |
| Pairwise test cases | 14 |
| Giảm so với feasible exhaustive | 406 (96.67%) |
| Total feasible pairs | 253 |
| Covered feasible pairs | 253 |
| Pair coverage | 100.00% |
| Constraint validation | PASS |
| Row validation | PASS |
| Overall validation | PASS |

Case ID được xác định theo thứ tự dòng: `PW-001` đến `PW-014`. File CSV chính thức
không lưu cột CaseId để giữ header trùng hoàn toàn với 10 factor của model.

## 5. File bàn giao

| File | Nội dung |
| --- | --- |
| `qa/pairwise/model.pict` | 10 factor và constraint C01-C09 |
| `qa/pairwise/install-pict.ps1` | Cài PICT 3.7.4 và kiểm tra checksum |
| `qa/pairwise/generate.ps1` | Sinh pairwise, exhaustive và metadata với seed cố định |
| `qa/pairwise/validate.ps1` | Chạy toàn bộ validation và tạo summary |
| `qa/pairwise/generated-cases.csv` | Bộ test pairwise chính thức gồm 14 dòng |
| `qa/pairwise/test-data/exhaustive-raw.tsv` | 420 tổ hợp khả thi |
| `qa/pairwise/test-data/coverage-report.csv` | Chi tiết 253 feasible pair |
| `qa/pairwise/test-data/summary.md` | Kết quả validation tổng hợp |
| `qa/pairwise/test-data/scenario-mapping.csv` | Trạng thái mapping cần review lại sau khi model đổi |

Không sửa tay các file output. Khi model hoặc constraint thay đổi, phải chạy lại
`generate.ps1`, `validate.ps1` và review lại scenario mapping.

## 6. Scenario bổ sung cho boundary tồn kho

### CART-14 - Chấp nhận quantity đúng bằng tồn kho khả dụng

| Trường | Nội dung |
| --- | --- |
| Mục tiêu | Xác nhận quantity bằng đúng stock được chấp nhận, không bị xử lý như vượt tồn kho. |
| Preconditions | Product/combination bật Track inventory, No backorders; cart được reset; stock đã biết. |
| Data set 1 | Add `PW-Simple-Stock`, stock `10`, quantity `10`. |
| Data set 2 | Add `PW-Shirt-Variants` Blue/M, stock `3`, quantity `3`. |
| Data set 3 | Update `PW-Shirt-Variants` Blue/M từ quantity `1` lên quantity `3`. |
| Steps | Mở product/cart; thực hiện Add hoặc Update theo data set; quan sát warning, quantity, line total và cart total. |
| Expected result | Không có stock warning; quantity mới bằng đúng stock; line/cart total đúng; cart có thể tiếp tục sang checkout nếu các input khác hợp lệ. |
| Invariants | `INV-CART-01`, `INV-CART-02`, `INV-CART-04`, `INV-CART-05`, `INV-CART-09`, `INV-CART-13`. |

`CART-14` bổ sung đúng khoảng trống của `PW-006`, `PW-009` và `PW-012`. Với
`PW-012`, sau khi Add ở đúng giới hạn thành công, phần address thiếu trường bắt buộc
tiếp tục được kiểm tra bởi `ADDR-02`.

Scenario này được đặc tả tại đây để không chỉnh sửa hoặc push tài liệu
`cart-checkout-scenarios.md` trên nhánh T06. Khi tích hợp T04/T05, người phụ trách
scenario cần chuyển nguyên nội dung `CART-14` vào tài liệu scenario chính thức.

## 7. Trạng thái scenario mapping

Mapping 11 case của model T07 cũ không còn hợp lệ sau khi đồng bộ model T06. File
`scenario-mapping.csv` hiện đối chiếu đủ 14 case với scenario T04/T05 và `CART-14`.
Mỗi mapping đều ghi rõ lý do; không còn case `PendingReview` hoặc
`NeedsNewScenario`.
