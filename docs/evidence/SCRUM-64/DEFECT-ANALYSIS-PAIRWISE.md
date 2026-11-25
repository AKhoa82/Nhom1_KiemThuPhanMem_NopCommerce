# Phân tích test case thất bại và hành vi bất thường

Phạm vi: 14 ca Pairwise `PW-001`…`PW-014` (model `qa/pairwise/model.pict`) cùng các scenario rủi ro đã chạy quanh chúng (SCRUM-112, N02, N03/SCRUM-91).

> **Giới hạn của tài liệu này.** Số liệu lấy từ bằng chứng đã commit (`qa/automation/REVIEW_EVIDENCE.md`, `docs/evidence/SCRUM-112/`, `docs/evidence/SCRUM-91/`) và từ mã nguồn trong repo. Riêng số liệu coverage 253/253 đã được **chạy lại ngày 24/11/2026** bằng `calculate-pairwise-coverage.ps1`. Đã chạy lại bộ Playwright PW ngày 24–25/11/2026 sau khi dựng lại fixture (xem E-03…E-05 ở mục 5). Lượt đầy đủ đầu tiên cho **10 pass / 4 fail** (PW-003, 006, 011, 014); cả 4 đều do lỗi fixture coupon (E-05) và đường dẫn shell (E-06), không phải lỗi sản phẩm. Sau khi sửa, **lượt chạy liền mạch `npx playwright test tests/pairwise.spec.ts` cho 14 passed (16.0 phút)**, xem `PW-RUN-25112026.md` và `screenshots/B3_pairwise-summary.png`.

## 1. Kết luận

| Nhóm | Kết quả |
| --- | --- |
| 14 ca Pairwise | **Không có defect sản phẩm.** Lượt đã commit: 15/15 Pass (`qa/automation/REVIEW_EVIDENCE.md` dòng 32 và 38). Lượt chạy lại 25/11/2026: 14/14 PW pass liền mạch sau khi sửa fixture (xem đầu tài liệu). |
| Coverage Pairwise | **253/253 cặp feasible = 100%**, 0 missing, 0 unexpected, 0 infeasible row (mục 4). |
| Scenario rủi ro ngoài 14 ca PW | **2 Fail và 1 finding mở**, được lập thành 3 defect ở mục 3. Trong đó DEF-01 đã được sửa trên `develop` bởi SCRUM-96 (PR #16); DEF-02 và DEF-03 chưa có bản sửa. |

Hai kết quả này không mâu thuẫn. Pairwise chỉ chứng minh mọi **cặp giá trị** của 10 factor đã được thử ít nhất một lần. Các lỗi dưới đây cần một **chuỗi thao tác** hoặc **hai request đồng thời**, nên model PW không sinh ra chúng. 253/253 là coverage của model, không phải risk coverage của 26 scenario.

## 2. Phân loại theo bản chất lỗi

| Loại | Mục | Ghi chú |
| --- | --- | --- |
| Lỗi sản phẩm | DEF-01, DEF-02, DEF-03 | Hành vi sai của nopCommerce hoặc cấu hình cửa hàng |
| Lỗi test | T-01, T-02 | Đã sửa trong mã test, không phải lỗi sản phẩm |
| Lỗi môi trường | E-01, E-02 | Không tính là defect sản phẩm |

## 3. Defect list (lỗi sản phẩm)

Không defect nào xuất phát từ một dòng PW. Cột "Pairwise case ID" ghi ca PW gần nhất về điều kiện và nêu rõ chưa có dòng PW nào bao phủ trực tiếp.

### DEF-01 — Mất món của guest khi gộp giỏ vượt tồn kho (CART-MERGE-01, SCRUM-96)

> **Trạng thái (cập nhật 25/11/2026): đã được sửa trên `develop` bởi SCRUM-96** (PR #16, merge `8b33708a54`, commit sửa `a867000902`, ngày 24/11/2026). Toàn bộ bằng chứng trong mục DEF-01 là bằng chứng **trước khi sửa**, thu thập trên baseline `79a5556925`/`ef90fd26b1` (chưa có bản sửa). Retest sau sửa do SCRUM-96 thực hiện (`docs/evidence/SCRUM-96/`: unit test `ShoppingCartMigrationTests` 7/7, Playwright 9/9); **nhóm SCRUM-64 chưa tự chạy lại sau sửa**.

| Mục | Nội dung |
| --- | --- |
| Defect ID | DEF-01 |
| Pairwise case ID | Không có dòng PW trực tiếp. Gần nhất là `PW-004`, `PW-013`, `PW-014` (ExceedsAvailableStock, Update). Không ca nào có factor `LoginMerge`, nên coverage 100% không phát hiện lỗi này. Scenario là `CART-MERGE-01` (N02). |
| Preconditions | Hai test tái hiện cùng lỗi: (a) `checkout-risk.spec.ts` `CART-MERGE-01-OVERSTOCK`: `PW-SIMPLE-001`, stock 5 (test đặt bằng SQL rồi restart web), account 4 + guest 2; (b) `n02-cart.spec.ts` `MERGE-OVER`: `PW-SHIRT` Red/S, stock 5, account 4 + guest 2. Fixture reset bằng `reset-n02-fixture.ps1`. |
| Steps to reproduce | 1) Guest thêm 2 món cùng SKU vào giỏ. 2) Đăng nhập tài khoản đã có 4 món cùng SKU (tổng 6 > stock 5). 3) Quan sát giỏ và bảng `ShoppingCartItem`. |
| Input | Guest quantity 2, account quantity 4, stock 5 (tổng 6 > 5). |
| Expected result | Không mất dữ liệu im lặng. Giỏ giữ 4 món của account và hoặc gộp tối đa 5, hoặc giữ 2 món guest và báo cho khách. Quy tắc cụ thể **chưa được nhóm thống nhất** (việc còn mở của SCRUM-112). |
| Actual result | Tổng quantity trong `ShoppingCartItem` từ 6 xuống 4 sau đăng nhập. Hai món guest biến mất, không có thông báo. |
| Severity | High (mất dữ liệu giỏ hàng, không cảnh báo) |
| Frequency | Tái hiện **2/2 lượt hợp lệ** ngày 24/11/2026 (6 → 4; một lượt khác bị loại vì store khởi động chậm, lỗi môi trường), cộng lượt 18/11/2026 và một lượt chụp tay 25/11/2026. Nhánh hợp lệ (tổng ≤ stock) Pass nên lỗi **có điều kiện**. Mẫu nhỏ, ghi "tái hiện ổn định" chứ không khẳng định 100%. Chi tiết: `DEF-01-repro.md`. |
| Log / screenshot | `docs/evidence/SCRUM-86/RUN-20261118-CART-MERGE/merge-over-*.png`, `merge-over-guest-before-login.sql.txt`, `merge-over-account-after-login.sql.txt`, `merge-over-merge-over-quantities.txt`. Tóm tắt: `docs/evidence/SCRUM-112/RUN-CART-MERGE-01.md`. |
| Module / class nghi ngờ | `Nop.Services.Orders.ShoppingCartService.MigrateShoppingCartAsync` (`ShoppingCartService.cs:1872`). Được gọi từ `CustomerRegistrationService.cs:467`. |
| Root cause | Vòng lặp đầu gọi `AddToCartAsync(...)` cho từng dòng guest. Hàm này trả về danh sách warning khi vượt tồn kho và **không thêm** món đó. `MigrateShoppingCartAsync` bỏ qua giá trị trả về. Vòng lặp thứ hai sau đó xóa **tất cả** dòng guest bất kể kết quả. Món bị từ chối nên bị mất. |
| Cách xác minh | **Đã xác nhận cơ chế bằng thực thi (25/11/2026)**: chạy `ShoppingCartService` thật (xem `DEF-01-mechanism-probe.md`). Giỏ account 4, giỏ guest 2, stock 5: `AddToCartAsync` cho dòng guest trả warning "Your quantity exceeds stock on hand. The maximum quantity that can be added is 5." và không đổi giỏ; sau `MigrateShoppingCartAsync` account `qty=4`, guest `[]`, tổng 6 → 4. Cũng đã có test Playwright `CART-MERGE-01-OVERSTOCK` (2/2 lượt hợp lệ, 6 → 4) và ảnh chụp tay. Chạy lại (chỉ còn Fail trên bản build **trước** SCRUM-96; image Docker local của nhóm vẫn là bản trước sửa): `npx playwright test tests/checkout-risk.spec.ts -g CART-MERGE-01`. |
| Đề xuất hướng sửa | Thu thập warning của `AddToCartAsync`; chỉ xóa dòng guest đã chuyển thành công; giữ lại và báo khách về dòng bị từ chối. **Đã được SCRUM-96 triển khai đúng hướng này** (PR #16): dòng bị từ chối ở lại giỏ guest, khách ở trạng thái guest, thấy cảnh báo và có thể giảm số lượng rồi đăng nhập lại; `MigrateShoppingCartAsync` trả về danh sách warning. Phân tích nguyên nhân của SCRUM-96 trùng với root cause ở trên. |

### DEF-02 — Lỗi SQL `AK_Order_OrderGuid` lộ ra khách khi Confirm đồng thời (CHK-RACE-01, B02 / SCRUM-100)

| Mục | Nội dung |
| --- | --- |
| Defect ID | DEF-02 (trùng B02 / SCRUM-100) |
| Pairwise case ID | Không có dòng PW trực tiếp. Điều kiện nền gần `PW-006` (Registered, SimplePhysical, Complete, LocalSuccess). PW chạy tuần tự nên không thể phát hiện race. Scenario là `CHK-RACE-01` (N03). |
| Preconditions | Tài khoản `qa.n03.*`, giỏ 1 dòng `PW-SHIRT` Red/S × 4, stock 5, Ground, Check/Money Order. Checkout nhiều bước. `PlaceOrderWithLock=False`, `MinimumOrderPlacementInterval=1`, `RegenerateOrderGuidInterval=180`. Reset bằng `reset-n03-fixture.ps1`. |
| Steps to reproduce | Mở hai tab cùng ở bước Confirm. Gửi hai POST Confirm gần đồng thời (chênh khoảng 2,7–32,6 ms). Chạy bằng `run-n03-series.ps1 -Runs 10 -Label BEFORE-FIX`. |
| Input | Hai POST `/checkout/confirmorder` từ cùng một khách, cùng `ProcessPaymentRequest`. |
| Expected result | Một đơn được tạo. Tab còn lại hiện thông báo nghiệp vụ hoặc chuyển về cùng đơn. Không có chuỗi SQL nội bộ hiển thị cho khách. |
| Actual result | Đúng một đơn được tạo (order delta = 1, stock 5→1, giỏ 1→0, không trùng `OrderGuid`). Tab thứ hai nhận HTTP 200 kèm lỗi SQL vi phạm unique key `AK_Order_OrderGuid`. |
| Severity | High về trải nghiệm và lộ thông tin nội bộ. **Không** gây đơn trùng hay lệch tồn kho. Không nên ghi là Critical. |
| Frequency | **10/10** lượt hợp lệ (Wilson 95%: 72%–100%). Ba lượt SCRUM-90 cũng là 3/3. Tab bị lỗi thay đổi giữa các lượt (A 5 lượt, B 5 lượt). |
| Log / screenshot | `docs/evidence/SCRUM-91/RUN-BEFORE-FIX.md`, `run01-tab-A-sql-error.png`, `run01-tab-B-completed.png`, `N03-FIXTURE-SQL-RESULTS.md`. Raw SQL và trace nằm local tại `qa/automation/n03-local-evidence/` (Git ignore). |
| Module / class nghi ngờ | `OrderProcessingService.PlaceOrderAsync` (`OrderProcessingService.cs:1590`), `SetProcessPaymentRequestAsync` (`:3336`), cấu hình `OrderSettings.PlaceOrderWithLock`. `CheckoutController` bắt `Exception` rồi đưa `exc.Message` vào lỗi hiển thị. |
| Root cause | Hai request dùng chung một `OrderGuid`, vì `RegenerateOrderGuidInterval=180` giữ lại GUID của `ProcessPaymentRequest` cũ trong 180 giây. `PlaceOrderWithLock=False` nên không có khóa tuần tự. Cả hai request cùng chạy `SaveOrderDetailsAsync`. Request đến sau vi phạm unique key `AK_Order_OrderGuid`. `exc.Message` được đưa thẳng vào UI. SQL cho thấy `OrderGuid` trong thông báo lỗi trùng với `OrderGuid` của đơn duy nhất. Giá trị identity bị tiêu một lần (order `Id=3`). Điều này khớp với cơ chế trên. **Trạng thái: đã xác nhận thực nghiệm `NO-LOCK` 10/10 so với `WITH-LOCK` 0/10 (xem Cách xác minh).** |
| Cách xác minh | **Đã thực hiện 25/11/2026, hai chuỗi 10 lượt cùng tài khoản `qa.n03.scrum64@example.test`, cùng máy, cùng commit `79a5556925`, cùng quy trình reset; chỉ đổi `placeorderwithlock`.** (1) `NO-LOCK` (`False`): **10/10 lượt lộ lỗi SQL** `AK_Order_OrderGuid` (Wilson 95%: 72%–100%), mỗi lượt đúng 1 đơn, không trùng `OrderGuid`; số liệu `RUN-NO-LOCK.md`. (2) `WITH-LOCK` (`True`): **0/10 lượt lộ lỗi SQL** (Wilson 95%: 0%–28%), mỗi lượt đúng 1 đơn, stock 5→1, giỏ 1→0; số liệu `RUN-WITH-LOCK.md`. Tab thua ở lại `/checkout/confirm` (HTTP 200) và hiện thông báo nghiệp vụ, trích từ HTML trong trace run01: "Please wait several seconds before placing a new order (already placed another order several seconds ago)." Hai khoảng tin cậy không chồng lên nhau (72%–100% so với 0%–28%). Kết luận: **cấu hình khóa đặt hàng là yếu tố quyết định**, root cause được xác nhận thực nghiệm trong phạm vi môi trường này. Hạn chế: một máy, một cấu hình khác; thông báo của tab thua mới trích từ 1 lượt (run01) chưa xem lại cả 10 lượt; chưa thử `RegenerateOrderGuidInterval=0` để tách riêng vai trò của việc dùng lại `OrderGuid`. |
| Đề xuất hướng sửa | Cách 1: bật `PlaceOrderWithLock`, nhưng cần đo ảnh hưởng hiệu năng. Cách 2: chặn double submit ở `CheckoutController` bằng idempotency token hoặc kiểm tra đơn theo `OrderGuid` trước khi tạo. Cách 3: bắt lỗi unique key và trả thông báo nghiệp vụ, không trả `exc.Message`. Retest theo checklist mục 5 của `N03-FIXTURE-SQL-RESULTS.md`. |

### DEF-03 — Ký hiệu tiền tệ không thống nhất (finding D-01 của CHK-01)

| Mục | Nội dung |
| --- | --- |
| Defect ID | DEF-03 |
| Pairwise case ID | `PW-006` (Registered, SimplePhysical, AtAvailableLimit, Valid coupon, LocalSuccess). Kết quả PW-006 vẫn Pass vì giá trị số đúng. |
| Preconditions | Tài khoản `qa.pairwise.registered@example.test`, `PW-SIMPLE-001` stock 10, Ground, Check/Money Order, checkout nhiều bước. |
| Steps to reproduce | Hoàn tất checkout như PW-006. So tổng tiền ở trang Confirm với Admin → Orders và Order details. |
| Input | Một dòng `PW-SIMPLE-001`, tổng 100. |
| Expected result | Storefront và Admin cùng ký hiệu tiền tệ. |
| Actual result | Storefront `100 đ`, Admin `$100.00`. Giá trị số, OrderStatus=10 và PaymentStatus=10 đều đúng, và có đúng một order mới. |
| Severity | Low trong môi trường test (chỉ khác ký hiệu, PW-006 vẫn Pass). Sẽ ở mức Medium nếu cấu hình này lên môi trường thật, vì tỷ giá VND = 1 làm giá hiển thị sai nghĩa kinh tế. |
| Frequency | Quan sát ở lượt 03/11/2026 và tái hiện lại ngày 25/11/2026 (đơn 1065, 2/2 lần có đặt hàng). Do cấu hình cố định nên xảy ra mỗi khi khách chưa chọn tiền tệ khác; chưa chạy lặp nhiều lần. |
| Log / screenshot | `screenshots/DEF-03_01_currencies.png`, `DEF-03_02_storefront-total.png`, `DEF-03_03_admin-total.png`, `DEF-03-notes.md` (ảnh Admin hiện `Order # 1065`; đối chiếu DB đơn 1065: `CustomerCurrencyCode=VND`, `CurrencyRate=1`, `OrderTotal=100`). Ảnh lượt 03/11: `image/review/REVIEW-02-confirm-order.png`, `REVIEW-04-orders-after.png`, `REVIEW-05-order-details.png`. |
| Module / class nghi ngờ | Cấu hình tiền tệ (Admin → Configuration → Currencies), `WebWorkContext.GetWorkingCurrencyAsync()` (`WebWorkContext.cs:398`): storefront dùng tiền tệ của khách, Admin dùng primary store currency. Không phải lỗi mã nguồn. |
| Root cause | **Đã xác nhận từ DB và mã nguồn (25/11/2026).** Primary store currency là USD. Vietnamese Dong cũng được Published với display order 0 và **tỷ giá 1** so với USD. Khách chưa chọn tiền tệ và ngôn ngữ không có `DefaultCurrencyId`, nên `GetWorkingCurrencyAsync` chọn tiền tệ đầu tiên của store là VND → storefront hiện `100 ₫`; Admin luôn dùng USD → `$100.00`. Vì tỷ giá VND = 1, con số giữ nguyên chỉ đổi ký hiệu. Chi tiết: `DEF-03-notes.md`. |
| Cách xác minh | **Đã xác nhận 25/11/2026:** ảnh Currencies, hai ảnh tổng tiền (storefront `100 ₫`, Admin `$100.00`), truy vấn bảng `Currency` / `Setting` / `Language` / `Order`, và đọc `WebWorkContext.cs`. Cùng một đơn có `CustomerCurrencyCode=VND`, `CurrencyRate=1`. Ảnh Admin hiện `Order # 1065`, khớp DB. Sau khi sửa cấu hình, chạy lại PW-006 và đặt thử một đơn để kiểm tra cả hai nơi cùng ký hiệu. |
| Đề xuất hướng sửa | Unpublish VND hoặc đặt USD display order 0; hoặc giữ VND với tỷ giá đúng và bật cập nhật tỷ giá. Nếu khác biệt là chủ ý cho môi trường test, ghi Accepted risk **sau khi Khoa quyết định** (tài liệu hiện chưa ghi Accepted risk). |

## 4. Bằng chứng không có defect trong 14 ca PW

### 4.1 Chứng minh pair coverage

Chạy lại ngày 24/11/2026: `powershell -File qa/pairwise/calculate-pairwise-coverage.ps1`

```
Factors: 10                                  Generated tests: 14
Raw full assignments before constraints: 6912    Feasible full assignments: 420
Raw candidate pairs: 279                         Total feasible pairs: 253
Covered feasible pairs: 253                      Missing feasible pairs: 0
Unexpected actual pairs: 0                       Infeasible generated rows: 0
Coverage: 253/253 = 100%                         Overall result: PASS
```

Cách đọc con số: pair feasible là cặp giá trị của hai factor khác nhau mà ít nhất một full assignment hợp lệ (qua constraint) chứa cả hai. Script đếm các cặp đó từ model và đối chiếu với các cặp xuất hiện thật trong 14 dòng. 279 − 253 = 26 cặp bị constraint loại nên không tính vào mẫu số. Không có dòng nào vi phạm constraint. Báo cáo đầy đủ ở `qa/pairwise/coverage-report.md` (PICT 3.7.4, seed 10380, SHA-256 model `70DDF667…AB5F`).

### 4.2 Chứng minh threshold đạt

Threshold của model: mọi pair feasible phải được phủ (2-way, 100%), mỗi dòng là một case có `CaseId` và ánh xạ 1-1 sang scenario.

| Tiêu chí | Yêu cầu | Thực tế | Kết quả |
| --- | --- | --- | --- |
| Pair coverage | 100% | 253/253 | Đạt |
| Dòng vi phạm constraint | 0 | 0 | Đạt |
| Pair ngoài dự kiến | 0 | 0 | Đạt |
| Ánh xạ CaseId → scenario | 14/14, 1-1 | 14/14 (`scenario-mapping.csv`) | Đạt |
| Thực thi 14 ca | 0 Fail, 0 Skip | 14/14 Pass (lượt chạy lại 25/11/2026); lượt cũ đã commit 15/15 gồm `HARNESS-001` (smoke test riêng) | Đạt |

Lưu ý: dòng "Thực thi" 14/14 là kết quả lượt chạy liền mạch ngày 25/11/2026 (`PW-RUN-25112026.md`, ảnh `B3_pairwise-summary.png`); `HARNESS-001` không nằm trong lượt này.

### 4.3 Giải thích một số kết quả

- Các ca Negative (PW-001, 004, 010, 011, 012, 013, 014) Pass nghĩa là hệ thống **chặn đúng** (địa chỉ thiếu trường, vượt tồn kho, hết hàng), không phải ca bị lỗi.
- PW-006 được ghi "Pass có điều kiện" chỉ vì DEF-03. Phần nghiệp vụ (1 order, Pending/Pending, giỏ rỗng) đều đúng.
- Một số dòng PW chỉ bao phủ một phần luồng. Ví dụ PW-003 và PW-008 dừng sau khi xóa dòng giỏ cuối. Pair coverage đo giá trị factor, không đo độ sâu luồng.

## 5. Lỗi test và lỗi môi trường (không phải defect sản phẩm)

| ID | Loại | Hiện tượng | Nguyên nhân | Xử lý |
| --- | --- | --- | --- | --- |
| T-01 | Lỗi test | SHP-01 không tìm đúng shipping option | Locator khớp nhiều option, kết quả sai chỗ | Sửa locator Ground riêng (`RUN-SHP-01.md`) |
| T-02 | Lỗi test | PAY-FAIL-01 bị skip | Test kiểm phương thức thanh toán khi còn ở bước Shipping | Sửa để đi tới Payment Method rồi mới kiểm (`RUN-20261118-N01.md`) |
| E-01 | Lỗi môi trường | INV-01: giảm stock bằng SQL nhưng web vẫn dùng số cũ | Nop cache tồn kho trong bộ nhớ, SQL trực tiếp bỏ qua cache | Restart container web sau khi đổi SQL. Kết quả không áp dụng cho cập nhật qua Admin |
| E-02 | Lỗi môi trường | Chưa thể chạy payment decline trước đây | Thiếu fake payment processor | Cài plugin local `Payments.QaDecline` (đã gỡ sau khi chạy) |
| E-03 | Lỗi môi trường / harness | 14/14 ca PW fail ở bước reset fixture (24/11/2026), `/opt/mssql-tools18/bin/sqlcmd: no such file` | `reset-fixture.ps1` gọi cứng `mssql-tools18`, còn container `mssql/server:2019-latest` chỉ có `/opt/mssql-tools/bin/sqlcmd`. SCRUM-91 đã sửa cho script N03 và `sql-fixture.ts` nhưng chưa sửa script này | Đã thêm fallback sang `/opt/mssql-tools/bin/sqlcmd` trong `reset-fixture.ps1` (chưa commit). Đã xác minh: reset chạy được |
| E-04 | Lỗi môi trường | Sau E-03, reset báo `FIXTURE_BLOCKED: Required fixture SKU is missing (PW-SIMPLE-001 or PW-SHIRT)` | DB hiện là bản cài mới: bảng `Product` chỉ có `PW-SHIRT` (do seed N03), không có `PW-SIMPLE-001`, `PW-OOS-001`, coupon `PW-CART-10PCT`. `seed-current-local-pw.sql` cũng không chạy được vì cần sản phẩm mẫu `QA-MERGE-*` không còn | Đã xử lý: tạo `PW-SIMPLE-001`, `PW-OOS-001` và coupon trong Admin; reset `-ValidateOnly` qua |
| E-05 | Lỗi môi trường / fixture | PW-003, 006, 011, 014 fail ở `assertCouponResult`: `.coupon-box .applied-discount-code` không tồn tại; giỏ hiện "The coupon code cannot be found" | Coupon `PW-CART-10PCT` trong DB có `CouponCode = NULL` và `DiscountTypeId = 1` (order total) thay vì `20` (order subtotal). Bốn ca này là toàn bộ các ca có Coupon = Valid. Báo cáo tự phân loại `FAILED_PRODUCT` nhưng thực chất là lỗi fixture | `UPDATE Discount SET CouponCode='PW-CART-10PCT', DiscountTypeId=20` cho đúng một dòng, restart web. PW-006, 014 pass. Cần ghi chú: phân loại tự động của reporter không tách được lỗi fixture khỏi lỗi sản phẩm |
| E-06 | Lỗi môi trường / shell | PW-003, 011 fail ở `page.goto`: `c:/Program%20Files/Git/pw-shirt-variants` | Git Bash đổi `/pw-shirt-variants` thành đường dẫn Windows khi truyền qua biến môi trường | Chạy lại với `MSYS_NO_PATHCONV=1`; PW-003, 011 pass. PowerShell không bị |

## 6. Tái hiện nhanh

```powershell
# Pairwise coverage
powershell -File qa/pairwise/calculate-pairwise-coverage.ps1

# 14 ca PW (cần QA_SQL_PASSWORD, QA_REGISTERED_EMAIL, QA_REGISTERED_PASSWORD)
cd qa/automation; npx playwright test tests/pairwise.spec.ts

# DEF-01
npx playwright test tests/checkout-risk.spec.ts -g CART-MERGE-01

# DEF-02 (10 lượt)
powershell -File scripts/run-n03-series.ps1 -Runs 10 -AccountEmail $env:QA_REGISTERED_EMAIL -Label BEFORE-FIX
```

## 7. Việc còn mở

1. DEF-01 (SCRUM-96): **đã sửa và merge trên `develop`** (PR #16, `8b33708a54`). Việc còn lại của nhóm SCRUM-64: retest sau sửa trên bản build mới (cần build lại image Docker từ `develop`; hiện container local vẫn là bản cũ) hoặc trích dẫn retest của SCRUM-96. Bằng chứng của tài liệu này là bằng chứng trước sửa.
2. DEF-02 (SCRUM-100): đã xác nhận thực nghiệm `NO-LOCK` 10/10 và `WITH-LOCK` 0/10. Cần nhóm quyết định hướng sửa (bật khóa hoặc chống submit đôi) và retest theo checklist SCRUM-91. Cấu hình hiện để `placeorderwithlock=False` (giá trị gốc theo SCRUM-91).
3. DEF-03: Khoa quyết định sửa cấu hình tiền tệ hay ghi Accepted risk.
4. Chưa chạy: `HARNESS-001` (smoke test riêng) trong lượt này; kiểm tra thông báo tab thua của DEF-02 cho cả 10 lượt `WITH-LOCK`; thử `RegenerateOrderGuidInterval=0`.
5. Ghi chú ảnh fixture: `screenshots/A6_coupon.png` chụp **trước khi** sửa E-05 (hiện "Assigned to order total"; DB hiện là loại subtotal, `CouponCode=PW-CART-10PCT`), và `A4_PW-OOS-001.png` hiện stock 10 (script reset đặt lại stock 0 trước mỗi ca). Hai ảnh chỉ minh họa việc tạo fixture, không phải trạng thái lúc chạy test.
