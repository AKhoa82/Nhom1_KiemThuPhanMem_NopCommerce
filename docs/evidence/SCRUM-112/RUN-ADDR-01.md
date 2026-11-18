# Run Manifest — RUN-ADDR-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-ADDR01-01` |
| Scenario ID | `ADDR-01` |
| Executed at | `2026-11-03T12:10:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` / `Guest` |
| Product/SKU and stock | `PW-SIMPLE-001` |
| Shipping method | `Ground` |
| Payment method | `Payments.CheckMoneyOrder` |
| Command/manual procedure | Điền đầy đủ trường địa chỉ hợp lệ tại bước Billing Address và Shipping Address |
| Result | `Pass` |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** [`image/review/REVIEW-06-order-addresses.png`](../../../image/review/REVIEW-06-order-addresses.png) (Admin lưu Billing Address đầy đủ) và [`REVIEW-07-order-shipping-method.png`](../../../image/review/REVIEW-07-order-shipping-method.png) (Shipping Address lưu khớp Billing Address).
- **SQL trước:** `ORDER_COUNT|0`
- **SQL sau:** `ORDER_COUNT|1`, bảng `Address` lưu đúng FirstName, LastName, Email, City, Address1, Zip, Country, State.
- **Report/log:** [`docs/linh-order-payment-review-summary.md`](../../linh-order-payment-review-summary.md#2-kết-quả-đọc-từ-evidence).

## Giới hạn đã biết (Known limitations)

- Đã xác minh địa chỉ hợp lệ được lưu đúng vào bảng `Address` và gắn chính xác vào Order tạo mới.

