# T04 - Đặc tả nghiệp vụ Shopping Cart

## 1. Thông tin tài liệu

| Thuộc tính | Giá trị |
| --- | --- |
| Deliverable | T04 - `docs/cart-checkout-scenarios.md` |
| Chức năng | Shopping Cart storefront |
| Phạm vi | Thêm, cập nhật, xóa sản phẩm; giỏ hàng rỗng; tồn kho; coupon; subtotal, discount và total |
| Ngoài phạm vi T04 | Checkout, Wishlist, Admin UI, performance, security và concurrency |
| Người phụ trách chính | Đỗ Đặng Diệu Linh |
| Người cùng đặc tả | Lê Anh Khoa |
| Reviewer | Lê Anh Khoa và Trần Thị Phương Trang |
| Baseline tham chiếu | `674d0ceef6bd8a52fe74d6f4fff326960162cec0` theo `setup.md` và `docs/architecture.md` |
| Trạng thái | Ready for Done - Linh đã xác minh fixture, thực thi `CART-07` đến `CART-13` và tải evidence lên Jira ngày 04/10/2026; Khoa và Trang đã review/Approved ngày 05/10/2026 |

> T04 sử dụng baseline `674d0ceef6bd8a52fe74d6f4fff326960162cec0` và quy trình trong `setup.md`, đúng với môi trường đã được dùng để kiểm thử trước đó. `scope.md` hiện ghi SHA khác và cần được đồng bộ ở lần cập nhật tài liệu tiếp theo. Commit hiện tại là hậu duệ của baseline này và không có thay đổi mã nguồn trong `src` so với baseline.

## 2. Mục tiêu và tiêu chí hoàn thành

Tài liệu mô tả các scenario nghiệp vụ quan trọng của Shopping Cart để một thành viên khác có thể chuẩn bị dữ liệu, thực hiện lại và xác định Pass/Fail mà không phải tự suy đoán kết quả mong đợi.

T04 hoàn thành khi:

- Có ít nhất 8 scenario; tài liệu này thiết kế 13 scenario.
- Có trường hợp hợp lệ, không hợp lệ và giá trị biên.
- Mỗi scenario có Scenario ID, Actor, Preconditions, Input, Steps, Expected result, Invariant và dữ liệu test.
- Bao phủ sản phẩm thường, sản phẩm có biến thể, số lượng bằng 1, nhiều sản phẩm, cập nhật, vượt tồn kho, xóa, giỏ rỗng, hết hàng, coupon hợp lệ/không hợp lệ và các tổng tiền.
- Khoa viết phần được giao và review chéo phần của Linh.
- Trang review toàn bộ scenario và invariant.
- Các nhận xét mức `Blocking` đã được xử lý và hai reviewer xác nhận `Approved`.

## 3. Phân công ba subtask

### 3.1. Subtask của Khoa

[Khoa] Đặc tả scenario thêm, cập nhật và xóa sản phẩm Shopping Cart

- Người thực hiện: Lê Anh Khoa.
- Phạm vi: `CART-01` đến `CART-06` và review chéo phần của Linh.
- Các scenario trong phạm vi:
  - `CART-01`: Thêm sản phẩm hợp lệ.
  - `CART-02`: Thêm sản phẩm có biến thể.
  - `CART-03`: Thêm sản phẩm với quantity bằng 1.
  - `CART-04`: Thêm nhiều sản phẩm khác nhau.
  - `CART-05`: Cập nhật quantity.
  - `CART-06`: Xóa một sản phẩm, cart vẫn còn item.
- Tiêu chí hoàn thành phần đặc tả:
  - [x] Cả 6 scenario có đủ Actor, Preconditions, Input, Steps, Expected result, Invariant và dữ liệu test.
  - [x] Dữ liệu scenario dùng các fixture chung và có kết quả quan sát/tính toán cụ thể.
  - [x] Khoa đã rà soát `CART-01` đến `CART-06`; kết quả ghi tại mục 13.2.
  - [x] Khoa đã review chéo `CART-07` đến `CART-13`; kết quả ghi tại mục 13.2.

### 3.2. Subtask của Linh

**Tên Jira:** `[Linh] Đặc tả scenario tồn kho, giỏ hàng rỗng, mã giảm giá, tổng tiền và tổng hợp T04`

Linh phụ trách:

- Tạo cấu trúc tài liệu, template, dữ liệu test và invariant chung.
- `CART-07`: Cập nhật số lượng vượt tồn kho.
- `CART-08`: Xóa sản phẩm cuối cùng làm giỏ hàng rỗng.
- `CART-09`: Truy cập giỏ hàng khi chưa có sản phẩm.
- `CART-10`: Thêm sản phẩm hết hàng.
- `CART-11`: Áp dụng mã giảm giá hợp lệ.
- `CART-12`: Áp dụng mã giảm giá không hợp lệ.
- `CART-13`: Kiểm tra subtotal, discount và total.
- Tổng hợp phần của Khoa, chuẩn hóa nội dung và xử lý review.
- Đính kèm hoặc liên kết phiên bản cuối vào task T04.

Definition of Done của subtask Linh:

- [x] Hoàn thành đủ `CART-07` đến `CART-13`.
- [x] Tổng hợp đủ `CART-01` đến `CART-13`.
- [x] Có dữ liệu tính tiền cụ thể và có thể tái lập.
- [x] Đã xử lý mọi comment `Blocking`.
- [x] Khoa và Trang đã xác nhận `Approved`.

### 3.3. Subtask của Trang

**Tên Jira:** `[Trang] Review toàn bộ scenario và invariant của Shopping Cart`

- Người thực hiện: Trần Thị Phương Trang.
- Phạm vi: Review toàn bộ `CART-01` đến `CART-13` và các invariant.

## 4. Quy ước đặc tả

### 4.1. Phân loại scenario

| Loại | Ý nghĩa |
| --- | --- |
| Positive | Input hợp lệ và thao tác phải thành công |
| Negative | Input hoặc trạng thái không hợp lệ và hệ thống phải từ chối an toàn |
| Boundary | Kiểm tra giá trị hoặc trạng thái ở ranh giới, ví dụ quantity bằng 1 hoặc giỏ rỗng |
| Calculation | Kiểm tra công thức và tính nhất quán của số tiền |

### 4.2. Mẫu bắt buộc

```text
Scenario ID:
Scenario name:
Scenario type:
Owner:

Actor:

Preconditions:
- ...

Input:
- ...

Steps:
1. ...

Expected result:
- ...

Invariant:
- INV-CART-...

Test data:
- ...
```

`Expected result` mô tả kết quả quan sát được của scenario. `Invariant` là điều kiện phải luôn đúng trước và sau thay đổi trạng thái. Hai phần không được dùng thay thế cho nhau.

## 5. Quy tắc nghiệp vụ và giả định

Các quy tắc dưới đây được đối chiếu với `scope.md`, `setup.md`, `docs/architecture.md` và luồng Shopping Cart hiện tại:

1. Người dùng đã đăng ký được dùng làm actor mặc định để giảm biến số về anonymous cart.
2. Sản phẩm chỉ được thêm khi đang Published, có quyền truy cập và đáp ứng quy tắc số lượng/tồn kho.
3. Sản phẩm quản lý tồn kho với `No backorders` không cho phép quantity vượt tồn kho khả dụng.
4. Sản phẩm quản lý tồn kho theo thuộc tính phải kiểm tra tồn kho của đúng tổ hợp Color/Size.
5. Cùng product và cùng bộ thuộc tính được xem là cùng loại cart item; khác tổ hợp thuộc tính phải được phân biệt.
6. Quantity bằng hoặc nhỏ hơn 0 đi theo luồng xóa item của service; T04 chỉ đặc tả xóa qua thao tác được UI hỗ trợ, không giả định UI nhận mọi giá trị âm.
7. Cập nhật bị cảnh báo không được làm thay đổi quantity cũ hoặc tạo cart item ngoài ý muốn.
8. Coupon hợp lệ chỉ làm thay đổi discount/total khi giỏ đáp ứng đầy đủ điều kiện của coupon.
9. Coupon không tồn tại, hết hạn hoặc không đủ điều kiện không được làm thay đổi các tổng tiền.
10. Giá, thuế, shipping, currency và coupon phải được khóa theo fixture trước khi đối chiếu số tiền.

Các điểm phải xác nhận trước khi chạy chính thức:

- [x] Lượt test dùng customer đã đăng ký; không dùng anonymous cart làm actor chính.
- [x] Tax của fixture được xác nhận bằng `0` cho phép tính tổng tiền.
- [x] Shipping tại cart được xác nhận bằng `0` hoặc chưa được tính cho `CART-13`.
- [x] Đã tạo và kiểm tra coupon `PW-CART-10PCT`.
- [x] Đã tạo và kiểm tra sản phẩm hết hàng `PW-Out-Of-Stock`.
- [x] Đã ghi nhận cảnh báo hết hàng thực tế là `Out of stock`.

## 6. Dữ liệu test chung

### 6.1. Fixture đã được mô tả trong `setup.md`

| Fixture | SKU | Giá | Quản lý kho | Tồn kho |
| --- | --- | ---: | --- | ---: |
| `PW-Simple-Stock` | `PW-SIMPLE-001` | 100 USD | Track inventory, No backorders | 10 |
| `PW-Shirt-Variants` | `PW-SHIRT` | 200 USD | Track inventory by product attributes | Theo tổ hợp |

Tồn kho của `PW-Shirt-Variants`:

| Color | Size | Stock | Cho vượt kho |
| --- | --- | ---: | --- |
| Red | S | 5 | Không |
| Red | M | 4 | Không |
| Blue | S | 6 | Không |
| Blue | M | 3 | Không |

### 6.2. Fixture bổ sung đã được xác nhận

| Fixture | Cấu hình bắt buộc | Mục đích |
| --- | --- | --- |
| `PW-Out-Of-Stock` | SKU `PW-OOS-001`, giá 50 USD, Published, Track inventory, stock `0`, No backorders | `CART-10` |
| `PW-CART-10PCT` | Coupon active, giảm 10% order subtotal, không có yêu cầu làm scenario mất tính độc lập | `CART-11`, `CART-13` |
| `PW-NOT-EXIST` | Không tạo coupon có code này | `CART-12` |
| `qa.customer@example.test` | Customer role Registered; không ghi mật khẩu vào repository | Actor mặc định |

Trạng thái xác minh ngày 04/10/2026:

- `PW-Out-Of-Stock` có stock `0`, No backorders; storefront trả cảnh báo `Out of stock` và không thêm sản phẩm vào cart.
- `PW-CART-10PCT` active, giảm đúng `10%` order subtotal.
- `PW-NOT-EXIST` không tồn tại và bị storefront từ chối.
- Customer test, currency USD, tax, shipping, gift card, reward points và payment fee đã được kiểm tra theo hướng dẫn T04.

Để `CART-13` có kết quả số cố định, cấu hình riêng lượt test:

- Currency: USD.
- Thuế áp dụng lên fixture: `0`.
- Shipping dùng trong giá trị total tại cart: `0` hoặc chưa được chọn/tính.
- Không dùng gift card, reward points hoặc payment fee.
- Coupon `PW-CART-10PCT` giảm đúng 10% subtotal.

Nếu môi trường không thể khóa các điều kiện này, tester phải ghi các thành phần thuế/shipping thực tế và tính lại expected total theo công thức tại `CART-13`; không được giữ số `450 USD` rồi đánh Pass.

### 6.3. Reset dữ liệu giữa các scenario

1. Dùng đúng customer test.
2. Xóa mọi item khỏi Shopping Cart.
3. Gỡ coupon đang áp dụng.
4. Khôi phục tồn kho fixture về giá trị ban đầu nếu lượt test trước đã tạo order.
5. Xác nhận currency và cấu hình tax/shipping không đổi.
6. Không chạy song song các scenario dùng chung fixture tồn kho.

## 7. Invariant chung

| ID | Invariant |
| --- | --- |
| `INV-CART-01` | Quantity của một cart item hợp lệ là số nguyên dương. |
| `INV-CART-02` | Với sản phẩm No backorders, quantity trong cart không vượt tồn kho khả dụng của sản phẩm hoặc tổ hợp thuộc tính. |
| `INV-CART-03` | Mỗi tổ hợp Product + Variant/Attributes được nhận diện nhất quán; các tổ hợp khác nhau không bị gộp sai. |
| `INV-CART-04` | `Line total = Unit price × Quantity`, có tính price adjustment của thuộc tính nếu fixture khai báo. |
| `INV-CART-05` | `Subtotal` bằng tổng các line total thuộc phạm vi subtotal của giỏ hiện tại. |
| `INV-CART-06` | Discount không âm và không vượt quá giá trị đủ điều kiện giảm. |
| `INV-CART-07` | Coupon không hợp lệ không làm thay đổi subtotal, discount hoặc total. |
| `INV-CART-08` | Total không âm và nhất quán với subtotal, discount, tax, shipping cùng các khoản được cấu hình. |
| `INV-CART-09` | Sau add/update/remove thành công, nội dung cart và số lượng trên biểu tượng cart được đồng bộ. |
| `INV-CART-10` | Item đã xóa không còn được tính vào subtotal hoặc total. |
| `INV-CART-11` | Khi cart rỗng, không còn product line hoặc coupon/discount cũ ảnh hưởng đến cart. |
| `INV-CART-12` | Thao tác bị từ chối không được cập nhật một phần hoặc làm hỏng trạng thái cart trước đó. |
| `INV-CART-13` | Thao tác với cart không làm giảm tồn kho thực tế; tồn kho chỉ thay đổi ở luồng đặt hàng theo cấu hình hệ thống. |

## 8. Ma trận bao phủ

| ID | Scenario | Loại | Owner | Reviewer |
| --- | --- | --- | --- | --- |
| `CART-01` | Thêm sản phẩm hợp lệ | Positive | Khoa | Trang |
| `CART-02` | Thêm sản phẩm có biến thể | Positive | Khoa | Trang |
| `CART-03` | Thêm sản phẩm với quantity bằng 1 | Boundary/Positive | Khoa | Trang |
| `CART-04` | Thêm nhiều sản phẩm khác nhau | Positive | Khoa | Trang |
| `CART-05` | Cập nhật quantity | Positive | Khoa | Trang |
| `CART-06` | Xóa một sản phẩm, cart vẫn còn item | Positive | Khoa | Trang |
| `CART-07` | Cập nhật quantity vượt tồn kho | Negative | Linh | Khoa, Trang |
| `CART-08` | Xóa item cuối cùng làm cart rỗng | Boundary | Linh | Khoa, Trang |
| `CART-09` | Mở cart khi chưa có sản phẩm | Boundary | Linh | Khoa, Trang |
| `CART-10` | Thêm sản phẩm hết hàng | Negative | Linh | Khoa, Trang |
| `CART-11` | Áp dụng coupon hợp lệ | Positive | Linh | Khoa, Trang |
| `CART-12` | Áp dụng coupon không hợp lệ | Negative | Linh | Khoa, Trang |
| `CART-13` | Kiểm tra subtotal, discount và total | Calculation | Linh | Khoa, Trang |

## 9. Scenario do Khoa phụ trách

### 9.1. CART-01 - Thêm sản phẩm hợp lệ

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-01` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | `PW-Simple-Stock` Published, giá 100 USD, tồn kho 10, No backorders; cart ban đầu rỗng |
| Input | Product `PW-SIMPLE-001`; quantity `2` |
| Steps | 1. Mở trang chi tiết `PW-Simple-Stock`.<br>2. Nhập quantity `2`.<br>3. Nhấn **Add to cart**.<br>4. Mở Shopping Cart. |
| Expected result | Hệ thống thông báo thêm thành công; cart có đúng một dòng `PW-Simple-Stock`; quantity bằng `2`; unit price bằng 100 USD; line total bằng 200 USD; cart indicator được cập nhật; không có cảnh báo tồn kho. |
| Invariant | `INV-CART-01`, `INV-CART-02`, `INV-CART-04`, `INV-CART-09`, `INV-CART-13` |
| Dữ liệu test | `PW-Simple-Stock`, SKU `PW-SIMPLE-001`, price `100`, stock `10`, quantity `2` |

### 9.2. CART-02 - Thêm sản phẩm có biến thể

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-02` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | `PW-Shirt-Variants` Published; quản lý kho theo attribute; tổ hợp Red/S còn 5; cart rỗng |
| Input | Product `PW-SHIRT`; Color `Red`; Size `S`; quantity `2` |
| Steps | 1. Mở trang chi tiết `PW-Shirt-Variants`.<br>2. Chọn Color `Red` và Size `S`.<br>3. Nhập quantity `2`.<br>4. Nhấn **Add to cart**.<br>5. Mở Shopping Cart. |
| Expected result | Thêm thành công; cart có một dòng `PW-Shirt-Variants`; thuộc tính hiển thị đúng `Red / S`; quantity bằng `2`; line total bằng 400 USD; không dùng nhầm tồn kho của tổ hợp khác. |
| Invariant | `INV-CART-01`, `INV-CART-02`, `INV-CART-03`, `INV-CART-04`, `INV-CART-09`, `INV-CART-13` |
| Dữ liệu test | `PW-Shirt-Variants`, SKU `PW-SHIRT`, price `200`, Red/S stock `5`, quantity `2` |

### 9.3. CART-03 - Thêm sản phẩm với quantity bằng 1

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-03` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | `PW-Simple-Stock` còn 10; cart rỗng |
| Input | Product `PW-SIMPLE-001`; quantity `1` |
| Steps | 1. Mở trang chi tiết sản phẩm.<br>2. Nhập hoặc giữ quantity `1`.<br>3. Nhấn **Add to cart**.<br>4. Mở Shopping Cart. |
| Expected result | Sản phẩm được thêm đúng một đơn vị; cart có một dòng; quantity bằng `1`; line total bằng 100 USD; không tự đổi quantity sang giá trị khác. |
| Invariant | `INV-CART-01`, `INV-CART-02`, `INV-CART-04`, `INV-CART-09` |
| Dữ liệu test | `PW-Simple-Stock`, price `100`, stock `10`, quantity `1` |

### 9.4. CART-04 - Thêm nhiều sản phẩm khác nhau

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-04` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Hai fixture đều Published và đủ kho; cart rỗng |
| Input | `PW-Simple-Stock` quantity `1`; `PW-Shirt-Variants` Blue/M quantity `1` |
| Steps | 1. Thêm `PW-Simple-Stock` quantity `1`.<br>2. Mở `PW-Shirt-Variants`.<br>3. Chọn Blue/M và quantity `1`.<br>4. Thêm vào cart.<br>5. Mở Shopping Cart. |
| Expected result | Cart có đúng hai dòng; mỗi dòng giữ đúng product, attributes và quantity; line total lần lượt là 100 USD và 200 USD; subtotal trước discount là 300 USD; cart indicator phản ánh tổng quantity bằng `2`. |
| Invariant | `INV-CART-03`, `INV-CART-04`, `INV-CART-05`, `INV-CART-09`, `INV-CART-13` |
| Dữ liệu test | `PW-SIMPLE-001` quantity `1`; `PW-SHIRT` Blue/M stock `3`, quantity `1` |

### 9.5. CART-05 - Cập nhật quantity

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-05` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Cart có `PW-Simple-Stock` quantity `2`; stock bằng 10; chưa áp dụng coupon |
| Input | Quantity mới `4` |
| Steps | 1. Mở Shopping Cart.<br>2. Đổi quantity của `PW-Simple-Stock` từ `2` thành `4`.<br>3. Nhấn nút cập nhật cart.<br>4. Quan sát item và tổng tiền. |
| Expected result | Cập nhật thành công; quantity hiển thị bằng `4`; line total và subtotal bằng 400 USD; không tạo thêm dòng sản phẩm trùng; cart indicator được cập nhật. |
| Invariant | `INV-CART-01`, `INV-CART-02`, `INV-CART-04`, `INV-CART-05`, `INV-CART-09`, `INV-CART-13` |
| Dữ liệu test | `PW-SIMPLE-001`, old quantity `2`, new quantity `4`, stock `10` |

### 9.6. CART-06 - Xóa một sản phẩm, cart vẫn còn item

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-06` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Cart có `PW-Simple-Stock` quantity `1` và `PW-Shirt-Variants` Blue/M quantity `1`; chưa áp dụng coupon |
| Input | Xóa `PW-Simple-Stock` |
| Steps | 1. Mở Shopping Cart.<br>2. Chọn thao tác xóa `PW-Simple-Stock`.<br>3. Cập nhật cart nếu UI yêu cầu.<br>4. Quan sát danh sách item và subtotal. |
| Expected result | `PW-Simple-Stock` không còn trong cart; Blue/M vẫn còn quantity `1`; subtotal còn 200 USD; cart indicator còn tổng quantity `1`; không xóa nhầm item. |
| Invariant | `INV-CART-03`, `INV-CART-05`, `INV-CART-09`, `INV-CART-10`, `INV-CART-13` |
| Dữ liệu test | Xóa `PW-SIMPLE-001`; giữ `PW-SHIRT` Blue/M quantity `1` |

## 10. Scenario do Linh phụ trách

### 10.1. CART-07 - Cập nhật quantity vượt tồn kho

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-07` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Cart có `PW-Shirt-Variants` Red/S quantity `4`; Red/S còn đúng 5; No backorders; chưa áp dụng coupon |
| Input | Quantity mới `6` |
| Steps | 1. Mở Shopping Cart.<br>2. Đổi quantity Red/S từ `4` thành `6`.<br>3. Nhấn cập nhật cart.<br>4. Quan sát cảnh báo, quantity và subtotal. |
| Expected result | Hệ thống từ chối quantity `6` và hiển thị cảnh báo tồn kho; không lưu quantity vượt kho; quantity hợp lệ trước đó vẫn là `4`; line total/subtotal vẫn là 800 USD; không tạo thêm cart item. Nội dung cảnh báo cụ thể được ghi theo locale khi chạy. |
| Invariant | `INV-CART-02`, `INV-CART-03`, `INV-CART-05`, `INV-CART-12`, `INV-CART-13` |
| Dữ liệu test | `PW-SHIRT`, Red/S stock `5`, old quantity `4`, requested quantity `6` |

### 10.2. CART-08 - Xóa item cuối cùng làm cart rỗng

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-08` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Cart chỉ có `PW-Simple-Stock` quantity `1`; không có item khác; nếu có coupon thì phải gỡ trước khi bắt đầu |
| Input | Xóa item duy nhất |
| Steps | 1. Mở Shopping Cart.<br>2. Chọn xóa `PW-Simple-Stock`.<br>3. Cập nhật cart nếu UI yêu cầu.<br>4. Quan sát trang cart và cart indicator. |
| Expected result | Item bị xóa; cart chuyển sang trạng thái rỗng; không còn product line; subtotal/discount của item cũ không còn ảnh hưởng; cart indicator bằng `0`; nếu giao diện hiển thị các khoản tổng tiền thì subtotal, discount và total đều bằng `0`. T04 không đánh giá luồng Checkout. |
| Invariant | `INV-CART-08`, `INV-CART-09`, `INV-CART-10`, `INV-CART-11`, `INV-CART-13` |
| Dữ liệu test | `PW-SIMPLE-001`, quantity `1` |

### 10.3. CART-09 - Truy cập cart khi chưa có sản phẩm

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-09` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Customer test không có Shopping Cart item; không có coupon đang áp dụng |
| Input | Mở URL Shopping Cart |
| Steps | 1. Đăng nhập bằng customer test.<br>2. Xác nhận cart indicator bằng `0`.<br>3. Mở Shopping Cart. |
| Expected result | Trang cart hiển thị trạng thái rỗng phù hợp; không có product line; không hiển thị tổng tiền của giỏ cũ; nếu giao diện hiển thị các khoản tổng tiền thì subtotal, discount và total đều bằng `0`; không phát sinh lỗi hệ thống. T04 không đánh giá luồng Checkout. |
| Invariant | `INV-CART-08`, `INV-CART-11` |
| Dữ liệu test | `qa.customer@example.test`, cart rỗng |

### 10.4. CART-10 - Thêm sản phẩm hết hàng

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-10` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | `PW-Out-Of-Stock` Published, stock `0`, Track inventory, No backorders; cart rỗng |
| Input | Product `PW-OOS-001`; quantity `1` |
| Steps | 1. Mở trang chi tiết `PW-Out-Of-Stock`.<br>2. Nhập quantity `1` và nhấn **Add to cart**.<br>3. Mở Shopping Cart. |
| Expected result | Hệ thống hiển thị cảnh báo `Out of stock` và không thêm sản phẩm hết hàng; cart vẫn rỗng; cart indicator vẫn bằng `0`; không tạo cart item một phần. |
| Invariant | `INV-CART-02`, `INV-CART-09`, `INV-CART-12`, `INV-CART-13` |
| Dữ liệu test | `PW-Out-Of-Stock`, SKU `PW-OOS-001`, price `50`, stock `0`, quantity `1` |

### 10.5. CART-11 - Áp dụng coupon hợp lệ

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-11` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Cart có `PW-Simple-Stock` quantity `2`; subtotal 200 USD; coupon `PW-CART-10PCT` active, giảm 10% subtotal và customer/cart đáp ứng điều kiện; chưa có coupon khác |
| Input | Coupon code `PW-CART-10PCT` |
| Steps | 1. Mở Shopping Cart.<br>2. Nhập `PW-CART-10PCT` vào ô coupon.<br>3. Nhấn áp dụng coupon.<br>4. Quan sát message, discount và total. |
| Expected result | Hệ thống báo áp dụng coupon thành công; coupon được thể hiện là đang áp dụng; subtotal trước discount bằng 200 USD; discount bằng 20 USD; total bằng 180 USD trong cấu hình tax/shipping bằng 0; không tạo discount trùng khi render lại trang. |
| Invariant | `INV-CART-05`, `INV-CART-06`, `INV-CART-08`, `INV-CART-12` |
| Dữ liệu test | `PW-SIMPLE-001` quantity `2`; coupon `PW-CART-10PCT`; rate `10%` |

### 10.6. CART-12 - Áp dụng coupon không hợp lệ

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-12` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Cart có `PW-Simple-Stock` quantity `2`; subtotal 200 USD; chưa áp dụng coupon; không tồn tại coupon `PW-NOT-EXIST` |
| Input | Coupon code `PW-NOT-EXIST` |
| Steps | 1. Mở Shopping Cart.<br>2. Ghi nhận subtotal và total ban đầu.<br>3. Nhập `PW-NOT-EXIST`.<br>4. Nhấn áp dụng coupon.<br>5. Quan sát message và các tổng tiền. |
| Expected result | Hệ thống hiển thị thông báo coupon không tồn tại/không hợp lệ; coupon không được đánh dấu đã áp dụng; discount bằng 0; subtotal và total vẫn bằng 200 USD trong cấu hình tax/shipping bằng 0; cart item không thay đổi. |
| Invariant | `INV-CART-05`, `INV-CART-07`, `INV-CART-08`, `INV-CART-12` |
| Dữ liệu test | `PW-SIMPLE-001` quantity `2`; invalid code `PW-NOT-EXIST` |

### 10.7. CART-13 - Kiểm tra subtotal, discount và total

| Trường | Nội dung |
| --- | --- |
| Scenario ID | `CART-13` |
| Actor | Khách hàng đã đăng nhập |
| Preconditions | Cart rỗng; currency USD; tax `0`; shipping `0` hoặc chưa tính; không có gift card/reward/payment fee; coupon `PW-CART-10PCT` hợp lệ |
| Input | `PW-Simple-Stock` quantity `1`; `PW-Shirt-Variants` Red/S quantity `2`; coupon `PW-CART-10PCT` |
| Steps | 1. Thêm `PW-Simple-Stock` quantity `1`.<br>2. Thêm `PW-Shirt-Variants` Red/S quantity `2`.<br>3. Mở Shopping Cart và ghi nhận line total/subtotal.<br>4. Áp dụng `PW-CART-10PCT`.<br>5. Ghi nhận discount và total.<br>6. Refresh trang và kiểm tra các giá trị không thay đổi ngoài dự kiến. |
| Expected result | Line total sản phẩm thường: `1 × 100 = 100 USD`.<br>Line total Red/S: `2 × 200 = 400 USD`.<br>Subtotal: `100 + 400 = 500 USD`.<br>Discount: `500 × 10% = 50 USD`.<br>Total: `500 - 50 + 0 tax + 0 shipping = 450 USD`.<br>Các giá trị vẫn nhất quán sau refresh và coupon không bị áp dụng lặp. |
| Invariant | `INV-CART-03`, `INV-CART-04`, `INV-CART-05`, `INV-CART-06`, `INV-CART-08`, `INV-CART-13` |
| Dữ liệu test | `PW-SIMPLE-001` price `100`, quantity `1`; `PW-SHIRT` Red/S price `200`, quantity `2`; `PW-CART-10PCT` rate `10%` |

Phép tính đối chiếu:

```text
PW-Simple-Stock       1 × 100 USD = 100 USD
PW-Shirt Red / S      2 × 200 USD = 400 USD
Subtotal                          = 500 USD
Discount 10%                      =  50 USD
Tax                               =   0 USD
Shipping                          =   0 USD
Total                             = 450 USD
```

### 10.8. Kết quả thực thi `CART-07` đến `CART-13`

Thông tin lượt chạy:

| Thuộc tính | Giá trị |
| --- | --- |
| Ngày xác minh | 04/10/2026 |
| Môi trường | Storefront `http://localhost/`; Admin `http://localhost/Admin` |
| Actor | Customer test thuộc role Registered |
| Currency | USD |
| Tax | `0` |
| Shipping tại cart | `0` hoặc chưa được tính |
| Khoản điều chỉnh khác | Không có gift card, reward points hoặc payment fee |
| Nguồn kết quả | Xác nhận trực tiếp của người thực hiện sau khi hoàn thành toàn bộ hướng dẫn T04 |

| Scenario | Kết quả quan sát | Kết luận | Evidence |
| --- | --- | --- | --- |
| `CART-07` | Quantity `6` vượt stock Red/S `5` bị từ chối; quantity hợp lệ và totals không bị cập nhật một phần. | Pass | Đã đính kèm trên Jira |
| `CART-08` | Xóa item cuối cùng làm cart rỗng; cart indicator về `0`; totals cũ không còn. | Pass | Đã đính kèm trên Jira |
| `CART-09` | Cart rỗng không có product line hoặc totals cũ và không thể checkout. | Pass | Đã đính kèm trên Jira |
| `CART-10` | Nút **Add to cart** vẫn hiển thị; khi nhấn, hệ thống báo `Out of stock`, không thêm item và cart indicator không tăng. | Pass | Đã đính kèm trên Jira |
| `CART-11` | Coupon `PW-CART-10PCT` được chấp nhận; subtotal `200 USD`, discount `20 USD`, total `180 USD`; refresh không áp dụng lặp. | Pass | Đã đính kèm trên Jira |
| `CART-12` | Coupon `PW-NOT-EXIST` bị từ chối; discount bằng `0`; subtotal và total vẫn là `200 USD`. | Pass | Đã đính kèm trên Jira |
| `CART-13` | Line totals `100 USD` và `400 USD`; subtotal `500 USD`; discount `50 USD`; total `450 USD`; dữ liệu nhất quán sau refresh. | Pass | Đã đính kèm trên Jira |

Các tên evidence đã dùng khi đính kèm trên Jira:

```text
CART-07-stock-warning.png
CART-08-empty-after-remove.png
CART-09-empty-cart.png
CART-10-out-of-stock.png
CART-11-valid-coupon.png
CART-12-invalid-coupon.png
CART-13-cart-totals.png
```

Evidence được lưu trên Jira nên không bắt buộc tạo bản sao trong repository. Không chuyển T04 sang Done chỉ dựa trên bảng kết quả này; vẫn cần hoàn thành review và nhận xác nhận `Approved` theo mục 13.

## 11. Hướng dẫn self-review và review chéo

### 11.1. Checklist cho người viết

- [x] Preconditions đủ để bắt đầu scenario.
- [x] Input có giá trị cụ thể.
- [x] Steps theo đúng thứ tự thao tác trên hệ thống.
- [x] Mỗi expected result quan sát hoặc tính toán được.
- [x] Invariant tham chiếu đúng và liên quan trực tiếp.
- [x] Test data tồn tại hoặc được đánh dấu là fixture cần tạo.
- [x] Scenario không phụ thuộc kết quả của scenario trước.
- [x] Không chứa mật khẩu hoặc dữ liệu cá nhân thật.

### 11.2. Mẫu comment review

```text
Scenario: CART-07
Mức độ: Blocking

Vấn đề:
Expected result chưa nói rõ quantity cũ có được giữ nguyên sau khi
cập nhật vượt tồn kho hay không.

Đề nghị:
Bổ sung rằng hệ thống từ chối cập nhật, hiển thị cảnh báo và giữ
quantity hợp lệ trước đó.
```

## 12. Kế hoạch thực hiện

| Giai đoạn | Người thực hiện | Công việc | Đầu ra |
| --- | --- | --- | --- |
| 1. Chuẩn bị | Linh | Chốt template, fixture, invariant và phân công | Khung tài liệu dùng chung |
| 2. Đặc tả song song | Khoa, Linh | Khoa viết 6 scenario; Linh viết 7 scenario | Bản nháp từng phần |
| 3. Tổng hợp | Linh | Chuẩn hóa ID, thuật ngữ, dữ liệu và định dạng | Draft v1 |
| 4. Review chéo | Khoa | Review `CART-07` đến `CART-13` | Comment theo ID |
| 5. Sửa vòng 1 | Linh | Xử lý comment của Khoa | Draft v2 |
| 6. Review độc lập | Trang | Review toàn bộ tài liệu | Comment Blocking/Suggestion |
| 7. Sửa vòng 2 | Linh | Xử lý comment của Trang | Release candidate |
| 8. Phê duyệt | Khoa, Trang | Kiểm tra lại và xác nhận | Hai comment Approved |
| 9. Hoàn tất | Linh | Kiểm tra checklist, cập nhật Jira và đóng T04 | T04 Done |

Tiến độ gợi ý:

| Ngày | Công việc |
| --- | --- |
| Ngày 1 | Chốt fixture/quy tắc và giao hai subtask còn lại |
| Ngày 2 | Khoa và Linh viết song song |
| Ngày 3 | Linh tổng hợp; Khoa review chéo |
| Ngày 4 | Linh sửa vòng 1; Trang review toàn bộ |
| Ngày 5 | Linh sửa vòng 2; Khoa và Trang xác nhận; đóng T04 |

## 13. Acceptance checklist và review

### 13.1. Acceptance criteria của T04

- [x] Có ít nhất 8 scenario; hiện có 13 scenario.
- [x] Có trường hợp hợp lệ và không hợp lệ.
- [x] Có trường hợp biên.
- [x] Mỗi scenario có Scenario ID.
- [x] Mỗi scenario có Actor.
- [x] Mỗi scenario có Preconditions.
- [x] Mỗi scenario có Input.
- [x] Mỗi scenario có Steps.
- [x] Mỗi scenario có Expected result.
- [x] Mỗi scenario có Invariant.
- [x] Mỗi scenario có dữ liệu test.
- [x] Có kiểm tra subtotal, discount và total bằng số cụ thể.
- [x] Đã tạo fixture coupon và sản phẩm hết hàng trên môi trường chạy test.
- [x] Linh đã thực thi và xác nhận Pass `CART-07` đến `CART-13` ngày 04/10/2026.
- [x] Evidence của `CART-07` đến `CART-13` đã được đính kèm trên Jira.
- [x] Khoa đã xác nhận hoàn thiện/self-review phần mình viết (đã có rà soát hỗ trợ theo yêu cầu; xem nhật ký bên dưới).
- [x] Khoa đã xác nhận review chéo phần của Linh (đã có review hỗ trợ theo yêu cầu; xem nhật ký bên dưới).
- [x] Trang đã review toàn bộ tài liệu.
- [x] Mọi comment `Blocking` đã được xử lý.
- [x] Khoa đã xác nhận `Approved`.
- [x] Trang đã xác nhận `Approved`.

### 13.2. Nhật ký review

| Reviewer | Phạm vi | Trạng thái | Ngày | Nhận xét hoặc bằng chứng |
| --- | --- | --- | --- | --- |
| Lê Anh Khoa | `CART-01` đến `CART-06` | Đã review | 04/10/2026 | Đã kiểm tra các trường bắt buộc, fixture, kết quả và invariant. Đề nghị bổ sung kết quả tổng tiền bằng 0 nếu giao diện hiển thị khi cart rỗng; đã cập nhật `CART-08`. |
| Lê Anh Khoa | `CART-07` đến `CART-13` | Đã review | 04/10/2026 | Đã đối chiếu input, expected result, invariant và phép tính. Nêu rõ subtotal/discount/total bằng 0 nếu được hiển thị tại `CART-09`; không ghi nhận vấn đề Blocking nào khác trong phạm vi rà soát tài liệu. |
| Trần Thị Phương Trang | `CART-01` đến `CART-13` và invariant | Đã review / Approved | 05/10/2026 | Đã kiểm tra đủ trường bắt buộc, độ bao phủ 13 scenario, fixture, expected result và phép tính. Đã chỉnh 2 assertion Checkout nằm ngoài phạm vi T04, làm rõ `CART-10` theo kết quả fixture đã xác minh, và loại `INV-CART-12` khỏi `CART-09` vì không phải thao tác bị từ chối. Không còn comment Blocking. |

### 13.3. Comment hoàn thành task cha

Chỉ sử dụng comment dưới đây sau khi mọi ô review bắt buộc đã hoàn tất:

> Đã hoàn thành T04 - Đặc tả nghiệp vụ Shopping Cart. Tài liệu gồm 13 scenario, bao phủ thêm, cập nhật, xóa sản phẩm, biến thể, tồn kho, giỏ hàng rỗng, coupon và kiểm tra subtotal/discount/total. Mỗi scenario có đầy đủ Scenario ID, Actor, Preconditions, Input, Steps, Expected result, Invariant và dữ liệu test. Khoa và Trang đã review; toàn bộ comment Blocking đã được xử lý.

## 14. Tài liệu đối chiếu

- [`scope.md`](../scope.md): phạm vi Shopping Cart/Checkout và tiêu chí Pass/Fail.
- [`setup.md`](../setup.md): baseline, môi trường và fixture sản phẩm.
- [`architecture.md`](architecture.md): Controller, service, model và data flow Shopping Cart.
- [`TEAM_WORKFLOW.md`](TEAM_WORKFLOW.md): quy trình Jira, Git, review và evidence.
- [`ShoppingCartController.cs`](../src/Presentation/Nop.Web/Controllers/ShoppingCartController.cs): add/update/remove cart và coupon.
- [`ShoppingCartService.cs`](../src/Libraries/Nop.Services/Orders/ShoppingCartService.cs): validation quantity, attributes và stock.
