# Các bước cần người dùng thực hiện trên môi trường local

Các bước dưới đây cần chạy trên máy có Docker Desktop và database nopCommerce
cục bộ. Không gửi mật khẩu SQL/customer cho agent hoặc commit vào Git.

## 1. Khởi động đúng store

Mở PowerShell tại thư mục repository:

```powershell
cd C:\projects\Kiemthu\Nhom1_KiemThuPhanMem_NopCommerce
docker compose build nopcommerce_web
docker compose up -d
docker compose ps
Invoke-WebRequest http://localhost/ -UseBasicParsing
```

Kỳ vọng:

- container `nopcommerce` và `nopcommerce_mssql_server` ở trạng thái `Up`;
- `http://localhost/` trả HTTP 200;
- database đã cài xong và storefront không chuyển về `/install`.

Nếu store đã có dữ liệu, không chạy `docker compose down` vì database hiện nằm
trong writable layer của container. Dùng `docker compose start` hoặc
`docker start nopcommerce` để khởi động lại container hiện có.

## 2. Kiểm tra checkout mode và fixture

Đăng nhập Admin, xác nhận:

1. `One page checkout enabled` = `False`.
2. `Anonymous checkout allowed` = `True` cho các ca guest.
3. Local shipping `Shipping.FixedByWeightByTotal` có option Ground.
4. `Payments.CheckMoneyOrder` đang bật.
5. Các fixture `PW-SIMPLE-001`, `PW-SHIRT`, `PW-OOS-001` và coupon
   `PW-CART-10PCT` tồn tại.

Sau đó đặt mật khẩu SQL vào biến môi trường của **chính PowerShell hiện tại**:

```powershell
$env:QA_SQL_PASSWORD = '<mat-khau-sa-cua-store-local>'
powershell -ExecutionPolicy Bypass -File .\qa\automation\scripts\reset-fixture.ps1 `
  -CaseId PW-001 -ValidateOnly
```

Kỳ vọng có dòng `Fixture validation passed; no data changed.`. Nếu báo thiếu
SKU/rate/payment hoặc sai password, dừng tại đây và sửa fixture trước khi chạy
test.

## 3. Cấu hình biến môi trường QA, không ghi vào file

Trong cùng PowerShell:

```powershell
$env:NOP_BASE_URL = 'http://localhost/'
$env:QA_CHECKOUT_MODE = 'multi-step'
$env:QA_FIXTURE_VERSION = 'PW-local-fixture-v1'
$env:QA_RUN_ID = 'RUN-20261107-SCRUM112-01'
$env:QA_REGISTERED_EMAIL = 'qa.pairwise.registered@example.test'
$env:QA_REGISTERED_PASSWORD = '<mat-khau-customer-local>'
$env:QA_BILLING_EMAIL = 'qa.guest@example.test'
$env:QA_BILLING_FIRST_NAME = 'QA'
$env:QA_BILLING_LAST_NAME = 'Customer'
$env:QA_BILLING_CITY = 'Ho Chi Minh City'
$env:QA_BILLING_ADDRESS1 = '1 Test Street'
$env:QA_BILLING_ZIP = '700000'
$env:QA_BILLING_PHONE = '0900000000'
$env:QA_BILLING_COUNTRY = 'Vietnam'
$env:QA_BILLING_STATE = 'Hồ Chí Minh'
```

Không thay `<mat-khau...>` bằng mật khẩu thật trong tài liệu hoặc lệnh được
chụp đưa lên Jira.

## 4. Cài plugin decline local

Sau khi build/rebuild web container từ source hiện tại:

1. Mở Admin → Local plugins.
2. Tìm `QA Decline (local only)` / system name `Payments.QaDecline`.
3. Install và activate plugin trong store local.
4. Trong Payment methods, chỉ bật plugin này cho lượt `PAY-FAIL-01`.
5. Sau khi chạy xong, deactivate/uninstall plugin và bật lại payment method cơ
   sở `Payments.CheckMoneyOrder`.

Plugin này cố ý decline mọi giao dịch. Không bật nó trên staging/production.

## 5. Chạy kiểm tra tự động

```powershell
cd .\qa\automation
npm ci
npx playwright install chromium
npx tsc --noEmit
npm run test:list
npm run test:case -- 'PW-002|PW-007|PW-009'
npm run test:all
```

Sau khi chạy, kiểm tra:

- `reports/run-manifest.json` có `sourceCommit`, `checkoutMode`, `fixtureVersion`
  và trạng thái đầy đủ;
- `reports/pairwise-summary.md` phân biệt pass/blocked/failure;
- report có `checkout-before.sql.txt` và `checkout-after.sql.txt` cho các case
  hoàn tất checkout;
- không có password/token trong report hoặc artifact.

Điền manifest tương ứng trong thư mục này và sao chép link report vào tracker.

## 6. Các ca cần thao tác thủ công

### SHP-02 — Shipping invalid

1. Reset fixture, mở guest hoặc registered checkout multi-step với sản phẩm vật
   lý.
2. Đi tới Shipping Method và ghi snapshot order/cart.
3. Gửi lần lượt ba request bằng DevTools Network “Edit and resend” hoặc công cụ
   tương đương, thay `shippingoption` thành: rỗng, `invalid-value`,
   `Unknown___Shipping.FixedByWeightByTotal`.
4. Với mỗi request, lưu response đã làm sạch.
5. Xác nhận vẫn ở Shipping Method, không có selected option invalid, order delta
   = 0 và cart không đổi.
6. Ghi ba request/response vào manifest `SHP-02`.

### ADDR-02 — Giữ dữ liệu sau lỗi required field

1. Ở Billing Address, điền tất cả field hợp lệ ngoại trừ `FirstName`.
2. Submit form tới server; không chỉ tắt JavaScript rồi kiểm tra HTML.
3. Chụp warning và form sau response, trong đó các field hợp lệ vẫn còn.
4. Đối chiếu SQL trước/sau: order delta = 0, cart không mất, address thiếu
   `FirstName` không được lưu như address hợp lệ.

### INV-01 — Giảm stock trước Confirm

1. Đặt cart quantity = 5, stock ban đầu = 5 và đi tới Confirm Order.
2. Trong Admin hoặc SQL read-only flow được phê duyệt, giảm stock xuống 4.
3. Quay lại customer và bấm Confirm một lần.
4. Lưu warning, order delta, cart quantity và stock sau request.
5. Kỳ vọng: không Completed, không order mới, cart vẫn quantity 5, stock vẫn 4.

### CART-MERGE-01 — Merge guest cart

1. Tạo guest cart có một simple product và một variant.
2. Tạo account cart có một dòng trùng product/variant và một dòng khác variant.
3. Từ phiên guest, đăng nhập account đích.
4. Lưu UI và SQL trước/sau: dòng trùng gộp đúng quantity, variant khác tách
   dòng, không mất item, không vượt stock, total/coupon tính lại.
5. Refresh và đăng nhập lại; xác nhận guest cũ không còn truy cập cart trái phép.

### CHK-RACE-01 — Hai Confirm đồng thời

Không dùng hai click tuần tự. Cần người có quyền chạy harness phát hai POST
request hợp lệ từ cùng checkout state qua barrier. Lưu timestamp, request ID,
status/response của cả hai request và SQL snapshot order/order item/cart/stock/
payment trước-sau. Nếu chưa có harness, ghi `Not Run` hoặc `Blocked` kèm lý do,
không ghi Pass.

## 7. Bàn giao

Sau khi chạy xong, gửi cho reviewer:

1. Các manifest trong `docs/evidence/SCRUM-112/`.
2. `11-risk-status-tracker.md` đã điền đủ 11 dòng.
3. Report/ảnh/SQL đã làm sạch.
4. Commit SHA và lệnh chạy.
5. Comment bàn giao theo mẫu trong kế hoạch tại
   `docs/KE_HOACH_HOAN_THIEN_NHIEM_VU.md`.

Khoa chỉ ký SCRUM-81 sau khi reviewer mở được tất cả link và xác nhận tổng
trạng thái theo mẫu số 26.

