# Run Manifest — RUN-ADDR-02

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-ADDR02-01` |
| Scenario ID | `ADDR-02` |
| Executed at | `2026-11-03T12:15:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Guest` / `Registered` |
| Product/SKU and stock | `PW-SIMPLE-001` / `PW-SHIRT` |
| Shipping method | N/A (bị chặn tại bước Address) |
| Payment method | N/A (bị chặn tại bước Address) |
| Command/manual procedure | Điền đầy đủ form address nhưng để trống `FirstName`, bấm Next; hoặc chạy `PW-001/PW-011/PW-012` |
| Result | `Pass` (theo regression test và evidence; yêu cầu lưu ảnh giữ field khi rerun) |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** [`image/review/REVIEW-08-address-firstname-required.png`](../../../image/review/REVIEW-08-address-firstname-required.png) (`First name is required.` hiển thị trên UI) và [`REVIEW-09-orders-unchanged-after-address-error.png`](../../../image/review/REVIEW-09-orders-unchanged-after-address-error.png) (Order list giữ nguyên không đổi, delta = 0).
- **SQL trước:** `ORDER_COUNT|1`, `CART_COUNT|1`
- **SQL sau:** `ORDER_COUNT|1` (delta = 0), `CART_COUNT|1` (cart không bị mất).
- **Report/log:** [`docs/linh-order-payment-review-summary.md`](../../linh-order-payment-review-summary.md#2-kết-quả-đọc-từ-evidence).

## Giới hạn đã biết (Known limitations)

- Đối chiếu hồi quy bug lịch sử nopCommerce #7203: Sau khi validation lỗi do thiếu `FirstName`, các field hợp lệ khác (LastName, Email, Address, Zip...) vẫn được giữ nguyên trên form, cart không bị xóa và không tạo address rác.

