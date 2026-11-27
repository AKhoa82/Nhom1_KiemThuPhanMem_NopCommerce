# Ghi chú defect — cảnh báo gộp giỏ hiện khóa tài nguyên thô khi thiếu bản dịch vi-VN

Ngày phát hiện: 26/11/2026. Liên quan: SCRUM-96 (B01, gộp giỏ vượt tồn kho). Mức độ đề xuất: Minor (hiển thị/UX).

> Defect này được đưa vào danh sách chính với mã **DEF-04**. Phân tích đầy đủ (pairwise case, tần suất, module, root cause, cách xác minh) nằm ở [DEFECT-ANALYSIS-PAIRWISE.md](../SCRUM-64/DEFECT-ANALYSIS-PAIRWISE.md#def-04--cảnh-báo-gộp-giỏ-hiện-khóa-tài-nguyên-thô-khi-gói-vi-vn-thiếu-shoppingcartquantityexceedsstock).

## Hiện tượng

Với khách dùng ngôn ngữ **Tiếng Việt**, khi đăng nhập bị từ chối vì gộp giỏ vượt tồn kho, thông báo hiển thị:

```text
Chưa đăng nhập: có món chưa gộp được. Món vẫn ở giỏ khách. Hãy kiểm tra và thử lại.
Giỏ Your store name: PW-Shirt-Variants (PW-Color: Red, PW-Size: S) ×2. shoppingcart.quantityexceedsstock
```

Phần lý do là **tên khóa** `shoppingcart.quantityexceedsstock`, không có số lượng tối đa (5).
Kỳ vọng: `Số lượng vượt tồn kho (tối đa 5 món).`

## Nguyên nhân

- Gói ngôn ngữ vi-VN trong DB local chỉ có 1297 chuỗi (en-US: 8266) và thiếu `ShoppingCart.QuantityExceedsStock`.
- nopCommerce trả về tên khóa khi thiếu tài nguyên; `MigrateShoppingCartAsync` tạo lý do cảnh báo bằng chuỗi đó.
- `CustomerRegistrationService` (đoạn ghép thông báo vi) cắt prefix/suffix từ template để lấy số lượng tối đa; template là tên khóa nên không khớp và lý do thô được giữ nguyên.

## Tái hiện

1. DB không có bản ghi vi-VN cho `shoppingcart.quantityexceedsstock`.
2. Tài khoản có Red/S ×4; khách (ngôn ngữ Tiếng Việt) có Red/S ×2; stock Red/S = 5.
3. Khách đăng nhập → bị từ chối, thông báo như trên.

Bằng chứng: `qa/automation/reports/final-adv-newbuild2/adv-cart-summary.json` (MERGE-OVER, MERGE-MULTISTORE, MERGE-ACTIVATION; local, không commit).

## Xử lý trong S2-ADV-CART-AUTO

Fixture local được bổ sung chuỗi vi-VN bằng `qa/automation/scripts/seed-vi-stock-resource.sql`
(ghi trong `cart-fixture-manifest.json` → `localizationFixture`). Đây là sửa **dữ liệu kiểm thử**,
không sửa sản phẩm.

## Đề xuất sửa sản phẩm

Khi `ShoppingCart.QuantityExceedsStock` không có bản dịch cho ngôn ngữ hiện tại, dùng bản en-US
hoặc thông báo mặc định có số lượng tối đa, không hiển thị tên khóa. Cân nhắc thêm chuỗi này vào
gói vi-VN của dự án.
