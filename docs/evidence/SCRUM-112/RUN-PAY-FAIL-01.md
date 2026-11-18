# Run manifest — PAY-FAIL-01

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Blocked / skipped**.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Test phát hiện Payments.QaDecline chưa active trên store local và skip với lý do FIXTURE_BLOCKED. Mã plugin có trong repo, chưa có bằng chứng plugin triển khai/hoạt động trong container.
- Giới hạn: Cần kích hoạt plugin QA local và chạy decline/retry, hoặc có quyết định Accepted risk với owner và lý do. Chưa có evidence Pass/Fail.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
