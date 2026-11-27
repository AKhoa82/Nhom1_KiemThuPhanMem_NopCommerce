# Phân tích test case thất bại và hành vi bất thường

Phạm vi: 14 ca Pairwise `PW-001`…`PW-014` (model `qa/pairwise/model.pict`) cùng các scenario rủi ro đã chạy quanh chúng (SCRUM-112, N02, N03/SCRUM-91).

> **Giới hạn của tài liệu này.** Số liệu lấy từ bằng chứng đã commit (`qa/automation/REVIEW_EVIDENCE.md`, `docs/evidence/SCRUM-112/`, `docs/evidence/SCRUM-91/`) và từ mã nguồn trong repo. Riêng số liệu coverage 253/253 đã được **chạy lại ngày 24/11/2026** bằng `calculate-pairwise-coverage.ps1`. Đã chạy lại bộ Playwright PW ngày 24–25/11/2026 sau khi dựng lại fixture (xem E-03…E-05 ở mục 5). Lượt đầy đủ đầu tiên cho **10 pass / 4 fail** (PW-003, 006, 011, 014); cả 4 đều do lỗi fixture coupon (E-05) và đường dẫn shell (E-06), không phải lỗi sản phẩm. Sau khi sửa, **lượt chạy liền mạch `npx playwright test tests/pairwise.spec.ts` cho 14 passed (16.0 phút)**, xem `PW-RUN-25112026.md` và `screenshots/B3_pairwise-summary.png`.

> **Cập nhật 27/11/2026 (trên `develop` `6f702568b0`).** Đã đối chiếu tài liệu với các việc làm sau ngày 25/11/2026:
> - **DEF-01:** đã retest sau sửa và đạt (mục 3).
> - **DEF-02:** đã được sửa bởi SCRUM-100 (PR #18) và retest 10/10 đạt.
> - **DEF-04 (mới):** thêm defect tìm thấy ngày 26/11/2026 trong S2-ADV-CART-AUTO.
> - **Lượt chạy lại 14 ca PW ngày 26/11/2026:** 14/14 Pass trên bản build mới.
> - **Lỗi test và lỗi môi trường mới:** bổ sung T-03, E-07.
> - **Coverage 253/253:** chạy lại ngày 27/11/2026, kết quả không đổi.

## 1. Kết luận

| Nhóm | Kết quả |
| --- | --- |
| 14 ca Pairwise | **Không có defect sản phẩm.** Lượt đã commit: 15/15 Pass (`qa/automation/REVIEW_EVIDENCE.md` dòng 32 và 38). Lượt chạy lại 25/11/2026: 14/14 PW pass liền mạch sau khi sửa fixture (xem đầu tài liệu). Lượt 26/11/2026 trên image build lại từ mã nguồn mới (S2-ADV-CART-AUTO): **14/14 Pass** (`docs/evidence/S2-ADV-CART-AUTO/live-20261126/final-pw-newbuild` 11 ca + `final-pw-rerun3` 3 ca chạy lại vì store khởi động chậm, xem E-07). |
| Coverage Pairwise | **253/253 cặp feasible = 100%**, 0 missing, 0 unexpected, 0 infeasible row (mục 4). Model N02 (gộp giỏ / thêm lặp, SCRUM-87): **30/30 = 100%**. |
| Scenario rủi ro ngoài 14 ca PW | **4 defect sản phẩm** ở mục 3. DEF-01 (SCRUM-96, PR #16) và DEF-02 (SCRUM-100, PR #18) **đã sửa trên `develop` và retest đạt**. DEF-03 (cấu hình tiền tệ) và DEF-04 (thiếu bản dịch vi-VN, mức Low) **còn mở**. |

Hai kết quả này không mâu thuẫn. Pairwise chỉ chứng minh mọi **cặp giá trị** của 10 factor đã được thử ít nhất một lần. Các lỗi dưới đây cần một **chuỗi thao tác** hoặc **hai request đồng thời**, nên model PW không sinh ra chúng. 253/253 là coverage của model, không phải risk coverage của 26 scenario.

## 2. Phân loại theo bản chất lỗi

| Loại | Mục | Ghi chú |
| --- | --- | --- |
| Lỗi sản phẩm | DEF-01, DEF-02, DEF-03, DEF-04 | Hành vi sai của nopCommerce, của bản sửa nhóm thêm vào, hoặc của cấu hình / dữ liệu ngôn ngữ cửa hàng |
| Lỗi test | T-01, T-02, T-03 | Đã sửa trong mã test, không phải lỗi sản phẩm |
| Lỗi môi trường | E-01 … E-07 | Không tính là defect sản phẩm |

Quy tắc phân loại:
- **Lỗi sản phẩm:** kết quả nghiệp vụ hoặc thông báo cho khách sai so với kỳ vọng, và vẫn sai khi môi trường cùng fixture đúng như mô tả.
- **Lỗi test:** locator, thứ tự bước hoặc giả định của test sai. Sau khi sửa test thì ca Pass mà không cần đổi sản phẩm.
- **Lỗi môi trường:** store, DB, Docker, shell hoặc fixture hỏng hay thiếu. Sau khi khôi phục môi trường, ca Pass với cùng mã test.

## 3. Defect list (lỗi sản phẩm)

Không defect nào xuất phát từ một dòng PW. Cột "Pairwise case ID" ghi ca PW gần nhất về điều kiện và nêu rõ chưa có dòng PW nào bao phủ trực tiếp.

### DEF-01 — Mất món của guest khi gộp giỏ vượt tồn kho (CART-MERGE-01, SCRUM-96)

> **Trạng thái (cập nhật 25/11/2026): đã được sửa trên `develop` bởi SCRUM-96** (PR #16, merge `8b33708a54`, commit sửa `a867000902`, ngày 24/11/2026). Toàn bộ bằng chứng trong mục DEF-01 là bằng chứng **trước khi sửa**, thu thập trên baseline `79a5556925`/`ef90fd26b1` (chưa có bản sửa). Retest sau sửa do SCRUM-96 thực hiện (`docs/evidence/SCRUM-96/`: unit test `ShoppingCartMigrationTests` 7/7, Playwright 9/9).
>
> **Retest bổ sung (26/11/2026, S2-ADV-CART-AUTO): Pass.**
> - **Bản build:** image web build lại từ mã nguồn `5756d2bac2`. Commit này có bản sửa `a867000902` và bản sửa B02 `0d0c9fcd75`. Image chạy trước đó (ngày 23/11) chưa có bản sửa nên đã được thay.
> - **Kết quả:** dòng N02 `N02-PW-006` (LoginMerge × Same × AboveStock, ánh xạ ca UI `MERGE-OVER`) cho Pass. Cụ thể: đăng nhập bị từ chối, guest giữ 2, account giữ 4; khách giảm guest xuống 1 rồi đăng nhập lại thì giỏ còn 5 món.
> - **Số liệu N02:** lượt `AUTO-202611261326` đạt 8/8 dòng (`qa/pairwise/n02-cart/execution.json`).
> - **Bằng chứng ADV:** `MERGE-OVER`, `MERGE-MULTISTORE`, `MERGE-ACTIVATION` Pass trong `docs/evidence/S2-ADV-CART-AUTO/live-20261126/final-adv-rerun4`.
> - **Ghi chú về lượt trước:** ở lượt `final-adv-newbuild2`, ba ca này Fail **chỉ vì câu thông báo** (DEF-04), không phải vì mất món.
> - **Hạn chế:** manifest ghi `workingTreeDirty=true`, tức lúc chạy có thay đổi harness chưa commit. Cùng ngày, các thay đổi harness được commit trong `1ede361faf` (gồm `n02-cart.spec.ts`, các helper, `seed-vi-stock-resource.sql`). Tuy vậy, không có bằng chứng rằng commit này trùng từng byte với working tree lúc chạy.

| Mục | Nội dung |
| --- | --- |
| Defect ID | DEF-01 |
| Pairwise case ID | **Model gốc 14 ca:** không có dòng PW trực tiếp. Gần nhất là `PW-004`, `PW-013`, `PW-014` (ExceedsAvailableStock, Update). Không ca nào có factor `LoginMerge`, nên coverage 100% không phát hiện lỗi này. **Model N02 (SCRUM-87, 30/30 pair), lập sau khi phát hiện lỗi:** dòng `N02-PW-006` (LoginMerge, Same, AboveStock; account 4, guest 2, stock 5), ánh xạ ca UI `MERGE-OVER`. Scenario là `CART-MERGE-01` (N02). |
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
| Cách xác minh | **Đã xác nhận cơ chế bằng thực thi (25/11/2026)**: chạy `ShoppingCartService` thật (xem `DEF-01-mechanism-probe.md`). Giỏ account 4, giỏ guest 2, stock 5: `AddToCartAsync` cho dòng guest trả warning "Your quantity exceeds stock on hand. The maximum quantity that can be added is 5." và không đổi giỏ; sau `MigrateShoppingCartAsync` account `qty=4`, guest `[]`, tổng 6 → 4. Cũng đã có test Playwright `CART-MERGE-01-OVERSTOCK` (2/2 lượt hợp lệ, 6 → 4) và ảnh chụp tay. Chạy lại: `npx playwright test tests/checkout-risk.spec.ts -g CART-MERGE-01`. Lệnh này chỉ Fail trên bản build **trước** SCRUM-96. Trên bản build sau sửa, kiểm bằng `MERGE-OVER` của N02 / ADV (xem khối retest ở trên). |
| Đề xuất hướng sửa | Thu thập warning của `AddToCartAsync`; chỉ xóa dòng guest đã chuyển thành công; giữ lại và báo khách về dòng bị từ chối. **Đã được SCRUM-96 triển khai đúng hướng này** (PR #16): dòng bị từ chối ở lại giỏ guest, khách ở trạng thái guest, thấy cảnh báo và có thể giảm số lượng rồi đăng nhập lại; `MigrateShoppingCartAsync` trả về danh sách warning. Phân tích nguyên nhân của SCRUM-96 trùng với root cause ở trên. |

### DEF-02 — Lỗi SQL `AK_Order_OrderGuid` lộ ra khách khi Confirm đồng thời (CHK-RACE-01, B02 / SCRUM-100)

> **Trạng thái (cập nhật 27/11/2026): đã sửa trên `develop` bởi SCRUM-100 và retest đạt.** PR #18 (merge `e21ff4471f`), commit sửa `9e0eb59eb5` và `0d0c9fcd75`.
> - **Hướng sửa:** theo Cách 3 ở cuối bảng dưới. Chi tiết ngoại lệ chỉ ghi vào log máy chủ; khách nhận thông báo `Checkout.OrderProcessingError`. Thông báo hợp lệ về `MinimumOrderPlacementInterval` vẫn được giữ.
> - **Retest có kiểm soát:** cùng cấu hình `PlaceOrderWithLock=False`. Kết quả **10/10 lượt Pass**: hai POST cách nhau dưới 250 ms, đúng 1 đơn, tồn kho 5→1, giỏ 1→0, `leakedSql=false`, `loserHasSafeMessage=true`. Unit test `CheckoutErrorMessageTests` đạt 4/4.
> - **Bằng chứng:** `docs/evidence/SCRUM-100/B02-DEFECT-AND-RETEST.md`, `B02-10-POSTS.json`, `run01-tab-A-safe.png`, `run01-sql-before.txt`, `run01-sql-after.txt`.
> - **Còn lại:** bản sửa không đổi cơ chế khóa hay idempotency (Cách 1, Cách 2). Hai request vẫn tranh nhau tới unique key; chỉ thông báo cho khách là đã an toàn.
>
> Bảng dưới đây mô tả lỗi **trước khi sửa**.

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
| Đề xuất hướng sửa | Cách 1: bật `PlaceOrderWithLock`, nhưng cần đo ảnh hưởng hiệu năng. Cách 2: chặn double submit ở `CheckoutController` bằng idempotency token hoặc kiểm tra đơn theo `OrderGuid` trước khi tạo. Cách 3: bắt lỗi unique key và trả thông báo nghiệp vụ, không trả `exc.Message`. **Cách 3 đã được SCRUM-100 triển khai** và retest 10/10 Pass theo checklist mục 5 của `N03-FIXTURE-SQL-RESULTS.md`. Cách 1 và Cách 2 vẫn là đề xuất gia cố, chưa làm. |

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

### DEF-04 — Cảnh báo gộp giỏ hiện khóa tài nguyên thô khi gói vi-VN thiếu `ShoppingCart.QuantityExceedsStock`

> Phát hiện ngày 26/11/2026 trong S2-ADV-CART-AUTO. Ghi chú gốc: `docs/evidence/S2-ADV-CART-AUTO/DEFECT-NOTE-vi-missing-stock-resource.md`. Lỗi nằm ở thông báo của bản sửa DEF-01, không ảnh hưởng dữ liệu giỏ.

| Mục | Nội dung |
| --- | --- |
| Defect ID | DEF-04 |
| Pairwise case ID | **Model gốc 14 ca:** không có dòng PW nào, vì model không có factor ngôn ngữ và không có `LoginMerge`. **Model N02:** `N02-PW-006` (LoginMerge × AboveStock), ca UI `MERGE-OVER`. Lỗi cũng xuất hiện ở hai ca ADV ngoài model là `MERGE-MULTISTORE` và `MERGE-ACTIVATION`. |
| Preconditions | Bản build có bản sửa DEF-01 (`a867000902` trở về sau). Ngôn ngữ Tiếng Việt (LanguageId 2) được Published. Bảng `LocaleStringResource` **không có** dòng `LanguageId=2, ResourceName='shoppingcart.quantityexceedsstock'`: gói vi-VN local chỉ có 1297 chuỗi, còn en-US có 8266. Fixture N02 `SCRUM-87-N02-v1`: `PW-SHIRT` Red/S stock 5, account Red/S ×4. |
| Steps to reproduce | 1) Reset fixture N02. 2) Ở trạng thái guest, chọn ngôn ngữ Tiếng Việt và thêm Red/S ×2. 3) Đăng nhập tài khoản đã có Red/S ×4. 4) Đọc thông báo `.bar-notification.warning`. |
| Input | Guest 2 + account 4 > stock 5. Ngôn ngữ vi-VN. Resource vi-VN cho `ShoppingCart.QuantityExceedsStock` bị thiếu. |
| Expected result | Thông báo nêu rõ giới hạn tồn kho, ví dụ `Số lượng vượt tồn kho (tối đa 5 món).`. Không hiện tên khóa tài nguyên. |
| Actual result | `Chưa đăng nhập: có món chưa gộp được. Món vẫn ở giỏ khách. Hãy kiểm tra và thử lại. Giỏ Your store name: PW-Shirt-Variants (PW-Color: Red, PW-Size: S) ×2. shoppingcart.quantityexceedsstock`. Câu này hiện tên khóa và không có con số 5. Phần dữ liệu vẫn đúng: guest giữ 2, account giữ 4. Cùng trang còn nhiều nhãn khác hiện tên khóa (`shoppingcart.sku`, `checkout.progress.cart`, `search.button`…). Đây là dấu hiệu gói vi-VN thiếu chuỗi trên diện rộng (xem `DEF-04-repro-20261127.md`). |
| Severity | Low (Minor). Đây là lỗi hiển thị / UX, không mất dữ liệu. Khách vẫn biết đăng nhập chưa xong và món còn trong giỏ, nhưng không biết được phép tối đa bao nhiêu món. |
| Frequency | **3/3** ca gộp bị từ chối với vi-VN trong lượt `S2-ADV-ADV-202611261207` (`final-adv-newbuild2`: MERGE-OVER, MERGE-MULTISTORE, MERGE-ACTIVATION). Sau khi bổ sung resource bằng `seed-vi-stock-resource.sql`, kết quả là **0/3**: ba ca Pass trong `final-adv-rerun4`. Lỗi mang tính tất định: luôn xảy ra khi thiếu resource, không bao giờ xảy ra khi có. **Lượt đối chứng 27/11/2026** (tài khoản mới `qa.n02.def04@example.test`): khi xóa resource, MERGE-OVER Fail đúng ở assertion thông báo; khi khôi phục resource, cùng test **Pass** (`DEF-04-repro-20261127.md`). |
| Log / screenshot | Ảnh: `screenshots/DEF-04_02_raw-key-warning.png`, thanh cảnh báo hiện `shoppingcart.quantityexceedsstock` và giỏ guest còn Red/S ×2. SQL trạng thái resource: `DEF-04-resource-before.sql.txt` (vi-VN 0 dòng; tổng chuỗi vi-VN 1297, en-US 8266). Biên bản: `DEF-04-repro-20261127.md`. Log lượt 26/11/2026: `docs/evidence/S2-ADV-CART-AUTO/live-20261126/final-adv-newbuild2/junit.xml` và `adv-cart-summary.json` / `.md`. Trace Playwright chỉ lưu local (Git ignore). |
| Module / class nghi ngờ | `ShoppingCartService.GetQuantityProductWarningsAsync` (`ShoppingCartService.cs:559`; dòng 576 gọi `GetResourceAsync("ShoppingCart.QuantityExceedsStock")` theo ngôn ngữ đang dùng). Sau đó `CustomerRegistrationService.SignInCustomerAsync` (`CustomerRegistrationService.cs:469`; đoạn ghép lý do tiếng Việt ở dòng 493-515). Hàm fallback `LocalizationService.GetResourceAsync` nằm ở `LocalizationService.cs:325-368`. |
| Root cause | Khi không tìm thấy resource và không có `defaultValue`, `LocalizationService.GetResourceAsync` trả về **tên khóa đã viết thường** (`LocalizationService.cs:329`, `:365`) và ghi log cảnh báo `Resource string (shoppingcart.quantityexceedsstock) is not found. Language ID = 2`. Vì vậy `string.Format("shoppingcart.quantityexceedsstock", 5)` cho ra đúng tên khóa, không còn con số. Ở `CustomerRegistrationService.cs:495`, template đọc lại cũng là tên khóa, nên `IndexOf("{0}")` trả về `-1`. Nhánh chuyển thành `Account.Login.CartMergeStockLimit` (dòng 498) bị bỏ qua và lý do thô được nối vào thông báo. Bản sửa DEF-01 dựa vào việc **phân tích chuỗi đã dịch** để lấy số lượng tối đa. Vì thế nó không chịu được trường hợp thiếu bản dịch, và giá trị mặc định của `CartMergeStockLimit` cũng không bao giờ được dùng tới. |
| Cách xác minh | 1) Truy vấn `SELECT COUNT(*) FROM LocaleStringResource WHERE LanguageId=2 AND ResourceName='shoppingcart.quantityexceedsstock'`: kết quả 0 thì lỗi tái hiện. 2) Chạy `npx playwright test tests/n02-cart.spec.ts -g MERGE-OVER` (đã chọn vi-VN) và xem thông báo. Đồng thời, Admin → System → Log có cảnh báo "Resource string ... is not found". 3) Chạy `qa/automation/scripts/seed-vi-stock-resource.sql`, restart web, chạy lại: thông báo có "tối đa 5". Bước 3 chỉ xác nhận cơ chế, **không** phải bản sửa sản phẩm. **Đã thực hiện đủ 3 bước ngày 27/11/2026: thiếu resource → Fail, có resource → Pass** (`DEF-04-repro-20261127.md`). Lưu ý khi chạy N02: phải đặt `QA_CONFIGURABLE_PRODUCT_PATH=/pw-shirt-variants`, nếu không trang sản phẩm trả 404. Lưu ý: `qa/automation/scripts/seed-n04-ci.sql` cũng seed chuỗi này, **nên CI (SCRUM-92) không phát hiện được DEF-04**. |
| Đề xuất hướng sửa | (1) `MigrateShoppingCartAsync` trả cảnh báo có cấu trúc (sản phẩm, số lượng tối đa) thay vì chuỗi đã dịch, để `CustomerRegistrationService` không phải phân tích chuỗi. (2) Hoặc tối thiểu: khi template không chứa `{0}`, dùng template en-US hoặc `Account.Login.CartMergeStockLimit` kèm số lượng lấy từ tồn kho. (3) Thêm chuỗi vi-VN `ShoppingCart.QuantityExceedsStock` vào gói ngôn ngữ / migration của dự án. Tốt hơn nữa là bổ sung đầy đủ gói vi-VN, vì hiện còn thiếu khoảng 7000 chuỗi so với en-US. Retest: chạy MERGE-OVER, MERGE-MULTISTORE, MERGE-ACTIVATION **khi chưa seed** resource; mong đợi thông báo có "tối đa 5". |

## 4. Bằng chứng không có defect trong 14 ca PW

### 4.1 Chứng minh pair coverage

Chạy lại ngày 24/11/2026 và **27/11/2026** (trên `develop` `6f702568b0`, kết quả giống hệt): `powershell -File qa/pairwise/calculate-pairwise-coverage.ps1`

```
Factors: 10                                  Generated tests: 14
Raw full assignments before constraints: 6912    Feasible full assignments: 420
Raw candidate pairs: 279                         Total feasible pairs: 253
Covered feasible pairs: 253                      Missing feasible pairs: 0
Unexpected actual pairs: 0                       Infeasible generated rows: 0
Coverage: 253/253 = 100%                         Overall result: PASS
```

Cách đọc con số: pair feasible là cặp giá trị của hai factor khác nhau mà ít nhất một full assignment hợp lệ (qua constraint) chứa cả hai. Script đếm các cặp đó từ model và đối chiếu với các cặp xuất hiện thật trong 14 dòng. 279 − 253 = 26 cặp bị constraint loại nên không tính vào mẫu số. Không có dòng nào vi phạm constraint. Báo cáo đầy đủ ở `qa/pairwise/coverage-report.md` (PICT 3.7.4, seed 10380, SHA-256 model `70DDF667…AB5F`).

**Model bổ sung N02** (SCRUM-87, `qa/pairwise/n02-cart/`): 8 dòng, **30/30 pair = 100%** (`pict.exe model.pict /o:2 /r:10387`). Lượt `AUTO-202611261326` cho 8/8 dòng Pass (`execution.json`). Model này độc lập với 14 ca PW và 253 pair ở trên. Nó được lập để phủ `LoginMerge` / `RepeatAdd`, là vùng mà model gốc bỏ sót (DEF-01, DEF-04).

**Kiểm tra tự động trên CI** (SCRUM-92, `.github/workflows/dotnet.yml`): job `pairwise-model` kiểm hai model như sau:
- **Model gốc:** `qa/ci/verify-model.ps1` sinh lại bằng PICT (`/o:2 /r:10380` và `/o:max`), so với `pairwise-raw.tsv` / `exhaustive-raw.tsv` đã commit, và kiểm `feasiblePairs = 253`.
- **Kiểm tra bổ sung:** job chạy thêm `validate.ps1` và `validate-invalid-combinations.ps1`.
- **Model N02:** job sinh lại bằng `node qa/pairwise/n02-cart/generate.mjs`, rồi chạy `git diff --exit-code` để chắc chắn kết quả không lệch với file đã commit. Tài liệu này **chưa đối chiếu** kết quả chạy CI cụ thể vì máy kiểm không có `gh`.

### 4.2 Chứng minh threshold đạt

Threshold của model: mọi pair feasible phải được phủ (2-way, 100%), mỗi dòng là một case có `CaseId` và ánh xạ 1-1 sang scenario.

| Tiêu chí | Yêu cầu | Thực tế | Kết quả |
| --- | --- | --- | --- |
| Pair coverage | 100% | 253/253 | Đạt |
| Dòng vi phạm constraint | 0 | 0 | Đạt |
| Pair ngoài dự kiến | 0 | 0 | Đạt |
| Ánh xạ CaseId → scenario | 14/14, 1-1 | 14/14 (`qa/pairwise/test-data/scenario-mapping.csv`) | Đạt |
| Thực thi 14 ca | 0 Fail, 0 Skip | 14/14 Pass (lượt chạy lại 25/11/2026). Lượt 26/11/2026 trên bản build mới cũng 14/14 Pass. Lượt cũ đã commit 15/15 gồm `HARNESS-001` (smoke test riêng) | Đạt |
| Model N02 | 100% pair, 0 Fail | 30/30 pair; 8/8 dòng Pass | Đạt |

Lưu ý về dòng "Thực thi":
- **Lượt 25/11/2026:** kết quả 14/14 là của lượt chạy liền mạch (`PW-RUN-25112026.md`, ảnh `B3_pairwise-summary.png`). `HARNESS-001` không nằm trong lượt này.
- **Lượt 26/11/2026:** gồm `final-pw-newbuild` (14 ca, 11 Pass, 3 Skip vì store khởi động chậm) và `final-pw-rerun3` (3/3 Pass). Trong lượt này không có expected result nào bị sửa cho khớp với sản phẩm.
- **Các file ở thư mục gốc `docs/evidence/S2-ADV-CART-AUTO/`** (`pairwise-summary.*`, `junit.xml` 25/25 skipped) là lượt **lúc store không chạy** (`BLOCKED_ENVIRONMENT`). Các file này được giữ để lưu lịch sử và **không** dùng làm bằng chứng Pass.

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
| E-03 | Lỗi môi trường / harness | 14/14 ca PW fail ở bước reset fixture (24/11/2026), `/opt/mssql-tools18/bin/sqlcmd: no such file` | `reset-fixture.ps1` gọi cứng `mssql-tools18`, còn container `mssql/server:2019-latest` chỉ có `/opt/mssql-tools/bin/sqlcmd`. SCRUM-91 đã sửa cho script N03 và `sql-fixture.ts` nhưng chưa sửa script này | Đã thêm fallback sang `/opt/mssql-tools/bin/sqlcmd` trong `reset-fixture.ps1`. Bản sửa **đã được commit** và có trên `develop` (dòng gọi `sqlcmd` ở khoảng dòng 142). Đã xác minh: reset chạy được |
| E-04 | Lỗi môi trường | Sau E-03, reset báo `FIXTURE_BLOCKED: Required fixture SKU is missing (PW-SIMPLE-001 or PW-SHIRT)` | DB hiện là bản cài mới: bảng `Product` chỉ có `PW-SHIRT` (do seed N03), không có `PW-SIMPLE-001`, `PW-OOS-001`, coupon `PW-CART-10PCT`. `seed-current-local-pw.sql` cũng không chạy được vì cần sản phẩm mẫu `QA-MERGE-*` không còn | Đã xử lý: tạo `PW-SIMPLE-001`, `PW-OOS-001` và coupon trong Admin; reset `-ValidateOnly` qua |
| E-05 | Lỗi môi trường / fixture | PW-003, 006, 011, 014 fail ở `assertCouponResult`: `.coupon-box .applied-discount-code` không tồn tại; giỏ hiện "The coupon code cannot be found" | Coupon `PW-CART-10PCT` trong DB có `CouponCode = NULL` và `DiscountTypeId = 1` (order total) thay vì `20` (order subtotal). Bốn ca này là toàn bộ các ca có Coupon = Valid. Báo cáo tự phân loại `FAILED_PRODUCT` nhưng thực chất là lỗi fixture | `UPDATE Discount SET CouponCode='PW-CART-10PCT', DiscountTypeId=20` cho đúng một dòng, restart web. PW-006, 014 pass. Cần ghi chú: phân loại tự động của reporter không tách được lỗi fixture khỏi lỗi sản phẩm |
| E-06 | Lỗi môi trường / shell | PW-003, 011 fail ở `page.goto`: `c:/Program%20Files/Git/pw-shirt-variants` | Git Bash đổi `/pw-shirt-variants` thành đường dẫn Windows khi truyền qua biến môi trường | Chạy lại với `MSYS_NO_PATHCONV=1`; PW-003, 011 pass. PowerShell không bị |
| T-03 | Lỗi test | Trong order-check ngày 26/11/2026, PW-006 Fail ở lần lặp liền kề thứ hai: store từ chối đơn thứ hai của cùng khách | Store có `MinimumOrderPlacementInterval` = 1 phút, đây là hành vi đúng. Test đã giả định các lượt đặt hàng độc lập với nhau | Test đọc giá trị này bằng SQL (chỉ đọc) và chờ đủ khoảng thời gian trước khi checkout registered. Cấu hình store giữ nguyên. Sau đó PW-006 Pass 4/4 liên tiếp (`S2-ADV-CART-AUTO/live-20261126/pw006-interval-fix`). Order-check toàn bộ chưa chạy lại nên ghi `STOPPED_AFTER_ORDER_DEPENDENCE_FOUND` |
| E-07 | Lỗi môi trường | 26/11/2026: PW-001, 003, 004 bị Skip trong `final-pw-newbuild`. `MERGE-VARIANT` Fail trong `final-adv-newbuild2` (`.bar-notification.success` không xuất hiện sau 30 s) | Store khởi động chậm sau restart, và spinner add-to-cart bị timeout. Lỗi không liên quan logic giỏ hàng | Chạy lại cùng mã test, không đổi expected: PW-001/003/004 Pass (`final-pw-rerun3`), `MERGE-VARIANT` Pass (`final-adv-rerun4`). Harness bổ sung bước chờ store sẵn sàng (tối đa 150 s) sau mỗi lần reset. Reporter tự gắn `FAILED_PRODUCT` cho `MERGE-VARIANT`, nhưng phân loại đúng là lỗi môi trường. Nhược điểm này giống E-05 |

## 6. Tái hiện nhanh

```powershell
# Pairwise coverage
powershell -File qa/pairwise/calculate-pairwise-coverage.ps1

# 14 ca PW (cần QA_SQL_PASSWORD, QA_REGISTERED_EMAIL, QA_REGISTERED_PASSWORD)
cd qa/automation; npx playwright test tests/pairwise.spec.ts

# Model N02 (8 dòng, gồm MERGE-OVER cho DEF-01 / DEF-04)
npx playwright test tests/n02-cart.spec.ts

# DEF-01: Fail trên build trước SCRUM-96, Pass trên build sau sửa
npx playwright test tests/checkout-risk.spec.ts -g CART-MERGE-01

# DEF-02: trước sửa (BEFORE-FIX) và retest sau sửa (nhãn mới mỗi lần)
powershell -File scripts/run-n03-series.ps1 -Runs 10 -AccountEmail $env:QA_REGISTERED_EMAIL -Label BEFORE-FIX
powershell -File scripts/run-n03-series.ps1 -Runs 10 -AccountEmail $env:QA_REGISTERED_EMAIL -Label B02-RETEST -Database $env:QA_DB_NAME

# DEF-04: kiểm resource vi-VN trước khi chạy (0 dòng = tái hiện được)
#   SELECT COUNT(*) FROM LocaleStringResource WHERE LanguageId=2 AND ResourceName='shoppingcart.quantityexceedsstock'
npx playwright test tests/n02-cart.spec.ts -g MERGE-OVER
```

## 7. Việc còn mở

1. **DEF-01 (SCRUM-96): đóng.** Lỗi đã sửa và merge trên `develop` (PR #16, `8b33708a54`). Bằng chứng retest: SCRUM-96 (7/7 unit, 9/9 Playwright), cộng N02 `MERGE-OVER` Pass trên bản build `5756d2bac2` ngày 26/11/2026.
2. **DEF-02 (SCRUM-100): đóng phần lộ lỗi SQL.** Lỗi đã sửa và merge (PR #18). Retest 10/10 Pass. Phần còn mở là gia cố: bật `PlaceOrderWithLock` hoặc thêm idempotency token. Nhóm cần quyết định có làm không. Cấu hình hiện vẫn `placeorderwithlock=False`.
3. **DEF-03: mở.** Khoa quyết định sửa cấu hình tiền tệ hay ghi Accepted risk.
4. **DEF-04: mở.**
   - Cần quyết định sửa mã (đề xuất 1 hoặc 2) hay chỉ thêm chuỗi vi-VN vào gói ngôn ngữ (đề xuất 3).
   - Fixture test (`seed-vi-stock-resource.sql`, `seed-n04-ci.sql`) đang che lỗi này. Khi retest phải chạy **không** seed resource.
   - Đã có ảnh và lượt đối chứng (27/11/2026). DB local đã được khôi phục resource sau lượt chạy.
5. **Chưa chạy:**
   - `HARNESS-001` (smoke test riêng) trong lượt này.
   - Kiểm tra thông báo tab thua của DEF-02 cho cả 10 lượt `WITH-LOCK`.
   - Thử `RegenerateOrderGuidInterval=0`.
   - Order-check toàn bộ trên bản mã cuối, sau khi sửa T-03 (khoảng 1 giờ 45 phút: `scripts/run-order-check.ps1`).
   - Đối chiếu một lượt CI xanh của job `pairwise-model`.
6. **Reporter:** phân loại tự động `FAILED_PRODUCT` vẫn gắn nhầm cho lỗi fixture (E-05) và lỗi timeout (E-07). Khi đọc báo cáo tự động phải đối chiếu lại với mục 5.
7. Ghi chú ảnh fixture: `screenshots/A6_coupon.png` chụp **trước khi** sửa E-05 (hiện "Assigned to order total"; DB hiện là loại subtotal, `CouponCode=PW-CART-10PCT`), và `A4_PW-OOS-001.png` hiện stock 10 (script reset đặt lại stock 0 trước mỗi ca). Hai ảnh chỉ minh họa việc tạo fixture, không phải trạng thái lúc chạy test.
