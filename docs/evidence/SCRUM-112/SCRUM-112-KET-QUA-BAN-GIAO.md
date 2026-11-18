# SCRUM-112 — Bàn giao đối chiếu bằng chứng cho SCRUM-81

Linh đã rà soát 11 rủi ro Checkout/luồng bổ sung và phân biệt đúng các bằng chứng lịch sử, các ca chưa chạy và blocker. Bảng [11 dòng](11-risk-status-tracker.md) là bản đối chiếu hiện hành. Khoa đã chạy bổ sung ngày 18/11/2026; kết quả mới được ghi riêng tại [RUN-20261118-N01.md](RUN-20261118-N01.md), không gán cho lượt rà soát cũ của Linh.

## Kết luận hiện hành

- **26 scenario** trong [risk register](../../test-design/SCRUM-80-risk-register.md): 20 Pass, 2 Pass có điều kiện, 1 Pass trong PW test, 1 Partial, 1 Fail, 1 Blocked.
- Lượt Playwright mới có **6 Pass, 1 Fail, 1 skipped** trên 8 test. SHP-02 gồm ba dataset.
- SHP-01 và SHP-02 đã Pass ở lượt mới. INV-01 Pass khi stock giảm trực tiếp trong SQL rồi restart web để xóa cache. CART-MERGE-01 Pass nhánh gộp hợp lệ nhưng nhánh vượt kho còn mở. CHK-RACE-01 Fail do một response lộ lỗi SQL; chỉ một đơn được tạo. PAY-FAIL-01 Blocked vì plugin QA chưa active.
- 253/253 là coverage của **cặp giá trị trong model Pairwise**, không phải risk coverage 26 scenario.
- Bảng này không tuyên bố 26/26 scenario Pass. Hai lỗi lịch sử nopCommerce #7467 và #7203 được theo dõi ở CHK-02 và ADDR-02, không được tính thành hai scenario mới.

## Hạng mục chưa thể đóng

1. **PAY-FAIL-01 — Khoa, High:** triển khai và kích hoạt Payments.QaDecline rồi chạy decline/retry; nếu không làm được, cần quyết định Accepted risk có người phê duyệt, lý do và ngày. Hiện vẫn Blocked.
2. **CART-MERGE-01 — Trang + Khoa, High:** chạy thêm tình huống vượt tồn kho và đối chiếu lỗi mất giỏ đã tái hiện trước đây. Không dùng kết quả nhánh hợp lệ thay cho nhánh âm tính.
3. **CHK-RACE-01 — Khoa, High:** ghi defect và theo dõi sửa/retest lỗi hiển thị nguyên thông báo SQL. Fail đã được chứng minh, nên đây là việc xử lý defect, không phải ca chưa chạy.
4. **CHK-01 — Khoa, High:** quyết định xử lý finding D-01 về format tiền tệ hoặc ghi accepted risk sau review; chưa tự giả định đã chấp nhận.
5. **Review nhóm:** Trang và Linh xác nhận bản tích hợp sau lượt chạy mới; Khoa ký duyệt SCRUM-81/SCRUM-80 theo tiêu chí Jira. Trạng thái Done của SCRUM-112 chỉ xác nhận bước rà soát của Linh, không tự đóng issue cha.

Bản báo cáo này có thể dùng làm nội dung bàn giao trên SCRUM-81. Các manifest cũ có ngày và snapshot dự kiến được giữ như hồ sơ lịch sử; kết quả ngày 18/11 ở file run mới là nguồn ưu tiên cho năm scenario đã chạy lại.
