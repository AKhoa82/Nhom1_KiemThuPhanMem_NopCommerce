# T08 - Thiết kế automation harness cho Pairwise Test

## 1. Mục tiêu và phạm vi

Tài liệu này mô tả bộ khung automation cho các case Pairwise của Shopping Cart
và Checkout trên nopCommerce. Phần skeleton, cấu hình và lệnh chạy do Khoa phụ
trách. Trang phụ trách đọc test data, biến từng row thành test và viết assertion.
Linh kiểm tra log, report và khả năng chạy lại trên máy khác.

Harness có smoke test `HARNESS-001` xác nhận storefront sẵn sàng và 14 test
nghiệp vụ `PW-001` đến `PW-014`. Full run cuối đã xác nhận 15/15 test pass
(gồm 14 Pairwise case và HARNESS-001); kết quả chi tiết nằm tại
[`qa/automation/REVIEW_EVIDENCE.md`](../qa/automation/REVIEW_EVIDENCE.md).

## 2. Framework và cấu trúc

Framework được chọn là Playwright Test với TypeScript, chạy Chromium. File
`qa/automation/package-lock.json` khóa phiên bản dependency đã cài. Cấu hình
runner nằm trong `qa/automation/playwright.config.ts`.

```text
qa/automation/
├── tests/                 # Smoke test và các test PW-xxx của Trang
├── test-data/             # Dữ liệu riêng của automation nếu cần
├── scripts/               # Lệnh hỗ trợ khởi động và chuẩn bị môi trường
├── artifacts/             # Screenshot/trace sinh khi chạy, không commit
├── reports/               # JSON/JUnit/HTML sinh khi chạy, không commit
├── package.json
├── package-lock.json
└── playwright.config.ts
```

Nguồn dữ liệu Pairwise chính thức vẫn là
[`qa/pairwise/test-data/generated-cases.csv`](../qa/pairwise/test-data/generated-cases.csv).
Liên kết từ case sang scenario nằm trong
[`scenario-mapping.csv`](../qa/pairwise/test-data/scenario-mapping.csv). Không
duy trì bản sao CSV ở `qa/automation/test-data/`.

## 3. Khởi động nopCommerce

Trước khi chạy, máy phải được cài store và fixture theo [`setup.md`](../setup.md).
Mở PowerShell tại thư mục gốc repository, rồi chạy:

```powershell
cd qa/automation
npm ci
npx playwright install chromium
.\scripts\start-local.ps1
$env:NOP_BASE_URL = 'http://localhost:8080/'
$env:QA_SQL_PASSWORD = '<mat-khau-SQL-cuc-bo>'
$env:QA_BILLING_EMAIL = 'qa.guest@example.test'
$env:QA_REGISTERED_EMAIL = 'qa.pairwise.registered@example.test'
$env:QA_REGISTERED_PASSWORD = '<mat-khau-customer-fixture>'
```

`start-local.ps1` gọi `docker compose start` cho các container hiện có, chờ
storefront trả HTTP 200 và báo lỗi nếu trang vẫn chuyển đến installer. Máy mới
chưa có container/database phải hoàn tất hướng dẫn `setup.md` trước. Script
không tạo lại container và không reset dữ liệu.

Nếu script báo không kết nối được Docker engine, mở Docker Desktop ở chế độ
Linux containers, đợi engine sẵn sàng rồi chạy lại script. Không dùng
`docker compose up -d` chỉ để khắc phục lỗi này: lệnh đó có thể tạo lại
container web. Cấu hình kết nối DB của web hiện nằm trong writable layer;
container web mới có thể chuyển về `/install` dù database cũ còn nguyên.
Khi gặp `/install` trên store đã cài, không chạy lại wizard trên database cũ;
kiểm tra và khôi phục cấu hình kết nối web trước khi lấy evidence test.

URL mặc định là `http://localhost/`. Nếu đổi URL, đặt `NOP_BASE_URL` cho
Playwright và dùng cùng URL với `start-local.ps1 -BaseUrl`, ví dụ:

```powershell
$env:NOP_BASE_URL = 'http://localhost:8080/'
.\scripts\start-local.ps1 -BaseUrl $env:NOP_BASE_URL
```

## 4. Lệnh chạy và quy ước ID

Tiếp tục chạy từ `qa/automation`:

```powershell
npm run test:list
npm run test:case -- 'HARNESS-001\b'
npm run test:all
npm run report
```

Mỗi row tạo đúng một test có tiêu đề bắt đầu bằng `PW-xxx`. Chạy một row bằng
`npm run test:case -- 'PW-001\b'`; `\b` tránh khớp nhầm ID có cùng tiền tố.
`npm run test:list` hiển thị 14 test `PW-xxx` và smoke test riêng. Full run
đã xác nhận toàn bộ 14 Pairwise case có assertion nghiệp vụ, không dùng smoke
test để bù một case Pairwise.

## 5. Reset dữ liệu và tính độc lập

Trước mỗi case nghiệp vụ, cần đưa fixture về trạng thái đã chốt: xóa cart của
customer test, gỡ coupon, khôi phục stock, kiểm tra currency/tax/shipping và
ghi order count ban đầu nếu case có thể tạo order. Đây là quy tắc reset tại
[`T04`](cart-checkout-scenarios.md) và đã được `reset-fixture.ps1` thực thi,
kiểm chứng trong full run 14 case.

Runner dùng một worker và không retry để tránh các case dùng chung cart/stock
chạy song song hoặc tạo side effect khó giải thích. Full run đã xác nhận reset
ổn định theo thứ tự; chỉ đánh giá chạy song song sau khi có yêu cầu riêng.

Không dùng `docker compose down` làm thao tác reset: SQL Server hiện chưa
mount named volume vào container, nên xóa container có thể làm mất fixture.

**Hợp đồng reset cho các test `PW-xxx`:** trước mỗi test, helper
`resetFixture(row)` đưa dữ liệu dùng chung về baseline T02/T04: dùng browser
context mới cho mỗi test (guest dùng session riêng), xóa cart/coupon và lựa
chọn checkout tạm của customer test, khôi phục tồn kho sản phẩm thường và từng tổ hợp biến
thể, rồi ghi số order và giá trị fixture trước khi chạy. Không xóa order cũ;
đối chiếu order mới bằng chênh lệch số lượng và ID. Sau reset, test mới chuẩn
bị quantity, stock và các precondition riêng theo row. Nếu reset hoặc kiểm tra
precondition thất bại, dừng case và ghi nguyên nhân `Blocked` do môi
trường/dữ liệu trong kết quả tổng hợp/Jira, không đánh giá assertion nghiệp vụ.
Giữ `workers: 1` cho tới khi reset được kiểm chứng là độc lập giữa các case.

## 6. Log, screenshot và report

Playwright in kết quả theo từng test trên console. Sau mỗi lần chạy:

| Đầu ra                                   | Vị trí                               |
| ------------------------------------------ | -------------------------------------- |
| Kết quả máy đọc được và lỗi test | `qa/automation/reports/results.json` |
| Báo cáo JUnit                            | `qa/automation/reports/junit.xml`    |
| Báo cáo HTML                             | `qa/automation/reports/html/`        |
| Screenshot và trace khi test lỗi         | `qa/automation/artifacts/`           |

Các thư mục output bị loại khỏi Git. Không ghi password, token, cookie hoặc
dữ liệu khách hàng thật vào log, ảnh và report.

## 7. Phân loại lỗi

Nếu Docker, database, storefront, plugin hoặc fixture chưa sẵn sàng, ghi lỗi
**môi trường/dữ liệu (Blocked)** kèm lệnh, cấu hình và bằng chứng. Nếu
precondition đã đạt nhưng assertion nghiệp vụ sai, ghi **ứng viên lỗi sản
phẩm** và tái hiện cùng input, expected/actual, screenshot/trace. Không coi
mọi dòng `failed` trong Playwright là defect của nopCommerce.

## 8. Checklist công việc T08

Đánh dấu `[x]` cho phần đã được tạo, chạy thử hoặc quyết định thiết kế đã ghi
rõ. Các mục `[ ]` cần người phụ trách hoàn thành và ghi bằng chứng trên Jira/PR trước khi đóng
task cha. `HARNESS-001` là test kiểm tra môi trường, không được tính vào 14
case Pairwise.

### Khoa - Skeleton harness và lệnh chạy

- [X] Chọn Playwright Test + TypeScript, tạo `package.json`, lockfile và cấu
  hình runner tại `qa/automation/`.
- [X] Tạo cấu trúc `tests/`, `test-data/`, `scripts/`; cấu hình nơi sinh
  `artifacts/` và `reports/`.
- [X] Viết `start-local.ps1` để khởi động container hiện có và chờ storefront
  sẵn sàng. Đã chạy thử, storefront trả HTTP 200.
- [X] Có lệnh liệt kê test, chạy một ID và chạy toàn bộ test hiện có. Đã chạy
  `HARNESS-001` riêng và chạy `test:all`, kết quả 1/1 Pass.
- [X] Cấu hình JSON, JUnit, HTML report cùng screenshot/trace khi lỗi; đã xác
  nhận ba loại report được tạo sau lượt smoke test.
- [X] Ghi cách cài và chạy tại tài liệu T08 này.
- [X] Chốt cách gọi reset fixture trước từng `PW-xxx` (quy ước: Trang gọi
  `resetFixture(row)` trong `beforeEach` theo hợp đồng ở mục 5; helper làm
  sạch cart/coupon/checkout state, khôi phục stock, ghi order baseline và
  ghi nguyên nhân `Blocked` trong kết quả tổng hợp/Jira nếu reset thất bại;
  phần triển khai và
  kiểm chứng reset vẫn thuộc các mục chưa hoàn thành bên dưới).
- [X] Đưa link PR, lệnh chạy và evidence smoke test lên subtask Jira của Khoa.

### Trang - Đọc test data và assertion

- [X] Đọc trực tiếp `qa/pairwise/test-data/generated-cases.csv` và
  `scenario-mapping.csv`; không sao chép hoặc sửa dữ liệu đã sinh.
- [X] Kiểm tra đủ 14 `CaseId` duy nhất, đúng 10 factor và mapping 1-1; báo
  lỗi rõ nếu dữ liệu thiếu hoặc sai.
- [X] Tạo đúng một test có tiêu đề bắt đầu bằng `PW-xxx` cho mỗi row; kiểm tra
  `test:list` hiển thị đủ `PW-001` đến `PW-014`.
- [X] Viết bước thao tác và assertion theo factor, expected path và scenario
  tương ứng; không đánh Pass chỉ vì đã đọc được row hoặc mở được storefront.
- [X] Nối bước reset/precondition đã thống nhất trước mỗi case, chạy PW-001
  theo ID và toàn bộ 14 case; full run cuối có PW-001–PW-014 đều Pass.
- [X] Gửi PR/evidence và các case còn Blocked hoặc chưa thực hiện cho reviewer.

### Linh - Log, report và khả năng chạy lại

- [X] Cài dependency bằng `npm ci`, cài Chromium, khởi động nopCommerce theo
  tài liệu này trên môi trường của Linh. Đã thực hiện ngày 2026-10-10; storefront
  cuối cùng trả HTTP 200.
- [ ] Chạy lại một test theo ID và toàn bộ suite trên môi trường của Linh;
  kết quả hiện hành của harness là 15/15 Pass, nhưng Linh cần rerun và bàn giao
  evidence của máy thứ hai trước khi đánh dấu hoàn tất.
- [ ] Kiểm tra lại console, `reports/results.json`, `reports/junit.xml` và
  `reports/html/` trên môi trường của Linh; full run hiện hành cần được đối
  chiếu là `15 passed, 0 failed, 0 skipped`.
- [X] Thử một ca lỗi có kiểm soát để xác nhận screenshot/trace được lưu trong
  `artifacts/` và mở được từ report. Đã xác nhận bằng controlled failure và
  evidence tại `image/evidence/linh-01..03`.
- [X] Kiểm tra việc reset cho phép chạy lại cùng case; phân biệt lỗi môi
  trường/fixture với assertion sản phẩm theo mục 7. Đã chạy thử `PW-003` và một
  spec rerun tạm gọi `resetFixture` theo luồng kiểm chứng. Vòng đầu bị
  `Blocked`: slug fixture mặc định sai, nhãn thuộc tính thực tế là `red/blue`
  thay vì `Red/Blue`, và add-to-cart không tạo cart line; đây không phải lỗi sản phẩm.
- [X] Ghi kết quả chạy lại, log/report và vấn đề phát hiện trong
  `docs/linh-log-report-rerun-plan.md` cùng evidence tại `image/evidence/`.
  Việc đăng lại lên Jira/PR vẫn là bước bàn giao thủ công chưa thực hiện.

### Điều kiện đóng task T08

- [X] Có lệnh chạy test, lệnh chạy theo ID và report ở mức skeleton.
- [X] Chạy được một case **Pairwise** theo ID với assertion nghiệp vụ (PW-001 Pass).
- [X] Chạy được toàn bộ 14 case Pairwise với reset dữ liệu đáng tin cậy (14/14 Pass).
- [ ] Trang và Linh chạy thử thành công, có evidence trên Jira/PR.
