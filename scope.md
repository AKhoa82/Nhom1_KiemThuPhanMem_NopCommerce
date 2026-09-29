# Phạm vi kiểm thử: Shopping Cart và Checkout

## 1. Mục tiêu và phiên bản

- Đề tài: R04 nopCommerce + K06 Combinatorial / Pairwise Testing.
- Mục tiêu: kiểm tra các tổ hợp đầu vào quan trọng của giỏ hàng và checkout, đồng thời xác minh các quy tắc nghiệp vụ và điều kiện biên được nêu dưới đây.
- Mã nguồn hiện có trong workspace: commit `efdf6348e54e3aae9dba4cba7f51ee4a73954c18`. Giữ nguyên commit này làm baseline kiểm thử của workspace; nếu nhóm chốt release/commit khác, cập nhật lại trước khi chạy bộ test chính thức.
- Phạm vi được đối chiếu với `ShoppingCartController`, `CheckoutController`, `ShoppingCartService` và `OrderProcessingService`.

## 2. Phạm vi trong

### 2.1 Shopping Cart

- Thêm sản phẩm đơn giản vào giỏ; với sản phẩm có thuộc tính/biến thể, chọn tổ hợp hợp lệ tại trang chi tiết sản phẩm rồi thêm vào giỏ.
- Cập nhật số lượng, giữ nguyên số lượng khi dữ liệu nhập không đọc được, và xóa sản phẩm khỏi giỏ.
- Kiểm tra số lượng dương, giới hạn số lượng tối thiểu/tối đa và số lượng cho phép của sản phẩm.
- Kiểm tra sản phẩm quản lý tồn kho: còn hàng, vừa đủ tồn kho, vượt tồn kho và hết hàng. Kiểm tra tồn kho của tổ hợp thuộc tính khi sản phẩm quản lý kho theo thuộc tính.
- Kiểm tra thuộc tính bắt buộc và tổ hợp thuộc tính không tồn tại/không được phép đặt.
- Áp dụng coupon hợp lệ, từ chối coupon rỗng/không tồn tại/không hợp lệ và gỡ coupon đã áp dụng.
- Xác minh số lượng, thuộc tính, cảnh báo và tổng tiền hiển thị được cập nhật tương ứng sau thao tác. Không đánh giá đầy đủ chính sách thuế, khuyến mại hay làm tròn đa tiền tệ.

### 2.2 Checkout

- Tạo đơn từ giỏ không rỗng; dùng tài khoản khách hoặc tài khoản đăng ký theo cấu hình checkout đã khóa cho lần chạy.
- Nhập/chọn địa chỉ thanh toán và địa chỉ giao hàng; kiểm tra dữ liệu bắt buộc không hợp lệ bị giữ lại ở bước địa chỉ, không đi tiếp.
- Chọn phương thức giao hàng khả dụng. Baseline đề xuất dùng phương thức giao hàng nội bộ có cấu hình ổn định, ví dụ `Shipping.FixedByWeightByTotal`; không kiểm tra các hãng vận chuyển bên ngoài.
- Chọn phương thức thanh toán local khả dụng và xác nhận đơn hàng thành công. Có thể dùng `Payments.CheckMoneyOrder` nếu plugin đã được cài, kích hoạt và cấu hình.
- Kiểm tra request thiếu/sai lựa chọn shipping hoặc payment không được chấp nhận như một lựa chọn hợp lệ; giỏ rỗng hoặc giỏ có cảnh báo không được chuyển tới bước xác nhận.
- Kiểm tra xác nhận đơn không hợp lệ hoặc payment bị từ chối bằng một payment processor giả lập, xác định được kết quả và chạy hoàn toàn local. Kịch bản này chỉ được tính hoàn thành khi processor giả lập có sẵn; plugin Check/Money Order không mô phỏng từ chối thanh toán.
- Với đơn thành công, xác minh đơn được tạo đúng một lần, giữ đúng sản phẩm/số lượng/giá trị checkout và giỏ/coupon được xóa theo luồng xử lý thành công.
- Với payment bị từ chối, xác minh lỗi được hiển thị, không có đơn ở trạng thái thanh toán thành công và checkout không tạo trùng đơn. Không gửi giao dịch thật tới cổng thanh toán.

### 2.3 Các luồng nghiệp vụ chính

1. **Thêm và cấu hình sản phẩm:** chọn sản phẩm đơn giản hoặc biến thể, nhập số lượng, thêm vào giỏ; kiểm tra dữ liệu giỏ và cảnh báo tồn kho.
2. **Cập nhật giỏ và coupon:** thay đổi số lượng/xóa sản phẩm, áp dụng hoặc gỡ coupon; kiểm tra dữ liệu và tổng tiền sau cập nhật.
3. **Checkout hợp lệ:** từ giỏ hợp lệ, nhập địa chỉ, chọn giao hàng và thanh toán local, xác nhận; kiểm tra kết quả đơn hàng và giỏ sau đặt hàng.
4. **Checkout không hợp lệ/thanh toán lỗi:** thử địa chỉ hoặc lựa chọn không hợp lệ, dữ liệu thiếu, rồi thử payment decline giả lập; xác minh luồng bị chặn và có thông báo phù hợp.

## 3. Mô hình Pairwise (K06)

Pairwise áp dụng cho các yếu tố đầu vào có thể kết hợp trong cùng quy trình; không thay thế các ca kiểm tra biên/negative bắt buộc ở trên. Sinh test bằng Microsoft PICT hoặc công cụ tương đương, lưu model, lệnh sinh và bộ dữ liệu đầu ra cùng mã test. Loại trừ các tổ hợp không khả thi phải được ghi thành constraint trong model.

| Yếu tố            | Mức dự kiến                                                          |
| ----------------- | -------------------------------------------------------------------- |
| Loại khách        | Đã đăng ký; guest (chỉ khi bật anonymous checkout)                   |
| Cấu hình sản phẩm | Sản phẩm đơn giản; sản phẩm có thuộc tính/tổ hợp hợp lệ              |
| Trạng thái kho    | Đủ hàng; đúng giới hạn; yêu cầu vượt kho/hết hàng                    |
| Thao tác giỏ      | Thêm; cập nhật số lượng; xóa                                         |
| Coupon            | Không dùng; hợp lệ; không hợp lệ                                     |
| Địa chỉ checkout  | Hợp lệ; thiếu/sai trường bắt buộc                                    |
| Giao hàng         | Phương thức nội bộ khả dụng; không áp dụng với hàng không cần ship   |
| Thanh toán        | Check/Money Order local; decline giả lập (chỉ khi có test processor) |

Ràng buộc: guest chỉ được dùng khi cấu hình cho phép; sản phẩm không cần giao hàng không có tổ hợp giao hàng; xóa giỏ không tiếp tục checkout; mức kho “đúng giới hạn/vượt kho” phải có sản phẩm thực sự quản lý tồn kho; decline chỉ chạy với processor giả lập. Tính coverage trên các cặp mức khả thi của model và báo riêng các ca biên không nằm trong ma trận pairwise.

## 4. Ngoài phạm vi

- Quản trị sản phẩm, tồn kho, coupon, phương thức giao hàng/thanh toán và cấu hình cửa hàng trong Admin.
- Quản lý tài khoản khách hàng ngoài việc tạo/đăng nhập đủ để thực hiện checkout; đăng ký, khôi phục mật khẩu và hồ sơ tài khoản.
- Báo cáo doanh thu, xử lý đơn sau checkout, hoàn tiền/hủy đơn và email bên ngoài.
- Tích hợp hoặc giao dịch thật với PayPal, ngân hàng, cổng thanh toán, hãng vận chuyển hay dịch vụ Internet khác. Không quét hoặc gửi tải tới hệ thống công khai.
- Payment decline từ cổng thật; chỉ kiểm tra decline qua processor giả lập local nếu có.
- Kiểm thử hiệu năng/tải, bảo mật/DAST, mutation, concurrency/race và kiểm thử toàn bộ plugin.
- Wishlist, recurring/rental/bundle/downloadable product, đa cửa hàng, đa tiền tệ và ma trận thuế đa quốc gia.
- Mọi luồng không thuộc giỏ hàng và checkout đã mô tả ở trên.

## 5. Giả định và dữ liệu kiểm thử

- Môi trường là instance local của đúng commit baseline; database test riêng, có thể reset và không chứa dữ liệu thật.
- Khóa cấu hình checkout trong suốt lượt chạy. Đề xuất tắt one-page checkout để kiểm tra rõ các bước địa chỉ, shipping, payment và confirm; nếu nhóm chọn one-page checkout thì cập nhật test model, không trộn hai cấu hình trong cùng lượt pairwise.
- Cấu hình rõ guest checkout bật/tắt và chỉ tạo mức “guest” trong model khi guest checkout được bật.
- Có tối thiểu một sản phẩm shippable đơn giản quản lý kho, một sản phẩm có thuộc tính/tổ hợp hợp lệ và dữ liệu kho biết trước. Tách dữ liệu fixture theo test để tránh tác động qua lại.
- Có coupon local hợp lệ và coupon không hợp lệ/không tồn tại; ghi trước điều kiện sử dụng, hạn dùng và phạm vi áp dụng.
- Có ít nhất một địa chỉ giao hàng hợp lệ và dữ liệu địa chỉ thiếu/sai trường bắt buộc. Quốc gia, tỉnh và postcode phải tương thích cấu hình shipping local.
- Có một phương thức giao hàng local khả dụng và Check/Money Order được cài/kích hoạt nếu dùng cho xác nhận thành công. Payment decline cần test processor local; nếu không có thì kết quả được ghi là chưa kiểm thử, không giả lập bằng PayPal thật.
- Giá, thuế, phí shipping, coupon và tiền tệ được cố định trong fixture để so sánh kết quả nhất quán; mục tiêu là kiểm tra tổng tiền theo cấu hình hiện hành, không xác nhận chính sách tính thuế tổng quát.
- Môi trường baseline chạy checkout nhiều bước như đề xuất. Các setting quan trọng (anonymous checkout, one-page checkout, inventory/backorder, plugin đang bật) phải được lưu trong README/log chạy test.

## 6. Tiêu chí Pass/Fail

Một test **Pass** khi hành vi quan sát được khớp với expected result, dữ liệu được lưu đúng và không có lỗi ngoài dự kiến. Test **Fail** khi có sai lệch; ghi lại input/fixture, cấu hình, log, kết quả thực tế và mã nguồn liên quan.

- Thao tác thêm/cập nhật/xóa lưu đúng sản phẩm, thuộc tính và số lượng; quantity không hợp lệ không được âm/0 hoặc vượt giới hạn nghiệp vụ.
- Hàng hết/vượt kho hoặc tổ hợp biến thể không hợp lệ bị từ chối/cảnh báo theo cấu hình; không xác nhận được số lượng vượt mức cho phép khi không bật backorder.
- Coupon hợp lệ áp dụng đúng trạng thái/tổng giảm; coupon không hợp lệ không được đánh dấu đã áp dụng; gỡ coupon loại bỏ hiệu lực của coupon.
- Địa chỉ/checkout thiếu dữ liệu bắt buộc, giỏ rỗng hoặc lựa chọn shipping/payment không khả dụng không được đi tới đặt đơn thành công.
- Luồng thành công tạo đúng một order với đúng line item, số lượng và tổng tiền theo fixture; giỏ được dọn sau khi đặt thành công.
- Payment decline giả lập phải trả lỗi quan sát được, không báo hoàn tất/thanh toán thành công và không tạo đơn thành công trùng lặp; nếu không có processor giả lập, ghi rõ kịch bản chưa chạy.
- Ma trận K06 đạt 100% coverage các cặp mức khả thi được khai báo trong model; lưu model, generated cases, constraints, lệnh chạy và report. Các ca biên/negative bắt buộc phải có kết quả riêng, không tính thay cho pair coverage.

## 7. Rủi ro chính

- Setting cửa hàng hoặc plugin chưa bật làm ẩn/bỏ qua bước checkout, khiến test không chạy đúng luồng dự kiến.
- Thay đổi tồn kho/coupon/đơn hàng giữa các test làm dữ liệu pairwise không còn độc lập; cần fixture reset hoặc dữ liệu riêng.
- Tồn kho theo thuộc tính có quy tắc khác tồn kho sản phẩm thường; chỉ kiểm tra số lượng tổng sẽ bỏ sót lỗi của biến thể.
- Nhiều constraint giữa sản phẩm, địa chỉ, shipping và payment làm giảm số cặp khả thi; cần lưu constraint và coverage thực tế, không báo 100% trên các cặp bị loại.
- Check/Money Order là phương thức offline và không mô phỏng decline; nếu không có test processor, nhánh decline là thiếu bằng chứng kiểm thử.
- Thay đổi plugin/cấu hình shipping/payment, locale hoặc dữ liệu thuế có thể đổi tổng tiền và kết quả; baseline phải được cố định trước khi chạy.
- Xác nhận đơn là thao tác có side effect; chạy lại test cần dọn order/cart và tránh gửi email/giao dịch thật.

## 8. Review và trạng thái

- [ ] **Trang:** review danh sách chức năng trong/ngoài phạm vi và các luồng nghiệp vụ chính.
- [ ] **Linh:** review giả định, rủi ro và tiêu chí Pass/Fail.
- Xác nhận của Trang: chưa có.
- Xác nhận của Linh: chưa có.
- Trạng thái: bản dự thảo; chờ cả hai reviewer hoàn tất phần được phân công và xác nhận.
- Trạng thái: bản dự thảo chờ Trang và Linh review; chưa ghi nhận acceptance cho đến khi hai reviewer xác nhận.

## 9. Căn cứ mã nguồn

- `src/Presentation/Nop.Web/Controllers/ShoppingCartController.cs`: thêm/cập nhật/xóa sản phẩm, checkout từ cart, áp dụng/gỡ discount coupon.
- `src/Presentation/Nop.Web/Controllers/CheckoutController.cs`: địa chỉ, shipping method, payment method/info, xác nhận và đặt đơn.
- `src/Libraries/Nop.Services/Orders/ShoppingCartService.cs`: kiểm tra quantity, stock thường, stock theo thuộc tính và cảnh báo giỏ.
- `src/Libraries/Nop.Services/Orders/OrderProcessingService.cs`: gọi payment processor, tạo order khi payment thành công và trả lỗi khi payment thất bại.
- `src/Plugins/Nop.Plugin.Payments.CheckMoneyOrder/CheckMoneyOrderPaymentProcessor.cs`: payment offline; `ProcessPaymentAsync` trả kết quả mặc định, không mô phỏng từ chối thanh toán.
