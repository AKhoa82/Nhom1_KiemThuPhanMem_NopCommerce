# Nội dung cập nhật Jira cho N01 — risk register

Ngày soạn: 30/10/2026. Issue cha: [SCRUM-80](https://anhkhoa080205.atlassian.net/browse/SCRUM-80).

Tài liệu này là nội dung sẵn để cập nhật Jira. Việc có tệp này trong Git **không có nghĩa issue Jira đã được cập nhật hoặc subtask đã được tạo**.

## 1. Cập nhật mô tả SCRUM-81 — [Khoa] Chốt phương pháp và review baseline

**Mục tiêu:** Chốt phương pháp đánh giá rủi ro cho đúng 26 scenario thuộc Shopping Cart, Checkout và ba luồng bổ sung; duyệt phần chấm của Trang và Linh trên cùng một baseline. Pairwise K06 là kỹ thuật chọn tổ hợp chính. Ca biên, ca trình tự và ca đồng thời được đánh giá riêng.

**Công việc:**

1. Xác nhận 26 ID duy nhất: `CART-01`–`CART-14`, chín ID `CHK-01`, `CHK-02`, `ADDR-01`, `ADDR-02`, `SHP-01`, `SHP-02`, `PAY-LOCAL-01`, `PAY-FAIL-01`, `INV-01`, và `CART-MERGE-01`, `CART-REPEAT-01`, `CHK-RACE-01`. Không cộng 14 row `PW-xxx` vào mẫu số risk register.
2. Ghi rõ commit SHA ứng dụng, phiên bản bộ test, cấu hình checkout và fixture/evidence của từng lượt chạy. Đối chiếu sự khác nhau giữa multi-step và one-page checkout.
3. Chốt thang Impact và Likelihood 1–3, `Score = I × L`, mức Low 1–2, Medium 3–4, High 6–9 và ưu tiên P3/P2/P1. Review lý do từng dòng High, đặc biệt `INV-01` (vẫn High dù đã Pass), `CART-MERGE-01` và `CHK-RACE-01`.
4. Review 15 dòng Cart của Trang và 11 dòng Checkout/luồng mới của Linh: ID, I/L, score, lý do, priority, owner, trạng thái, link scenario/test/report/evidence. Phân biệt người chấm với người duyệt.
5. Tính risk coverage theo 26 scenario: số có evidence đủ để kết luận Pass/Fail, Partial, Blocked, Not Run và Accepted risk. Với mọi dòng High chưa chạy, ghi blocker thật và kế hoạch gỡ hoặc quyết định accepted risk có người chịu trách nhiệm. Không dùng `253/253` pair coverage làm risk coverage.
6. Ghi nhận các sai lệch, yêu cầu sửa và ký duyệt bản cuối sau khi Trang/Linh cập nhật. Chỉ đề xuất đóng SCRUM-80 khi các tiêu chí issue cha đã đạt.

**Tiêu chí nghiệm thu:**

- Có đúng 26 ID không trùng; 15 dòng Trang + 11 dòng Linh; công thức, mức rủi ro và ưu tiên nhất quán.
- Baseline mã nguồn, cấu hình checkout, fixture, ngày chạy và nguồn evidence được ghi đủ để tái lập; kết quả Pairwise và kết quả thực thi không bị gộp.
- Có nhận xét review cụ thể cho hai phần, các chỗ cần sửa đã được xử lý hoặc được ghi là còn mở. Khoa ký duyệt sau khi đọc bản Linh, không ký trước.
- Mỗi dòng High có trạng thái đúng cùng link evidence, hoặc blocker/accepted risk và owner; `Not Run` không được đổi thành `Blocked` chỉ vì chưa thực hiện.
- Tài liệu bàn giao: [`SCRUM-81-risk-baseline-review-khoa.md`](SCRUM-81-risk-baseline-review-khoa.md), [`SCRUM-80-risk-register.md`](SCRUM-80-risk-register.md), report Cart và Pairwise của lượt chạy đã ghi nhận.

**Tình trạng kiểm chứng 30/10/2026:** Đã rà mẫu số/công thức, chạy lại Cart 15/15 Pass và Pairwise 14/14 Pass trên fixture local. Chưa có bản SCRUM-83 của Linh trong Git; Jira chưa xác minh được vì kết nối Atlassian MCP chưa được thiết lập trong phiên này. Chưa ký duyệt SCRUM-80.

## 2. Nội dung cho SCRUM-83 — [Linh] Chấm nhóm Checkout và luồng bổ sung

Nếu SCRUM-83 đã tồn tại, **cập nhật mô tả issue đó**, không tạo bản trùng.

**Mục tiêu:** Chấm 11 rủi ro ngoài nhóm Cart của Trang, kiểm tra tính đúng của trạng thái và bằng chứng trên từng scenario, đề xuất thứ tự test cho cuối kỳ.

**Phạm vi 11 ID:** `CHK-01`, `CHK-02`, `ADDR-01`, `ADDR-02`, `SHP-01`, `SHP-02`, `PAY-LOCAL-01`, `PAY-FAIL-01`, `INV-01`, `CART-MERGE-01`, `CHK-RACE-01`.

**Công việc:**

1. Tạo bảng 11 dòng; mỗi dòng có Impact, Likelihood, Score, mức, lý do độc lập, priority, trạng thái, owner, link scenario/test/evidence và ngày/commit/config của lượt chạy.
2. Đối chiếu review Order/Payment cũ của Linh với report Pairwise mới: `CHK-02` đã có row guest chạy trong Pairwise ngày 30/10, còn `INV-01` có evidence ở lượt bổ sung trước đó. Ghi nguồn đúng cho từng kết luận, không gán kết quả của lượt khác cho review cũ.
3. Giữ `CHK-01` là Pass có điều kiện đến khi xử lý finding ký hiệu tiền tệ; `SHP-01` là Partial khi chưa đủ evidence theo expected; `PAY-FAIL-01` Blocked vì chưa có fake payment processor.
4. Với `SHP-02`, `CART-MERGE-01`, `CHK-RACE-01`, ghi `Not Run` cho vòng Sprint 2 nếu mới thiếu thực thi; chỉ ghi Blocked khi có blocker môi trường/fixture/harness cụ thể. Hai bug tái hiện lịch sử là căn cứ ưu tiên cao, không phải bằng chứng Pass cho case mới.
5. Review rủi ro High, nêu ca biên/trình tự/đồng thời cần chạy riêng ngoài Pairwise, kế hoạch gỡ blocker hoặc accepted risk. Gửi Khoa bảng và link bằng chứng để ký duyệt.

**Tiêu chí nghiệm thu:** Có đủ 11 dòng với I/L 1–3, score/mức đúng, lý do và ưu tiên; mọi link nội bộ truy cập được; mọi kết quả Pass/Fail có evidence của đúng lượt chạy; trạng thái Partial/Blocked/Not Run đúng định nghĩa; các dòng High chưa chạy có kế hoạch hoặc quyết định accepted risk; Khoa đã ghi nhận review.

**Đầu ra đề nghị:** `docs/test-design/SCRUM-83-checkout-risk-register-linh.md`, cập nhật 11 dòng tương ứng trong `SCRUM-80-risk-register.md`, và link report/ảnh/SQL gắn với commit, ngày chạy.

## 3. Subtask Linh cần bổ sung dưới SCRUM-80

Chỉ tạo subtask sau khi kiểm tra Jira chưa có issue tương đương. Nếu SCRUM-83 là subtask của SCRUM-80, issue bổ sung này phải **cùng cấp dưới SCRUM-80**, không lồng dưới SCRUM-83.

**Summary:** `[Linh] N01 — Đối chiếu bằng chứng và trạng thái 11 rủi ro Checkout/luồng mới`

**Assignee:** Đỗ Đặng Diệu Linh. **Ngày đề nghị:** 31/10–01/11/2026 (hai ngày, thuộc Sprint 2).

**Mô tả:** Kiểm tra độc lập 11 dòng SCRUM-83 sau khi chấm: mở từng link scenario/test/report/ảnh/SQL; xác nhận commit, chế độ checkout và fixture của bằng chứng; sửa trạng thái `SHP-01`, `SHP-02`, `PAY-FAIL-01`, `CART-MERGE-01`, `CHK-RACE-01` theo bằng chứng thực tế; ghi nguồn mới cho `CHK-02` và `INV-01`; lập danh sách các dòng High chưa có execution và người nhận xử lý. Gửi Khoa bảng thay đổi và các blocker còn mở để ký duyệt.

**Nghiệm thu:** Có checklist đủ 11/11 ID; link truy cập được; mỗi Pass/Fail gắn đúng run, mỗi Blocked nêu blocker cụ thể, mỗi Partial/Not Run được giữ đúng; có bảng High còn mở và comment bàn giao cho Khoa. Kết quả Pairwise `253/253` được để riêng, không dùng thay risk coverage.

**Đầu ra đề nghị:** Phần “Evidence/status review” trong `docs/test-design/SCRUM-83-checkout-risk-register-linh.md` hoặc một tệp review được link từ đó.
