# T12 — Đối chiếu SQL trước/sau và tần suất lỗi CHK-RACE-01 (10 lượt)

Commit nguồn: `450d486bd19049f406290138e905644fe782bebc`. Có đủ 10/10 lượt yêu cầu. Defect theo dõi: SCRUM-100 (B02).
Cấu hình đọc từ SQL: minimumorderplacementinterval=1, onepagecheckoutenabled=False, placeorderwithlock=False, regenerateorderguidinterval=180.

| Lượt | Khoảng cách hai POST (ms) | Tab A | Tab B | Số đơn trước→sau | OrderGuid mới | OrderItem | Tồn kho trước→sau | Số dòng giỏ trước→sau | Kết luận |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| run01 | 1.8 | 200 | 302 | 10→11 (Δ1) | 9C11C37B-EBE9-4893-9FEF-5C75EA6D74BF | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run02 | 1.7 | 302 | 200 | 11→12 (Δ1) | C19647E4-8254-4509-84EA-C02BB0041D57 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run03 | 15.1 | 302 | 200 | 12→13 (Δ1) | B2E7E7CE-1C01-40D4-B1EA-EB9EE6EBB688 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run04 | 2.9 | 302 | 200 | 13→14 (Δ1) | 90138F7B-4CC4-464F-83D0-A86D72CECF74 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run05 | 4.8 | 200 | 302 | 14→15 (Δ1) | FC43577C-218E-41D6-877A-66ABE2820FEC | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run06 | 1.6 | 302 | 200 | 15→16 (Δ1) | 4073A4C4-BDAF-4F8B-9E69-BB67FF0AA13A | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run07 | 14.1 | 200 | 302 | 16→17 (Δ1) | E3C31D63-5CA5-453F-B12F-99C8D3874C6B | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run08 | 22.5 | 302 | 200 | 17→18 (Δ1) | 2E0FAC59-356A-415D-B609-03E62E9CB258 | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run09 | 2.2 | 302 | 200 | 18→19 (Δ1) | 70DBE55B-DF76-4DC9-BCA0-3250E05C2AAD | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |
| run10 | 26.3 | 302 | 200 | 19→20 (Δ1) | EF09ADE6-D499-4CEC-A7F8-289AA850815E | 1×PW-SHIRT×4 | 5→1 | 1→0 | NOT_REPRODUCED_THIS_RUN |

## Tần suất quan sát

- Kết luận theo lượt: `NOT_REPRODUCED_THIS_RUN` = 10.
- Cả **10** lượt đều có hai yêu cầu Confirm gửi gần đồng thời và tạo một đơn. Lượt lộ lỗi SQL (tái hiện SCRUM-100): **0/10**; khoảng Wilson 95% cho tần suất quan sát là **0%–28%**.
- Lượt tạo hai đơn hoặc trùng OrderGuid: **0**.
- Số lượt bị loại khỏi mẫu số do thiếu điều kiện, sai thời điểm, không tạo đơn hoặc thiếu dữ liệu: **0**.

## Giới hạn bằng chứng

- Tần suất chỉ áp dụng cho máy, commit, cấu hình và khoảng cách gửi yêu cầu ở 10 lượt này; không phải xác suất lỗi chung.
- `NOT_REPRODUCED_THIS_RUN` nghĩa là lượt đó không lộ lỗi SQL và dữ liệu SQL nhất quán. Kết quả không chứng minh lỗi đã được sửa trong mọi điều kiện. Ảnh [tab nhận cảnh báo](T12-RACE-run01-tab-A-after.png) và [tab tạo đơn](T12-RACE-run01-tab-B-after.png) xác nhận phản hồi giao diện ở run01; test còn kiểm tra thông báo an toàn ở mỗi lượt.
- SQL không cho biết tab đã hiển thị gì; hai cột Tab lấy từ attachment `n03-attempt.json` của Playwright.
- Trace và HTML thô được giữ tại máy local để tránh đưa cookie/phiên đăng nhập vào Git.
