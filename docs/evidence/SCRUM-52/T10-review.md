# T10 — Automation Checkout và Payment

## Phạm vi và oracle

Bộ Pairwise K06 vẫn có 14 dòng `PW-001`–`PW-014`. Các ca Checkout thành công
(`PW-002`, `PW-006`, `PW-007`, `PW-009`) phải tạo đúng **một** đơn; đơn có
đúng SKU và số lượng đã kiểm tra ở giỏ, tổng tiền bằng tổng giỏ cộng phí Ground
theo fixture, `OrderStatusId = 10` (Pending), `PaymentStatusId = 10` (Pending),
`PaymentMethodSystemName = Payments.CheckMoneyOrder`; giỏ trống sau đặt hàng.
Tồn kho sản phẩm thường và tổng tồn kho các biến thể phải giảm đúng bằng số
lượng của SKU tương ứng trong đơn. Tổng tồn kho biến thể dùng để kiểm tra lượng
trừ; lựa chọn Red/S hoặc Blue/M đã được xác minh ở giỏ trước Confirm.
Kiểm tra SQL được lưu ở attachment `checkout-before.sql.txt` và
`checkout-after.sql.txt` của từng test. Phương thức thanh toán được chọn rõ bằng
system name, không dựa vào vị trí đầu tiên trên trang.

| Nhánh | Test | Kết quả cần đối chiếu |
| --- | --- | --- |
| Khách đã đăng nhập, địa chỉ hợp lệ, Ground, Check / Money Order | `PW-006` | Một đơn mới, Pending/Pending, SKU/số lượng/tổng tiền đúng |
| Guest checkout (khi cấu hình cho phép) | `PW-002`, `PW-007`, `PW-009` | Một đơn mới gắn với email checkout; không dùng tài khoản registered làm bằng chứng guest |
| Thiếu trường địa chỉ | `PW-001`, `PW-011`, `PW-012` | Cảnh báo và không tạo đơn |
| Lựa chọn giao hàng sai hoặc không tồn tại | `SHP-02-DS01`–`DS03` | Dừng tại Shipping, giỏ còn, không tạo đơn |
| Payment processor local từ chối | `PAY-FAIL-01` | Hai lần Confirm đều bị từ chối, giỏ còn và không tạo đơn; cần plugin `Payments.QaDecline` hoạt động |
| Tồn kho giảm trước Confirm | `INV-01` | Chặn đơn, giữ giỏ và không tạo đơn |
| Confirm gần đồng thời | `CHK-RACE-01` trong `n03-race.spec.ts` | Báo riêng ngoài 14 ca Pairwise; kiểm một đơn, giỏ/tồn kho và thông báo an toàn |

## Fixture và cách chạy lại

Chạy trên store local đã cài đặt, checkout nhiều bước, dữ liệu `PW-*` theo
[`setup.md`](../../setup.md). `resetFixture` khôi phục giỏ, coupon, tồn kho và
ghi số đơn trước ca; không xóa đơn cũ. Dùng một worker và không retry. Các biến
`QA_*` được cấp trong phiên terminal theo [`automation-harness.md`](../../automation-harness.md),
không đưa mật khẩu vào report hay Jira.

```powershell
cd qa/automation
npm ci
npx playwright install chromium
npx tsc --noEmit
npm run test:pw
npm run test:case -- 'SHP-02-DS02'
npm run test:case -- 'PAY-FAIL-01'
npm run test:case -- 'INV-01'
npm run test:n03-race
```

`CHK-RACE-01` cần tài khoản `qa.n03.*@example.test` và fixture riêng; dùng
`run-n03-series.ps1` để reset rồi chạy theo hướng dẫn tại
[`B02-DEFECT-AND-RETEST.md`](../SCRUM-100/B02-DEFECT-AND-RETEST.md).

Nếu nopCommerce bỏ qua trang Payment Method và đi thẳng sang Payment Info,
`PAY-FAIL-01` ghi `FIXTURE_BLOCKED`: plugin QA chưa được kích hoạt. Cách cài và
bật plugin local nằm trong [`USER_STEPS_LOCAL_EXECUTION.md`](../SCRUM-112/USER_STEPS_LOCAL_EXECUTION.md).
Bằng chứng lượt 18/11/2026 khi plugin hoạt động nằm ở
[`RUN-20261118-N01.md`](../SCRUM-112/RUN-20261118-N01.md). Không được tính
`Blocked` thành `Pass` của lượt chạy mới.

## Ranh giới kết quả

Độ bao phủ 253/253 cặp là kết quả thiết kế model Pairwise; trạng thái Pass/Fail
chỉ lấy từ lượt Playwright thực thi. `CHK-RACE-01` là kiểm thử đồng thời tách
riêng, không đưa vào mẫu số 14 ca. Một lượt chạy trên container local không
chứng minh mọi cấu hình nopCommerce hoặc mọi phiên bản plugin đều đúng.
