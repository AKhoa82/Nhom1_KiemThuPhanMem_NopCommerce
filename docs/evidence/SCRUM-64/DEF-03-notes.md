# DEF-03 — Ghi chú cấu hình tiền tệ (C3 bước 2)

Ngày kiểm tra: 25/11/2026. Ảnh Admin: `screenshots/DEF-03_01_currencies.png` (Admin → Configuration → Currencies). Số liệu bên dưới đọc từ DB local bằng truy vấn chỉ đọc và khớp với ảnh.

## Cấu hình hiện tại

| Mục | Giá trị |
| --- | --- |
| Primary store currency | **US Dollar (USD)**, rate 1 (`currencysettings.primarystorecurrencyid = 1`) |
| Primary exchange rate currency | US Dollar (USD) (`primaryexchangeratecurrencyid = 1`) |
| Currency đang Published | **Vietnamese Dong (VND)** rate **1**, display order **0**; **US Dollar (USD)** rate 1, display order 1. Các tiền tệ khác không Published |
| Ngôn ngữ | English (`en-US`) và Tiếng Việt (`vi-VN`), cả hai có `DefaultCurrencyId = 0` (không gán tiền tệ mặc định) |
| Tỷ giá | `autoupdateenabled = False` (không tự cập nhật tỷ giá) |
| Ô chọn tiền tệ trên storefront | Có (dropdown ở góc trên bên trái, hiện `Vietnamese Dong`, xem ảnh `DEF-01_02_guest-cart.png`) |

## Tiền tệ nào hiển thị `đ`, và vì sao

- `₫` / `đ` là ký hiệu của **Vietnamese Dong (VND)**. VND đang Published.
- Storefront dùng *working currency* của khách. Theo `WebWorkContext.GetWorkingCurrencyAsync()` (`src/Presentation/Nop.Web.Framework/WebWorkContext.cs:398`), khi khách chưa chọn tiền tệ (`customer.CurrencyId` không khớp) và ngôn ngữ không có `DefaultCurrencyId`, hệ thống lấy **tiền tệ đầu tiên của store** (xếp theo display order). VND có display order 0 nên được chọn.
- **Admin** luôn dùng *primary store currency* (cùng hàm, nhánh "admin area"), tức **USD** → hiển thị `$`.

## Kết luận nguyên nhân (đã xác nhận từ mã nguồn và DB)

Khác biệt `100 đ` ở storefront và `$100.00` ở Admin do cấu hình, không phải lỗi mã nguồn:
1. Storefront hiển thị bằng VND (display order 0), Admin bằng USD (primary store currency).
2. **Tỷ giá VND = 1** so với USD. Vì vậy số tiền 100 USD được hiển thị là `100 ₫`, giữ nguyên con số, chỉ đổi ký hiệu. Đây là lỗi cấu hình tỷ giá: thực tế 1 USD khác khoảng 25.000 VND. Do đó giá trị số "đúng" ở D-01 là đúng *vì tỷ giá sai bằng 1*.

## Ảnh hưởng

- Trong môi trường test: chỉ gây khác biệt ký hiệu, các assertion PW dùng giá trị số nên vẫn Pass.
- Nếu đưa lên môi trường thật: khách thấy giá `100 ₫` nhưng đơn lưu bằng USD, sai về nghĩa kinh tế. Mức độ nghiêm trọng thực tế cao hơn "Low", nhưng đây là dữ liệu cấu hình của môi trường test, không phải lỗi sản phẩm nopCommerce.

## Hướng xử lý (để Khoa quyết định)

- Cách 1: đặt VND thành Unpublished, hoặc đổi display order để USD đứng đầu, rồi chạy lại PW-006 và xác nhận cả hai nơi hiển thị `$`.
- Cách 2: giữ VND nhưng đặt tỷ giá đúng (khoảng 25.000 so với USD) và bật cập nhật tỷ giá.
- Cách 3: ghi Accepted risk cho môi trường test (chỉ khi Khoa đồng ý bằng văn bản).

## Bằng chứng đặt hàng (C3 bước 3, 25/11/2026)

Đơn thử: đăng nhập `qa.n03.scrum64@example.test`, thêm 1 `PW-Simple-Stock`, Ground, Check / Money Order, checkout nhiều bước.

| Nơi hiển thị | Quan sát | Ảnh |
| --- | --- | --- |
| Storefront, trang Confirm | Price `100 ₫`, Sub-Total `100 ₫`, Shipping (Ground) `0 ₫`, Tax `0 ₫`, **Total `100 ₫`** | `screenshots/DEF-03_02_storefront-total.png` |
| Admin, Order details | Order subtotal `$100.00` excl tax, Order shipping `$0.00`, Order tax `$0.00`, **Order total `$100.00`**; Payment method Check / Money Order, Payment status Pending | `screenshots/DEF-03_03_admin-total.png` |

Đối chiếu DB (truy vấn chỉ đọc, đơn mới nhất của tài khoản này):

| Order Id | Customer | `CustomerCurrencyCode` | `CurrencyRate` | `OrderSubtotalExclTax` | `OrderTotal` | Status / Payment |
| --- | --- | --- | --- | --- | --- | --- |
| 1065 | `qa.n03.scrum64@example.test` | **VND** | **1.0000** | 100 | 100 | 10 / 10 (Pending / Pending) |

Ảnh Admin (`DEF-03_03_admin-total.png`, chụp lại 25/11/2026) hiện `Order # 1065` và khách `qa.n03.scrum64@example.test`, khớp với DB (đơn 1065, tổng 100, Pending).

## Kết luận nguyên nhân (đã xác nhận)

**Nguyên nhân là cấu hình, không phải lỗi mã nguồn.** Cùng một đơn, hai nơi cho cùng con số 100 nhưng khác ký hiệu:
- Storefront hiển thị theo tiền tệ của khách (VND, ký hiệu `₫`). Đơn lưu `CustomerCurrencyCode = VND`.
- Admin hiển thị theo tiền tệ chính của store (USD, ký hiệu `$`). `OrderTotal` được lưu theo đơn vị tiền chính nên bằng 100.
- `CurrencyRate = 1.0000`: nopCommerce quy đổi 100 (USD) × 1 = 100 (VND), vì tỷ giá VND được cấu hình bằng 1. Vì vậy số không đổi, chỉ đổi ký hiệu.

Cả bốn dòng tiền (subtotal, shipping, tax, total) nhất quán trong từng nơi; không có sai số học giữa hai nơi.

## Việc còn lại

- Khoa quyết định cách xử lý (Unpublish VND hoặc đặt USD display order 0, hoặc sửa tỷ giá VND, hoặc ghi Accepted risk).
- Sau khi sửa cấu hình, chạy lại PW-006 và đặt thử một đơn, xác nhận cả hai nơi cùng ký hiệu.
