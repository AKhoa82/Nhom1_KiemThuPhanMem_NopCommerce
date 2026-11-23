# Run manifest — SHP-02

- Ngày thực thi: **18/11/2026**, local Docker, checkout nhiều bước.
- Trạng thái: **Pass 3/3 dataset**.
- Lệnh: từ `qa/automation`, nạp cấu hình QA local và chạy `npx playwright test tests/checkout-risk.spec.ts`.
- Mã test: [checkout-risk.spec.ts](../../../qa/automation/tests/checkout-risk.spec.ts).
- Kết quả: Giá trị rỗng, sai định dạng và option không tồn tại đều bị từ chối tại Shipping Method.
- Giới hạn: Ba dataset được tính thành một scenario rủi ro trong mẫu số 26.
- Bản tóm tắt đã loại bí mật và thống kê từ Playwright JSON report: [RUN-20261118-N01.md](RUN-20261118-N01.md). Image web là container đã tồn tại; chưa xác minh SHA build của image. Report chi tiết và artifact được Git ignore, giữ trên máy chạy.
