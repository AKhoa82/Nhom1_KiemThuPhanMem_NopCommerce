# SCRUM-112 — Bàn giao đối chiếu bằng chứng cho SCRUM-81

Linh đã rà soát 11 rủi ro Checkout/luồng bổ sung và phân biệt đúng các bằng chứng lịch sử, các ca chưa chạy và blocker. Bảng [11 dòng](11-risk-status-tracker.md) là bản đối chiếu hiện hành. Khoa đã chạy bổ sung ngày 18/11/2026; kết quả mới được ghi riêng tại [RUN-20261118-N01.md](RUN-20261118-N01.md), không gán cho lượt rà soát cũ của Linh.

## Kết luận hiện hành

- **26 scenario** trong [risk register](../../test-design/SCRUM-80-risk-register.md): 21 Pass, 2 Pass có điều kiện, 1 Pass trong PW test, 2 Fail, không còn Partial/Blocked/Not Run.
- Lượt Playwright cuối có **7 Pass, 2 Fail, 0 skipped** trên 9 test. SHP-02 gồm ba dataset; CART-MERGE-01 gồm nhánh hợp lệ và vượt kho.
- SHP-01, SHP-02 và PAY-FAIL-01 đã Pass ở lượt mới. INV-01 Pass khi stock giảm trực tiếp trong SQL rồi restart web để xóa cache. CART-MERGE-01 Fail ở nhánh vượt kho (6 → 4 món); CHK-RACE-01 Fail do một response lộ lỗi SQL, dù chỉ một đơn được tạo.
- 253/253 là coverage của **cặp giá trị trong model Pairwise**, không phải risk coverage 26 scenario.
- Bảng này không tuyên bố 26/26 scenario Pass. Hai lỗi lịch sử nopCommerce #7467 và #7203 được theo dõi ở CHK-02 và ADDR-02, không được tính thành hai scenario mới.

## Hạng mục chưa thể đóng

1. **CART-MERGE-01 — Trang + Khoa, High:** theo dõi defect mất hai món guest khi gộp vượt kho, thống nhất expected, sửa và retest. Fail đã có bằng chứng.
2. **CHK-RACE-01 — Khoa, High:** theo dõi defect lộ lỗi SQL, sửa và retest. Fail đã có bằng chứng.
3. **CHK-01 — Khoa, High:** xử lý finding D-01 về format tiền tệ hoặc ghi quyết định accepted risk sau review; đây là finding riêng, không phải ca chưa chạy.
4. **Review nhóm:** Trang và Linh đã hoàn thành các phần chấm/rà soát của mình trong SCRUM-82, SCRUM-83 và SCRUM-112; bản tích hợp đã được đối chiếu trong [kết luận SCRUM-81](../../test-design/SCRUM-81-risk-baseline-review-khoa.md#8-kết-luận-nghiệm-thu-bản-tích-hợp-18112026). Vòng đời sửa lỗi thuộc các task defect tiếp theo.

Bản báo cáo này là nội dung bàn giao trên SCRUM-81. Kết quả ngày 18/11 trong file run mới là nguồn ưu tiên cho các scenario đã chạy lại.
