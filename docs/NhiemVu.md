Mục tiêu

Rà soát độc lập bằng chứng và trạng thái của 11 rủi ro Checkout/luồng bổ sung đã được chấm trong SCRUM-83, để Khoa có căn cứ duyệt SCRUM-81. Đây là bước kiểm tra nghiệm thu, không chấm lại 15 dòng Cart của Trang.

Phạm vi

CHK-01, CHK-02, ADDR-01, ADDR-02, SHP-01, SHP-02, PAY-LOCAL-01, PAY-FAIL-01, INV-01, CART-MERGE-01, CHK-RACE-01.

Công việc

Mở từng link scenario, test, report, ảnh/SQL; ghi commit, ngày chạy, fixture và chế độ checkout của bằng chứng.

Đối chiếu trạng thái từng dòng với expected: CHK-01 còn finding currency; SHP-01 Partial; PAY-FAIL-01 Blocked do thiếu fake payment processor. CHK-02 có các ca guest Pairwise chạy sau review cũ; INV-01 có lượt kiểm thử bổ sung trước đó — ghi đúng nguồn, không gán cho review cũ.

Với SHP-02, CART-MERGE-01 và CHK-RACE-01, phân biệt Not Run trong Sprint 2 với Blocked thật. Hai lỗi lịch sử không được tính là Pass của full case mới. Nếu blocker tồn tại, ghi điều kiện cụ thể và cách gỡ.

Lập danh sách các dòng High còn thiếu execution evidence, owner và ngày dự kiến xử lý; đối chiếu tổng trạng thái với mẫu số 26, giữ riêng 253/253 pair coverage.

Bàn giao bảng thay đổi và link bằng chứng cho Khoa để review/ký SCRUM-81.

Tiêu chí nghiệm thu

Checklist đủ 11/11 ID với I/L, score, mức, lý do, ưu tiên, trạng thái và link bằng chứng truy cập được.

Pass/Fail được gắn đúng run; Partial/Not Run/Blocked dùng đúng định nghĩa và không suy diễn từ pair coverage.

Các dòng High chưa đủ evidence có owner và kế hoạch thực thi hoặc quyết định accepted risk được ghi rõ.

Có nhận xét bàn giao cho Khoa trên SCRUM-81; cập nhật 11 dòng tương ứng trong risk register khi đã xác minh.

Liên kết

Issue cha: SCRUM-80. Phần chấm trước: SCRUM-83. Người duyệt: SCRUM-81.  
Risk register: https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce/blob/docs/SCRUM-81-risk-review-khoa/docs/test-design/SCRUM-80-risk-register.md

Thời gian dự kiến

31/10–01/11/2026 (hai ngày trong Sprint 2).