# Ảnh bằng chứng SCRUM-64

| Ảnh | Nội dung | Ghi chú |
| --- | --- | --- |
| `A3_PW-SIMPLE-001.png`, `A4_PW-OOS-001.png`, `A6_coupon.png` | Tạo fixture PW trong Admin (24/11/2026) | `A6` chụp trước khi sửa E-05 (loại discount hiện "order total", CouponCode chưa lưu). `A4` hiện stock 10; script reset đặt stock 0 trước mỗi ca. Chỉ minh họa việc tạo fixture |
| `B3_pairwise-summary.png` | Terminal: 14 passed (16.0m) | Bằng chứng chính của lượt PW 25/11/2026 |
| `DEF-01_01_overstock-fail-run1.png`, `DEF-01_04_overstock-fail-run3.png` | Ảnh lúc fail của test `CART-MERGE-01-OVERSTOCK`, lượt 1 và 3 | |
| `DEF-01_02_guest-cart.png`, `DEF-01_03_after-login.png` | Chụp tay: giỏ guest 2 món, sau đăng nhập còn 4 món | |
| `DEF-03_01_currencies.png` | Admin → Currencies | |
| `DEF-03_02_storefront-total.png`, `DEF-03_03_admin-total.png` | Tổng tiền ở storefront (`100 ₫`) và Admin (`$100.00`) | Ảnh Admin hiện `Order # 1065`; khớp DB |
| `DEF-04_02_raw-key-warning.png` | Ảnh lúc fail của `MERGE-OVER` (27/11/2026), khi thiếu resource vi-VN: thanh cảnh báo hiện `shoppingcart.quantityexceedsstock`, giỏ guest còn Red/S ×2 | Trạng thái SQL tương ứng ở `../DEF-04-resource-before.sql.txt`; biên bản ở `../DEF-04-repro-20261127.md` |
