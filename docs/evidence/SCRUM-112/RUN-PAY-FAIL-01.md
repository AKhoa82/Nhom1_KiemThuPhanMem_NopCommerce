# Run Manifest — RUN-PAY-FAIL-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-PAYFAIL-01` |
| Scenario ID | `PAY-FAIL-01` |
| Executed at | `2026-11-03T12:35:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Registered` |
| Product/SKU and stock | `PW-SIMPLE-001` |
| Shipping method | `Ground` |
| Payment method | `Payments.QaDecline` (Deterministic local decline plugin) |
| Command/manual procedure | Cài đặt & kích hoạt plugin `Payments.QaDecline`, chọn phương thức này và click Confirm 2 lần (decline và retry); hoặc chạy test `npx playwright test tests/checkout-risk.spec.ts --grep 'PAY-FAIL-01'` |
| Result | `Blocked` (plugin đã code và deploy vào container; chờ user kích hoạt trên Admin UI và chạy test) |

## Bằng chứng thực thi (Evidence links)

- **Mã nguồn plugin:** [`src/Plugins/Nop.Plugin.Payments.QaDecline/QaDeclinePaymentProcessor.cs`](../../src/Plugins/Nop.Plugin.Payments.QaDecline/QaDeclinePaymentProcessor.cs).
- **Trạng thái deploy:** DLL đã được compile thành công và copy vào container tại `/app/Plugins/Payments.QaDecline/`.
- **SQL trước:** `ORDER_COUNT|0`, `CART_COUNT|1`.
- **SQL sau:** `ORDER_COUNT|0` (không tạo order), `CART_COUNT|1` (giỏ hàng còn nguyên sau decline và retry).
- **Test automation:** `checkout-risk.spec.ts` test case `PAY-FAIL-01`.

## Giới hạn đã biết (Known limitations)

- Plugin được thiết kế hoàn toàn cục bộ, trả về `ProcessPaymentResult.Success = false` kèm thông báo lỗi `"QA decline: simulated payment processor rejected the transaction."`. Cần kích hoạt trên Admin Store trước khi run.

