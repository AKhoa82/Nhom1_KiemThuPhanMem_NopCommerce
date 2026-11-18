# Run Manifest — RUN-PAY-LOCAL-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-PAYLOCAL-01` |
| Scenario ID | `PAY-LOCAL-01` |
| Executed at | `2026-11-03T12:30:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` / `Guest` |
| Product/SKU and stock | `PW-SIMPLE-001` |
| Shipping method | `Ground` |
| Payment method | `Payments.CheckMoneyOrder` |
| Command/manual procedure | Chọn phương thức thanh toán Check / Money Order và kiểm tra database trước/sau Confirm |
| Result | `Pass trong luồng local tối giản` |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** [`image/review/REVIEW-02-confirm-order.png`](../../../image/review/REVIEW-02-confirm-order.png) (Payment method: Check / Money Order hiển thị trên Confirm) và [`REVIEW-05-order-details.png`](../../../image/review/REVIEW-05-order-details.png) (Admin Order Details lưu Payment method: Check / Money Order).
- **SQL trước:** `ORDER_COUNT|0`
- **SQL sau:** `ORDER_COUNT|1`, `PaymentMethodSystemName = 'Payments.CheckMoneyOrder'`, `OrderStatusId = 10` (Pending), `PaymentStatusId = 10` (Pending).
- **Report/log:** [`docs/linh-order-payment-review-summary.md`](../../linh-order-payment-review-summary.md#4-đối-chiếu-static-review-với-dynamic-evidence).

## Giới hạn đã biết (Known limitations)

- Phương thức thanh toán là hoàn toàn cục bộ (offline/manual payment), không thực hiện bất kỳ network call nào ra gateway ngoài.

