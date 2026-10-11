# Evidence review T08 — Pairwise automation

## Cách reviewer chạy lại

```powershell
cd qa/automation
npm ci
npx playwright install chromium
$env:NOP_BASE_URL = 'http://localhost:8080/'
$env:QA_SQL_PASSWORD = '<mat-khau-SQL-cuc-bo>'
$env:QA_BILLING_EMAIL = 'qa.guest@example.test'
$env:QA_REGISTERED_EMAIL = 'qa.pairwise.registered@example.test'
$env:QA_REGISTERED_PASSWORD = '<mat-khau-customer-fixture>'
npm run test:case -- 'PW-001'
npm run test:all
```

Kết quả chi tiết được tạo cục bộ, không commit thông tin nhạy cảm:

- `reports/pairwise-summary.md`: một dòng cho mỗi `PW-xxx`, có phân loại môi trường/sản phẩm/harness.
- `reports/html/`: Playwright HTML report.
- `reports/junit.xml` và `reports/results.json`: report cho CI.
- `artifacts/`: screenshot và trace khi failure.

## Evidence đã xác minh

| Evidence | Kết quả | Ghi chú |
| --- | --- | --- |
| `npx tsc --noEmit` | Pass | TypeScript không lỗi. |
| `npm run test:list` | Pass | Phát hiện đủ 15 test: PW-001 đến PW-014 và HARNESS-001. |
| `npm run test:case -- 'PW-001'` | Pass | Assertion nghiệp vụ: cập nhật quantity, coupon không hợp lệ độc lập và validation địa chỉ bắt buộc chặn checkout. |
| `npm run test:all` | Pass | 15/15 Passed trong 6.5 phút: PW-001–PW-014 và HARNESS-001; 0 Failed, 0 Skipped. Reset fixture chạy trước mỗi Pairwise case. |

## Danh sách case trước khi mở PR

| Nhóm case | Trạng thái hiện tại | Điều kiện để reviewer chấp nhận |
| --- | --- | --- |
| PW-001–PW-014 | Pass | Đã xác nhận trong cùng một full run; fixture và credential local hợp lệ. |
| HARNESS-001 | Pass | Storefront local trả HTTP 200. |

Không còn case Blocked hoặc chưa thực hiện trong full run cuối. `FAILED_ENVIRONMENT`/`BLOCKED_ENVIRONMENT` là vấn đề fixture, Docker, DB hoặc store; `FAILED_PRODUCT` là assertion nghiệp vụ; `FAILED_AUTOMATION` là harness/selector.

## Nội dung PR đề xuất

```text
test(T08): hoàn thiện fixture, evidence và phân loại Pairwise

- reset fixture và làm mới cache storefront trước từng case
- preflight slug/variant/shipping/payment/address
- xuất Pairwise summary phân biệt environment, product và automation
- xác nhận PW-001–PW-014 và HARNESS-001 đều pass; không còn case Blocked

Evidence: qa/automation/REVIEW_EVIDENCE.md
```
