# SCRUM-82 — Risk register nghiệm thu Cart của Trang

Tài liệu này là deliverable triển khai của SCRUM-82. Phạm vi chỉ gồm đánh giá rủi ro và nghiệm thu hành vi Cart; không bao gồm việc chấm Checkout/Payment của SCRUM-83.

## Nguồn và cách chạy

- Scenario nền: [`docs/cart-checkout-scenarios.md`](../../docs/cart-checkout-scenarios.md).
- Bộ kiểm thử nghiệm thu: [`qa/automation/tests/cart-risk.spec.ts`](../../qa/automation/tests/cart-risk.spec.ts).
- Đối chiếu SQL read-only: [`qa/automation/tests/helpers/sql-fixture.ts`](../../qa/automation/tests/helpers/sql-fixture.ts).
- Chạy tại `qa/automation`: `npm run test:cart-risk`.
- Report local sau khi chạy: `reports/cart-risk-summary.md` và attachment SQL của từng case. Thư mục `reports/` được ignore, không chứa credential.
- Lần chạy nghiệm thu cuối: `15 passed`, `0 failed`, `0 skipped`.

Điểm rủi ro dùng công thức `Impact (I) × Likelihood (L)`: 1–2 Low, 3–4 Medium, 6–9 High. Ưu tiên P1 là phải có execution evidence; P2 phải có evidence trong vòng kiểm thử hiện tại.

## 15 dòng nghiệm thu

| ID | Scenario / dữ liệu đối chiếu | I | L | Score / mức | Lý do chấm | Ưu tiên | Kết quả | Link case / evidence |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- |
| `CART-01` | Thêm `PW-SIMPLE-001`, quantity 2, stock 10 | 2 | 2 | 4 / Medium | Sai quantity hoặc line total làm sai giá trị giỏ nhưng chưa gây oversell | P2 | Pass — UI có 1 dòng qty 2, subtotal/total 200 và SQL có cart qty 2 | [case CART-01](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-02` | Thêm `PW-SHIRT`, Red/S qty 2, variant stock 5 | 3 | 2 | 6 / High | Dùng nhầm tổ hợp thuộc tính có thể lấy sai tồn kho hoặc sai sản phẩm | P1 | Pass — UI giữ Red/S, qty 2, subtotal 400 và SQL giữ variant stock 5 | [case CART-02](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-03` | Thêm `PW-SIMPLE-001`, quantity 1 | 2 | 2 | 4 / Medium | Boundary quantity mặc định sai làm lệch line total và cart indicator | P2 | Pass — quantity không tự đổi và line total là 100 | [case CART-03](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-04` | Simple qty 1 + `PW-SHIRT` Blue/M qty 1 | 3 | 2 | 6 / High | Gộp nhầm hai product/variant làm sai line, subtotal 300 hoặc tổng quantity | P1 | Pass — có đúng 2 dòng và SQL có đủ hai cart item | [case CART-04](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-05` | Simple qty 2 cập nhật lên 4, stock 10 | 3 | 2 | 6 / High | Update có thể tạo duplicate line hoặc lưu quantity/line total sai | P1 | Pass — chỉ còn 1 dòng qty 4, subtotal 400 và SQL qty 4 | [case CART-05](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-06` | Simple qty 1 + Blue/M qty 1, xóa simple | 2 | 2 | 4 / Medium | Xóa nhầm toàn bộ cart hoặc xóa nhầm variant còn lại | P2 | Pass — Blue/M vẫn còn 1 dòng, subtotal 200 và simple không còn trong cart | [case CART-06](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-07` | Red/S đang qty 4, stock 5, yêu cầu qty 6 | 3 | 3 | 9 / High | Có thể oversell hoặc làm mất quantity hợp lệ trước đó | P1 | Pass — bị chặn, qty vẫn 4, SQL không vượt stock 5 | [case CART-07](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-08` | Simple qty 1, xóa item cuối | 2 | 2 | 4 / Medium | Cart indicator, coupon hoặc total cũ có thể còn sau khi cart rỗng | P2 | Pass — không còn cart row và UI hiển thị empty cart | [case CART-08](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-09` | Customer đã đăng nhập mở cart sau reset | 2 | 2 | 4 / Medium | Dữ liệu cart cũ hoặc tổng tiền cũ có thể rò sang phiên mới | P2 | Pass — UI rỗng và SQL không có cart row của fixture | [case CART-09](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-10` | Thêm `PW-OOS-001`, stock 0, no backorders | 3 | 2 | 6 / High | Cho phép item hết hàng vào cart tạo rủi ro đặt hàng/oversell | P1 | Pass — có cảnh báo, cart vẫn rỗng và SQL xác nhận stock 0 | [case CART-10](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-11` | Simple qty 2, coupon `PW-CART-10PCT` active 10% | 3 | 2 | 6 / High | Sai discount hoặc áp dụng lặp làm sai total phải thu | P1 | Pass — subtotal 200, discount 20, total 180 và SQL xác nhận coupon active 10% | [case CART-11](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-12` | Simple qty 2, coupon không tồn tại `PW-NOT-EXIST` | 2 | 2 | 4 / Medium | Coupon invalid không được làm thay đổi subtotal/discount/total | P2 | Pass — có cảnh báo, subtotal/total vẫn 200 và cart không đổi | [case CART-12](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-13` | Simple qty 1 + Red/S qty 2, coupon 10% | 3 | 2 | 6 / High | Sai phép tính nhiều dòng hoặc mất trạng thái coupon sau refresh | P1 | Pass — subtotal 500, discount 50, total 450 sau refresh | [case CART-13](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-14` | Simple qty đúng bằng stock 10 | 3 | 2 | 6 / High | Boundary exact-stock có thể bị từ chối nhầm hoặc cho phép vượt stock ở lần update sau | P1 | Pass — qty 10 được chấp nhận, SQL cart qty không vượt product stock 10 | [case CART-14](../../qa/automation/tests/cart-risk.spec.ts) |
| `CART-REPEAT-01` | Cùng Red/S qty 2 rồi 3; sau đó thêm Blue/M qty 1 | 3 | 2 | 6 / High | Duplicate line hoặc gộp khác variant làm sai quantity, subtotal và inventory mapping | P1 | Pass — Red/S là 1 dòng qty 5, Blue/M là dòng riêng và SQL có 2 cart row | [case CART-REPEAT-01](../../qa/automation/tests/cart-risk.spec.ts) |

## Điều kiện nghiệm thu

- Có đủ đúng 15 ID, không bỏ sót `CART-REPEAT-01`.
- Mỗi dòng có lý do chấm, mức ưu tiên và link tới test case.
- Test reset fixture trước từng case; SQL snapshot chỉ đọc đối chiếu product stock, variant stock, coupon, cart item và applied coupon.
- Không dùng pair coverage để thay thế risk coverage.
- Kết quả pass/fail cuối cùng lấy từ `reports/cart-risk-summary.md` sau lệnh chạy thực tế.
