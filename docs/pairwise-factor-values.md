# T06 - Bảng factor/value chính cho Pairwise

## 1. Mục tiêu và cơ sở chọn factor

Tài liệu này xác định factor/value đề xuất cho model kiểm thử Shopping Cart và
multi-step Checkout. Factor mô tả đầu vào hoặc fixture có thể kiểm soát; kết
quả nghiệp vụ như tạo order, payment status và cảnh báo tồn kho là expected
result, không phải factor.

Phạm vi dựa trên [`scope.md`](../scope.md), fixture/hướng dẫn tại
[`setup.md`](../setup.md), các scenario Checkout/Payment của T05 và luồng xử lý
trong `ShoppingCartController`, `CheckoutController`,
`ShoppingCartService`, `OrderProcessingService`. Baseline kiểm thử được pin
trong scope/setup; các setting checkout, plugin và dữ liệu fixture phải được
ghi nhận cho từng lượt sinh/chạy model.

> **Baseline đã thống nhất:** dùng `674d0ceef6bd8a52fe74d6f4fff326960162cec0`
> theo `setup.md`; `scope.md` đã được đồng bộ cùng SHA trước khi dùng kết quả
> coverage làm evidence.

### Quy ước fixture

- Mỗi test dùng database local riêng; không dùng dữ liệu khách hàng thật.
- Product vật lý thường `PW-Simple-Stock` có giá `100` USD, tồn kho ban đầu
  `10`, quản lý tồn kho và tắt backorder. Sản phẩm biến thể
  `PW-Shirt-Variants` có các combination tồn kho được ghi trong `setup.md`.
- Dùng **multi-step checkout**. Cấu hình `OnePageCheckoutEnabled=false` cho
  môi trường chạy và giữ cố định trong toàn bộ model; không trộn one-page
  checkout và multi-step trong cùng model.
- Chỉ dùng shipping/payment plugin local. Không gọi shipping provider hoặc
  payment gateway bên ngoài.
- Giá, currency, tax và shipping settings được cố định; tổng tiền chỉ là kết
  quả cần đối chiếu, không dùng làm factor.

## 2. Bảng factor/value

| Factor | Values | Quyết định/điều kiện đưa vào model | Lý do |
| --- | --- | --- | --- |
| `CustomerType` | `Registered`, `Guest` | `Registered` là mức baseline. Chỉ đưa `Guest` vào tập khả thi khi `OrderSettings.AnonymousCheckoutAllowed=true`; setting phải được xác minh và cố định trong toàn lượt chạy. | Hai luồng có gate khác nhau; guest không khả thi khi anonymous checkout bị tắt. |
| `ProductType` | `SimplePhysical`, `ConfigurablePhysical` | Đưa cả hai vào model; dùng product và variant fixture trong setup. | Bao phủ product đơn giản và product có required attributes/stock theo combination. |
| `CartComposition` | `OneLine`, `MultipleLines` | Đề xuất đưa vào model; `MultipleLines` dùng các fixture khác nhau, không nhân bản cùng line. | Số line trong cart khác với quantity trên một line; cần kiểm tra tổng hợp cart nhiều sản phẩm. |
| `QuantityClass` | `One`, `ManyWithinStock`, `AtAvailableLimit`, `ExceedsAvailableStock` | Đưa vào model cho sản phẩm quản lý tồn kho. Mỗi value được xác định tương đối với stock khả dụng tại thời điểm kiểm tra; không dùng số lượng tuỳ ý ngoài fixture. | Thể hiện 1/nhiều, boundary vừa đủ và trường hợp vượt kho; quantity và tồn kho có tương tác nghiệp vụ. |
| `InventoryState` | `InStock`, `OutOfStock` | Đưa vào model cho product/combination có quản lý tồn kho; constraint phải thống nhất với `QuantityClass`. | Bao phủ còn hàng và hết hàng; stock theo combination phải được kiểm tra cho configurable product. |
| `Coupon` | `None`, `Valid`, `Invalid` | Đưa vào model khi fixture có coupon local hợp lệ và một coupon không hợp lệ/không tồn tại. Nếu chưa tạo đủ fixture, đánh dấu mức tương ứng Blocked/Not Run, không giả định đã kiểm thử. | Coupon có thể làm thay đổi cart total hoặc bị từ chối; cần kiểm tra riêng hiệu lực và trạng thái áp dụng. |
| `Address` | `Complete`, `MissingRequired`, `NA` | `Complete` và `MissingRequired` là mức kiểm thử. `NA` chỉ dùng cho flow bị chặn trước bước address, không phải một kiểu address. | Address thiếu required field phải bị validation chặn; `NA` giúp biểu diễn flow chưa tới bước address. |
| `ShippingMethod` | `LocalOption1`, `LocalOption2`, `NA` | Chỉ dùng các option local thực sự được cài, bật và trả về cho fixture. Nếu chỉ xác minh được một option, chỉ sinh `LocalOption1`; không tạo value giả để đủ số lượng. `NA` chỉ khi shipping không áp dụng hoặc flow dừng trước bước này. | Shipping options phụ thuộc cấu hình/provider và địa chỉ. Chỉ một local method được bảo đảm trong baseline hiện tại. |
| `PaymentMethod` | `LocalSuccess`, `SimulatedDecline`, `NA` | `LocalSuccess` dùng `Payments.CheckMoneyOrder` khi plugin được cài/bật; kết quả tạo order thành công nhưng payment vẫn `Pending`. Chỉ dùng `SimulatedDecline` khi có fake processor local đã được xác minh. `NA` nếu checkout chưa tới bước payment. | Check/Money Order không thu tiền và không mô phỏng decline; không được dùng payment gateway thật. |
| `CartAction` | `Add`, `Update`, `Remove` | Đưa vào model Shopping Cart nếu lượt chạy bao gồm thao tác cart; trong model, `Remove` biểu diễn xóa line cuối và làm cart rỗng. Xóa một line nhưng vẫn còn line khác cần case riêng nếu nằm trong scope chạy. | Đây là thao tác cart được scope nêu rõ; xóa sản phẩm có thể khiến checkout không khả thi. |

### Diễn giải lượng đặt so với tồn kho

Các value của `QuantityClass` là phân hoạch theo quantity yêu cầu `q` và stock
khả dụng `s` của đúng product/combination:

| Value | Điều kiện |
| --- | --- |
| `One` | `q = 1` và `s > 1` |
| `ManyWithinStock` | `1 < q < s` |
| `AtAvailableLimit` | `q = s` và `s > 0` |
| `ExceedsAvailableStock` | `q > s` |

Trường hợp `s = 0` được thể hiện bằng `InventoryState=OutOfStock` và
`QuantityClass=ExceedsAvailableStock` với cart quantity dương. Không gộp
quantity của một line với `CartComposition`: `QuantityClass` là số lượng của
một product/combination, còn `CartComposition` là số line khác nhau trong cart.

## 3. Những mức có điều kiện hoặc chưa đưa vào baseline

Các giá trị bên dưới là ứng viên theo yêu cầu T06, nhưng không được sinh vào
model chạy chính thức cho tới khi có fixture/cấu hình xác nhận:

| Ứng viên | Điều kiện để đưa vào | Nếu chưa đáp ứng |
| --- | --- | --- |
| `CustomerType=Guest` | Anonymous checkout được bật; kiểm tra được guest order không gắn nhầm customer. | Giữ `Registered` cố định; không tính guest vào pair coverage. |
| `ShippingMethod=LocalOption2` | Có local option thứ hai, khác option thứ nhất, khả dụng với cùng fixture/cart và có phí dự kiến. | Chỉ giữ một local option; không coi provider bên ngoài là mức thứ hai. |
| `PaymentMethod=SimulatedDecline` | Có fake processor local với decline xác định, có thể cài/bật và có bằng chứng không gọi gateway thật. | Giữ mức decline ngoài tập sinh; ghi scenario là Blocked, không thay bằng `CheckMoneyOrder`. |
| `Coupon=Valid` | Coupon local đã được cấu hình hợp lệ cho product/customer/điều kiện đang test. | Không đánh dấu pair chứa mức này là đã chạy. |
| `CartComposition=MultipleLines` | Có ít nhất hai line fixture khả dụng trong cùng cart, giá/stock đã biết. | Tạm giữ `OneLine`; không thay bằng quantity nhiều trên một line. |

## 4. Constraint và tổ hợp không khả thi cần kiểm tra khi tích hợp

Đây là constraint đề xuất cho người tích hợp PICT; Linh xác nhận cú pháp và tập
tổ hợp cuối cùng trên `model.pict`.

1. `CustomerType=Guest` chỉ khả thi khi anonymous checkout bật; cấu hình này
   cố định trong một lần sinh/chạy, không xem setting bật/tắt là factor đồng
   thời với customer type.
2. `QuantityClass` chỉ áp dụng khi product/combination thực sự track inventory;
   không áp dụng `AtAvailableLimit`/`ExceedsAvailableStock` cho fixture không
   quản lý tồn kho.
3. `InventoryState=OutOfStock` yêu cầu quantity cart dương và dẫn tới
   `QuantityClass=ExceedsAvailableStock`; tổ hợp này chỉ đại diện một stock
   failure, không được tính như hai lỗi độc lập.
4. Nếu `CartAction=Remove` xóa line cuối, không thể tiếp tục checkout; các
   factor `Address`, `ShippingMethod`, `PaymentMethod` phải là `NA`.
5. `Address=MissingRequired` chặn bước checkout tiếp theo; khi address là lỗi
   chính, `ShippingMethod` và `PaymentMethod` là `NA`.
6. Fixture hiện tại chỉ có sản phẩm vật lý cần ship; do đó
   `ShippingMethod=NA` chỉ hợp lệ khi flow đã dừng trước bước shipping, không
   dùng `NA` trên nhánh checkout thành công.
7. `PaymentMethod=SimulatedDecline` chỉ khả thi nếu fake processor đã sẵn
   sàng và address/shipping/cart hợp lệ để payment là lỗi được quan sát.
8. Trong một test negative, chỉ kích hoạt một nguyên nhân chặn chính (ví dụ
   address thiếu required field **hoặc** stock không đủ **hoặc** payment
   decline). Tránh ghép nhiều lỗi chặn khiến không xác định được validation
   nào được thực thi.
9. Coupon không hợp lệ được kiểm tra như thao tác apply coupon riêng; nếu
   checkout vẫn có thể tiếp tục không dùng coupon, không ràng buộc nó thành
   `NA` trừ khi scenario cố ý dừng tại cart.

## 5. Tổ hợp cần kiểm thử exhaustive ngoài pairwise

Pairwise không thay thế các boundary/negative test bắt buộc. Chạy riêng các
tổ hợp sau, gắn scenario ID/evidence và không cộng chúng vào pair coverage:

| Exhaustive set | Tổ hợp bắt buộc | Mục đích |
| --- | --- | --- |
| Tồn kho và quantity | `One`, `ManyWithinStock`, `AtAvailableLimit`, `ExceedsAvailableStock` × `SimplePhysical`, `ConfigurablePhysical`; bao gồm một trường hợp stock bằng `0` và kiểm tra theo từng variant combination. | Bao phủ boundary và khác biệt inventory theo product/combination. |
| Address validation | `Complete` và từng required field bị thiếu riêng lẻ; mỗi lượt chỉ thiếu một field. | Xác nhận lỗi validation không bị field lỗi khác che khuất. |
| Coupon | `None`, coupon hợp lệ, coupon không hợp lệ/không tồn tại; thử apply/remove và kiểm tra total/state. | Xác minh coupon chỉ được áp dụng khi hợp lệ và được gỡ đúng. |
| Checkout shipping | Mỗi local option thực sự khả dụng và request rỗng/sai/option không còn khả dụng. | Bảo đảm tất cả method khả dụng và nhánh từ chối đều có case riêng. |
| Payment | Local success; decline với fake processor; retry sau decline nếu processor hỗ trợ. | Phân biệt tạo order offline với thanh toán thành công và lỗi decline. |
| Stock thay đổi khi checkout | Cart hợp lệ lúc bắt đầu, giảm stock trước Confirm xuống dưới quantity yêu cầu. | Kiểm tra lại stock tại thời điểm đặt order; không suy ra từ static pairwise. |

Nếu fake processor hoặc fixture cần thiết chưa có, đánh dấu tổ hợp tương ứng
`Blocked` và không báo là exhaustive pass.

## 6. Tiêu chí pairwise coverage

- Dùng PICT `/o:2`; tính các cặp mức trên **tập tổ hợp khả thi sau constraint**,
  không tính các cặp bị loại bởi constraint.
- Tiêu chí chấp nhận là `covered feasible pairs / total feasible pairs = 100%`.
  Báo cả tử số, mẫu số, số tổ hợp exhaustive khả thi, số test pairwise và seed/
  phiên bản PICT để có thể tái lập.
- Không tính value conditional chưa khả dụng (guest, local shipping thứ hai,
  simulated decline) là covered nếu chúng đã được loại khỏi model chạy.
  Liệt kê riêng các value/factor bị loại và lý do.
- Dùng validator/checker để xác nhận từng test row thỏa constraints và mọi
  feasible pair xuất hiện ít nhất một lần; không suy coverage từ số lượng test.
- Pairwise chỉ áp dụng cho tổ hợp input đa yếu tố. Các exhaustive set ở mục 5
  có kết quả/pass-fail riêng và không bù cho pair bị thiếu.

## 7. Checklist công việc T06

Model PICT hiện có trên nhánh T07 dùng tám factor và cố định
`CustomerType=Registered`, `Shipping=LocalAvailable/NA`,
`Payment=CheckMoneyOrder/NA`; chưa có factor tách riêng
`CartComposition`/`QuantityClass`. Checklist dưới đây theo dõi việc hoàn thành
subtask và chốt model chung; các ô review chỉ được đánh dấu bởi người phụ trách
sau khi xác nhận thực tế.

### Subtask của Khoa - Xây dựng bảng factor/value chính

- [x] Lập bảng factor/value và nêu lý do chọn từng factor.
- [x] Phân biệt quantity của một line với số line trong cart.
- [x] Ghi rõ các value cần điều kiện fixture/cấu hình trước khi đưa vào model.
- [x] Đề xuất exhaustive cases và tiêu chí feasible-pair coverage.
- [ ] Cập nhật bảng nếu Trang hoặc Linh có ý kiến review.

### Review và tích hợp model chung

- [x] **Trang:** đã review factor Checkout/Payment và ghi rõ trạng thái
  `Included`, `Excluded` hoặc `Blocked` cho guest checkout, shipping option
  thứ hai và payment decline local.
- [ ] **Linh:** xác nhận constraint và tổ hợp không hợp lệ; đồng bộ các factor/
  value đã được nhóm chốt vào `qa/pairwise/model.pict`.
- [ ] **Linh:** sinh lại bộ test và kiểm tra constraint cùng coverage trên model
  cuối; lưu kết quả/coverage report.
- [x] **Nhóm:** thống nhất source baseline SHA là
  `674d0ceef6bd8a52fe74d6f4fff326960162cec0` trong `scope.md` và `setup.md`.
- [ ] **Nhóm:** ghi rõ value conditional chưa khả dụng là `Excluded` hoặc
  `Blocked`; không tính chúng vào coverage và không báo là đã chạy.
