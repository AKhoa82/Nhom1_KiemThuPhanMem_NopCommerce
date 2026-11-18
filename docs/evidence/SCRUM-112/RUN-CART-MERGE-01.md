# Run manifest — CART-MERGE-01

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Fail** toàn scenario.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Nhánh hợp lệ Pass: simple của guest và account gộp thành quantity 2; Red/S và Blue/M giữ hai dòng riêng. Nhánh vượt kho Fail: stock 5, account 4, guest 2; tổng số lượng trước đăng nhập 6, sau đăng nhập còn 4.
- Giới hạn: Cần thống nhất quy tắc xử lý khi không gộp được, sửa lỗi và retest. Không dùng nhánh hợp lệ để che kết quả Fail của nhánh vượt kho.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
