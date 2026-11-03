# Run Manifest — RUN-CHK-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-CHK01-01` |
| Scenario ID | `CHK-01` |
| Executed at | `2026-11-03T12:00:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` (`ordersettings.onepagecheckoutenabled = False`) |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` (`qa.pairwise.registered@example.test`) |
| Product/SKU and stock | `PW-SIMPLE-001`, stock ban đầu = 10 |
| Shipping method | `Ground` (`Shipping.FixedByWeightByTotal`) |
| Payment method | `Payments.CheckMoneyOrder` |
| Command/manual procedure | `npx playwright test tests/pairwise.spec.ts --grep PW-006` / Checkout registered |
| Result | `Pass có điều kiện` |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** [`image/review/REVIEW-02-confirm-order.png`](../../image/review/REVIEW-02-confirm-order.png), [`REVIEW-03-order-completed.png`](../../image/review/REVIEW-03-order-completed.png), [`REVIEW-04-orders-after.png`](../../image/review/REVIEW-04-orders-after.png), [`REVIEW-05-order-details.png`](../../image/review/REVIEW-05-order-details.png)
- **SQL trước:** `ORDER_COUNT|0`, `CART_COUNT|0`
- **SQL sau:** `ORDER_COUNT|1`, `ORDER|1|10|10|Payments.CheckMoneyOrder|100.00`, `CART_COUNT|0`
- **Report/log:** [`docs/linh-order-payment-review-summary.md`](../linh-order-payment-review-summary.md#3-kết-quả-thực-tế-của-lượt-chạy)

## Giới hạn đã biết (Known limitations)

- **Finding D-01 (Ký hiệu currency):** Storefront hiển thị `100 đ`, trong khi Admin hiển thị `$100.00`. Giá trị số đúng là 100, OrderStatus = 10 (Pending), PaymentStatus = 10 (Pending), phát sinh đúng 1 order mới. Finding currency được ghi nhận như một accepted risk / defect cấu hình hiển thị đang mở.

