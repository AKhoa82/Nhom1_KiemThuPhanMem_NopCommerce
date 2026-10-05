# T06 - Plan của Trang: kiểm tra factor Checkout và Payment

## 1. Mục tiêu

Rà soát và đề xuất phần model Pairwise thuộc phạm vi Checkout/Payment của T06, gồm:

- Factor và value liên quan đến loại khách, địa chỉ, phương thức giao hàng và phương thức thanh toán.
- Constraint giữa các value.
- Tổ hợp không hợp lệ cần loại khỏi model.
- Tổ hợp cần kiểm tra exhaustive thay vì chỉ kiểm tra pairwise.
- Tiêu chí để xác nhận coverage cho phần Checkout/Payment.

File này là kế hoạch review của Trang. Không sinh test case Pairwise, không viết model PICT và không chạy test trong phạm vi T06 của Trang.

## 2. Phạm vi

### Trong phạm vi

- Kiểm tra factor/value của Checkout và Payment.
- Đối chiếu value với cấu hình local và baseline trong `scope.md`.
- Kiểm tra tính khả thi của shipping method và payment method.
- Xác định constraint, tổ hợp không hợp lệ và các trường hợp phải exhaustive.
- Ghi nhận kết quả review để Linh cập nhật model chung.

### Ngoài phạm vi

- Chọn hoặc đặc tả factor sản phẩm, biến thể, quantity, tồn kho, coupon và số lượng sản phẩm.
- Tạo fixture Admin hoặc thay đổi cấu hình cửa hàng.
- Sinh ma trận Pairwise, viết file `model.pict` hoặc `generated-cases.csv`.
- Viết automation, chạy checkout thực tế hoặc kiểm tra payment gateway thật.
- Kiểm tra nghiệp vụ sau checkout như hoàn tiền, hủy đơn, email hoặc báo cáo.

Các yếu tố ngoài phạm vi chỉ được dùng làm precondition tối thiểu: cart phải có sản phẩm hợp lệ và, khi kiểm tra shipping, sản phẩm phải cần giao hàng.

## 3. Factor/value đề xuất để review

| Factor | Value cần review | Lý do đưa vào model | Cách xác nhận |
| --- | --- | --- | --- |
| Loại khách hàng | `Registered`, `Guest` | Có thể thay đổi bước địa chỉ, trạng thái đăng nhập và khả năng đi qua checkout. | Xác nhận `Guest` chỉ được giữ khi anonymous checkout đang bật; nếu tắt thì loại khỏi model. |
| Địa chỉ checkout | `ValidComplete`, `MissingRequiredField` | Kiểm tra checkout cho phép đi tiếp với địa chỉ hợp lệ và chặn dữ liệu thiếu. | Dùng một địa chỉ local hợp lệ; tạo một dữ liệu thiếu trường bắt buộc, không dùng dữ liệu thật. |
| Shipping method | `ShippingMethod1`, `ShippingMethod2` | Phương thức giao hàng có thể ảnh hưởng bước chọn shipping và total. | Đối chiếu với các phương thức local đang khả dụng; không tự tạo value nếu môi trường chỉ có một phương thức. |
| Payment method | `PaymentSuccess`, `PaymentFailure` | Kiểm tra nhánh đặt hàng thành công và nhánh payment bị từ chối. | `PaymentSuccess` dùng payment local khả dụng. `PaymentFailure` chỉ giữ khi có processor giả lập local có thể tái lập. |

### Quy ước value

- `ShippingMethod1` và `ShippingMethod2` là tên logic của hai phương thức đã được xác minh, không phải tên giả định để đưa thẳng vào test.
- `PaymentSuccess` không đồng nghĩa với giao dịch thật; chỉ dùng payment local được cấu hình cho môi trường test.
- `PaymentFailure` không được mô phỏng bằng PayPal, ngân hàng hoặc cổng thanh toán thật.
- Nếu một value không tồn tại hoặc không tái lập được trên baseline, ghi `Not available` và loại khỏi model thay vì đánh dấu Pass giả định.

## 4. Constraint cần kiểm tra

| ID | Constraint | Hành động khi review |
| --- | --- | --- |
| `T06-C01` | `Guest` chỉ hợp lệ khi anonymous checkout được bật. | Nếu anonymous checkout tắt, loại mọi tổ hợp có `Guest`. |
| `T06-C02` | `MissingRequiredField` không được đi tới bước shipping/payment hoặc confirm. | Giữ để kiểm tra negative; không ghép với expected result của checkout thành công. |
| `T06-C03` | Shipping method chỉ hợp lệ khi có sản phẩm cần giao hàng và phương thức đó đang khả dụng. | Không tạo tổ hợp shipping cho cart không cần ship. |
| `T06-C04` | Payment method phải là plugin local được cài và kích hoạt. | Chỉ giữ value đã xác minh trong môi trường test. |
| `T06-C05` | `PaymentFailure` chỉ hợp lệ khi có payment processor giả lập local hỗ trợ kết quả từ chối. | Nếu không có processor, ghi nhận là chưa khả dụng và không sinh case giả lập. |
| `T06-C06` | Checkout bắt đầu từ cart không rỗng và không có lỗi tồn kho chưa xử lý. | Dùng đây là precondition chung, không biến thành factor của phần Trang. |
| `T06-C07` | Một lượt chạy không trộn cấu hình one-page checkout với checkout nhiều bước. | Khóa một cấu hình trước khi review/chạy model. |
| `T06-C08` | `PaymentFailure` không được kỳ vọng tạo đơn thành công hoặc tạo trùng đơn. | Expected result phải là lỗi hiển thị, không có đơn thành công và không tạo trùng. |

## 5. Tổ hợp không hợp lệ phải loại khỏi model

Các tổ hợp sau không được tính vào mẫu Pairwise khả thi:

1. `Guest` khi anonymous checkout bị tắt.
2. `MissingRequiredField` kết hợp với kết quả checkout thành công hoặc đi tới Payment.
3. Bất kỳ shipping method nào khi cart không có sản phẩm cần giao hàng.
4. Shipping method không tồn tại hoặc không được bật trong môi trường local.
5. `PaymentFailure` khi không có processor giả lập local.
6. Payment method không tồn tại, bị tắt hoặc không được hỗ trợ bởi cấu hình hiện tại.
7. `PaymentSuccess` nhưng địa chỉ vẫn `MissingRequiredField`.
8. Tổ hợp dùng cart rỗng, sản phẩm hết hàng hoặc quantity vượt tồn kho làm precondition cho checkout thành công. Các trạng thái này do phạm vi sản phẩm/tồn kho xử lý; ở đây chỉ ghi nhận là điều kiện loại trừ.

## 6. Tổ hợp cần exhaustive testing

Pairwise không thay thế các ca bắt buộc sau:

| Tổ hợp/nhánh | Lý do exhaustive | Kết quả cần xác minh |
| --- | --- | --- |
| `Registered` + `ValidComplete` + shipping khả dụng + `PaymentSuccess` | Luồng checkout thành công cơ bản. | Đơn được tạo đúng một lần; giữ đúng cart/giá trị; trạng thái sau đặt hàng đúng cấu hình. |
| `Guest` + `ValidComplete` + shipping khả dụng + `PaymentSuccess` (chỉ khi Guest hợp lệ) | Luồng thành công riêng của anonymous checkout. | Guest đi qua đúng các bước và không bị yêu cầu dữ liệu đăng nhập ngoài cấu hình. |
| Mỗi loại khách + `MissingRequiredField` | Negative bắt buộc, không chỉ kiểm tra cặp. | Bị chặn tại bước địa chỉ; không đi tiếp sang shipping/payment. |
| Mỗi payment method có `PaymentFailure` khả dụng | Payment decline là nhánh rủi ro và cần kết quả xác định. | Hiển thị lỗi; không có đơn thanh toán thành công; không tạo trùng đơn. |
| Mỗi shipping method khả dụng với cart cần giao hàng | Đảm bảo từng phương thức thực tế hoạt động. | Chọn được phương thức và checkout tiếp tục đúng khi các dữ liệu khác hợp lệ. |
| Cart không cần giao hàng | Tránh áp shipping không hợp lệ. | Không xuất hiện hoặc không yêu cầu chọn shipping theo cấu hình. |

Nếu môi trường chỉ có một shipping method hoặc không có payment processor decline, ghi rõ giới hạn này trong kết quả review; không mở rộng phạm vi bằng cách kiểm tra gateway thật.

## 7. Tiêu chí Pairwise coverage cho phần Trang

Model được xem là đạt phần review Checkout/Payment khi:

- Mỗi factor đã có value cụ thể, có nguồn xác nhận và không chứa value giả định chưa kiểm chứng.
- Mọi cặp value khả thi giữa các factor trong phạm vi Trang xuất hiện ít nhất một lần trong model/case được Linh sinh.
- Các cặp không khả thi được loại bằng constraint và có lý do rõ ràng.
- Coverage chỉ tính trên các cặp khả thi; không tính tổ hợp bị loại hoặc value `Not available`.
- `Guest`, `PaymentFailure` và `ShippingMethod2` chỉ được tính coverage khi precondition tương ứng đã được xác minh.
- Các nhánh exhaustive ở mục 6 được báo cáo riêng, không dùng pairwise coverage để thay thế.
- Kết quả review phải chỉ ra factor/value nào được giữ, loại hoặc cần xác minh thêm.

## 8. Kế hoạch thực hiện của Trang

| Bước | Công việc | Đầu ra |
| --- | --- | --- |
| 1 | Đọc `scope.md`, `setup.md` và cấu hình checkout baseline. | Danh sách value ứng viên và giả định cần khóa. |
| 2 | Xác nhận anonymous checkout, checkout mode và các shipping/payment plugin local. | Bảng value khả dụng/không khả dụng. |
| 3 | Đối chiếu từng factor/value với constraint và tổ hợp không hợp lệ. | Danh sách constraint `T06-C01` đến `T06-C08`. |
| 4 | Kiểm tra các nhánh cần exhaustive theo mục 6. | Danh sách case bắt buộc ngoài Pairwise. |
| 5 | Gửi nhận xét cho Linh để cập nhật model T06. | Review comment theo factor/constraint; không sửa sang phần factor ngoài phạm vi. |
| 6 | Xác nhận model sau khi Linh cập nhật. | Xác nhận Trang/Linh về model và coverage criteria. |

## 9. Acceptance checklist cho phạm vi của Trang

- [ ] Có bảng factor/value của Checkout và Payment.
- [ ] Mỗi factor có lý do lựa chọn và cách xác nhận value.
- [ ] Có constraint giữa Guest, address, shipping và payment.
- [ ] Có danh sách tổ hợp không hợp lệ cần loại.
- [ ] Có danh sách tổ hợp Checkout/Payment cần exhaustive.
- [ ] Có tiêu chí coverage trên các cặp khả thi.
- [ ] Đã ghi rõ giới hạn nếu thiếu shipping method hoặc payment processor giả lập.
- [ ] Đã gửi review cho Linh và nhận xác nhận model sau cập nhật.

## 10. Kết quả rà soát bước 1-2

### 10.1. Phát hiện từ tài liệu và source baseline

| Hạng mục | Kết quả hiện tại | Tác động lên model |
| --- | --- | --- |
| Anonymous checkout | Source installer đặt `AnonymousCheckoutAllowed = true`; chưa thay thế cho xác nhận setting của instance đang chạy. | Giữ `Guest` ở trạng thái conditional; cần xác nhận runtime trước khi tính coverage. |
| Checkout mode | Đã chốt dùng multi-step; source installer mặc định `OnePageCheckoutEnabled = true`. | Cần cấu hình instance chạy thành `false` trước khi sinh/chạy model; không trộn one-page và multi-step. |
| Shipping | Source installer chỉ khai báo provider `Shipping.FixedByWeightByTotal`. | Chưa có bằng chứng cho `ShippingMethod2`; chỉ giữ một shipping value nếu runtime không có option local thứ hai. |
| Payment thành công | Source installer khai báo `Payments.CheckMoneyOrder`; plugin local tồn tại trong source. | Có thể giữ `PaymentSuccess` sau khi xác nhận plugin được cài và bật trên instance. Trạng thái order cần ghi đúng là payment pending nếu đó là hành vi của plugin. |
| Payment thất bại | Chưa tìm thấy fake payment processor local trong source hiện có; Check/Money Order không mô phỏng decline. | `PaymentFailure`/`SimulatedDecline` phải để `Blocked` hoặc loại khỏi model; không thay bằng gateway thật. |
| Baseline SHA | Đã thống nhất `674d0ceef6bd8a52fe74d6f4fff326960162cec0` và đồng bộ trong `scope.md`/`setup.md`. | Có thể dùng SHA này làm baseline; vẫn phải ghi lại SHA khi sinh/chạy model. |

### 10.2. Kết luận review sơ bộ của Trang

- Các factor `CustomerType`, `Address`, `ShippingMethod` và `PaymentMethod` là phù hợp với phạm vi Checkout/Payment.
- `Guest`, `ShippingMethod2` và `SimulatedDecline` chưa được coi là value khả thi đã xác nhận.
- `MissingRequired` là nhánh negative cần giữ, nhưng phải dừng trước shipping/payment theo constraint.
- `PaymentSuccess` chỉ được xác nhận với payment local; không gọi hoặc mô phỏng gateway bên ngoài.
- Hai blocker về quyết định Checkout mode và baseline SHA đã được xử lý ở cấp tài liệu. Model chung chỉ được `Approved` sau khi instance đã áp dụng multi-step và Linh cập nhật `model.pict`.

### 10.3. Việc cần Linh/nhóm xác nhận tiếp

1. Cấu hình instance chạy theo multi-step (`OnePageCheckoutEnabled=false`) và lưu bằng chứng cấu hình.
2. Xác nhận instance chạy đúng baseline `674d0ceef6bd8a52fe74d6f4fff326960162cec0`.
3. Ghi lại runtime setting của anonymous checkout, shipping plugin và payment plugin.
4. Quyết định rõ `ShippingMethod2` và `SimulatedDecline` là `Included`, `Excluded` hay `Blocked` trước khi sinh pairwise.
