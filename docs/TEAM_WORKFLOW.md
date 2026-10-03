# Hướng dẫn làm việc nhóm

## Mục tiêu và nguồn sự thật

Tài liệu này hướng dẫn cách phối hợp, lưu deliverable và review cho đề tài nopCommerce R04 + Pairwise K06. Bảng Jira là nơi theo dõi người phụ trách, trạng thái và acceptance criteria; workbook phân công là bản tham khảo, không thay thế Jira.

Tài liệu đã có:

- [`scope.md`](../scope.md): phạm vi Shopping Cart/Checkout, giả định, rủi ro và Pass/Fail.
- [`setup.md`](../setup.md): pin phiên bản, dựng môi trường, tạo fixture và cách chạy lại.
- `README.md`: bắt đầu nhanh và liên kết tới các hướng dẫn trong repo.

Source baseline để chạy và báo cáo test: `674d0ceef6bd8a52fe74d6f4fff326960162cec0`. Ghi SHA thực tế vào từng test run; không dùng nhánh mới nhất thay cho baseline khi so sánh kết quả.

## Quy trình cho mỗi task

1. **To Do:** đọc mô tả, acceptance criteria và dependency trên Jira. Nếu thiếu dữ liệu hoặc có xung đột, hỏi trên task trước khi bắt đầu.
2. **In Progress:** chuyển đúng issue/subtask sang In Progress; xác nhận output file, người viết và reviewer.
3. **Làm việc:** tạo branch cho thay đổi, commit theo từng phần có thể review, cập nhật Jira bằng link PR/file và ghi rõ blocker.
4. **Code Review:** chỉ chuyển khi output đã được push, PR hoặc link deliverable truy cập được và reviewer đã được chỉ định. Reviewer nhận xét theo acceptance criteria.
5. **Sửa và review lại:** nếu có góp ý, đưa đúng issue về In Progress, sửa trên cùng branch rồi cập nhật PR.
6. **Done:** chỉ chuyển sau khi acceptance criteria đạt, góp ý đã xử lý, lệnh chạy lại và evidence đã được lưu/link. Không đánh dấu checklist hoàn thành thay cho kết quả thực tế.

Subtask có trạng thái độc lập với task cha. Khi đổi trạng thái một subtask, mở đúng issue của subtask; đừng kéo thẻ task cha trên board nếu chỉ cập nhật tiến độ của subtask.

## Git và Pull Request

- Không commit trực tiếp lên `develop` hoặc nhánh baseline dùng chung.
- Tạo branch từ nhánh đích được thống nhất trong Jira/PR, ví dụ `task/SCRUM-36-pairwise-factors` hoặc `docs/SCRUM-14-test-guide`.
- Giữ thay đổi trong phạm vi task; không dùng `git add .` nếu working tree có file không thuộc task.
- Commit message nên nêu loại thay đổi và task, ví dụ `docs(T02): document local setup` hoặc `test(K06): add pairwise model`.
- Mở PR vào nhánh tích hợp do nhóm thống nhất (thường là `develop`); ghi issue Jira, nội dung thay đổi, cách kiểm tra và SHA baseline.
- Chỉ yêu cầu review khi PR đã có mô tả, thay đổi liên quan và evidence cần thiết. Không tự approve phần mình viết.

Trước khi commit, chạy `git status --short` và xem kỹ danh sách file. Sau khi push, kiểm tra PR hiển thị đúng file và ảnh; gửi link PR cho reviewer.

## Bản đồ deliverable

Các đường dẫn dưới đây là gợi ý để cả nhóm biết deliverable nằm ở đâu, không phải phân quyền chỉnh sửa. **Assignee đang được ghi trên Jira chịu trách nhiệm cập nhật file/evidence cho subtask đó**, kể cả khi file được dùng chung với task khác. Assignee có thể sửa nội dung liên quan; reviewer kiểm tra, nhận xét hoặc cùng sửa nếu đã thống nhất. Nếu file được chuyển vị trí, cập nhật link trên Jira và README để giữ một bản chính thức.

| Task    | Deliverable khuyến nghị                                     | Nội dung cần có                                                                                   |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| T01     | `scope.md`                                                  | Phạm vi trong/ngoài, luồng chính, giả định, rủi ro, Pass/Fail và trạng thái review.               |
| T02     | `setup.md`, `image/setup/`                                  | SHA/tool versions, build/run, database, seed fixtures, ports, hướng dẫn máy mới và evidence.      |
| T03     | `docs/architecture.md`                                      | Sơ đồ component/container, module/dependency, data flow và các điểm liên quan tới test.           |
| T04-T05 | `docs/test-design/cart-checkout-scenarios.md`               | Scenario ID, precondition, input, steps, expected result/invariant và dữ liệu cho Cart/Checkout.  |
| T06-T07 | `qa/pairwise/model.pict`, `qa/pairwise/generated-cases.csv` | Factors/values/constraints, phiên bản và lệnh PICT, dữ liệu sinh ra cùng mapping về scenario.     |
| T08-T10 | `qa/automation/README.md`, mã test trong `qa/automation/`   | Dependency/config, lệnh chạy từng test/toàn bộ, assertion, logs và nơi lưu report.                |
| T11     | PR review và checklist quality gate trên Jira               | Reviewer, phạm vi đã kiểm tra, góp ý, kết quả và các gate còn chặn merge.                         |
| T12-T13 | `qa/results/<SHA>/<YYYY-MM-DD>/summary.md`, `defects.md`    | Môi trường, tổng/pass/fail/skip, pair coverage, logs, defect, bước tái hiện, severity và RCA.     |
| T14     | `README.md`, `setup.md`, `qa/automation/README.md`          | Hướng dẫn cài, tạo dữ liệu, pin SHA, chạy test, xem report, reset dữ liệu và giới hạn.            |
| T15-T16 | `docs/report/`, `docs/demo-runbook.md`                      | Outline báo cáo/slide, trình tự demo, lệnh chạy, người trình bày theo Jira và phương án dự phòng. |

Không cần tạo tất cả thư mục ngay từ đầu. Tạo file khi task bắt đầu và liên kết từ Jira; không tạo bản sao nội dung giữa README, setup guide và report.

## Quy ước test và evidence

- Scenario ID: `CART-01`, `CHK-01`; Pairwise case ID: `PW-001`; Defect ID: `DEF-001`. Giữ ID ổn định qua report và Jira.
- Mỗi scenario ghi: mục tiêu, precondition/fixture, input/factor values, steps, expected result hoặc invariant, actual result, pass/fail.
- Mỗi lần chạy ghi: commit SHA, ngày, OS/runtime/Docker, cấu hình checkout, lệnh chạy, phiên bản dependency, tổng case, pass/fail/skip và đường dẫn log/report.
- Đặt ảnh theo task, ví dụ `image/setup/`, `image/SCRUM-60/`; tên ảnh nên mô tả sự kiện hoặc dùng timestamp có chú thích trong report.
- Evidence phải cho thấy output cần chứng minh và không chứa mật khẩu, token, cookie, dữ liệu khách hàng thật hoặc thông tin cá nhân.
- Không commit `bin/`, `obj/`, database dump, secret, log có thông tin nhạy cảm hoặc dữ liệu cửa hàng không cần thiết.

## Review checklist

Reviewer kiểm tra các điểm áp dụng cho task:

- Deliverable trả lời đúng yêu cầu và acceptance criteria trên Jira.
- Có thể chạy lại bằng lệnh được ghi; SHA/config/test data được pin.
- Test data tách bạch, kết quả có expected result rõ, không phụ thuộc thứ tự test.
- Pairwise model có constraints giải thích được; coverage tính trên các cặp khả thi.
- Fail có thể tái hiện; phân biệt defect ứng dụng với lỗi môi trường/test.
- Ảnh/log không chứa secret; README và Jira dẫn đúng đường dẫn.

## Khi bị chặn hoặc có kết quả bất thường

1. Ghi trên Jira: bước đang làm, lệnh, SHA, kết quả thực tế và log rút gọn; không chỉ ghi “không chạy được”.
2. Phân loại sơ bộ: môi trường, dữ liệu, script/test, hay hành vi ứng dụng.
3. Mời reviewer/owner liên quan kiểm tra; không tự sửa code sản phẩm trong phạm vi QA nếu chưa thống nhất.
4. Khi xác nhận defect, tạo issue có steps, input, expected/actual, tần suất, severity, evidence và RCA sau khi tái hiện.

## Hoàn tất task

Task chỉ Done khi deliverable đã push, PR được review, acceptance criteria có bằng chứng, hướng dẫn chạy lại đúng SHA và Jira trỏ tới file/report/evidence. Với task chạy lại, ghi riêng người chạy, máy/môi trường, ngày và kết quả; không xem việc đọc hướng dẫn là đã xác nhận tái lập.
