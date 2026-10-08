# T07 - Báo cáo review model PICT

Ngày review: 2026-10-08

## Kết quả

**PASS - Không phát hiện lỗi nghiêm trọng ở factor/value hoặc constraint.**

| Hạng mục review                          | Kết quả | Bằng chứng                                                                                                                                                                                                                              |
| ------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Danh sách factor                          | PASS      | `model.pict` khai báo 10 factor và 25 value.                                                                                                                                                                                          |
| Value phụ thuộc môi trường            | PASS      | Guest checkout, phương thức shipping/payment nội bộ, fixture coupon, cùng các lựa chọn shipping/decline bị loại đã được ghi nhận theo baseline local đã chọn.                                                         |
| Ngữ nghĩa số lượng và tồn kho       | PASS      | `OutOfStock` kéo theo `ExceedsAvailableStock`. Không yêu cầu chiều ngược lại vì sản phẩm còn hàng vẫn có thể được yêu cầu với số lượng vượt tồn kho khả dụng.                                           |
| Constraint dừng trước bước tiếp theo | PASS      | Các luồng lỗi tồn kho, xóa line cuối và thiếu địa chỉ đều dùng`NA` nhất quán cho những bước không thể tới; không cho phép `NA` trong luồng sản phẩm vật lý vẫn có thể tiếp tục.                     |
| Luồng thanh toán nội bộ thành công   | PASS      | `LocalSuccess` yêu cầu địa chỉ đầy đủ, `LocalOption1` và thao tác/số lượng giỏ hàng không làm luồng bị dừng.                                                                                                     |
| Thao tác coupon độc lập                | PASS      | Các value coupon được chủ ý tách biệt khỏi tiến trình checkout; model ghi rõ kiểm thử coupon không hợp lệ là một thao tác riêng.                                                                                     |
| Ghi chú constraint không thực thi       | PASS      | C01/C02 mô tả các giả định cố định về môi trường/fixture. C08 được suy ra từ các quy tắc dừng có thể thực thi với những factor đã khai báo; payment decline bị loại. C09 được thiết kế là độc lập. |
| Nguồn gốc output đã sinh               | PASS      | `generation.log` ghi nhận PICT 3.7.4, seed 10380, command và hash; SHA-256 của model trong log trùng với `model.pict` hiện tại.                                                                                                |

## Nội dung đã làm rõ

Bảng factor trước đó chưa nêu rõ thời điểm quan sát `CartComposition`, cũng chưa
xác định `ProductType` mô tả toàn bộ giỏ hàng hay line đang được thao tác. Điều này
có thể dẫn đến cách chuẩn bị fixture không nhất quán, nhất là với `Add` và `Remove`.
Tài liệu model hiện xác định `CartComposition` là trạng thái giỏ hàng ngay trước
`CartAction`, còn `ProductType` là loại fixture/line đang được thao tác. Đây chỉ là
làm rõ tài liệu, không thay đổi model hoặc output đã sinh.

## Xác thực thực tế

Đã cài PICT 3.7.4 và chạy lại model với seed `10380`. Các lệnh sinh dữ liệu và
kiểm tra đều hoàn tất với kết quả `PASS`:

| Kiểm tra                             |         Kết quả |
| ------------------------------------- | ----------------: |
| Raw exhaustive trước constraint     |              6912 |
| Exhaustive khả thi sau constraint    |               420 |
| Test pairwise                         |                14 |
| Kiểm tra row hợp lệ                | 14/14, 0 row lỗi |
| Vi phạm constraint/tổ hợp bị cấm |                 0 |
| Pair coverage                         |    253/253 (100%) |
| Kết quả tổng                       |              PASS |

`validate-generated-rows.ps1` báo 11 cột thực tế vì CSV có cột `CaseId` cộng với
10 factor; cấu trúc này là đúng. `INV-01` và `INV-07` có trạng thái `N/A`, không
phải lỗi: guest được đưa vào vì anonymous checkout đang bật, còn simulated decline
bị loại do không có fake processor đã xác nhận. Tổng vi phạm vẫn bằng 0.

Các lệnh đã chạy:

```powershell
.\qa\pairwise\install-pict.ps1
.\qa\pairwise\generate.ps1 -Seed 10380
.\qa\pairwise\validate.ps1
.\qa\pairwise\validate-generated-rows.ps1
.\qa\pairwise\validate-invalid-combinations.ps1
.\qa\pairwise\calculate-pairwise-coverage.ps1
```

Kết quả trên xác nhận model chạy được với PICT 3.7.4 và output tái sinh đáp ứng
các kiểm tra row, constraint và pair coverage.
