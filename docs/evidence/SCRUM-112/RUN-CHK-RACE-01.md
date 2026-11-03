# Run Manifest — RUN-CHK-RACE-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-CHKRACE-01` |
| Scenario ID | `CHK-RACE-01` |
| Executed at | `2026-11-03T12:50:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` |
| Product/SKU and stock | `PW-SIMPLE-001` |
| Shipping method | `Ground` |
| Payment method | `Payments.CheckMoneyOrder` |
| Command/manual procedure | Dùng barrier (Promise.all) phát hai request Confirm đồng thời với cùng checkout state; hoặc chạy `npx playwright test tests/checkout-risk.spec.ts --grep 'CHK-RACE-01'` |
| Result | `Not Run` (harness concurrency barrier đã dựng thành công) |

## Bằng chứng thực thi (Evidence links)

- **Concurrency harness:** Được tích hợp trong `qa/automation/tests/checkout-risk.spec.ts` (test case `CHK-RACE-01`).
- **Response log:** Lưu timestamp, request ID, status code và status text của cả 2 request đồng thời.
- **SQL trước:** `ORDER_COUNT|0`, `CART_COUNT|1`, `PRODUCT|PW-SIMPLE-001|10`.
- **SQL sau:** `ORDER_COUNT|1` (tối đa 1 order mới, delta <= 1; nếu delta = 2 sẽ fail và mở defect race condition), stock trừ đúng 1 lần.
- **Report/log:** `qa/automation/tests/checkout-risk.spec.ts`.

## Giới hạn đã biết (Known limitations)

- Tuyệt đối không mô phỏng bằng hai click tuần tự bằng tay. Phải dùng concurrency barrier phát song song hai POST request đến `/checkout/confirm`.

