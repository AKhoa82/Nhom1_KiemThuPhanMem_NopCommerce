# Tổng hợp kết quả review Order và Payment

## 1. Thông tin lượt review

| Thuộc tính | Giá trị |
| --- | --- |
| Reviewer | Đỗ Đặng Diệu Linh |
| Ngày chạy evidence | 2026-10-05 đến 2026-10-06 |
| Source baseline của static review | `674d0ceef6bd8a52fe74d6f4fff326960162cec0` |
| Runtime/build SHA đã ghi trong hướng dẫn | `5a8d4063129513307b5b9a668194cbe4dc3b5e6a` |
| Customer test | `l@gmail.com` |
| Product/SKU | PW-Simple-Stock / PW-SIMPLE-001 |
| Payment method | Check / Money Order (`Payments.CheckMoneyOrder`) |
| Kết luận chung | **Pass có điều kiện / Approve có điều kiện** |

Báo cáo này kết hợp kết quả static review đã thực hiện với 9 ảnh dynamic
evidence tại [`image/review`](../image/review/). Kết luận chỉ áp dụng cho phạm
vi evidence hiện có, không được hiểu là đã chạy đủ 9 scenario T05.

## 2. Kết quả đọc từ evidence

| Evidence | Nội dung quan sát được | Kết quả |
| --- | --- | --- |
| [REVIEW-01-orders-before.png](../image/review/REVIEW-01-orders-before.png) | Lọc Billing email address = `l@gmail.com`; bảng hiển thị `No data available in table` | Trước test: order count = 0, latest Order # = N/A |
| [REVIEW-02-confirm-order.png](../image/review/REVIEW-02-confirm-order.png) | Billing/Shipping address của Diệu Linh; Payment method = Check / Money Order; Shipping method = Ground; SKU PW-SIMPLE-001; quantity 1; total `100 đ` | Dữ liệu checkout hợp lệ và sẵn sàng Confirm |
| [REVIEW-03-order-completed.png](../image/review/REVIEW-03-order-completed.png) | `Your order has been successfully processed!`; Order number = 1 | Checkout tạo order thành công |
| [REVIEW-04-orders-after.png](../image/review/REVIEW-04-orders-after.png) | Một dòng Order #1; Order status Pending; Payment status Pending; Shipping status Not yet shipped; customer `l@gmail.com`; total `$100.00` | So với bảng rỗng trước test, phát sinh đúng 1 order mới |
| [REVIEW-05-order-details.png](../image/review/REVIEW-05-order-details.png) | Order #1; Order status Pending; subtotal `$100.00`; shipping/tax `$0.00`; total `$100.00`; Payment method Check / Money Order; Payment status Pending | Dữ liệu order/payment đã lưu khớp expected Pending/Pending |
| [REVIEW-06-order-addresses.png](../image/review/REVIEW-06-order-addresses.png) | Admin lưu Billing address của Diệu Linh, email `l@gmail.com`, address 123/234, Bến Tre, Vietnam | Billing address đã lưu đúng trong Order #1 |
| [REVIEW-07-order-shipping-method.png](../image/review/REVIEW-07-order-shipping-method.png) | Admin lưu Shipping address của Diệu Linh với dữ liệu khớp Billing address | Shipping address đã lưu; ảnh chưa hiển thị trường Shipping method |
| [REVIEW-08-address-firstname-required.png](../image/review/REVIEW-08-address-firstname-required.png) | Form address để trống First name hiển thị `First name is required.` và vẫn ở màn hình address | Server/UI từ chối address thiếu First name |
| [REVIEW-09-orders-unchanged-after-address-error.png](../image/review/REVIEW-09-orders-unchanged-after-address-error.png) | Sau validation lỗi, danh sách vẫn chỉ có Order #1 | Address lỗi không tạo order mới; delta = 0 |

## 3. Kết quả thực tế của lượt chạy

```text
Before:
- Order count: 0
- Latest Order #: N/A

Checkout:
- Product/SKU: PW-Simple-Stock / PW-SIMPLE-001
- Quantity: 1
- Shipping method: Ground
- Payment method: Check / Money Order
- Storefront total: 100 đ

After:
- Order count: 1
- New Order #: 1
- Order status: Pending
- Payment status: Pending
- Shipping status: Not yet shipped
- Admin order total: $100.00

Order count delta: +1
Minimal review result: Pass có điều kiện
```

## 4. Đối chiếu static review với dynamic evidence

Static review kết luận rằng `Payments.CheckMoneyOrder` tạo order mới với
`OrderStatus.Pending` và `PaymentStatus.Pending`. Dynamic evidence xác nhận đúng
luồng này trên Order #1:

1. Trước checkout không có order cho email test.
2. Confirm order sử dụng Check / Money Order.
3. Completed trả về Order #1.
4. Admin xuất hiện đúng một order mới.
5. Order details lưu Pending/Pending và đúng payment method.

Như vậy căn cứ mã nguồn và hành vi runtime thống nhất đối với luồng checkout
thành công bằng Check / Money Order.

## 5. Ma trận scenario sau khi bổ sung evidence

| Scenario | Trạng thái sau review | Căn cứ/giới hạn |
| --- | --- | --- |
| CHK-01 | **Pass có điều kiện** | Có đúng một order mới; Pending/Pending; method đúng; có finding về ký hiệu currency |
| PAY-LOCAL-01 | **Pass trong luồng tối giản** | Payment method được tự chọn khi bước selection bị bypass; Confirm và Order details đều ghi Check / Money Order |
| ADDR-01 | **Pass** | Confirm và Admin Order details cùng chứng minh billing/shipping address đã lưu đúng |
| SHP-01 | **Partial** | Confirm hiển thị Shipping method = Ground; chưa chạy riêng kiểm tra lựa chọn được giữ trước khi Confirm |
| CHK-02 | **Not run** | Không có evidence guest checkout |
| ADDR-02 | **Pass** | Có validation `First name is required.` và danh sách vẫn chỉ có Order #1; delta = 0 |
| SHP-02 | **Not run** | Không có evidence request shipping sai và order delta = 0 |
| INV-01 | **Not run** | Chưa có evidence tồn kho thay đổi, warning, cart và order delta = 0 |
| PAY-FAIL-01 | **Blocked** | Chưa có fake payment processor local; Check / Money Order không mô phỏng decline |

## 6. Findings sau dynamic review

### D-01 - Ký hiệu currency không thống nhất

- Mức độ: **Minor / cần xác minh cấu hình currency**.
- Confirm order hiển thị total `100 đ`.
- Orders và Order details trong Admin hiển thị `$100.00`.
- Giá trị số đều là 100, nhưng ký hiệu tiền tệ không khớp.
- Finding này không làm thay đổi kết luận Pending/Pending, nhưng chưa thể khẳng
  định phần hiển thị total/currency khớp hoàn toàn giữa storefront và Admin.

### D-02 - Dynamic coverage mới bao phủ luồng tối giản

- Mức độ: **Coverage gap**.
- Evidence hiện tại đủ cho checkout thành công và trạng thái order/payment.
- Đã bổ sung evidence address hợp lệ và address thiếu First name.
- Chưa có evidence hoàn chỉnh cho guest, shipping invalid, inventory thay đổi
  và payment decline.
- Không nâng kết luận thành final approve của toàn bộ 9 scenario T05.

### D-03 - Shipping method chưa được chụp trong Admin

- Mức độ: **Minor / evidence gap**.
- ADDR-01 đã đủ evidence: Billing address và Shipping address được lưu trong
  Admin Order details.
- Ảnh Confirm chứng minh Shipping method Ground được dùng, nhưng ảnh 07 chỉ
  hiển thị Shipping address, chưa hiển thị trường Shipping method trong Admin.
- SHP-01 tiếp tục được ghi Partial cho tới khi bổ sung ảnh trường Shipping
  method = Ground.

## 7. Kết luận review

### Phần đã xác nhận

- Static review không phát hiện sai lệch trong expected Pending/Pending.
- Dynamic review tạo thành công đúng một Order #1 từ baseline không có order.
- Order #1 lưu Order status = Pending.
- Order #1 lưu Payment status = Pending.
- Order #1 lưu Payment method = Check / Money Order.
- Product/SKU, quantity và giá trị số của total khớp luồng Confirm.
- Billing address và Shipping address được lưu đúng trong Order #1.
- Address thiếu First name bị từ chối và không tạo order mới.

**Quyết định đề xuất: Approve có điều kiện.** Luồng Order/Payment thành công đã
đạt theo expected Pending/Pending.

## 8. Nội dung ngắn để đăng PR/Jira

> Linh đã hoàn thành static review và dynamic review tối giản cho Order/Payment.
> Evidence xác nhận từ baseline 0 order, checkout bằng Check / Money Order tạo
> đúng Order #1; Admin lưu OrderStatus Pending, PaymentStatus Pending và đúng
> payment method. Kết quả phù hợp với căn cứ mã nguồn. Hiện đề xuất Approve có
> điều kiện vì guest/shipping invalid và inventory chưa chạy,
> PAY-FAIL-01 còn
> blocked và có finding ký hiệu currency: storefront `100 đ`, Admin `$100.00`.
