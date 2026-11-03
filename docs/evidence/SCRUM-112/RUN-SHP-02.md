# Run Manifest — RUN-SHP-02

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-SHP02-01` |
| Scenario ID | `SHP-02` |
| Executed at | `2026-11-03T12:25:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` |
| Product/SKU and stock | `PW-SIMPLE-001` |
| Shipping method | Invalid / Empty / Unrecognized |
| Payment method | N/A |
| Command/manual procedure | `npx playwright test tests/checkout-risk.spec.ts --grep 'SHP-02'` (3 datasets) |
| Result | `Not Run` (đã có test code tự động bao phủ 3 dataset) |

## Bằng chứng thực thi (Evidence links)

- **Data sets kiểm tra:**
  1. `SHP-02-DS01`: Giá trị rỗng `""`.
  2. `SHP-02-DS02`: Sai định dạng `"invalid-value"`.
  3. `SHP-02-DS03`: Phương thức không tồn tại `"Unknown___Shipping.FixedByWeightByTotal"`.
- **SQL trước:** `ORDER_COUNT|0`, `CART_COUNT|1`
- **SQL sau:** `ORDER_COUNT|0`, `CART_COUNT|1`, không lưu invalid option vào `GenericAttribute`.
- **Report/log:** `qa/automation/tests/checkout-risk.spec.ts`.

## Giới hạn đã biết (Known limitations)

- Cần ghi nhận response đã làm sạch và log khi chạy trên local runtime.

