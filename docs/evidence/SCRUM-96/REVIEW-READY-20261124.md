# SCRUM-96 B01 — review kỹ thuật trước commit, 24/11/2026

## Kết luận

**Đạt để tạo commit/PR cho phạm vi B01.** Không thấy lỗi chức năng chặn bàn giao trong bản sửa hiện tại. Đây là review kỹ thuật của workspace; người giữ vai trò nhóm trưởng trên Jira vẫn cần xác nhận quyết định nghiệp vụ và kết quả sau khi commit/PR có thể truy cập được. Chưa commit, push hoặc chuyển trạng thái Jira.

## Đối chiếu yêu cầu Jira

Jira SCRUM-96 mô tả account Red/S 4, guest Red/S 2, stock 5, không backorder. Trước sửa, 2 món guest bị xóa và không có cảnh báo. Bản sửa chỉ xóa từng dòng guest khi `AddToCartAsync` thành công; dòng vượt kho được giữ, người mua ở trạng thái guest, thấy cảnh báo và có thể giảm số lượng rồi đăng nhập lại. Gộp hợp lệ và khác biến thể vẫn được kiểm tra. Mức ưu tiên Jira: High; RCA là migration bỏ qua warning của `AddToCartAsync` rồi xóa toàn bộ dòng nguồn.

## Kết quả review và kiểm thử

- Bốn phát hiện của [review trước](REVIEW-20261124.md) đã được xử lý: cảnh báo tiếng Việt dễ đọc; link tới đúng giỏ theo store; kết quả gộp thất bại được xử lý ở các đường gọi đăng nhập liên quan; lựa chọn checkout không bị xóa khi dòng hàng bị từ chối.
- Build `Nop.Web` Release từ mã nguồn hiện tại: 0 lỗi, 0 cảnh báo.
- `ShoppingCartMigrationTests` Release từ mã nguồn hiện tại: **7/7 pass**. Bao gồm vượt kho, sửa số lượng rồi thử lại, gộp hợp lệ, nhiều dòng, coupon/gift card và lựa chọn checkout.
- Playwright Chromium full run `AUTO-20261124151151736`: **9/9 pass**, 0 fail/skip/error. Có cả `REPEAT-SAME`, `REPEAT-DIFFERENT`, nhiều store và activation. [JUnit](RUN-20261124-B01-FULL-9OF9/junit.xml), [manifest](RUN-20261124-B01-FULL-9OF9/run-manifest.json), [tóm tắt retest](RUN-20261124-B01-RECOVERY-RESULTS.md).
- TypeScript `tsc --noEmit`, kiểm tra cú pháp các script B01, XML localization và `git diff --check`: pass.

## Giới hạn và bàn giao

- Lượt UI dùng fixture N02 và store thứ hai tạm trên máy local; store tạm đã dọn. Ca nhiều store tạo cùng guest cookie ở hai host test để kiểm tra tình huống cùng một guest có dòng ở cả hai store.
- Bốn đường gọi đăng nhập đã được sửa; UI kiểm tra trực tiếp đường kích hoạt tài khoản. Ba đường còn lại được kiểm tra ở mức code và build.
- Báo cáo cũ 8/8 và review `changes requested` là lịch sử trước các chỉnh sửa sau đó. Báo cáo này và lượt 9/9 là kết quả mới nhất.
- Working tree có nhiều file ngoài B01. Chỉ đưa code B01, test N02 liên quan và `docs/evidence/SCRUM-96` vào commit B01. File trong `Plan/` được giữ cục bộ theo yêu cầu, không đưa lên GitHub. Sau commit, ghi SHA/PR và link bằng chứng vào SCRUM-96; nhóm trưởng xác nhận trước khi chuyển Done.
- Phần B01 đã được stage trên nhánh `fix/SCRUM-96-b01-cart-merge`, xuất phát từ `9d57731321`. Nhánh `origin/develop` tại lúc review có thêm hai commit (merge N03); cần kiểm tra chênh lệch khi mở PR. SHA của base không đại diện cho patch chưa commit.
