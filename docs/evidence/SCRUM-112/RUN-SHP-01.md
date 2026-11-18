# Run manifest — SHP-01

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Pass**.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Chọn Ground, đi tới bước sau rồi quay lại; Ground vẫn được chọn. Test dùng locator Ground riêng vì môi trường có nhiều shipping options.
- Giới hạn: Không khẳng định phương thức đã lưu ở đơn hàng vì ca dừng trước Confirm.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
