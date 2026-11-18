# Run manifest — CART-MERGE-01

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Partial**.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Nhánh hợp lệ Pass: simple của guest và account gộp thành quantity 2; Red/S và Blue/M giữ hai dòng riêng, tổng 3 dòng trong SQL.
- Giới hạn: Nhánh vượt tồn kho từng tái hiện lỗi mất giỏ chưa được test hiện tại chạy lại; scenario chưa đủ để Pass toàn bộ.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
