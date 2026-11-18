# Run manifest — CHK-RACE-01

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Fail**.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Hai POST Confirm phát gần đồng thời; SQL ghi đúng một đơn mới và stock trừ một lần. Một response HTTP 200 chứa lỗi SQL AK_Order_OrderGuid.
- Giới hạn: Đây là lỗi lộ thông báo SQL, không phải tạo trùng đơn. Không lưu raw response chứa thông tin nội bộ trong Git.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
