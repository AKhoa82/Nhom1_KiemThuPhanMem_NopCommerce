# Run Manifest — RUN-INV-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-INV01-01` |
| Scenario ID | `INV-01` |
| Executed at | `2026-11-03T12:40:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` |
| Product/SKU and stock | `PW-SIMPLE-001`, stock ban đầu = 5, giảm xuống 4 trước Confirm |
| Shipping method | `Ground` |
| Payment method | `Payments.CheckMoneyOrder` |
| Command/manual procedure | Đặt quantity 5, tới bước Confirm; giảm stock xuống 4 qua SQL/Admin; bấm Confirm; hoặc chạy `npx playwright test tests/checkout-risk.spec.ts --grep 'INV-01'` |
| Result | `Chưa xác minh cục bộ` (kịch bản và test code tự động đã hoàn thành, chờ rerun) |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** Màn hình thông báo lỗi cảnh báo tồn kho không đủ sau khi bấm Confirm.
- **SQL trước:** `ORDER_COUNT|0`, `CART_COUNT|1` (qty = 5), `PRODUCT|PW-SIMPLE-001|5`.
- **SQL sau:** `ORDER_COUNT|0` (delta = 0), `CART_COUNT|1` (qty = 5), `PRODUCT|PW-SIMPLE-001|4` (stock không bị trừ tiếp).
- **Test automation:** `checkout-risk.spec.ts` test case `INV-01`.

## Giới hạn đã biết (Known limitations)

- Cần ghi nhận đúng nguồn chạy của lượt kiểm thử bổ sung hoặc rerun trực tiếp, không gán nhầm cho đợt review cũ ngày 05–06/10/2026.

