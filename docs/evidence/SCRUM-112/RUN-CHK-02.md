# Run Manifest — RUN-CHK-02

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-CHK02-01` |
| Scenario ID | `CHK-02` |
| Executed at | `2026-11-03T12:05:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Guest` (`qa.guest@example.test`) |
| Product/SKU and stock | `PW-SHIRT` (Red/S), `PW-SIMPLE-001` |
| Shipping method | `Ground` |
| Payment method | `Payments.CheckMoneyOrder` |
| Command/manual procedure | `npx playwright test tests/pairwise.spec.ts --grep 'PW-002\|PW-007\|PW-009'` |
| Result | `Pass trong PW-002/PW-007/PW-009` |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** Màn hình checkout Completed guest và danh sách Orders trong Admin.
- **SQL trước:** `ORDER_COUNT|0`, `CART_COUNT|0`
- **SQL sau:** `ORDER_COUNT|1`, `ORDER|<Id>|10|10|Payments.CheckMoneyOrder|<Total>`, `CART_COUNT|0`, billing email = `qa.guest@example.test`.
- **Report/log:** [`qa/automation/REVIEW_EVIDENCE.md`](../../../qa/automation/REVIEW_EVIDENCE.md#evidence-đã-xác-minh) và snapshot Playwright `checkout-after.sql.txt`.

## Giới hạn đã biết (Known limitations)

- Đối chiếu hồi quy bug lịch sử nopCommerce #7467: Guest checkout tạo order có BillingAddress.Email hợp lệ không null. Đã bổ sung assertion `assertCheckoutOrderEvidence` xác thực trực tiếp snapshot SQL.

