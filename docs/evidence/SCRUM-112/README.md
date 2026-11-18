# Evidence workspace — SCRUM-112 / SCRUM-81

Thư mục này lưu manifest và bảng tổng hợp đã làm sạch cho vòng rà soát 11 rủi
ro Checkout. Không lưu mật khẩu, cookie, token hoặc report chứa dữ liệu cá nhân
thật.

## Trạng thái preflight môi trường hiện tại

| Hạng mục | Kết quả kiểm tra ngày 03/11/2026 |
| --- | --- |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Branch | `test/SCRUM-82-cart-risk` |
| Docker container nopCommerce | **Đang chạy (Up)**: `nopcommerce` (port 80) và `nopcommerce_mssql_server` (port 1433) |
| Storefront HTTP Status | **HTTP 200 OK** tại `http://localhost/` |
| Database connection | Kết nối thành công, database `nopcommerce` sẵn sàng |
| Fixture baseline | `PW-SIMPLE-001`, `PW-SHIRT`, `PW-OOS-001` và coupon `PW-CART-10PCT` đã được xác minh |
| Checkout mode | **Multi-step checkout** (`ordersettings.onepagecheckoutenabled = False`) |
| Anonymous checkout | **Bật** (`ordersettings.anonymouscheckoutallowed = True`) |
| QA decline plugin | Đã build thành công `Nop.Plugin.Payments.QaDecline.dll` và copy vào container tại `/app/Plugins/Payments.QaDecline/` |
| `qa/automation/node_modules` | Đã cài (`npm ci`) |
| Playwright Chromium | Đã cài (`npx playwright install chromium`) |
| Test inventory | **38 test cases** được Playwright nhận diện và TypeScript biên dịch không lỗi |
| Smoke test `HARNESS-001` | **Passed (1/1)** |

## Danh mục Run Manifest 11 rủi ro

1. [`RUN-CHK-01.md`](RUN-CHK-01.md) — Customer đăng nhập hoàn tất checkout (Pass có điều kiện)
2. [`RUN-CHK-02.md`](RUN-CHK-02.md) — Guest hoàn tất checkout khi được hỗ trợ (Pass trong PW-002/007/009)
3. [`RUN-ADDR-01.md`](RUN-ADDR-01.md) — Chấp nhận address hợp lệ (Pass)
4. [`RUN-ADDR-02.md`](RUN-ADDR-02.md) — Từ chối address thiếu FirstName (Pass)
5. [`RUN-SHP-01.md`](RUN-SHP-01.md) — Giữ lựa chọn shipping khi quay lại (Partial / Test Coded)
6. [`RUN-SHP-02.md`](RUN-SHP-02.md) — Shipping invalid 3 dataset (Not Run / Test Coded)
7. [`RUN-PAY-LOCAL-01.md`](RUN-PAY-LOCAL-01.md) — Payment method CheckMoneyOrder local (Pass luồng tối giản)
8. [`RUN-PAY-FAIL-01.md`](RUN-PAY-FAIL-01.md) — Decline payment processor local (Blocked chờ kích hoạt)
9. [`RUN-INV-01.md`](RUN-INV-01.md) — Giảm tồn kho trước Confirm (Chưa xác minh cục bộ / Test Coded)
10. [`RUN-CART-MERGE-01.md`](RUN-CART-MERGE-01.md) — Merge guest cart khi đăng nhập (Not Run / Test Coded)
11. [`RUN-CHK-RACE-01.md`](RUN-CHK-RACE-01.md) — Race condition hai request Confirm (Not Run / Harness Coded)

Chi tiết bảng thay đổi và tổng hợp trạng thái xem tại [`11-risk-status-tracker.md`](11-risk-status-tracker.md).
