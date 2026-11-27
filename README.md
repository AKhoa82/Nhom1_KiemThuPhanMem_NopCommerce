# Nhóm 1 — Kiểm thử nopCommerce bằng Pairwise

Tài liệu này giúp thành viên mới dựng lại môi trường, sinh dữ liệu và chạy test cho báo cáo cuối kỳ. Nhóm kiểm thử storefront nopCommerce 5.00: Shopping Cart, Checkout/Payment, gộp giỏ sau đăng nhập, thêm lại sản phẩm và xác nhận đơn ở hai tab. Kỹ thuật chính là **Pairwise K06**; ca biên, dữ liệu không hợp lệ, chuyển trạng thái và đồng thời được thực hiện riêng cho các rủi ro ngoài mô hình theo cặp.

## 1. Phiên bản, phạm vi và tài liệu có thể mở trực tiếp

- [Repository GitHub](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce). Mốc mã ứng dụng và bộ test đã chạy trong T12 là commit `10d1757d28ca4bbf3ddd2b6667559b1c7a8f308f` trên `develop` (merge PR #28). Khi chạy lại, ghi SHA thực tế bằng `git rev-parse HEAD`; không tự gán kết quả T12 cho commit khác.
- Môi trường: [.NET SDK 10](global.json), SQL Server 2019 Express, Docker Compose, Node.js 22, Playwright/Chromium theo [package-lock.json](qa/automation/package-lock.json), Microsoft PICT 3.7.4.
- [Model Pairwise gốc](qa/pairwise/model.pict) → [14 ca PW](qa/pairwise/test-data/generated-cases.csv) → [bảng liên kết kịch bản](qa/pairwise/test-data/scenario-mapping.csv). [Model N02 độc lập](qa/pairwise/n02-cart/model.pict) → [8 dòng N02-PW](qa/pairwise/n02-cart/generated-cases.csv). Dòng PICT là đầu vào test, không phải kết quả Pass.
- [Báo cáo T12 và metrics](docs/evidence/SCRUM-60/T12-RESULTS.md): model gốc bao phủ **253/253 cặp khả thi**, N02 bao phủ **30/30 cặp**; hai mẫu số không cộng với nhau. CI sạch đã chạy 14/14 PW và 11/11 ADV Cart Pass. Điều kiện và giới hạn nằm trong báo cáo.
- [Kịch bản Cart/Checkout](docs/test-design/cart-checkout-scenarios.md), [risk register 26 kịch bản](docs/test-design/SCRUM-80-risk-register.md), [phân tích defect/RCA](docs/evidence/SCRUM-64/DEFECT-ANALYSIS-PAIRWISE.md), [kiến trúc](docs/architecture.md), [hướng dẫn automation chi tiết](qa/automation/README.md), [quy trình làm việc nhóm](docs/TEAM_WORKFLOW.md).

| Vị trí | Nội dung |
| --- | --- |
| [`src/`](src/) | Ứng dụng nopCommerce và unit test .NET |
| [`qa/pairwise/`](qa/pairwise/) | Model PICT, dữ liệu sinh, kiểm tra constraint và coverage |
| [`qa/automation/`](qa/automation/) | Playwright, fixture, test và report |
| [`qa/ci/`](qa/ci/) và [workflow](.github/workflows/dotnet.yml) | Môi trường dùng một lần và CI |
| [`docs/test-design/`](docs/test-design/) và [`docs/evidence/`](docs/evidence/) | Thiết kế, kết quả và minh chứng |

Theo phân công nhóm: **Khoa** chốt phạm vi, môi trường và nghiệm thu; **Trang** phụ trách Cart và review test data; **Linh** phụ trách Checkout, model/coverage và phân tích kết quả. Công việc thực tế của từng issue nằm trên Jira; riêng T14, Khoa thực hiện cả ba subtask theo phân công cập nhật ngày 28/11/2026.

## 2. Chọn môi trường và chuẩn bị máy

Máy Windows 10/11 cần Git, Docker Desktop đang chạy Linux containers, PowerShell 7 (`pwsh`), Node.js 22 và đủ RAM/đĩa cho SQL Server cùng Docker build. Chỉ cần .NET SDK 10 khi build/chạy ứng dụng trực tiếp; Dockerfile đã có SDK/runtime.

- **Máy mới, chưa có container `nopcommerce` hoặc `nopcommerce_mssql_server`:** dùng mục 3. Script bootstrap tạo database, sản phẩm, biến thể, coupon, tài khoản QA và store thứ hai. Chỉ dùng dữ liệu giả.
- **Máy đã cài store và cần giữ dữ liệu:** dùng mục 4. Không chạy bootstrap hay lệnh xóa volume trên store đó. [Compose ở thư mục gốc](docker-compose.yml) chưa gắn volume vào thư mục SQL; tạo lại container có thể làm mất dữ liệu.

Không đưa mật khẩu vào Git, README, ảnh hoặc lệnh được chụp cho báo cáo. [`.env.example`](qa/automation/.env.example) chỉ mô tả biến; Playwright đọc **biến môi trường của tiến trình**, không tự nạp `.env`.

## 3. Dựng từ đầu trên máy sạch

Chạy trong **PowerShell 7**. Dùng `develop` hiện tại để có README và script mới nhất, ghi SHA in ra vào report. Nếu cần đối chiếu đúng lượt T12, mốc của lượt đó là `10d1757d28ca4bbf3ddd2b6667559b1c7a8f308f`; checkout mốc ấy sẽ đưa cả README về phiên bản trước T14. Hai container phải chưa tồn tại vì Compose QA dùng đúng tên container của store local.

```powershell
git clone https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce.git
cd Nhom1_KiemThuPhanMem_NopCommerce
git switch develop
git pull --ff-only
git rev-parse HEAD
node --version
docker compose version
```

Nhập bốn mật khẩu chỉ trong phiên terminal hiện tại; hàm này không hiện ký tự gõ. Dùng mật khẩu mạnh, riêng cho QA.

```powershell
function Set-TestSecret([string]$Name) {
    $secret = Read-Host $Name -AsSecureString
    [Environment]::SetEnvironmentVariable($Name, [System.Net.NetworkCredential]::new('', $secret).Password, 'Process')
}
Set-TestSecret QA_SQL_PASSWORD
Set-TestSecret QA_ADMIN_PASSWORD
Set-TestSecret QA_PW_REGISTERED_PASSWORD
Set-TestSecret QA_REGISTERED_PASSWORD

$env:QA_ADMIN_EMAIL = 'admin.qa@example.test'
$env:QA_PW_REGISTERED_EMAIL = 'qa.pairwise.t14@example.test'
$env:QA_REGISTERED_EMAIL = 'qa.n02.t14@example.test'
$env:QA_BILLING_EMAIL = 'qa.guest.t14@example.test'
$env:QA_DB_CONTAINER = 'nopcommerce_mssql_server'
$env:QA_STORE_CONTAINER = 'nopcommerce'
$env:QA_DB_NAME = 'nopcommerce'
$env:NOP_BASE_URL = 'http://localhost/'
$env:QA_CONFIGURABLE_PRODUCT_PATH = '/pw-shirt-variants'
$env:QA_FIXTURE_VERSION = 'S2-ADV-CART-AUTO-v1'
$env:QA_CHECKOUT_MODE = 'MultiStep'
```

Hai tài khoản khách phải khác nhau và đúng mẫu `qa.pairwise.*@example.test`, `qa.n02.*@example.test`; script bootstrap từ chối tên khác. Giữ nguyên terminal này để các lệnh tiếp theo nhận biến môi trường.

```powershell
docker compose -f qa/ci/compose.yml up -d --build
docker compose -f qa/ci/compose.yml ps
cd qa/automation
npm ci
npx playwright install chromium
node scripts/ci-bootstrap.cjs
```

`ci-bootstrap.cjs` chỉ dành cho **database mới, rỗng**: nó mở `/install`, tạo database nopCommerce, seed `PW-SIMPLE-001`, `PW-SHIRT`, `PW-OOS-001`, coupon và tài khoản, đặt checkout nhiều bước rồi kiểm tra fixture. Chỉ tiếp tục khi thấy `CI_BOOTSTRAP|PASS`. Có thể kiểm tra storefront tại <http://localhost/>. Không chạy bootstrap trên store đã có dữ liệu.

Sau khi lưu bằng chứng, chỉ dọn **môi trường dùng một lần** đã tạo bằng `qa/ci/compose.yml`:

```powershell
cd ../..
docker compose -f qa/ci/compose.yml down --volumes --remove-orphans
```

Lệnh `down --volumes` xóa database QA của môi trường này. Đừng dùng nó với store local ở mục 4.

## 4. Dùng store local đã cài

Trong thư mục gốc, chạy `docker compose start` và `docker compose ps`. Chờ SQL sẵn sàng, rồi kiểm tra <http://localhost/cart> không chuyển về `/install`. Nếu web dừng sau cài đặt, chạy `docker start nopcommerce` trên **container hiện có**. Nếu store cũ quay về `/install`, khôi phục cấu hình `App_Data/appsettings.json` và database cũ; không cài đè. [Hướng dẫn seed thủ công](setup.md) mô tả sản phẩm, tồn kho và coupon; [manifest fixture](qa/automation/test-data/cart-fixture-manifest.json) là dữ liệu chuẩn mà bộ test kiểm tra.

Từ `qa/automation`, chạy `npm ci` và `npx playwright install chromium`, rồi đặt `QA_SQL_PASSWORD`, `QA_REGISTERED_EMAIL`, `QA_REGISTERED_PASSWORD`, `QA_BILLING_EMAIL`, `NOP_BASE_URL` trong terminal. Dùng tài khoản PW và N02 riêng qua `QA_PW_REGISTERED_EMAIL/PASSWORD` và `QA_REGISTERED_EMAIL/PASSWORD`; N02 cần email `qa.n02.*@example.test`. Script reset chỉ sửa fixture QA được chỉ định; nếu giỏ/coupon ngoài phạm vi, nó dừng với `FIXTURE_BLOCKED` thay vì xóa dữ liệu lạ.

Tạm dừng/bật lại store local bằng `docker compose stop` và `docker compose start`. Không dùng `docker compose down` để reset dữ liệu. N02 cần store QA thứ hai; xem [setup/cleanup N02](qa/automation/README.md#local-setup) và điều kiện chặn trong tài liệu đó.

## 5. Cài PICT, sinh và kiểm tra dữ liệu

Chạy từ thư mục gốc trên Windows. [Script cài PICT](qa/pairwise/install-pict.ps1) pin phiên bản 3.7.4, kiểm tra SHA-256 rồi lưu executable vào `qa/pairwise/tools/` (không commit). Seed của bộ sinh được cố định; nếu model, value hoặc constraint đổi, phải sinh lại dữ liệu và tính lại coverage.

```powershell
pwsh -NoProfile -File qa/pairwise/install-pict.ps1
pwsh -NoProfile -File qa/pairwise/generate.ps1
pwsh -NoProfile -File qa/pairwise/validate.ps1
pwsh -NoProfile -File qa/pairwise/validate-invalid-combinations.ps1
node qa/pairwise/n02-cart/generate.mjs
```

Đọc [summary model gốc](qa/pairwise/test-data/summary.md) và [coverage N02](qa/pairwise/n02-cart/coverage-report.md). Mốc hiện tại: **14 PW / 253 cặp khả thi** và **8 N02-PW / 30 cặp khả thi**. PICT không tạo assertion hoặc chạy website. Không sửa CSV sinh bằng tay.

## 6. Chạy test và xem report

Các lệnh sau chạy từ `qa/automation` sau khi bootstrap hoặc xác nhận fixture local. Nếu bạn đã ở thư mục đó sau mục 3, bỏ lệnh `cd` đầu tiên. Runner dùng Chromium, một worker, không retry. **Không chạy hai bộ dùng chung tồn kho/giỏ cùng lúc.** Reset fixture được gọi trước các ca phù hợp; Checkout có thể tạo đơn trong database QA.

```powershell
cd qa/automation
npm run test:list
npm run test:case -- 'PW-001\b'       # một ca gốc theo ID
npm run test:pw                     # 14 ca Pairwise gốc
npm run test:adv-cart               # 11 ca Cart nâng cao
npm run test:cart-risk              # CART-01..14 và CART-REPEAT-01
npx playwright test tests/checkout-risk.spec.ts
npm run test:all                    # mọi spec, gồm các ca cần fixture riêng
npm run report                      # mở HTML của lượt cuối
```

Để lưu riêng từng lượt, đặt `$env:QA_REPORT_DIR='reports/<ten-luot>'` và `$env:QA_ARTIFACT_DIR='artifacts/<ten-luot>'` **trước** lệnh chạy. Mỗi report dir có `results.json`, `junit.xml`, `html/`, `run-manifest.json` và summary tương ứng; `artifacts/` chứa ảnh/trace khi test lỗi. `npm run test:all` có thể ghi **Skipped/Blocked** cho `PAY-FAIL-01` nếu chưa bật `Payments.QaDecline`, hoặc cho N03 nếu chưa có tài khoản/giỏ riêng. Đọc lý do trong JSON/HTML, không tính Skipped thành Pass. `test:pw` và `test:adv-cart` là hai suite ổn định được CI bắt buộc chạy đủ.

Để lặp `CHK-RACE-01`, cần tài khoản `qa.n03.*@example.test` có địa chỉ, giỏ `PW-SHIRT` Red/S số lượng 4 và tồn kho 5. Xem [hướng dẫn N03](qa/automation/README.md#scrum-91-n03-fixture-sql-and-repeated-runs) cho script reset/chụp SQL/tính tần suất. Một lượt không tái hiện lỗi không chứng minh lỗi đã hết ở mọi điều kiện.

## 7. CI, giới hạn và lỗi thường gặp

[Workflow `.NET and N04 QA`](.github/workflows/dotnet.yml) chạy khi mở PR vào `develop` và push lên `develop`: build/unit test .NET, kiểm tra model PICT và chạy 14 PW + 11 ADV Cart trên Chromium với store/database dùng một lần. Mở tab **Actions** của commit/PR để xem job; tải `n04-model-*` và `n04-e2e-*` artifact trong bảy ngày. [Báo cáo T12](docs/evidence/SCRUM-60/T12-RESULTS.md) giữ metrics đã lọc trong Git. CI không chạy mọi ca Cart risk, Checkout risk, payment decline hoặc race; các kết quả đó phải xem report riêng.

| Hiện tượng | Kiểm tra/cách xử lý |
| --- | --- |
| Docker không khởi động | Mở Docker Desktop ở Linux containers, chạy `docker info` và `docker compose ps -a`. |
| `/install` không kết nối SQL | Chờ database healthy/SQL ready, dùng server `nopcommerce_database` trong container, không dùng `localhost` từ web. |
| Store cũ trở về `/install` | Dừng cài đặt; khôi phục cấu hình web và database cũ, không tạo database mới trên dữ liệu cần giữ. |
| Cổng 80 bị chiếm | Đổi host mapping sang `8080:80`, đặt `NOP_BASE_URL=http://localhost:8080/`. |
| PICT không tìm thấy hoặc hash sai | Chạy lại `install-pict.ps1`; không dùng binary khác hash đã pin. |
| Test `FIXTURE_BLOCKED`/Skip | Kiểm tra email QA, tồn kho, coupon, plugin, checkout mode và store thứ hai theo manifest. |
| `SQL Server rejected QA_SQL_PASSWORD` dù biến trùng cấu hình container | Database cũ có thể đã đổi mật khẩu `sa` sau khi container được tạo. Dùng thông tin đăng nhập **đang có hiệu lực** của database đó hoặc dựng môi trường dùng một lần trên máy sạch; không đặt lại/xóa database cũ chỉ để test Pass. |
| Tổng tiền khác expected | Xác nhận currency USD, giá/tax/phí Ground và coupon theo manifest; không sửa expected để test Pass. |
| `npm run report` không mở | Xác nhận `QA_REPORT_DIR/html` của đúng lượt; trên CI tải artifact HTML. |

Pairwise chỉ bảo đảm **các cặp khả thi đã khai báo trong từng model**. Nó không bao phủ mọi cấu hình nopCommerce, mọi lỗi phụ thuộc ba yếu tố, chuỗi thao tác dài, race hoặc payment decline. Đọc [defect/RCA](docs/evidence/SCRUM-64/DEFECT-ANALYSIS-PAIRWISE.md) cùng [kết quả T12](docs/evidence/SCRUM-60/T12-RESULTS.md) để tránh nhầm “100% pair coverage” với “100% chức năng đúng”. Khi báo cáo, ghi commit, checkout mode, fixture, ngày chạy, Pass/Fail/Blocked/Not Run và link bằng chứng của **lượt chạy đó**.
