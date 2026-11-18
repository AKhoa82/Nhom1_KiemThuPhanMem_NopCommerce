# Run manifest — INV-01

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Pass với cache reset**.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Giỏ 5 món, stock trong SQL giảm từ 10 xuống 4 trước Confirm. Web được restart để xóa cache; truy vấn xác nhận stock 4. Confirm bị chặn, không tạo đơn, giỏ còn.
- Giới hạn: Thay đổi stock trực tiếp bằng SQL bypass cache. Kết quả này không đại diện cho mọi cách cập nhật tồn kho qua Admin.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
