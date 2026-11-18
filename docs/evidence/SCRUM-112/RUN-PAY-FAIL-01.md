# Run manifest — PAY-FAIL-01

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Pass** trong lượt cuối 18/11/2026.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Đã build, cài và bật Payments.QaDecline trong store QA local. Confirm bị từ chối với thông báo `QA decline`, không tạo đơn, giỏ còn. Retry cũng bị từ chối và không tạo đơn. Test Pass trong bộ 9 test.
- Giới hạn: Plugin chỉ dùng trong môi trường local; cần bật lại nếu đã hoàn nguyên cấu hình sau demo.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
