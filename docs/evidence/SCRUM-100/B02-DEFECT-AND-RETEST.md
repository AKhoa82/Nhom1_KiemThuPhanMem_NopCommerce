# SCRUM-100 (B02) — Lộ lỗi SQL khi xác nhận đơn ở hai tab

## Phạm vi và mức độ

- Kịch bản: `CHK-RACE-01`; task: [SCRUM-100](https://anhkhoa080205.atlassian.net/browse/SCRUM-100).
- Mức ảnh hưởng: **Cao**, vì khách thấy chi tiết SQL và không biết đơn đã được tạo hay chưa. Mức ưu tiên: **High** theo Jira. Đây **không phải** lỗi tạo hai đơn.
- Cấu hình của các lượt chạy có kiểm soát: checkout nhiều bước (`onepagecheckoutenabled=False`), `PlaceOrderWithLock=False`, `MinimumOrderPlacementInterval=1` phút và `RegenerateOrderGuidInterval=180`. Nhóm đã rà soát và sửa cả endpoint checkout một trang trong mã, nhưng loạt kiểm thử giao diện ở đây chạy trên checkout nhiều bước.
- Dữ liệu: tài khoản QA riêng `qa.n03.b02khoa@example.test`; giỏ có một dòng `PW-SHIRT` biến thể Red/S, số lượng 4; tồn kho Red/S là 5; giao hàng Ground; thanh toán Check / Money Order. Script đặt lại dữ liệu chỉ tác động tới giỏ của tài khoản này và tồn kho Red/S, không xóa các đơn cũ.

## Trước khi sửa: cách tái hiện và bằng chứng

[Báo cáo SCRUM-91](../SCRUM-91/RUN-BEFORE-FIX.md) ghi nhận **10/10 lượt hợp lệ tái hiện lỗi** trên commit `9d57731321fe5d60ed4a42f9837189c0e45ac879`. Hai tab gửi Confirm cách nhau 2,7–32,6 ms. Mỗi lượt, một tab hiển thị nguyên lỗi `Cannot insert duplicate key ... AK_Order_OrderGuid`. SQL ghi nhận đúng **một đơn mới**, một dòng `PW-SHIRT` số lượng 4, tồn kho Red/S từ 5 xuống 1 và giỏ từ một dòng về rỗng. [Ảnh tab lỗi](../SCRUM-91/run01-tab-A-sql-error.png) cho thấy thông báo SQL; [ảnh tab còn lại](../SCRUM-91/run01-tab-B-completed.png) cho thấy đơn đã hoàn tất.

Để tái hiện trên môi trường local: dùng `qa/automation/scripts/reset-n03-fixture.ps1` đặt lại dữ liệu QA; đăng nhập tài khoản QA; đi tới `/checkout/confirm`; mở cùng trang trong tab thứ hai; bấm Confirm ở hai tab gần đồng thời; đối chiếu giao diện và truy vấn số đơn, OrderGuid, OrderItem, tồn kho Red/S và giỏ. Script `qa/automation/scripts/run-n03-series.ps1` lặp lại quy trình, ghi thời điểm request và ảnh chụp SQL trước/sau. Trace và HTML đầy đủ chỉ lưu cục bộ vì có thể chứa thông tin phiên đăng nhập.

## Nguyên nhân và bản sửa

Hai request dùng dữ liệu thanh toán của cùng khách, bao gồm OrderGuid. Khi `PlaceOrderWithLock=False`, cả hai có thể đi tới bước tạo đơn trước khi request thắng xóa dữ liệu thanh toán dùng chung. Ràng buộc duy nhất `AK_Order_OrderGuid` trong SQL ngăn đơn thứ hai. Trước bản sửa, `OrderProcessingService.PlaceOrderAsync` vừa ghi ngoại lệ vào log **vừa thêm `exc.Message` vào `PlaceOrderResult.Errors`**; `CheckoutController.ConfirmOrder` hiển thị nội dung đó cho khách. Nhánh `catch` ngoài của Confirm và nhánh checkout một trang `OpcConfirmOrder` cũng trả thẳng `exc.Message`.

Bản sửa giữ chi tiết ngoại lệ trong log máy chủ, còn giao diện nhận thông báo từ tài nguyên `Checkout.OrderProcessingError`. Nếu database cũ chưa có tài nguyên này, hệ thống dùng câu dự phòng an toàn, hướng dẫn khách kiểm tra lịch sử đơn trước khi thử lại. Thông báo hợp lệ về giới hạn thời gian giữa hai đơn vẫn được giữ riêng. Bản sửa xử lý việc lộ lỗi và phản hồi cho khách; ràng buộc duy nhất trong database tiếp tục bảo đảm hành vi một đơn quan sát được. Việc thay đổi cơ chế khóa hoặc tính lặp an toàn của request cần thiết kế và kiểm thử riêng.

Các vị trí đã rà soát: `OrderProcessingService.PlaceOrderAsync`, `CheckoutController.ConfirmOrder`, `CheckoutController.OpcConfirmOrder`, `CheckoutErrorMessage` và `defaultResources.nopres.xml`. Bốn unit test kiểm tra trường hợp thiếu tài nguyên ngôn ngữ, thông báo giới hạn thời gian, chuỗi lỗi SQL và lỗi truy cập tài nguyên ngôn ngữ.

## Sau khi sửa: kiểm thử lại có kiểm soát

Commit ứng dụng: `0d0c9fcd751801b3762f99cfffdf196960289cc3`; harness ở cùng nhánh. Web container được build lại từ commit này; SQL container và database được giữ nguyên. Harness chờ đủ thời gian 1 phút theo `MinimumOrderPlacementInterval` trước từng lượt. Mỗi lượt đặt lại giỏ và tồn kho của tài khoản QA, chụp SQL trước, gửi Confirm từ hai tab, rồi chụp SQL sau.

Kết quả: **10/10 lượt Pass**; không có lượt nào bị loại khỏi mẫu số. Cả 10 lượt đều có hai POST cách nhau dưới 250 ms, đúng một đơn mới, một OrderItem `PW-SHIRT` số lượng 4, tồn kho 5→1, giỏ 1→0, OrderGuid không trùng, không lộ SQL và tab thua hiển thị thông báo an toàn. Trạng thái Playwright của từng lượt là Pass; bốn unit test của `CheckoutErrorMessageTests` cũng Pass (0 Fail, 0 Skip). [Tệp JSON đã lọc](B02-10-POSTS.json) lưu thời điểm UTC của từng POST, mã HTTP và kết quả kiểm tra từng lượt, không chứa cookie hoặc token phiên.

| Lượt | Khoảng cách hai POST | Mã HTTP tab A/B | Số đơn trước→sau | OrderGuid của đơn mới | Tồn kho | Giỏ |
| --- | ---: | --- | --- | --- | --- | --- |
| 01 | 17,7 ms | 200/302 | 4→5 | `51936CAB-C490-47E5-8669-EC4D2B6BBC63` | 5→1 | 1→0 |
| 02 | 0,3 ms | 200/302 | 5→6 | `0457AA5F-F72D-4E35-A824-601B68365156` | 5→1 | 1→0 |
| 03 | 14,5 ms | 200/302 | 6→7 | `00C81454-9881-402C-B8CB-CFFF371EB666` | 5→1 | 1→0 |
| 04 | 21,4 ms | 200/302 | 7→8 | `198BCBD6-177A-42E7-9B4E-54027EE76CCF` | 5→1 | 1→0 |
| 05 | 0,3 ms | 302/200 | 8→9 | `00E6B2C4-4F0C-4388-A6BC-FC4FEC88C0CC` | 5→1 | 1→0 |
| 06 | 1,1 ms | 302/200 | 9→10 | `F5027024-0B48-4824-BEEC-F6B833733D9E` | 5→1 | 1→0 |
| 07 | 0,3 ms | 200/302 | 10→11 | `4AC00C8C-7158-409F-BA2A-60451E28D7F0` | 5→1 | 1→0 |
| 08 | 14,5 ms | 200/302 | 11→12 | `03D07197-0881-42B4-97A6-46B4469C46E3` | 5→1 | 1→0 |
| 09 | 2,1 ms | 200/302 | 12→13 | `A58853F6-3F4B-4B9C-AD44-37C5C98DA281` | 5→1 | 1→0 |
| 10 | 0,3 ms | 302/200 | 13→14 | `3BF0E4F7-BB21-488A-A412-4EE84538F500` | 5→1 | 1→0 |

Mã 302 dẫn tới trang Completed; mã 200 là tab vẫn ở Confirm và hiển thị câu an toàn. Kiểm tra riêng `n03-attempt.json` của cả 10 lượt xác nhận `leakedSql=false` và `loserHasSafeMessage=true` trong từng lượt. Tập dữ liệu trước sửa tái hiện lỗi 10/10; số lượt tái hiện lỗi sau sửa là 0/10 trong cùng cấu hình và loại dữ liệu. Hai tập chạy trên các commit khác nhau, nên phép so sánh là bằng chứng theo hai mốc kiểm thử, không phải thí nghiệm cô lập mọi thay đổi mã nguồn khác. Các lượt thử kỹ thuật trước loạt cuối, khi script còn hiểu sai đơn vị của `MinimumOrderPlacementInterval`, không được đưa vào mẫu số này.

Kiểm tra bổ sung: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj -c Release --no-restore --filter FullyQualifiedName~CheckoutErrorMessageTests` đạt **4/4**; `node node_modules/typescript/bin/tsc --noEmit` đạt; `docker compose build nopcommerce_web` thành công từ commit ứng dụng nêu trên.

Bằng chứng minh họa của lượt 1: [tab nhận thông báo an toàn](run01-tab-A-safe.png), [tab tạo đơn thành công](run01-tab-B-completed.png), [SQL trước Confirm](run01-sql-before.txt) và [SQL sau Confirm](run01-sql-after.txt). Hai POST cách nhau 17,7 ms; số đơn của tài khoản QA từ 4 lên 5, tồn kho Red/S từ 5 xuống 1, giỏ từ một dòng về rỗng và số nhóm OrderGuid trùng là 0. Các ảnh dùng tài khoản QA giả lập; trace và HTML có dữ liệu phiên nên không đưa lên Git hoặc Jira.

### Cách chạy lại

Sau khi dựng store và chuẩn bị tài khoản QA riêng, đặt các biến môi trường `QA_SQL_PASSWORD`, `QA_DB_NAME`, `QA_REGISTERED_EMAIL`, `QA_REGISTERED_PASSWORD` trên máy kiểm thử, không ghi mật khẩu vào Git. Từ thư mục `qa/automation` chạy:

```powershell
./scripts/run-n03-series.ps1 -Runs 10 -AccountEmail $env:QA_REGISTERED_EMAIL -Label B02-RETEST -Database $env:QA_DB_NAME
node scripts/summarize-n03-runs.cjs n03-local-evidence/B02-RETEST --md n03-local-evidence/B02-RETEST/summary.md
```

Mỗi lần chạy cần một nhãn mới để không ghi đè bằng chứng cũ. Nếu môi trường không có database tên `nopcommerce` hoặc biến thể cũ có ký tự U+200B ở đầu, script sẽ từ chối các tên khác. Không đưa thư mục `n03-local-evidence` lên Git vì có trace và HTML phiên đăng nhập.

## Tiêu chí nghiệm thu

1. Ghi nhận cả hai POST Confirm với khoảng cách không quá 250 ms.
2. Chỉ có một đơn mới; OrderGuid duy nhất; đơn có một OrderItem `PW-SHIRT` số lượng 4.
3. Tồn kho Red/S từ 5 xuống 1; giỏ từ một dòng về rỗng.
4. Không phản hồi nào lộ `Cannot insert duplicate key`, `AK_Order_OrderGuid` hoặc `SqlException`.
5. Tab còn lại hiển thị thông báo dễ hiểu về kết quả đặt hàng; tab thắng hiển thị trang Completed.

Kết quả chỉ áp dụng cho máy, commit, chế độ checkout, dữ liệu và thời điểm đã ghi. Mười lượt hợp lệ không chứng minh mọi lịch thực thi đều an toàn. Nếu bật checkout một trang, cần có lượt kiểm thử giao diện riêng cho cấu hình đó.
