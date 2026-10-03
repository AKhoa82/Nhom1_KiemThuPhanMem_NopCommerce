# T04-T05 - Đặc tả nghiệp vụ Shopping Cart, Checkout và Payment

## 1. Thông tin tài liệu

| Thuộc tính | Giá trị |
| --- | --- |
| Task | T05 - Đặc tả nghiệp vụ Checkout và Payment |
| Phần phụ trách | `[Trang] Viết scenario shipping, payment failure và tồn kho` |
| Người thực hiện | Trần Thị Phương Trang |
| Reviewer | Lê Anh Khoa, Đỗ Đặng Diệu Linh |
| Source baseline | `674d0ceef6bd8a52fe74d6f4fff326960162cec0` |
| Checkout mode | Multi-step checkout |
| Trạng thái | Draft - chờ review |

Tài liệu này là deliverable dùng chung của T04-T05. Phần hiện tại chỉ đặc tả
đúng phạm vi được giao cho Trang. Các scenario về customer đăng nhập, guest,
địa chỉ, payment thành công, xác nhận order thành công nói chung và kiểm tra
tổng tiền cuối cùng do thành viên được phân công tương ứng bổ sung.

## 2. Quy ước chung cho phần của Trang

### 2.1. Fixture và cấu hình

- Storefront và database đã được dựng theo [`setup.md`](../../setup.md).
- Dùng multi-step checkout; không trộn one-page checkout vào cùng lượt kiểm thử.
- Customer, billing address và shipping address đã hợp lệ. Đây chỉ là
  precondition, không phải đối tượng kiểm thử trong các scenario của Trang.
- Giỏ hàng chỉ chứa sản phẩm vật lý `PW-Simple-Stock`, có quản lý tồn kho và
  không cho backorder.
- Sản phẩm yêu cầu giao hàng; quantity trong giỏ là số nguyên dương.
- Shipping dùng provider local đã được cài và kích hoạt, ưu tiên
  `Shipping.FixedByWeightByTotal`; không gọi hãng vận chuyển bên ngoài.
- Payment failure chỉ được chạy với payment processor giả lập chạy hoàn toàn
  local và trả lỗi có thể quan sát. `Payments.CheckMoneyOrder` không được dùng
  để giả lập payment decline.
- Ghi lại commit SHA, cấu hình thực tế, tên shipping method và dữ liệu tồn kho
  khi thực thi scenario. Không ghi mật khẩu, cookie hoặc token vào evidence.

### 2.2. Invariant dùng chung

- Trước khi xác nhận order thành công, không được phát sinh order mới.
- Một lần bấm xác nhận không được tạo nhiều hơn một order.
- Checkout thất bại không được tạo order có `OrderStatus = Complete`.
- Checkout hoặc payment thất bại không được tạo order có
  `PaymentStatus = Paid`.
- Checkout thất bại không được tự ý xóa giỏ hàng của customer.
- Tồn kho không được âm và không được bán vượt quá lượng tồn kho khả dụng khi
  backorder bị tắt.

## 3. Ma trận scenario thuộc phạm vi Trang

| ID | Nhóm | Mục tiêu | Nhánh | Sẵn sàng thực thi |
| --- | --- | --- | --- | --- |
| `SHP-01` | Shipping | Hiển thị và chọn shipping method local hợp lệ | Thành công | Ready khi fixture có shipping method local |
| `SHP-02` | Shipping | Từ chối lựa chọn shipping rỗng, sai định dạng hoặc không còn khả dụng | Thất bại | Ready |
| `PAY-FAIL-01` | Payment | Xử lý payment processor trả về decline/error | Thất bại | Blocked đến khi có fake processor local |
| `INV-01` | Inventory | Chặn đặt hàng khi tồn kho giảm xuống không đủ trong lúc checkout | Thất bại | Ready |

## 4. Scenario shipping

### SHP-01 - Chọn phương thức giao hàng local hợp lệ

**Mục tiêu**

Xác minh checkout hiển thị các shipping method local khả dụng cho giỏ hàng và
địa chỉ hiện tại; customer chọn được từng lựa chọn hợp lệ và đi tiếp tới bước
Payment Method.

**Preconditions**

1. Các fixture và cấu hình tại mục 2.1 đã sẵn sàng.
2. `Bypass shipping method selection if only one` được tắt để màn hình lựa
   chọn luôn xuất hiện.
3. Provider local có ít nhất một shipping option khả dụng cho địa chỉ test.
4. Customer đang ở bước Shipping Method của checkout.

**Input/Test data**

Lặp scenario cho từng shipping option local được hệ thống trả về. Khi chạy,
ghi lại dữ liệu thực tế theo mẫu:

| Data set | Shipping option | Provider | Phí hiển thị |
| --- | --- | --- | ---: |
| `SHP-01-DS01` | `<tên option thực tế>` | `Shipping.FixedByWeightByTotal` | `<giá trị thực tế>` |

Phí chỉ được ghi nhận để nhận diện đúng option; việc kiểm tra công thức tổng
tiền cuối cùng không thuộc phạm vi của Trang.

**Steps**

1. Mở bước Shipping Method.
2. Ghi lại danh sách shipping option local đang hiển thị.
3. Chọn shipping option của data set hiện tại.
4. Bấm **Next**.
5. Quay lại bước Shipping Method hoặc kiểm tra checkout state để xác nhận lựa
   chọn đã được lưu.
6. Lặp lại từ bước 1 cho các shipping option local còn lại, nếu có.

**Expected result**

- Mỗi shipping option khả dụng hiển thị đúng tên provider/option và phí tương
  ứng với cấu hình local.
- Lựa chọn hợp lệ được chấp nhận và được lưu vào checkout state của customer.
- Customer được chuyển tới bước Payment Method.
- Khi quay lại, option vừa chọn vẫn được chọn.
- Chưa có order mới được tạo ở bước này.

**OrderStatus/PaymentStatus**

- Không áp dụng vì chưa tạo order.
- Số order mới phát sinh sau scenario phải bằng `0`.

**Invariants**

- Chọn shipping không làm thay đổi product, attribute hoặc quantity trong cart.
- Không xuất hiện provider bên ngoài chưa được cấu hình cho lượt kiểm thử.
- Không tạo order và không xử lý payment tại bước Shipping Method.

### SHP-02 - Shipping method rỗng, sai định dạng hoặc không còn khả dụng

**Mục tiêu**

Xác minh server không chấp nhận request thiếu shipping option, có giá trị sai
định dạng hoặc trỏ tới option không nằm trong danh sách hiện được cung cấp.

**Preconditions**

1. Các fixture và cấu hình tại mục 2.1 đã sẵn sàng.
2. Customer đang ở bước Shipping Method.
3. Giỏ hàng yêu cầu shipping và không chọn pickup.
4. Customer chưa có selected shipping option từ lần checkout trước; nếu có,
   phải xóa lựa chọn cũ trước khi chạy scenario.

**Input/Test data**

| Data set | Giá trị `shippingoption` | Ý nghĩa |
| --- | --- | --- |
| `SHP-02-DS01` | Rỗng | Không chọn shipping method |
| `SHP-02-DS02` | `invalid-value` | Không đúng cấu trúc `option___provider` |
| `SHP-02-DS03` | `Unknown___Shipping.FixedByWeightByTotal` | Option không có trong danh sách khả dụng |

`SHP-02-DS03` cũng có thể được thực hiện bằng cách chọn một option hợp lệ,
sau đó vô hiệu hóa option đó trước khi gửi request tiếp theo.

**Steps**

1. Ghi nhận số order hiện có của customer và trạng thái giỏ hàng.
2. Gửi bước Shipping Method với data set cần kiểm tra.
3. Quan sát trang/section mà server trả về.
4. Kiểm tra shipping selection trong checkout state.
5. Kiểm tra lại số order và giỏ hàng.

**Expected result**

- Customer vẫn ở hoặc được đưa lại bước Shipping Method.
- Giá trị rỗng, sai định dạng hoặc không khả dụng không được lưu làm selected
  shipping option.
- Customer không được đi tiếp bằng dữ liệu shipping không hợp lệ.
- Không có order mới được tạo; cart vẫn giữ nguyên.
- Không yêu cầu bắt buộc phải có thông báo lỗi riêng vì implementation hiện
  tại có thể chỉ render lại bước Shipping Method.

**OrderStatus/PaymentStatus**

- Không áp dụng vì không có order mới.
- Không được tồn tại order mới có `OrderStatus = Complete` hoặc
  `PaymentStatus = Paid` từ request này.

**Invariants**

- Server phải xác minh option theo danh sách được provider cung cấp, không chỉ
  tin giá trị từ client.
- Request shipping không hợp lệ không làm thay đổi cart hoặc tạo order.

## 5. Scenario payment failure

### PAY-FAIL-01 - Payment processor local từ chối giao dịch

**Mục tiêu**

Xác minh checkout xử lý an toàn khi payment processor giả lập trả về lỗi
decline: hiển thị lỗi, không hoàn tất checkout và không lưu order thành công.

**Execution readiness**

`Blocked` cho đến khi nhóm cung cấp một payment processor giả lập có thể cài
và chọn trên storefront. Processor `Payments.TestMethod` hiện chỉ nằm trong
test assembly, còn `Payments.CheckMoneyOrder` không mô phỏng decline.

**Preconditions**

1. Các fixture và cấu hình chung tại mục 2.1 đã sẵn sàng.
2. Nhóm đã cung cấp fake payment processor local có hành vi xác định:
   `ProcessPaymentResult.Success = false` và có ít nhất một error, ví dụ
   `Payment declined`.
3. Fake processor đã được cài, kích hoạt và chọn cho checkout.
4. Cart, tồn kho, address và shipping đều hợp lệ để lỗi duy nhất đến từ
   payment processor.
5. Customer đang ở bước Confirm Order.

**Input/Test data**

| Thuộc tính | Giá trị |
| --- | --- |
| Payment method | `<system name của fake processor>` |
| Processor response | Decline/error xác định trước |
| Cart quantity | `1` |
| Retry count | `1` lần sau lần decline đầu tiên |

**Steps**

1. Ghi nhận số order hiện có của customer và nội dung cart.
2. Xác nhận fake processor đang ở chế độ decline.
3. Tại Confirm Order, bấm **Confirm** một lần.
4. Quan sát response và warning trên trang Confirm.
5. Kiểm tra order của customer trong Admin hoặc database bằng truy vấn chỉ đọc.
6. Kiểm tra cart vẫn còn sản phẩm.
7. Gửi lại thao tác Confirm thêm một lần khi processor vẫn decline.
8. Kiểm tra lại số order để phát hiện order trùng.

**Expected result**

- Checkout hiển thị payment error do processor trả về và không chuyển đến
  trang Completed.
- Số order của customer không tăng sau cả lần đầu và lần retry.
- Vì payment thất bại trước bước lưu order, không có `OrderStatus` hoặc
  `PaymentStatus` mới được tạo.
- Không tồn tại order mới có `OrderStatus = Complete`.
- Không tồn tại order mới có `PaymentStatus = Paid`.
- Cart vẫn giữ đúng product và quantity để customer có thể thử lại hoặc chọn
  phương thức khác.

**OrderStatus/PaymentStatus**

- Expected `OrderStatus`: `N/A - không tạo order`.
- Expected `PaymentStatus`: `N/A - không tạo order`.
- Assertion bổ sung: số order mới có `Complete` hoặc `Paid` đều bằng `0`.

**Invariants**

- Payment decline không được biến thành success ở UI hoặc dữ liệu lưu trữ.
- Retry một request bị decline không được tạo order trùng.
- Không gửi giao dịch tới cổng payment thật.

**Blocker resolution**

Trước khi chuyển scenario sang Ready, reviewer/owner payment phải ghi trên Jira:

1. System name và phiên bản fake processor.
2. Cách cài/kích hoạt và cách bật chế độ decline.
3. Error dự kiến mà processor trả về.
4. Bằng chứng processor chạy local và không gọi dịch vụ thanh toán thật.

## 6. Scenario tồn kho thay đổi trong checkout

### INV-01 - Tồn kho giảm xuống không đủ trước khi xác nhận order

**Mục tiêu**

Xác minh hệ thống kiểm tra lại tồn kho tại thời điểm đặt hàng và chặn checkout
khi sản phẩm đủ hàng lúc bắt đầu nhưng không còn đủ trước khi bấm Confirm.

**Preconditions**

1. Các fixture và cấu hình chung tại mục 2.1 đã sẵn sàng.
2. `PW-Simple-Stock` dùng `Track inventory`, tắt backorder và có stock ban đầu
   là `5`.
3. Cart chứa `PW-Simple-Stock`, quantity `5`.
4. Address, shipping và payment method local đã hợp lệ. Các dữ liệu này chỉ là
   precondition, không phải đối tượng kiểm thử.
5. Customer đã tới bước Confirm Order nhưng chưa bấm Confirm.

**Input/Test data**

| Thuộc tính | Trước checkout | Ngay trước Confirm |
| --- | ---: | ---: |
| Cart quantity | 5 | 5 |
| Available stock | 5 | 4 |
| Backorder | Off | Off |

**Steps**

1. Ghi nhận số order hiện có, cart quantity và stock ban đầu.
2. Đi qua checkout đến bước Confirm Order.
3. Trong một phiên Admin riêng, giảm stock của `PW-Simple-Stock` từ `5` xuống
   `4` và lưu thay đổi.
4. Quay lại phiên customer và bấm **Confirm**.
5. Quan sát warning/response của checkout.
6. Kiểm tra số order, cart và stock sau request.
7. Không tăng stock trở lại trước khi đã lưu evidence của kết quả.

**Expected result**

- Hệ thống kiểm tra lại cart item và phát hiện quantity `5` vượt stock `4`.
- Confirm Order không thành công và không chuyển tới trang Completed.
- Warning tồn kho được hiển thị trên trang Confirm.
- Không có order mới được tạo, do validation xảy ra trước xử lý payment và
  trước khi lưu order.
- Không có payment thành công.
- Cart vẫn chứa sản phẩm để customer giảm quantity hoặc xóa item.
- Stock giữ ở `4`, không bị trừ thêm và không âm.

**OrderStatus/PaymentStatus**

- Expected `OrderStatus`: `N/A - không tạo order`.
- Expected `PaymentStatus`: `N/A - payment chưa được xử lý`.
- Không được tồn tại order mới có `OrderStatus = Complete` hoặc
  `PaymentStatus = Paid`.

**Invariants**

- `ordered quantity <= available stock` khi backorder bị tắt.
- Validation tồn kho phải xảy ra lại tại thời điểm place order, không chỉ khi
  add-to-cart.
- Thất bại do tồn kho không được làm mất cart hoặc trừ stock lần nữa.

**Cleanup**

Sau khi lưu evidence, đưa stock của `PW-Simple-Stock` về giá trị fixture đã
thống nhất và xóa dữ liệu order thử nếu nhóm có quy trình cleanup riêng. Không
xóa container/database khi các thành viên khác vẫn cần fixture.

## 7. Traceability với mã nguồn và yêu cầu

| Nội dung | Điểm đối chiếu |
| --- | --- |
| Hiển thị/chọn shipping method | [`CheckoutController.ShippingMethod` và `SelectShippingMethod`](../../src/Presentation/Nop.Web/Controllers/CheckoutController.cs) |
| Shipping rỗng/sai/không tìm thấy | `SelectShippingMethod` render lại bước Shipping Method |
| Xác nhận order và hiển thị warning | [`CheckoutController.ConfirmOrder`](../../src/Presentation/Nop.Web/Controllers/CheckoutController.cs) |
| Payment error không lưu order | [`OrderProcessingService.PlaceOrderAsync`](../../src/Libraries/Nop.Services/Orders/OrderProcessingService.cs) chỉ lưu khi `ProcessPaymentResult.Success` |
| Kiểm tra lại cart/tồn kho | `PrepareAndValidateShoppingCartAndCheckoutAttributesAsync` gọi lại cart warnings trước khi xử lý payment |
| Giới hạn payment decline | [`scope.md`](../../scope.md) yêu cầu fake processor local; Check/Money Order không mô phỏng decline |

## 8. Checklist bàn giao phần của Trang

- [x] Có scenario shipping hợp lệ.
- [x] Có scenario shipping rỗng/sai/không còn khả dụng.
- [x] Có scenario payment decline và ghi rõ blocker thực thi.
- [x] Có scenario tồn kho thay đổi trong lúc checkout.
- [x] Mỗi scenario có precondition, input, steps, expected result và invariant.
- [x] Có kiểm tra `OrderStatus` và `PaymentStatus` ở các nhánh thất bại.
- [x] Có cả nhánh thành công và thất bại trong phần được giao.
- [x] Không kiểm thử payment gateway hoặc shipping provider thật.
- [x] Không mở rộng sang guest, address, payment thành công, xác nhận order
  thành công nói chung hoặc công thức tổng tiền cuối cùng.
- [ ] Khoa review nội dung và xác nhận trên PR/Jira.
- [ ] Linh review nội dung và xác nhận trên PR/Jira.
