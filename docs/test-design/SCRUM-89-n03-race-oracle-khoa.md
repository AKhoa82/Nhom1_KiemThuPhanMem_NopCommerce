# SCRUM-89 — Ca kiểm thử và oracle Confirm gần đồng thời

**Issue:** [SCRUM-89](https://anhkhoa080205.atlassian.net/browse/SCRUM-89), thuộc [N03 / SCRUM-88](https://anhkhoa080205.atlassian.net/browse/SCRUM-88). **Defect liên quan:** [B02 / SCRUM-100](https://anhkhoa080205.atlassian.net/browse/SCRUM-100). Người thiết kế và review mã: Khoa. Phần chạy hai tab thuộc SCRUM-90 của Trang; phần SQL, fixture và tổng hợp nhiều lượt thuộc SCRUM-91 của Linh.

## 1. Phạm vi và điều kiện ban đầu

`CHK-RACE-01` kiểm tra hai yêu cầu Confirm hợp lệ, phát gần đồng thời từ **hai tab cùng tài khoản và cùng giỏ**. Đây là một scenario theo rủi ro đồng thời, không phải một row mới trong 14 ca Pairwise cũ. Pairwise K06 vẫn là kỹ thuật chính để chọn cấu hình đầu vào tĩnh của đề tài; thời điểm và thứ tự xử lý hai request cần ca riêng.

Fixture chuẩn cho N03: tài khoản Registered; một dòng sản phẩm vật lý `PW-Simple-Stock` số lượng **4**; stock khả dụng **5**, không backorder; địa chỉ hợp lệ; shipping `Ground`; payment local `Check / Money Order`; checkout nhiều bước và hai tab ở Confirm. Trước mỗi lượt, xác nhận giỏ và stock, số order của **đúng CustomerId/StoreId**, `OrderGuid`, các `OrderItem` và trạng thái payment request. Không chạy thêm lần khác khi dữ liệu của lượt trước chưa được đối chiếu và khôi phục. Ghi commit của mã nguồn, cấu hình `PlaceOrderWithLock`, `MinimumOrderPlacementInterval`, `RegenerateOrderGuidInterval`, plugin, thời gian bắt đầu và URL của lượt chạy. Nếu fixture hoặc chế độ checkout khác, ghi thành lượt riêng và tính lại expected.

## 2. Oracle và bảng trạng thái

Hai yêu cầu đều xuất phát từ một giỏ hợp lệ. Dù request nào thắng, các điều kiện sau phải luôn đúng sau khi hệ thống ổn định:

1. **An toàn đơn hàng:** có tối đa **một order mới** cho lần mua này, `OrderGuid` duy nhất, một bộ `OrderItem` phản ánh đúng một lần đặt 4 món. Trong điều kiện fixture và payment đều hoạt động, kỳ vọng có **đúng một** request hoàn tất thành công và order delta = 1. Nếu cả hai lỗi do môi trường, đánh giá theo nguyên nhân thực tế, không ghi Pass.
2. **Tồn kho và giỏ:** stock từ 5 còn 1; giỏ đã chuyển sang order và không còn 4 món có thể đặt lại. Nếu order delta = 0 thì stock/giỏ không được thay đổi như thể đã đặt thành công. Không được trừ kho hoặc ghi order item hai lần.
3. **Phản hồi:** request thắng nhận trang Completed hoặc phản hồi thành công phù hợp chế độ checkout. Request còn lại được từ chối với thông báo nghiệp vụ dễ hiểu (đơn đã được xử lý, giỏ không còn hợp lệ, hoặc giới hạn thời gian đặt hàng), hoặc được xử lý idempotent và dẫn tới **cùng một order**. Không hiển thị SQL, stack trace, tên bảng/index, connection string hoặc exception nội bộ. Mã HTTP 200 tự nó **không** chứng minh Pass.
4. **Bằng chứng:** lưu riêng thời điểm phát/nhận, HTTP status, URL/redirect, nội dung đã khử dữ liệu nhạy cảm và ảnh/trace của **từng tab**; truy vấn SQL read-only trước/sau theo customer/store để đối chiếu order, order item, cart, stock. Log server chỉ dùng để giải thích lỗi; không đưa raw SQL exception hay cookie/token lên Git.

| Trạng thái sau hai request | Order delta | Stock và giỏ | Phản hồi hai tab | Kết luận |
| --- | ---: | --- | --- | --- |
| Một request thắng, request kia được xử lý an toàn | 1 | Stock 1, giỏ rỗng, một bộ OrderItem 4 | Một thành công; một thông báo nghiệp vụ hoặc cùng order | Pass cho lượt đó. |
| Một request thắng nhưng request kia lộ lỗi SQL | 1 | Có thể vẫn đúng về dữ liệu | Một tab thấy exception/index SQL | **Fail** về xử lý/hiển thị lỗi; không gọi là tạo trùng order. |
| Hai order được ghi từ một giỏ | 2 | Có nguy cơ trừ stock hai lần | Bất kỳ | **Fail nghiêm trọng** về tính toàn vẹn. |
| Không order nào do fixture/plugin/database không sẵn sàng | 0 | Đối chiếu theo trạng thái thực tế | Không tới được Confirm hợp lệ | **Blocked** nếu precondition chưa đạt; ghi nguyên nhân. |
| Hai request đã gửi, không lỗi ở một lần thử | 0 hoặc 1 | Phải kiểm tra SQL và phản hồi | Không có lỗi SQL quan sát được | Ghi **Not Reproduced** cho lượt đó nếu chưa đủ điều kiện kết luận Pass; không tự đóng B02. |

## 3. Ma trận ca và bước thực thi

| Case ID | Bước | Expected / assertion | Bằng chứng |
| --- | --- | --- | --- |
| `CHK-RACE-01 / CTRL-SEQUENTIAL` | Chuẩn bị fixture; mở Confirm một tab; gửi một lần. | Order delta = 1; một OrderItem quantity 4; stock 5→1; giỏ rỗng; không lỗi kỹ thuật. Đây là đối chứng môi trường, phải reset trước ca race. | Ảnh Confirm/Completed, order/cart/stock trước-sau. |
| `CHK-RACE-01 / RACE-TWO-TABS` | Reset; mở hai tab cùng context ở Confirm; từng tab có form/token hợp lệ. Tạo barrier rồi phát hai POST Confirm gần đồng thời, ghi mốc gửi/nhận riêng. | Oracle mục 2; kiểm cả hai response và SQL. Cần nhiều lượt độc lập vì thứ tự xử lý có thể đổi. | Ảnh/trace tab A và B, response đã khử bí mật, timestamp, SQL trước-sau, run ID. |
| `CHK-RACE-01 / RETEST-B02` | Sau khi có bản sửa SCRUM-100, chạy lại CTRL và nhiều lượt RACE trên cùng fixture và ghi SHA mới. | Không có order trùng, không lộ SQL; request thứ hai có thông báo hoặc idempotent hợp lệ. | So sánh run trước/sau sửa; chỉ đóng B02 khi đủ bằng chứng. |

Khi chạy race, hai tab phải đến Confirm **trước** barrier và mỗi tab phải có phiên/form hợp lệ. Hai click tuần tự cách nhau lâu không kiểm cùng điều kiện. Ghi chênh lệch thời điểm gửi của hai request; nếu request thứ hai đến sau khi tab thứ nhất đã hoàn tất rõ ràng, đánh dấu lượt đó là kiểm thử tuần tự, không dùng làm bằng chứng cho nhánh đồng thời. Không cần định nghĩa cứng một ngưỡng mili giây cho mọi máy: log phải cho phép thấy hai request chồng thời gian xử lý hoặc phát cùng barrier.

## 4. Review mã nguồn và đường đi exception

1. [`CheckoutController.ConfirmOrder`](../../src/Presentation/Nop.Web/Controllers/CheckoutController.cs) kiểm giỏ, chế độ checkout và `IsMinimumOrderPlacementIntervalValidAsync` trước khi gọi `PlaceOrderAsync`. Hàm kiểm interval đọc **đơn cuối đã lưu**; hai request cùng đi qua trước khi có order có thể đều vượt qua kiểm tra này. Đây là khả năng suy ra từ mã, không phải bằng chứng về thứ tự thực tế của một run.
2. `GetProcessPaymentRequestAsync` đọc payment request lưu ở generic attribute của customer. `SetProcessPaymentRequestAsync` có thể dùng lại `OrderGuid` trong khoảng `RegenerateOrderGuidInterval`; cần ghi cấu hình này ở run. [`OrderBuilder`](../../src/Libraries/Nop.Data/Mapping/Builders/Orders/OrderBuilder.cs) đặt unique constraint `AK_Order_OrderGuid`, nên việc SQL từ chối GUID trùng là phù hợp với triệu chứng đã quan sát, nhưng chưa chứng minh đó là cơ chế duy nhất ngăn order trùng.
3. [`OrderProcessingService.PlaceOrderAsync`](../../src/Libraries/Nop.Services/Orders/OrderProcessingService.cs) gọi `SaveOrderDetailsAsync`. Khi exception xảy ra trong local function `placeOrder`, hàm bắt exception rồi gọi `result.AddError(exc.Message)`. Nếu `PlaceOrderWithLock` bật, nhánh mutex/cache được dùng; cần xác nhận cấu hình thực tế trước khi quy lỗi cho nhánh nào.
4. Sau khi nhận `PlaceOrderResult` thất bại, `CheckoutController.ConfirmOrder` đưa từng `placeOrderResult.Errors` vào `model.Warnings` và render lại View; `catch` bên ngoài cũng đưa `exc.Message` vào warnings. Với checkout một trang, `OpcConfirmOrder` thêm lỗi vào model hoặc trả JSON `{ error = 1, message = exc.Message }`. **Điểm lộ thông tin** là đưa thông điệp exception nội bộ trực tiếp vào phản hồi khách. Log nội bộ có thể giữ chi tiết để debug; phản hồi khách cần thông báo nghiệp vụ không chứa SQL.
5. Hướng sửa để B02 đánh giá: phân loại lỗi đặt hàng đã xử lý hoặc giỏ không còn hợp lệ, trả thông báo an toàn; giữ ràng buộc dữ liệu chống duplicate; kiểm số order/cart/stock sau lỗi. Chưa chọn một bản vá cụ thể trong SCRUM-89 và chưa tuyên bố lỗi đã sửa. Sau sửa cần test cả checkout nhiều bước và một trang nếu hai đường controller bị thay đổi.

## 5. Đối chiếu bằng chứng hiện có và khoảng trống

[Lượt rủi ro ngày 18/11](../evidence/SCRUM-112/RUN-CHK-RACE-01.md) ghi hai POST Confirm gần đồng thời: một order được tạo, stock chỉ trừ một lần, một HTTP response 200 chứa `AK_Order_OrderGuid`; kết luận **Fail xử lý thông báo**, không phải tạo hai order. Container đang chạy không được chứng minh là build từ SHA của nhánh test; report raw và trace chỉ lưu local. Bằng chứng này có giá trị xác nhận triệu chứng trên môi trường đó, không thay thế một lượt N03 đầy đủ.

[Test rủi ro hiện có](../../qa/automation/tests/checkout-risk.spec.ts) gửi hai POST song song bằng `Promise.all`, nhưng dùng **số lượng 1** trên fixture stock **10**, không mở/ghi ảnh hai tab, chỉ ghi thời lượng tổng và không kiểm đầy đủ `OrderItem`/stock/cart theo oracle trên. Do đó nó là bằng chứng sớm cho B02, **chưa đạt toàn bộ yêu cầu SCRUM-88** (giỏ 4, stock 5, trace/ảnh từng tab, nhiều lượt, mốc request riêng). Trang xử lý harness và bằng chứng hai tab ở SCRUM-90; Linh xử lý fixture, SQL và bảng nhiều lượt ở SCRUM-91. Không gán kết quả của hai subtask này cho Khoa trước khi được bàn giao.

**Điều kiện review SCRUM-89:** Trang và Linh xác nhận oracle, các trạng thái Pass/Fail/Blocked/Not Reproduced và điểm cần bổ sung cho hai subtask của họ. Khi review xong, cập nhật lại tài liệu theo nhận xét; SCRUM-89 có thể Done độc lập với việc defect SCRUM-100 vẫn đang mở.
