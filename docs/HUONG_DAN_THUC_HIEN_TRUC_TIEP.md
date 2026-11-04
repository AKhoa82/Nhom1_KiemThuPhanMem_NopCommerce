# Hướng dẫn thực hiện trực tiếp & chụp ảnh nghiệm thu SCRUM-81

Tài liệu này hướng dẫn chi tiết từng thao tác trên máy cục bộ để hoàn tất nghiệm thu 11 rủi ro Checkout phục vụ việc duyệt **SCRUM-81**. Các bước được sắp xếp theo **một luồng Checkout tự nhiên duy nhất**: làm tới bước nào cần bằng chứng sẽ hướng dẫn chụp ảnh và lưu file ngay tại bước đó.

---

## 1. Trạng thái môi trường hiện tại (Đã sẵn sàng)

- **Docker Containers**: Cả 2 container `nopcommerce` (Web port 80) và `nopcommerce_mssql_server` (MSSQL port 1433) đang chạy bình thường (`Up`).
- **Storefront & Admin**: Đang hoạt động tốt tại `http://localhost/` và `http://localhost/admin/` (HTTP 200 OK).
- **Cấu hình chuẩn**:
  - Multi-step checkout: `ordersettings.onepagecheckoutenabled = False`.
  - Anonymous checkout: `ordersettings.anonymouscheckoutallowed = True`.
- **Plugin QA Decline (`Payments.QaDecline`)**: Đã được biên dịch, copy vào container và đã kích hoạt sẵn trong hệ thống (`paymentsettings.activepaymentmethodsystemnames`).
- **Lưu ý về Docker**: Trong trường hợp bạn bấm *Reload list of plugins* hoặc *Restart application*, container sẽ tự khởi động lại mất khoảng 30–60 giây để nạp lại .NET và plugin; nếu gặp lỗi mất kết nối chỉ cần đợi 1 phút rồi F5 tải lại trang.

---

## 2. Quy trình thực hiện chi tiết: Làm tới đâu - Chụp ảnh tới đó

### Bước 1: Bắt đầu luồng Checkout

1. Mở trình duyệt và truy cập: `http://localhost/`
2. Chọn bất kỳ sản phẩm nào có sẵn (ví dụ: `PW-SIMPLE-001` hoặc áo `PW-SHIRT`), nhấp nút **Add to cart**.
3. Nhấp vào menu **Shopping cart** trên thanh header (hoặc vào `http://localhost/cart`).
4. Tích chọn ô **I agree with the terms of service...** và nhấp nút **Checkout**.
5. Nếu được hỏi đăng nhập/guest: Chọn **Checkout as Guest** (hoặc đăng nhập bằng tài khoản `qa.pairwise.registered@example.test`).

---

### Bước 2: Bước Billing Address ➔ Chụp Ảnh 1 (`ADDR-02`)

*Mục đích: Đối chiếu hồi quy lỗi lịch sử nopCommerce #7203 (form bị xóa sạch sau khi validation lỗi).*

1. Tại bước **Billing Address**, điền thông tin vào form nhưng **cố tình để trống trường First name**:
   - **First name**: *(Để trống)*
   - **Last name**: `Customer`
   - **Email**: `qa.guest@example.test`
   - **Country**: `Vietnam`
   - **State / province**: `Hồ Chí Minh`
   - **City**: `Ho Chi Minh City`
   - **Address 1**: `1 Test Street`
   - **Zip / postal code**: `700000`
   - **Phone number**: `0900000000`
2. Nhấp nút **Continue** (hoặc **Next**).
3. Trang sẽ hiển thị thông báo lỗi màu đỏ: `First name is required.`, các ô dữ liệu khác vẫn giữ nguyên.
4. 📸 **CHỤP ẢNH 1 NGAY TẠI ĐÂY**:
   - **Nội dung ảnh**: Chụp toàn màn hình form hiển thị lỗi màu đỏ `First name is required.` và các ô dữ liệu khác (`Last name`, `Email`, `Address 1`...) vẫn còn nguyên giá trị, không bị reset trắng form.
   - **Đường dẫn lưu file**:  
     `image/evidence/scrum-112/ADDR-02-keep-fields.png`
5. **Tiếp tục luồng**: Nhập chữ `QA` vào ô **First name**, sau đó nhấp nút **Continue** để chuyển sang bước tiếp theo.

---

### Bước 3: Bước Shipping Method ➔ Chụp Ảnh 2 (`SHP-01`)

*Mục đích: Bù đắp khoảng trống kiểm thử Finding D-03 (chứng minh lựa chọn phương thức giao hàng không bị mất khi quay lại bước trước).*

1. Tại bước **Shipping Method**, bạn sẽ thấy các tùy chọn giao hàng (ví dụ: `Ground`).
2. Tích chọn phương thức **Ground**, sau đó nhấp nút **Continue** để chuyển sang bước **Payment Method**.
3. Tại bước **Payment Method**, nhấn nút **Back** của trình duyệt (hoặc nhấp trực tiếp vào tiêu đề bước Shipping Method) để quay lại bước trước.
4. 📸 **CHỤP ẢNH 2 NGAY TẠI ĐÂY**:
   - **Nội dung ảnh**: Màn hình bước **Shipping Method** với radio button của tùy chọn **Ground vẫn đang được tích chọn (checked)** sau khi quay lại.
   - **Đường dẫn lưu file**:  
     `image/evidence/scrum-112/SHP-01-ground-persisted.png`
5. **Tiếp tục luồng**: Nhấp nút **Continue** một lần nữa để đi tiếp sang bước **Payment Method**.

---

### Bước 4: Bước Payment Method & Confirm Order ➔ Chụp Ảnh 3 (`PAY-FAIL-01`)

*Mục đích: Kiểm chứng cổng thanh toán giả lập từ chối giao dịch xác định, không tạo order rác và giỏ hàng còn nguyên.*

1. Tại bước **Payment Method**, bạn sẽ thấy danh sách phương thức thanh toán.
2. Tích chọn phương thức **QA Decline (local only)** (đã được bật sẵn), sau đó nhấp nút **Continue**.
3. Bước **Payment Information**: Nhấp **Continue**.
4. Tại bước **Confirm Order**: Kiểm tra thông tin đơn hàng và nhấp nút **Confirm**.
5. Hệ thống sẽ xử lý thanh toán thông qua cổng giả lập và trả về lỗi từ chối giao dịch:
   - Xuất hiện thanh thông báo lỗi màu đỏ ở đầu trang:  
     `QA decline: simulated payment processor rejected the transaction.`
   - Đơn hàng **không** được tạo.
   - Biểu tượng **Shopping cart** trên header vẫn hiển thị còn nguyên số lượng sản phẩm `(1)` (không bị mất giỏ hàng).
6. 📸 **CHỤP ẢNH 3 NGAY TẠI ĐÂY**:
   - **Nội dung ảnh**: Chụp toàn màn hình bước Confirm Order hiển thị thông báo lỗi từ chối màu đỏ và góc trên bên phải thấy icon Shopping cart vẫn còn giữ nguyên sản phẩm.
   - **Đường dẫn lưu file**:  
     `image/evidence/scrum-112/PAY-FAIL-01-decline.png`

---

### Bước 5: Chạy bộ kiểm thử tự động (Playwright)

Sau khi hoàn tất thao tác trực tiếp và chụp xong 3 ảnh UI, mở cửa sổ **PowerShell** tại thư mục dự án để chạy kiểm thử tự động ghi nhận log và run-manifest:

```powershell
cd C:\projects\Kiemthu\Nhom1_KiemThuPhanMem_NopCommerce\qa\automation

# Thiết lập biến môi trường cục bộ (thay <mat-khau-customer-cua-ban> bằng pass của customer registered)
$env:NOP_BASE_URL = 'http://localhost/'
$env:QA_CHECKOUT_MODE = 'multi-step'
$env:QA_SQL_PASSWORD = 'nopCommerce_db_password'
$env:QA_REGISTERED_EMAIL = 'qa.pairwise.registered@example.test'
$env:QA_REGISTERED_PASSWORD = '<mat-khau-customer-cua-ban>'
$env:QA_BILLING_EMAIL = 'qa.guest@example.test'

# 1. Chạy riêng bộ kiểm thử Checkout Risk & Concurrency Harness:
npx playwright test tests/checkout-risk.spec.ts

# 2. (Tùy chọn) Chạy kiểm tra toàn bộ 38 kịch bản:
npm run test:all
```

Sau khi chạy xong, kết quả kiểm thử tự động sẽ được lưu tại `qa/automation/reports/`.

---

### Bước 6: Khôi phục cấu hình Payment về mặc định (Tùy chọn)

Sau khi hoàn tất nghiệm thu case `PAY-FAIL-01`:
1. Truy cập trang quản trị: `http://localhost/Admin/Payment/Methods`.
2. Tại dòng **QA Decline (local only)**, nhấp nút **Edit**, bỏ tích chọn ô **Is active**, sau đó bấm **Update**.
3. Đảm bảo phương thức **Check / Money Order** vẫn đang ở trạng thái `Is active = True`.

---

### Bước 7: Mẫu Comment bàn giao trên Jira SCRUM-81

Sau khi hoàn tất chụp ảnh và chạy test, bạn copy đoạn nội dung dưới đây để đăng comment bàn giao trên issue Jira **SCRUM-81**:

```markdown
Đã hoàn thành rà soát evidence và trạng thái 11 rủi ro Checkout và luồng bổ sung phục vụ SCRUM-81:

- Báo cáo bàn giao SCRUM-112: docs/evidence/SCRUM-112/SCRUM-112-KET-QUA-BAN-GIAO.md
- Bảng đối chiếu 11 rủi ro: docs/evidence/SCRUM-112/11-risk-status-tracker.md
- Risk register cập nhật: docs/test-design/SCRUM-80-risk-register.md
- Run manifests: docs/evidence/SCRUM-112/RUN-*.md (đủ 11 manifest cho từng scenario)
- Bằng chứng hình ảnh UI:
  + image/evidence/scrum-112/ADDR-02-keep-fields.png (giữ field khi validation lỗi theo nopCommerce #7203)
  + image/evidence/scrum-112/SHP-01-ground-persisted.png (giữ lựa chọn Ground khi quay lại bước trước)
  + image/evidence/scrum-112/PAY-FAIL-01-decline.png (thông báo decline xác định từ QaDecline processor)
- Risk coverage theo mẫu số 26:
  + Pass: 17 (15 dòng Cart + ADDR-01 + ADDR-02)
  + Pass có điều kiện: 2 (CHK-01 finding currency D-01 + PAY-LOCAL-01)
  + Pass trong PW test: 1 (CHK-02 trong PW-002/PW-007/PW-009)
  + Partial: 1 (SHP-01)
  + Not Run: 3 (SHP-02, CART-MERGE-01, CHK-RACE-01)
  + Blocked: 1 (PAY-FAIL-01)
  + Chưa xác minh cục bộ: 1 (INV-01)
  + Fail: 0
- Pairwise model coverage: 253/253 feasible pairs (Pairwise execution: 14/14 passed)
- Các vấn đề High risk còn mở:
  + CHK-01: Finding D-01 format currency; đề xuất Accepted Risk (Khoa, 07/11).
  + PAY-FAIL-01: Blocked do thiếu fake payment processor trong CI (Khoa, 06/11).
  + SHP-02: Not Run trong Sprint 2; kế hoạch chạy 3 dataset (Khoa, 04/11).
  + INV-01: Chưa xác minh cục bộ trong Sprint 2; ghi nhận đúng lượt bổ sung Jira (Trang + Khoa, 07/11).
  + CART-MERGE-01: Not Run trong Sprint 2; kế hoạch chạy merge cart (Trang + Khoa, 05/11).
  + CHK-RACE-01: Not Run trong Sprint 2; kế hoạch chạy barrier concurrency (Khoa, 06/11).

Đề nghị Khoa đối chiếu từng link scenario, test, manifest và ký duyệt SCRUM-81.
```

---

## 3. Bảng tra cứu nhanh 11 Run Manifest trong `docs/evidence/SCRUM-112/`

| ID | Tên kịch bản | File Manifest | Trạng thái hiện tại |
| --- | --- | --- | --- |
| `CHK-01` | Customer đăng nhập hoàn tất checkout | [RUN-CHK-01.md](evidence/SCRUM-112/RUN-CHK-01.md) | Pass có điều kiện (Finding D-01) |
| `CHK-02` | Guest hoàn tất checkout | [RUN-CHK-02.md](evidence/SCRUM-112/RUN-CHK-02.md) | Pass trong PW-002/PW-007/PW-009 |
| `ADDR-01` | Chấp nhận address hợp lệ | [RUN-ADDR-01.md](evidence/SCRUM-112/RUN-ADDR-01.md) | Pass |
| `ADDR-02` | Từ chối address thiếu First Name | [RUN-ADDR-02.md](evidence/SCRUM-112/RUN-ADDR-02.md) | Pass (chờ ảnh giữ field) |
| `SHP-01` | Giữ option shipping khi quay lại | [RUN-SHP-01.md](evidence/SCRUM-112/RUN-SHP-01.md) | Partial / Test Coded |
| `SHP-02` | Shipping invalid 3 dataset | [RUN-SHP-02.md](evidence/SCRUM-112/RUN-SHP-02.md) | Not Run / Test Coded |
| `PAY-LOCAL-01` | Check / Money Order local | [RUN-PAY-LOCAL-01.md](evidence/SCRUM-112/RUN-PAY-LOCAL-01.md) | Pass trong luồng local tối giản |
| `PAY-FAIL-01` | Processor từ chối thanh toán | [RUN-PAY-FAIL-01.md](evidence/SCRUM-112/RUN-PAY-FAIL-01.md) | Blocked (chờ kích hoạt plugin) |
| `INV-01` | Giảm tồn kho trước Confirm | [RUN-INV-01.md](evidence/SCRUM-112/RUN-INV-01.md) | Chưa xác minh cục bộ / Test Coded |
| `CART-MERGE-01` | Merge giỏ guest khi đăng nhập | [RUN-CART-MERGE-01.md](evidence/SCRUM-112/RUN-CART-MERGE-01.md) | Not Run / Test Coded |
| `CHK-RACE-01` | Race condition hai Confirm đồng thời | [RUN-CHK-RACE-01.md](evidence/SCRUM-112/RUN-CHK-RACE-01.md) | Not Run / Harness Coded |
