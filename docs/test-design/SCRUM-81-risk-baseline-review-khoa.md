# SCRUM-81 — Chốt phương pháp và review baseline risk register

Người thực hiện: Lê Anh Khoa. Issue: [SCRUM-81](https://anhkhoa080205.atlassian.net/browse/SCRUM-81), thuộc [SCRUM-80](https://anhkhoa080205.atlassian.net/browse/SCRUM-80). Mục 1–4 ghi kết quả review tài liệu và mã; mục 5 ghi các lượt chạy kiểm chứng trên môi trường local ngày 30/10/2026.

## 1. Baseline và mẫu số

| Mục | Mốc dùng để review | Giới hạn |
| --- | --- | --- |
| Đặc tả Shopping Cart/Checkout | [`cart-checkout-scenarios.md`](cart-checkout-scenarios.md), khai báo source baseline `674d0ceef6bd8a52fe74d6f4fff326960162cec0` | Đặc tả Checkout dùng **multi-step checkout**. |
| Mã ứng dụng | Commit nguồn `674d0ceef6bd8a52fe74d6f4fff326960162cec0`; HEAD khi review là `1edaf26874f0b43bb1e74132c3ad4d461c24c942` | So sánh từ commit nguồn tới HEAD: trong `src/` chỉ có hai tệp unit test thay đổi, không có mã ứng dụng thay đổi. HEAD của tài liệu **không tự chứng minh** image/container đang chạy đúng commit đó. |
| Chế độ checkout của bằng chứng | Lượt review Order/Payment của Linh lưu ảnh và cấu hình local; ca Pairwise được thiết kế cho multi-step checkout | Lượt tái hiện lỗi giao diện bổ sung từng dùng one-page checkout. Phải ghi mode thực tế cho từng run; không gộp hai mode thành một kết quả. |
| Mẫu số risk register | **26 ID duy nhất**: `CART-01`–`CART-14` (14), 9 ID Checkout/Address/Shipping/Payment/Inventory, và `CART-MERGE-01`, `CART-REPEAT-01`, `CHK-RACE-01` (3) | Phần Trang có 15 dòng: 14 `CART` và `CART-REPEAT-01`. Phần còn lại có 11 dòng: 9 Checkout liên quan và 2 luồng bổ sung. Tổng `15 + 11 = 26`. |

Chín ID Checkout liên quan là `CHK-01`, `CHK-02`, `ADDR-01`, `ADDR-02`, `SHP-01`, `SHP-02`, `PAY-LOCAL-01`, `PAY-FAIL-01`, `INV-01`. Không tính 14 dòng `PW-001`–`PW-014` là 14 rủi ro mới: đó là bộ dữ liệu tổ hợp của model Pairwise, không phải scenario nghiệp vụ. `HARNESS-001` cũng không thuộc mẫu số 26.

## 2. Quy tắc chấm đã chốt

| Điểm | Impact (I): hậu quả nếu quy tắc hỏng | Likelihood (L): khả năng gặp sai lệch trong phạm vi kiểm thử |
| ---: | --- | --- |
| 1 | Ảnh hưởng nhỏ, chủ yếu hiển thị, không làm sai dữ liệu nghiệp vụ | Hiếm, cần điều kiện đặc biệt hoặc nhiều bước khó gặp |
| 2 | Hỏng một luồng hoặc sai dữ liệu có thể phục hồi | Có thể xảy ra trong thao tác/cấu hình thông thường |
| 3 | Sai tiền/đơn hàng, mất dữ liệu, bán vượt kho hoặc ảnh hưởng nhiều khách | Dễ xảy ra, hoặc có lỗi/dấu hiệu đã được tái hiện trong cùng điều kiện |

`Score = I × L`; `1–2 = Low/P3`, `3–4 = Medium/P2`, `6–9 = High/P1`. Với thang 1–3 không có điểm 5, 7 hoặc 8. **Impact và Likelihood chấm cho rủi ro quy tắc bị hỏng, không phải cho kết quả Pass của một lần chạy.** Vì vậy `INV-01` đã Pass ở một lượt bổ sung nhưng vẫn có thể giữ `3 × 3 = 9/High` do hậu quả oversell khi kiểm tra lại tồn kho bị hỏng; mức Likelihood 3 cần ghi rõ căn cứ về khả năng xảy ra, không suy từ mức hậu quả.

Pairwise K06 dùng để chọn tổ hợp các yếu tố tĩnh trong model đã chốt. Các ca biên, dữ liệu âm tính, trình tự đăng nhập/gộp giỏ và hai request Confirm đồng thời được theo dõi bằng case và bằng chứng riêng. `253/253` chỉ là coverage của **cặp giá trị khả thi trong model cũ**, không phải `26/26` risk coverage.

Quy ước trạng thái: `Pass` cần bằng chứng thực thi đúng expected; `Fail` cần sai lệch tái hiện; `Blocked` cần nêu điều kiện tiên quyết cụ thể đang thiếu; `Not Run` nghĩa là chưa chạy; `Partial` là bằng chứng chưa đủ để Pass; `Accepted risk` cần quyết định chấp nhận có người chịu trách nhiệm và lý do. Không đổi `Not Run` thành `Blocked` chỉ để đạt tiêu chí nghiệm thu.

## 3. Kết quả review bảng của Trang và phần còn lại

| Kiểm tra | Kết quả review | Việc còn phải làm trước khi đóng SCRUM-80 |
| --- | --- | --- |
| Mẫu số và ID | Bảng [`SCRUM-80-risk-register.md`](SCRUM-80-risk-register.md) có đúng 26 dòng ID duy nhất. Phần [Trang](SCRUM-82-cart-risk-register-trang.md) có đúng 15 dòng Cart. | Linh và Khoa xác nhận chín ID Checkout cùng hai luồng bổ sung đã được phân công đúng trong Jira và trong cột Owner. |
| Thang điểm | Bảng dùng I/L trong 1–3; các điểm đang ghi khớp phép nhân và mức `1–2/3–4/6–9`. | Ba thành viên review lý do của các dòng High, đặc biệt `INV-01`, `CART-MERGE-01`, `CHK-RACE-01`; không chấm Likelihood theo Impact. |
| Liên kết | Tất cả đường dẫn **nội bộ repository** trong bảng 26 dòng đều trỏ tới tệp tồn tại ở nhánh đang review. | Link đến test file chỉ xác nhận có mã test, không thay thế report của từng lượt chạy. Gắn commit/run ID và bằng chứng thực thi có thể truy cập khi chốt kết quả. |
| Cart của Trang | Tài liệu SCRUM-82 ghi `15 passed`, `0 failed`, `0 skipped`, SQL read-only và link test `cart-risk.spec.ts`. | Tại thời điểm review ban đầu, Khoa chưa chạy lại suite. Lượt chạy lại và report local được ghi ở mục 5; cần gắn report/run ID khi ký duyệt cuối. |
| Checkout/Payment | Review của Linh có ảnh cho `CHK-01`, `ADDR-01`, `ADDR-02`, `PAY-LOCAL-01`; `SHP-01` là `Partial`, `PAY-FAIL-01` thiếu fake processor. | Giữ `CHK-01` là Pass có điều kiện vì finding currency; `SHP-01` chưa Pass đầy đủ; `SHP-02` cần request invalid trực tiếp; `PAY-FAIL-01` giữ Blocked với blocker cụ thể. |
| Luồng mới | `CART-MERGE-01` và `CHK-RACE-01` từng bị ghi Blocked vì chưa có test mới. Hai lỗi tương ứng đã được mô tả ở lượt bổ sung trước đây, nhưng tệp ảnh/report không có trên nhánh này và chưa có bằng chứng của **toàn bộ case mới** trên baseline hiện tại. | Ma trận đã sửa thành current-cycle `Not Run`. Gắn lại ảnh/SQL lịch sử khi có thể truy cập và không tính chúng vào 15 case Cart của Trang hay 14 PW cũ. |
| Phân công | Bảng hợp nhất hiện ghi Khoa là Owner của cả 11 dòng còn lại, trong khi SCRUM-83 giao Linh chấm nhóm còn lại. | Linh đối chiếu/đề xuất điểm và bằng chứng; cập nhật Owner hoặc thêm cột Reviewer để phân biệt người chấm với người duyệt. Khoa chỉ ký sau khi đọc bản của Linh. |

## 4. Risk coverage và quyết định review

Risk coverage phải báo theo **26 scenario**. Tối thiểu cần ba số riêng: số scenario có bằng chứng thực thi đủ để kết luận Pass/Fail, số scenario Partial, và số scenario Blocked/Not Run/Accepted risk. Với nhóm High, lập danh sách riêng từng ID cùng người phụ trách và kế hoạch gỡ blocker/retest. Không cộng `253/253` vào tử số hoặc mẫu số của chỉ số này.

**Kết luận SCRUM-81:** chốt được mẫu số 26, baseline tài liệu, chế độ checkout cần dùng khi so sánh, và quy tắc chấm I/L. Bảng 26 dòng qua kiểm tra cấu trúc và phép tính. Bộ Cart của Trang đã chạy lại 15/15 Pass theo mục 5. **Chưa ký duyệt đóng SCRUM-80** cho đến khi đối chiếu bản chấm của Linh và giải quyết các khoảng trống evidence/trạng thái nêu trên. Kết quả chạy lại không phải tuyên bố đã chạy đủ 26 scenario.

## 5. Lượt chạy kiểm chứng phục vụ SCRUM-81 ngày 30/10/2026

Trên nhánh `test/SCRUM-82-cart-risk`, tại commit `1edaf26874f0b43bb1e74132c3ad4d461c24c942`, hai container cũ đã được khởi động lại để kiểm chứng. Storefront `http://localhost/` trả HTTP 200 và tiêu đề trang chủ; `HARNESS-001` chạy bằng Chromium **Pass 1/1**. Đây chỉ là smoke test, không chứng minh fixture nghiệp vụ đã sẵn sàng.

| Lệnh/kiểm tra | Kết quả thực tế | Diễn giải |
| --- | --- | --- |
| `qa/pairwise/validate.ps1` | PASS; 6.912 tổ hợp thô, 420 khả thi, 14 row, `253/253` cặp | Xác minh model/dữ liệu Pairwise tĩnh; chưa chạy nghiệp vụ web. |
| `npm ci`, `tsc --noEmit`, `npm run test:list` tại `qa/automation` | Dependency cài được; TypeScript Pass; phát hiện 30 test = 15 Cart + 14 PW + 1 smoke | Kiểm tra khả năng tải và nhận diện test. |
| `npm run test:case -- 'HARNESS-001'` | **1 Pass** | Storefront và trình duyệt chạy được. |
| `npm run test:cart-risk` | **15 Skipped, 0 Pass, 0 Fail** | Tất cả dừng ở precondition: `QA_SQL_PASSWORD` chưa được đặt trong phiên chạy. |
| `npm run test:all` | **1 Pass, 29 Skipped, 0 Fail** | 15 Cart và 14 PW chưa chạy nghiệp vụ. Pairwise còn thiếu `QA_REGISTERED_EMAIL`, `QA_REGISTERED_PASSWORD`, `QA_BILLING_EMAIL` khi cần. |
| SQL read-only trên container cũ | Database online có tên bắt đầu bằng ký tự ẩn **U+200B** trước `nopcommerce`; số product có SKU `PW-SIMPLE-001`, `PW-SHIRT`, `PW-OOS-001` = **0**; coupon `PW-CART-10PCT` = **0** | Dù đặt biến môi trường, fixture này vẫn chưa phù hợp với cấu hình mặc định `QA_DB_NAME=nopcommerce` và dữ liệu PW cần cho test. |

Report của lượt chạy nằm cục bộ trong `qa/automation/reports/` và không được commit. Các số `15/15 Passed` trong tài liệu Trang là **lượt nghiệm thu trước trên môi trường khác**; không được gộp với kết quả `15 Skipped` ngày 30/10. Để xác nhận lại 15 ca trên máy này, cần dựng đúng database/fixture PW, xác nhận tên DB và cấu hình checkout, cung cấp biến môi trường QA qua nơi lưu bí mật, rồi chạy lại cùng lệnh và lưu report gắn với commit SHA. Không đổi các ca Skipped thành Pass hoặc Fail của sản phẩm.

### Lượt chạy tiếp theo sau khi chuẩn bị fixture

Trong cùng ngày 30/10/2026 và cùng commit, đã tạo bản sao database cũ tại `qa/local-backups/qa-before-pw-seed-20261030.bak` (thư mục bị Git bỏ qua), rồi dùng [`seed-current-local-pw.sql`](../../qa/automation/scripts/seed-current-local-pw.sql) tạo riêng ba sản phẩm `PW-*`, bốn tổ hợp Red/Blue × S/M, coupon 10% và rate giao hàng local. Tài khoản QA giả lập được đăng ký qua storefront; thông tin chạy được giữ trong `qa/automation/.env` bị Git bỏ qua, không ghi mật khẩu vào tài liệu. Preflight `reset-fixture.ps1 -CaseId PW-001 -ValidateOnly` báo đạt. Các trang sản phẩm PW đều trả HTTP 200.

Lần chạy `PW-001` đầu tiên thất bại ở `#billing-form` vì store đang bật **one-page checkout**, trong khi model và test yêu cầu **multi-step checkout**. Sau khi chuyển `ordersettings.onepagecheckoutenabled` từ `True` sang `False` trên database local và restart web, `PW-001` Pass. Đây là sai lệch cấu hình kiểm thử, không phải defect của sản phẩm.

| Bộ chạy lại trên fixture đúng | Kết quả | Báo cáo local |
| --- | --- | --- |
| `npm run test:cart-risk` | **15/15 Passed**, 0 Failed, 0 Skipped | `qa/automation/reports/cart-risk-summary.md` |
| `playwright test tests/pairwise.spec.ts` | **14/14 Passed**, 0 Failed, 0 Skipped | `qa/automation/reports/pairwise-summary.md`; JSON/JUnit/HTML cùng thư mục `reports/` |

Truy vấn SQL read-only sau lượt chạy xác nhận vẫn có 3 sản phẩm PW, 4 biến thể, 1 coupon, 1 tài khoản QA và cấu hình one-page = `False`. Kết quả chạy lại chứng thực bộ Cart và Pairwise trên fixture này; **không** chứng thực riêng `CART-MERGE-01`, `CHK-RACE-01`, `SHP-02` hoặc `PAY-FAIL-01`. Hai lỗi mới và các ca còn Not Run/Blocked/Partial vẫn phải báo riêng theo ma trận 26 rủi ro.

## 6. Review phần Linh hiện có và khoảng trống SCRUM-83

Ngày 30/10/2026, repository chỉ có [`linh-order-payment-review-summary.md`](../linh-order-payment-review-summary.md) cùng chín ảnh trong `image/review/`. Tài liệu này ghi lượt review ngày 05–06/10/2026, trước Sprint 2. Không có tệp hoặc nhánh SCRUM-83 trên repository/remote tại thời điểm kiểm tra. Vì vậy, nội dung dưới đây là review bằng chứng Linh đã có; **chưa phải ký duyệt deliverable SCRUM-83**.

| Nhóm ID trong 11 dòng còn lại | Đối chiếu với bằng chứng hiện có | Kết luận review |
| --- | --- | --- |
| `CHK-01`, `ADDR-01`, `ADDR-02`, `PAY-LOCAL-01` | Tài liệu Linh có ảnh và diễn giải luồng checkout local, địa chỉ hợp lệ/thiếu FirstName, Order/Payment Pending. | Có căn cứ lịch sử cho các trạng thái đã ghi; `CHK-01` còn finding khác ký hiệu tiền tệ, không được nâng thành Pass không điều kiện. |
| `CHK-02` | Tài liệu Linh cũ ghi Not run. Bộ Pairwise ngày 30/10 có các ca guest checkout Pass. | Có bằng chứng mới từ bộ Pairwise, phải dẫn đúng report/run mới thay vì gán thành kết quả Linh đã chạy ngày 05–06/10. |
| `SHP-01` | Linh chỉ xác nhận Ground trên Confirm; chưa chứng minh lựa chọn được giữ và lưu đủ theo expected riêng. | Giữ Partial. |
| `SHP-02` | Chưa có request shipping rỗng/sai/không khả dụng được gửi. | Ma trận đã sửa thành `Not Run`; lên lịch chạy ca âm tính. |
| `PAY-FAIL-01` | Check / Money Order không tạo nhánh decline; chưa có fake processor local. | `Blocked` có căn cứ; ghi owner và kế hoạch tạo processor hoặc quyết định accepted risk. |
| `INV-01` | Tài liệu Linh cũ ghi Not run; lượt giao diện bổ sung sau đó ghi nhận Pass khi tồn kho giảm trước Confirm. | Dẫn đúng bằng chứng lượt bổ sung; không ghi là Linh đã chạy trong review cũ. |
| `CART-MERGE-01`, `CHK-RACE-01` | Có hai lỗi được mô tả trong lượt bổ sung lịch sử; tệp ảnh/report không có trên nhánh này; chưa có full case mới và bằng chứng của vòng Sprint 2. | Ma trận đã sửa thành `Not Run`; chỉ dùng `Blocked` khi nêu rõ blocker thực tế. Không ghi hai lỗi là Pass. |

Ma trận hiện gán Khoa làm Owner của cả 11 dòng, dù SCRUM-83 giao Linh chấm nhóm này. Cần phân biệt người chấm/người phụ trách kiểm thử với người duyệt, hoặc sửa Owner theo phân công Jira. Phần Linh ở Sprint 2 phải có 11 dòng I/L, score, mức, lý do riêng cho từng dòng, ưu tiên, trạng thái và link case/evidence; đồng thời giải thích các dòng High chưa chạy. Sau khi bản này xuất hiện, Khoa đối chiếu từng dòng rồi mới ký SCRUM-81. Kết quả `15/15` Cart và `14/14` Pairwise không thay thế bước review đó.
