# Run Manifest — RUN-SHP-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-SHP01-01` |
| Scenario ID | `SHP-01` |
| Executed at | `2026-11-03T12:20:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` |
| Product/SKU and stock | `PW-SIMPLE-001` |
| Shipping method | `Ground` (`Ground___Shipping.FixedByWeightByTotal`) |
| Payment method | N/A (kiểm tra trước confirm) |
| Command/manual procedure | `npx playwright test tests/checkout-risk.spec.ts --grep 'SHP-01'` |
| Result | `Partial` (chờ rerun local lưu ảnh UI trước/sau quay lại) / `Test Coded` |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** Cần ảnh chụp màn hình bước Shipping Method sau khi quay lại từ Payment Method vẫn giữ checked Ground option.
- **SQL trước:** `ORDER_COUNT|0`, `CART_COUNT|1`
- **SQL sau:** `ORDER_COUNT|0`, `CART_COUNT|1`, `ATTR|SelectedShippingOption|Ground___Shipping.FixedByWeightByTotal`.
- **Report/log:** `qa/automation/tests/checkout-risk.spec.ts` test case `SHP-01`.

## Giới hạn đã biết (Known limitations)

- Gap trước đây (Finding D-03 trong review Diệu Linh): Ảnh chỉ chụp Confirm order có Ground nhưng chưa có ảnh trường Shipping Method trong Admin và chưa chụp màn hình quay lại. Test tự động đã assert option surviving navigation.

