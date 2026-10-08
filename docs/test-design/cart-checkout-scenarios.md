# T04-T05 - Đặc tả nghiệp vụ Shopping Cart, Checkout và Payment

## 1. Thông tin tài liệu

| Thuộc tính | Giá trị |
| --- | --- |
| Task | T05 - Đặc tả nghiệp vụ Checkout và Payment |
| Phần phụ trách | `[Khoa] Checkout thành công và validation`; `[Trang] Shipping, payment failure và tồn kho` |
| Người thực hiện | Khoa (scenario Checkout và validation); Trần Thị Phương Trang (scenario shipping, payment failure và tồn kho) |
| Reviewer | Lê Anh Khoa (phần của Trang); Đỗ Đặng Diệu Linh (toàn bộ tài liệu) |
| Source baseline | `674d0ceef6bd8a52fe74d6f4fff326960162cec0` |
| Checkout mode | Multi-step checkout |
| Trạng thái | Draft - chờ review |

Tài liệu này là deliverable dùng chung của T04-T05, gồm scenario Checkout và
validation do Khoa phụ trách cùng scenario shipping, payment failure và tồn
kho do Trang phụ trách. Trạng thái review được theo dõi riêng trên PR/Jira;
không đánh dấu scenario đã review chỉ dựa trên nội dung tài liệu.

## 2. Quy ước chung và fixture

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

### 2.3. Fixture và cấu hình cho Checkout/validation

- Dùng fixture tổng hợp, không chứa dữ liệu cá nhân thật. Ghi nhận SHA của
  source, store, currency, tax settings, địa chỉ test và tên payment method
  thực tế trước mỗi lượt chạy.
- Dùng multi-step checkout với một sản phẩm vật lý `PW-Simple-Stock`, quantity
  `1`, stock đủ hàng và backorder tắt. Bật một shipping method local có thể
  giao tới địa chỉ test.
- `CHK-01` yêu cầu customer đã đăng nhập và có cart. `CHK-02` chỉ chạy khi
  `OrderSettings.AnonymousCheckoutAllowed = true`; nếu tắt, ghi scenario là
  `N/A` cùng cấu hình đã kiểm tra, không tính là lần chạy guest thành công.
- Với address validation, cấu hình `CustomerSettings.FirstNameEnabled` và
  `CustomerSettings.FirstNameRequired` là `true`. Các trường còn lại phải
  khớp yêu cầu hiện hành của Customer Settings, Address Settings, quốc gia
  chọn và address attributes. Kiểm tra validation phía server, không chỉ trạng
  thái HTML/JavaScript ở trình duyệt.
- Chỉ dùng payment method đã bật và xác nhận chạy hoàn toàn local. Dùng
  `Payments.CheckMoneyOrder` làm payment method cơ sở nếu plugin được cài và
  bật; không dùng payment gateway thật. Method này chấp nhận tạo order nhưng
  không thu tiền tự động, vì vậy trạng thái payment mong đợi là `Pending`,
  không phải `Paid`.
- Trước mỗi data set, ghi số order hiện có, cart, stock và cấu hình checkout;
  sau khi hoàn tất, đối chiếu order mới bằng customer/order ID và lưu tổng tiền
  từng thành phần ở độ chính xác currency của store.

### 2.4. Quy ước xác nhận kết quả

- `OrderStatus` và `PaymentStatus` được đối chiếu trên order đã lưu, không suy
  ra chỉ từ nội dung trang Completed. Các giá trị status dùng đúng tên enum
  trong ứng dụng.
- Với tổng tiền, tính độc lập theo đúng cấu hình store:
  `OrderTotal = subtotal sau product discounts (chưa gồm tax) + shipping (chưa gồm tax) + payment fee (chưa gồm tax) + tax - order-level discount - gift card - reward points`.
  Áp dụng rounding tại các bước cấu hình yêu cầu. Ghi lại từng thành phần,
  currency và rounding setting, rồi so sánh chính xác tới độ chính xác currency
  với tổng trên Confirm Order và `Order.OrderTotal`. Nếu thành phần nào không
  áp dụng, ghi `0`; không để placeholder làm expected result khi thực thi.
- Địa chỉ hợp lệ phải được gắn vào order mới đúng vai trò billing/shipping.
  Địa chỉ thiếu trường required không được lưu làm địa chỉ được chọn và không
  được tạo order.

## 3. Ma trận scenario T05

| ID | Nhóm | Mục tiêu | Nhánh | Sẵn sàng thực thi |
| --- | --- | --- | --- | --- |
| `CHK-01` | Checkout | Customer đăng nhập hoàn tất checkout bằng payment method local; xác nhận order, status và tổng tiền | Thành công | Ready khi fixture và `Payments.CheckMoneyOrder` khả dụng |
| `CHK-02` | Checkout | Guest hoàn tất checkout nếu anonymous checkout được bật | Thành công | Conditional theo `OrderSettings.AnonymousCheckoutAllowed` |
| `ADDR-01` | Address | Chấp nhận và lưu address hợp lệ cho order | Thành công | Ready khi cấu hình required fields được ghi nhận |
| `ADDR-02` | Address | Từ chối address thiếu trường bắt buộc | Thất bại | Ready khi `FirstName` enabled/required |
| `PAY-LOCAL-01` | Payment | Hiển thị và chọn payment method local an toàn | Thành công | Ready khi có local payment method được bật |
| `SHP-01` | Shipping | Hiển thị và chọn shipping method local hợp lệ | Thành công | Ready khi fixture có shipping method local |
| `SHP-02` | Shipping | Từ chối lựa chọn shipping rỗng, sai định dạng hoặc không còn khả dụng | Thất bại | Ready |
| `PAY-FAIL-01` | Payment | Xử lý payment processor trả về decline/error | Thất bại | Blocked đến khi có fake processor local |
| `INV-01` | Inventory | Chặn đặt hàng khi tồn kho giảm xuống không đủ trong lúc checkout | Thất bại | Ready |

## 4. Scenario Checkout và validation

### CHK-01 - Customer đăng nhập hoàn tất checkout thành công

**Mục tiêu**

Xác minh customer đăng nhập có thể đi hết multi-step checkout với address,
shipping và payment method local hợp lệ; order được tạo đúng một lần, tổng
tiền cuối cùng chính xác và trạng thái order/payment phù hợp với phương thức
thanh toán đã chọn.

**Preconditions**

1. Fixture tại mục 2.1 và 2.3 đã sẵn sàng; customer đăng nhập, cart không rỗng
   và `PW-Simple-Stock` còn đủ hàng.
2. Billing address và shipping address hợp lệ, và shipping option local khả
   dụng cho địa chỉ này.
3. `Payments.CheckMoneyOrder` được cài, bật và hiện ra cho cart/customer này.
   Nếu nhóm dùng local method khác, ghi system name và xác minh hành vi status
   trước lượt chạy.
4. Không có discount, gift card hoặc reward points trong fixture cơ sở; nếu
   cấu hình bắt buộc có thành phần nào, ghi giá trị và đưa vào phép tính tổng.

**Input/Test data**

| Thuộc tính | Giá trị |
| --- | --- |
| Customer | Customer fixture đã đăng nhập |
| Cart | `PW-Simple-Stock`, quantity `1` |
| Billing/shipping address | Fixture hợp lệ đã tạo riêng cho test |
| Shipping method | Một option local khả dụng |
| Payment method | `Payments.CheckMoneyOrder` (hoặc local method đã được xác minh) |
| Expected total | Tổng độc lập tính theo cấu hình và các thành phần thực tế của store |

Trước khi chạy, điền giá trị thực tế của subtotal, discount, shipping, payment
fee, tax, currency và các khoản khấu trừ áp dụng; ghi kết quả tổng kỳ vọng theo
quy tắc làm tròn của store.

**Steps**

1. Ghi nhận số order hiện có của customer, cart và stock ban đầu.
2. Đăng nhập bằng customer fixture và bắt đầu checkout.
3. Xác nhận/chọn billing address và shipping address hợp lệ; chọn shipping
   method local đã ghi trong test data.
4. Chọn payment method local trong test data và đi qua payment information
   (nếu checkout yêu cầu).
5. Tại Confirm Order, ghi lại từng thành phần và tổng tiền hiển thị.
6. Tính độc lập tổng tiền từ giá sản phẩm, discount, shipping, payment fee,
   tax và các khoản khấu trừ áp dụng theo cấu hình store.
7. Bấm **Confirm** đúng một lần; ghi order ID trên trang Completed/Order
   Details.
8. Tìm order vừa tạo trong Admin hoặc database bằng truy vấn chỉ đọc; kiểm tra
   order/customer, địa chỉ, dòng sản phẩm, tổng tiền và status.
9. Kiểm tra cart và stock sau khi đặt hàng.

**Expected result**

- Customer được chuyển tới Completed hoặc Order Details của đúng order mới.
- Có đúng một order mới thuộc customer; order lưu đúng product/quantity,
  billing address, shipping address, shipping method và payment method đã
  chọn.
- Tổng tiền trên Confirm Order, `Order.OrderTotal` và tổng tính độc lập bằng
  nhau tới độ chính xác currency của store. Các thành phần được tính một lần,
  theo đúng tax/rounding configuration; không có thay đổi tổng tiền không giải
  thích được giữa Confirm và order đã lưu.
- Với `Payments.CheckMoneyOrder`, tạo order thành công không đồng nghĩa đã thu
  tiền: `OrderStatus = Pending` và `PaymentStatus = Pending`.
- Stock giảm đúng quantity đã đặt (quantity `1` trong fixture cơ sở); cart
  được xóa theo hành vi checkout thành công.

**OrderStatus/PaymentStatus**

- Expected `OrderStatus`: `Pending`.
- Expected `PaymentStatus`: `Pending` với `Payments.CheckMoneyOrder`; không
  assert `Paid` cho phương thức chưa thực hiện thu tiền.
- Nếu thay payment method, xác định expected status từ hợp đồng của processor
  local trước khi chạy và ghi rõ trong evidence; không dùng status của
  `CheckMoneyOrder` để áp cho processor khác.

**Invariants**

- Một thao tác Confirm thành công chỉ tạo một order; retry/refresh không làm
  phát sinh order trùng.
- Tổng tiền order khớp tổng tiền được tính từ cùng cart, address, shipping,
  payment fee, tax và discounts tại thời điểm confirm.
- Không đánh dấu `Paid` khi processor chỉ chấp nhận tạo order nhưng chưa thu
  tiền.
- Stock không âm và không bị trừ quá quantity đã đặt.

### CHK-02 - Guest hoàn tất checkout khi được hỗ trợ

**Mục tiêu**

Xác minh customer guest có thể hoàn tất checkout không cần đăng nhập khi
anonymous checkout được bật; nếu cấu hình tắt, ghi nhận scenario không áp dụng
cho nhánh thành công thay vì giả định guest checkout được hỗ trợ.

**Preconditions**

1. Cart, address, local shipping và local payment method hợp lệ như CHK-01.
2. Customer hiện tại là guest, chưa đăng nhập.
3. `OrderSettings.AnonymousCheckoutAllowed = true`; nếu bằng `false`, dừng
   nhánh thành công, lưu cấu hình làm evidence và đánh dấu `N/A`.

**Input/Test data**

| Thuộc tính | Giá trị |
| --- | --- |
| Customer | Guest fixture, email tổng hợp |
| Cart | `PW-Simple-Stock`, quantity `1` |
| Address/shipping/payment | Fixture hợp lệ, local shipping và payment |

**Steps**

1. Ghi nhận số order hiện có của guest và cart.
2. Mở storefront trong session guest, thêm fixture product vào cart và bắt
   đầu checkout mà không đăng nhập.
3. Nhập email và các address field hợp lệ theo cấu hình; chọn shipping và
   payment method local.
4. Xác nhận order một lần.
5. Kiểm tra trang kết quả, order trong Admin và guest/cart sau checkout.

**Expected result**

- Guest đi hết checkout và nhận được trang Completed/Order Details cho order
  vừa tạo, không bị chuyển sang login/registration.
- Tạo đúng một order gắn với customer guest và email/address đã nhập; không
  tự tạo tài khoản nếu test không đi qua luồng đăng ký.
- Order status khớp method được dùng; với `Payments.CheckMoneyOrder` là
  `OrderStatus = Pending`, `PaymentStatus = Pending`.
- Nếu anonymous checkout bị tắt, không tạo order guest; luồng bị yêu cầu đăng
  nhập và kết quả của scenario được ghi `N/A` cho acceptance của guest success.

**Invariants**

- Guest thành công không làm lộ order của guest khác và không gắn order vào
  customer đăng nhập khác.
- Order/email/address chỉ được kiểm tra bằng fixture tổng hợp; không lưu dữ
  liệu cá nhân thật vào evidence.
- Một lần Confirm không tạo order trùng.

### ADDR-01 - Chấp nhận address hợp lệ

**Mục tiêu**

Xác minh address điền đủ các trường bắt buộc theo cấu hình hiện hành được
validation chấp nhận, gắn đúng vào checkout và được lưu trên order.

**Preconditions**

1. Customer đăng nhập và có cart với sản phẩm yêu cầu shipping.
2. Checkout dùng multi-step; Address Settings, quốc gia và required address
   attributes đã được ghi lại.
3. Có fixture tổng hợp với mọi field enabled/required hợp lệ, bao gồm
   `FirstName`, địa chỉ, city, country, email/phone nếu được bật và yêu cầu
   thuộc tính tùy chỉnh nếu có.

**Input/Test data**

Một bộ address tổng hợp hợp lệ, dùng country/state/zip code được cấu hình và
được shipping provider local hỗ trợ. Không dùng dữ liệu cá nhân thật.

**Steps**

1. Bắt đầu checkout bằng customer fixture.
2. Chọn tạo address mới và nhập đủ các field bắt buộc; hoàn thành các
   custom-address attributes bắt buộc nếu có.
3. Submit address và tiếp tục checkout.
4. Kiểm tra billing/shipping selection trong checkout state.
5. Hoàn tất order bằng payment method local và kiểm tra address trên order.

**Expected result**

- Server chấp nhận address, checkout đi tới bước tiếp theo mà không có
  validation warning.
- Address được lưu/chọn đúng vai trò billing hoặc shipping; order mới chứa
  đúng giá trị fixture và country/state tương ứng.
- Checkout chỉ tạo order sau khi các bước còn lại thành công; status của order
  tuân theo payment method được chọn.

**OrderStatus/PaymentStatus**

- Với `Payments.CheckMoneyOrder`: `OrderStatus = Pending` và
  `PaymentStatus = Pending`.
- Không assert `Paid` khi method local chưa thu tiền.

**Invariants**

- Address của fixture không bị gắn sang customer khác.
- Bỏ trống các field optional không làm address hợp lệ thất bại; không coi
  field optional là required nếu cấu hình không yêu cầu.
- Chạy lại test không tạo duplicate address ngoài hành vi deduplicate hiện có.

### ADDR-02 - Từ chối address thiếu trường bắt buộc

**Mục tiêu**

Xác minh server từ chối address thiếu một trường đang được bật và đánh dấu
required, kể cả khi validation phía client bị bỏ qua.

**Preconditions**

1. Customer đăng nhập, cart hợp lệ và đang ở bước nhập address mới.
2. `CustomerSettings.FirstNameEnabled = true` và
   `CustomerSettings.FirstNameRequired = true`; xác nhận cấu hình thực tế trước
   khi chạy.
3. Các trường address khác hợp lệ, để `FirstName` là lỗi duy nhất.

**Input/Test data**

| Data set | Field | Giá trị |
| --- | --- | --- |
| `ADDR-02-DS01` | `FirstName` | Rỗng/không gửi field |

**Steps**

1. Ghi nhận số order, các address của customer và cart trước khi submit.
2. Nhập address hợp lệ ngoại trừ `FirstName`.
3. Gửi form tới server; có thể bỏ qua client validation để xác nhận server-side
   validation.
4. Quan sát form/warning và kiểm tra address được chọn/lưu, order, cart.

**Expected result**

- Server từ chối address và hiển thị validation error hoặc giữ customer tại
  bước nhập address; không chuyển checkout qua bước tiếp theo bằng address
  thiếu `FirstName`.
- Address thiếu required field không được gắn làm billing/shipping address
  hợp lệ và không được lưu thành address mới của customer.
- Không tạo order mới, không xử lý payment, cart vẫn còn nguyên.

**OrderStatus/PaymentStatus**

- Expected: `N/A` vì order chưa được tạo.
- Không tồn tại order mới từ request này có `OrderStatus = Complete` hoặc
  `PaymentStatus = Paid`.

**Invariants**

- Required-field validation được áp dụng phía server, không phụ thuộc
  JavaScript/client validation.
- Address validation failure không làm thay đổi cart, stock hoặc số order.
- Kết quả chỉ được coi là hợp lệ khi cấu hình xác nhận field đang được required.

### PAY-LOCAL-01 - Chọn payment method local

**Mục tiêu**

Xác minh checkout chỉ cung cấp/chấp nhận payment method local được bật và lưu
đúng lựa chọn trước bước xác nhận order.

**Preconditions**

1. Customer đang ở bước Payment Method, cart/address/shipping hợp lệ.
2. Có ít nhất một payment method đã cài, bật và chạy an toàn hoàn toàn local.
   `Payments.CheckMoneyOrder` là phương thức cơ sở; không gọi gateway thật.

**Input/Test data**

| Data set | Payment method | Điều kiện |
| --- | --- | --- |
| `PAY-LOCAL-01-DS01` | `Payments.CheckMoneyOrder` | Plugin local được cài và bật |
| Các data set bổ sung nếu có | `<system name local khác>` | Đã xác minh chạy local và expected status |

**Steps**

1. Ghi lại các payment method hiển thị và danh sách local method đã được duyệt.
2. Chọn method của data set; submit bước Payment Method.
3. Nếu cần, hoàn thành payment information; đi tới Confirm Order.
4. Kiểm tra payment method được lưu trong checkout state. Với `DS01`, có thể
   tiếp tục theo CHK-01 để xác nhận tạo order và status.

**Expected result**

- Payment method local hợp lệ được hiển thị, chọn và lưu đúng system name.
- Customer tới được bước tiếp theo; lựa chọn vẫn được giữ khi quay lại bước
  trước.
- Chưa có order mới tại thời điểm chỉ chọn payment method.
- Không phát sinh request ra payment gateway bên ngoài.

**OrderStatus/PaymentStatus**

- Không áp dụng trước khi tạo order; không được có order mới `Complete` hoặc
  `Paid` chỉ vì đã chọn payment method.

**Invariants**

- Checkout chỉ chấp nhận method đang bật và khả dụng cho cart/customer.
- Chọn payment method không làm thay đổi cart, shipping hoặc address.

## 5. Scenario shipping

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

**Dependency/blocker**

- Dependency: provider local đã cài/bật và trả về ít nhất một option cho cart
  cùng địa chỉ test.
- Blocker: nếu không có option khả dụng, không chạy nhánh thành công; ghi
  `Blocked` và lưu cấu hình/provider response làm evidence.

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

**Dependency/blocker**

- Dependency: checkout đang ở bước Shipping Method và có provider local để tạo
  danh sách option hợp lệ; xóa selected option cũ trước mỗi data set.
- Blocker: nếu không thể tạo danh sách option hoặc reset checkout state, dừng
  scenario thay vì diễn giải redirect về bước trước thành kết quả validation.

## 6. Scenario payment failure

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

## 7. Scenario tồn kho thay đổi trong checkout

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

**Dependency/blocker**

- Dependency: stock được quản lý, backorder tắt; người thực thi có thể cập nhật
  stock của cùng fixture trong phiên Admin sau khi customer tới Confirm Order.
- Blocker: nếu không thể thay đổi stock giữa checkout và Confirm, không thể kết
  luận hệ thống đã kiểm tra lại tồn kho tại thời điểm đặt order.

**Cleanup**

Sau khi lưu evidence, đưa stock của `PW-Simple-Stock` về giá trị fixture đã
thống nhất và xóa dữ liệu order thử nếu nhóm có quy trình cleanup riêng. Không
xóa container/database khi các thành viên khác vẫn cần fixture.

## 8. Traceability với mã nguồn và yêu cầu

| Nội dung | Điểm đối chiếu |
| --- | --- |
| Customer guest/đăng nhập và cho phép anonymous checkout | `CheckoutController` kiểm tra `OrderSettings.AnonymousCheckoutAllowed` tại các bước checkout |
| Nhập address và từ chối model không hợp lệ | `CheckoutController.NewBillingAddress`, `CheckoutController.NewShippingAddress` và address model validation |
| Confirm order và trang Completed | [`CheckoutController.ConfirmOrder` và `Completed`](../../src/Presentation/Nop.Web/Controllers/CheckoutController.cs) |
| Status của order mới | [`OrderProcessingService.PlaceOrderAsync`](../../src/Libraries/Nop.Services/Orders/OrderProcessingService.cs) khởi tạo `OrderStatus.Pending` |
| Status payment | [`CheckMoneyOrderPaymentProcessor.ProcessPaymentAsync`](../../src/Plugins/Nop.Plugin.Payments.CheckMoneyOrder/CheckMoneyOrderPaymentProcessor.cs) trả kết quả không thu tiền; giá trị mặc định là `PaymentStatus.Pending` |
| Tính tổng tiền lưu trên order | [`OrderTotalCalculationService`](../../src/Libraries/Nop.Services/Orders/OrderTotalCalculationService.cs) và `OrderProcessingService.PlaceOrderAsync` |
| Hiển thị/chọn shipping method | [`CheckoutController.ShippingMethod` và `SelectShippingMethod`](../../src/Presentation/Nop.Web/Controllers/CheckoutController.cs) |
| Shipping rỗng/sai/không tìm thấy | `SelectShippingMethod` render lại bước Shipping Method |
| Payment error không lưu order | [`OrderProcessingService.PlaceOrderAsync`](../../src/Libraries/Nop.Services/Orders/OrderProcessingService.cs) chỉ lưu khi `ProcessPaymentResult.Success` |
| Kiểm tra lại cart/tồn kho | `PrepareAndValidateShoppingCartAndCheckoutAttributesAsync` gọi lại cart warnings trước khi xử lý payment |
| Giới hạn payment decline | [`scope.md`](../../scope.md) yêu cầu fake processor local; Check/Money Order không mô phỏng decline |

## 9. Checklist bàn giao T05

- [x] Có scenario Checkout thành công cho customer đăng nhập.
- [x] Có scenario guest checkout với điều kiện hỗ trợ được kiểm tra rõ.
- [x] Có scenario address hợp lệ và address thiếu field bắt buộc.
- [x] Có scenario chọn payment method local an toàn.
- [x] Checkout thành công kiểm tra order mới, status và tổng tiền cuối cùng.
- [x] Có scenario shipping hợp lệ.
- [x] Có scenario shipping rỗng/sai/không còn khả dụng.
- [x] Có scenario payment decline và ghi rõ blocker thực thi.
- [x] Có scenario tồn kho thay đổi trong lúc checkout.
- [x] Mỗi scenario có precondition, input/test data, steps, expected result và invariant.
- [x] Có kiểm tra `OrderStatus` và `PaymentStatus` ở các scenario liên quan.
- [x] Có cả nhánh thành công và thất bại; tổng cộng 9 scenario trong ma trận.
- [x] Không kiểm thử payment gateway hoặc shipping provider thật.
- [x] Khoa đã review phần của Trang trong tài liệu này.
- [ ] Linh review tài liệu và xác nhận trên PR/Jira.
