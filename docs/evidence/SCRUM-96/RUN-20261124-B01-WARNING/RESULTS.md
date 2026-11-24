# SCRUM-96 B01 — kiểm tra lại cảnh báo tiếng Việt, 24/11/2026

- Mã nguồn gốc: `9d57731321fe5d60ed4a42f9837189c0e45ac879`; bản sửa hiện **chưa commit**.
- `MERGE-OVER`: lượt `AUTO-20261124090315850` **Pass 1/1**. Cảnh báo thực tế: “Chưa đăng nhập: có món chưa gộp được. Món vẫn ở giỏ khách. Hãy kiểm tra và thử lại. Số lượng vượt tồn kho (tối đa 5 món).” Xem [nội dung cảnh báo](login-feedback.txt), [ảnh desktop](after-login.png), [ảnh mobile 390 px](after-login-mobile.png), [JUnit](junit.xml) và [run manifest](run-manifest.json).
- Ở mobile, kiểm tra tự động xác nhận vùng cảnh báo không tràn ngang; ảnh cho thấy chữ xuống dòng và nút đóng không đè lên chữ. Ở desktop, cảnh báo hiển thị thành một dòng. Test cũng xác nhận không còn bản dịch sai “cổ phiếu trên tay”.
- `MERGE-MULTISTORE`: lượt `AUTO-20261124090527151` **Pass 1/1**. Xem [cảnh báo](../RUN-20261124-B01-WARNING-MULTISTORE/multistore-login-feedback.txt), [ảnh tại store 2](../RUN-20261124-B01-WARNING-MULTISTORE/multistore-store2-rejected-login.png), [JUnit](../RUN-20261124-B01-WARNING-MULTISTORE/junit.xml) và [run manifest](../RUN-20261124-B01-WARNING-MULTISTORE/run-manifest.json). Store 2 tạm (ID 2) đã được dọn sau khi lưu bằng chứng.
- `ShoppingCartMigrationTests` **Pass 6/6**; `dotnet build Nop.Services` **Pass** với 0 lỗi và 1 cảnh báo CS0108 có sẵn; `npx tsc --noEmit`, phân tích XML resource và `git diff --check` đều **Pass**.

Bản sửa này xử lý phát hiện số 4 trong [review B01](../REVIEW-20261124.md). Cảnh báo ở store 2 vẫn chưa chỉ ra món nằm ở store 1 hoặc cách tới giỏ đó; các phát hiện số 1–3 còn mở. Lượt 8/8 trong [báo cáo gốc](../RUN-20261124-B01/RESULTS.md) được chạy trước thay đổi ngôn ngữ này.
