# SCRUM-80 — Risk register Cart và Checkout

Tài liệu này hợp nhất 26 rủi ro của nhóm: 14 scenario Cart hiện có, 9 scenario
Checkout hiện có và ba luồng bổ sung `CART-MERGE-01`, `CART-REPEAT-01`,
`CHK-RACE-01`. Issue cha: [SCRUM-80](https://anhkhoa080205.atlassian.net/browse/SCRUM-80).

Baseline, quy tắc chấm và các điểm cần đối chiếu trước khi ký duyệt nằm trong
[review SCRUM-81 của Khoa](SCRUM-81-risk-baseline-review-khoa.md).

## 1. Quy ước chấm

- Impact (I): `1` = ảnh hưởng nhỏ/hiển thị; `2` = hỏng một luồng hoặc sai dữ liệu
  có thể phục hồi; `3` = sai tiền, sai order, mất dữ liệu, oversell hoặc ảnh hưởng
  nhiều khách hàng.
- Likelihood (L): `1` = hiếm/đòi hỏi điều kiện đặc biệt; `2` = có thể xảy ra
  trong thao tác bình thường; `3` = dễ xảy ra hoặc đã có dấu hiệu/lịch sử lỗi.
- Score = `I × L`: `1–2 Low`, `3–4 Medium`, `6–9 High`.
- Ưu tiên: `P1` cho High, `P2` cho Medium, `P3` cho Low.
- Pairwise K06 là kỹ thuật chính để chọn tổ hợp dữ liệu. Boundary, sequence và
  concurrency được theo dõi riêng; `253/253` pair coverage không phải risk
  coverage và không được dùng để kết luận một scenario đã Pass.
- `Pass` chỉ được ghi khi có execution evidence trực tiếp. `Partial` không được
  xem là Pass. Dòng High chưa chạy được ghi `Not Run`; chỉ ghi `Blocked` khi có
  điều kiện tiên quyết cụ thể bị chặn. Trước khi đóng SCRUM-80, các dòng High
  này cần được chạy hoặc có quyết định `Accepted risk` kèm owner và lý do.

## 2. Ma trận 26 dòng

| ID | I | L | Score / mức | Lý do chấm | Kỹ thuật / ưu tiên | Trạng thái và link scenario, test, evidence | Owner |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| `CART-01` | 2 | 2 | 4 / Medium | Sai quantity hoặc line total làm sai giá trị giỏ nhưng chưa trực tiếp gây oversell | Pairwise / P2 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-02` | 3 | 2 | 6 / High | Dùng nhầm tổ hợp thuộc tính có thể trừ sai tồn kho hoặc bán sai variant | Pairwise / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-03` | 2 | 2 | 4 / Medium | Boundary quantity mặc định sai làm lệch line total và cart indicator | Boundary / P2 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-04` | 3 | 2 | 6 / High | Gộp nhầm product/variant làm sai dòng, tổng tiền và ánh xạ tồn kho | Pairwise / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-05` | 3 | 2 | 6 / High | Update có thể tạo dòng trùng hoặc lưu sai quantity/line total | Sequence / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-06` | 2 | 2 | 4 / Medium | Có thể xóa nhầm toàn bộ cart hoặc nhầm variant còn lại | Sequence / P2 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-07` | 3 | 3 | 9 / High | Vượt stock có thể gây oversell hoặc làm mất quantity hợp lệ trước đó | Boundary / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-08` | 2 | 2 | 4 / Medium | Cart indicator, coupon hoặc total cũ có thể còn sau khi xóa item cuối | Sequence / P2 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-09` | 2 | 2 | 4 / Medium | Dữ liệu cart/tổng tiền cũ có thể rò sang phiên mới | State reset / P2 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-10` | 3 | 2 | 6 / High | Cho item hết hàng vào cart làm tăng nguy cơ đặt hàng và oversell | Boundary / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-11` | 3 | 2 | 6 / High | Sai discount hoặc áp dụng lặp làm sai số tiền phải thu | Pairwise + sequence / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-12` | 2 | 2 | 4 / Medium | Coupon invalid không được làm đổi subtotal, discount, total hoặc cart | Negative / P2 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-13` | 3 | 2 | 6 / High | Phép tính nhiều dòng hoặc trạng thái coupon sau refresh có thể sai | Pairwise + sequence / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-14` | 3 | 2 | 6 / High | Boundary exact-stock có thể bị từ chối nhầm hoặc mở đường vượt stock | Boundary / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CART-REPEAT-01` | 3 | 2 | 6 / High | Thêm lặp có thể tạo duplicate line hoặc gộp nhầm variant, làm sai quantity, total và tồn kho | Sequence / P1 | Pass — [scenario và evidence](SCRUM-82-cart-risk-register-trang.md#15-dòng-nghiệm-thu), [test](../../qa/automation/tests/cart-risk.spec.ts) | Trang |
| `CHK-01` | 3 | 2 | 6 / High | Luồng chính có thể tạo sai order/status/total hoặc tạo nhiều hơn một order | Pairwise + end-to-end / P1 | Pass có điều kiện — [scenario](cart-checkout-scenarios.md#chk-01---customer-đăng-nhập-hoàn-tất-checkout-thành-công), [test](../../qa/automation/tests/pairwise.spec.ts), [evidence](../linh-order-payment-review-summary.md#5-ma-trận-scenario-sau-khi-bổ-sung-evidence). Finding currency vẫn mở | Khoa |
| `CHK-02` | 2 | 2 | 4 / Medium | Guest checkout lỗi làm mất đơn hoặc bỏ qua policy anonymous checkout; phạm vi hẹp hơn sai tiền/tồn kho | Pairwise / P2 | Pass trong PW-002/PW-007/PW-009 — [scenario](cart-checkout-scenarios.md#chk-02---guest-hoàn-tất-checkout-khi-được-hỗ-trợ), [mapping](../../qa/pairwise/test-data/scenario-mapping.csv), [test](../../qa/automation/tests/pairwise.spec.ts), [full-run evidence](../../qa/automation/REVIEW_EVIDENCE.md#evidence-đã-xác-minh) | Khoa |
| `ADDR-01` | 2 | 2 | 4 / Medium | Lưu sai billing/shipping address gây lỗi giao hàng nhưng thường có thể sửa/hoàn tác | Pairwise / P2 | Pass — [scenario](cart-checkout-scenarios.md#addr-01---chấp-nhận-address-hợp-lệ), [evidence ảnh 06–07](../linh-order-payment-review-summary.md#2-kết-quả-đọc-từ-evidence) | Khoa |
| `ADDR-02` | 3 | 2 | 6 / High | Chấp nhận thiếu required field có thể tạo order không giao được và dữ liệu khách hàng không hợp lệ | Negative + historical regression / P1 | Pass — [scenario](cart-checkout-scenarios.md#addr-02---từ-chối-address-thiếu-trường-bắt-buộc), [test PW-001/PW-011/PW-012](../../qa/automation/tests/pairwise.spec.ts), [evidence ảnh 08–09](../linh-order-payment-review-summary.md#2-kết-quả-đọc-từ-evidence) | Khoa |
| `PAY-LOCAL-01` | 3 | 2 | 6 / High | Chọn/lưu sai payment method có thể tạo sai trạng thái thanh toán hoặc thu sai cách | Pairwise / P1 | Pass trong luồng local tối giản — [scenario](cart-checkout-scenarios.md#pay-local-01---chọn-payment-method-local), [evidence](../linh-order-payment-review-summary.md#5-ma-trận-scenario-sau-khi-bổ-sung-evidence) | Khoa |
| `SHP-01` | 2 | 2 | 4 / Medium | Chọn sai shipping option làm sai phí hoặc giao hàng, nhưng evidence hiện mới xác nhận Ground ở Confirm | Pairwise / P2 | Partial — [scenario](cart-checkout-scenarios.md#shp-01---chọn-phương-thức-giao-hàng-local-hợp-lệ), [evidence và gap](../linh-order-payment-review-summary.md#6-findings-sau-dynamic-review) | Khoa |
| `SHP-02` | 3 | 2 | 6 / High | Server chấp nhận option rỗng/giả mạo có thể làm sai phí và tạo order không giao được | Negative / P1 | Not Run trong Sprint 2 — chưa gửi request shipping rỗng/sai/không còn khả dụng; cần ca âm tính và order delta; [scenario](cart-checkout-scenarios.md#shp-02---shipping-method-rỗng-sai-định-dạng-hoặc-không-còn-khả-dụng) | Khoa |
| `PAY-FAIL-01` | 3 | 2 | 6 / High | Xử lý decline sai có thể tạo order Paid/Complete giả hoặc làm mất cart khi khách retry | Negative + sequence / P1 | Blocked — chưa có fake payment processor local; [scenario và điều kiện gỡ blocker](cart-checkout-scenarios.md#pay-fail-01---payment-processor-local-từ-chối-giao-dịch), [review evidence](../linh-order-payment-review-summary.md#5-ma-trận-scenario-sau-khi-bổ-sung-evidence) | Khoa |
| `INV-01` | 3 | 3 | 9 / High | Nếu revalidation tồn kho hỏng, hậu quả là oversell dù lượt bổ sung đã Pass | Boundary + state change / P1 | Pass ở lượt bổ sung theo SCRUM-80; vẫn giữ High theo hậu quả — [scenario](cart-checkout-scenarios.md#inv-01---tồn-kho-giảm-xuống-không-đủ-trước-khi-xác-nhận-order), [Jira evidence](https://anhkhoa080205.atlassian.net/browse/SCRUM-80) | Khoa |
| `CART-MERGE-01` | 3 | 2 | 6 / High | Merge guest cart vào account có thể mất item, nhân đôi quantity, gộp nhầm variant hoặc rò cart giữa customer | Sequence + identity transition / P1 | Not Run đầy đủ trong Sprint 2 — lỗi đã được mô tả trong báo cáo trước nhưng tệp ảnh/report không có ở nhánh này; cần chạy lại full case trên baseline mới; [scenario bổ sung](#cart-merge-01---merge-guest-cart-sau-khi-đăng-nhập) | Khoa |
| `CHK-RACE-01` | 3 | 2 | 6 / High | Hai request Confirm đồng thời có thể tạo hai order, trừ stock hai lần hoặc xử lý payment hai lần | Concurrency / P1 | Not Run đầy đủ trong Sprint 2 — lỗi đã được mô tả trong báo cáo trước nhưng tệp ảnh/report không có ở nhánh này; cần hai response và SQL snapshot cho full case; [scenario bổ sung](#chk-race-01---hai-request-confirm-order-đồng-thời) | Khoa |

## 3. Phần nghiệm thu của Khoa — 11 dòng

Phần còn lại là 9 dòng từ `CHK-01` đến `INV-01`, cộng
`CART-MERGE-01` và `CHK-RACE-01`. Cả 11 dòng đã có I/L, score/mức, lý do,
ưu tiên, trạng thái, link và owner trong ma trận trên. Linh được giao chấm nhóm
đó trong SCRUM-83; Khoa review baseline và bằng chứng. Các dòng High chưa chạy
được ghi đúng `Not Run` hoặc `Blocked` theo điều kiện thực tế; đây là khoảng
trống nghiệm thu SCRUM-80, không được suy diễn Pass từ pair coverage.

### CART-MERGE-01 — Merge guest cart sau khi đăng nhập

1. Guest có cart gồm một simple product và một variant; account đích đã có ít
   nhất một dòng trùng product/variant và một dòng khác variant.
2. Ghi snapshot cart của guest và account, sau đó đăng nhập account từ phiên
   guest.
3. Xác nhận quy tắc merge đã thống nhất: item trùng chỉ có một dòng với quantity
   đúng, khác variant vẫn tách dòng, không mất item, không vượt stock, total và
   coupon được tính lại.
4. Đối chiếu UI và SQL theo customer/store; refresh và đăng nhập lại để kiểm tra
   tính bền vững. Không được còn cart có thể truy cập trái phép dưới guest cũ.

### CHK-RACE-01 — Hai request Confirm Order đồng thời

1. Chuẩn bị một cart hợp lệ, stock hữu hạn, local payment method và dừng ở
   Confirm Order.
2. Lấy hai request hợp lệ từ cùng checkout state rồi phát đồng thời bằng barrier;
   không mô phỏng bằng hai click tuần tự.
3. Expected: tối đa một order thành công, không duplicate order/order item,
   không trừ stock hoặc xử lý payment hai lần; request còn lại phải bị từ chối
   hoặc trả về trạng thái idempotent an toàn.
4. Evidence bắt buộc gồm timestamp/request ID, response của cả hai request và
   SQL snapshot trước/sau cho order, order item, cart, stock và payment history.

## 4. Đối chiếu hai bug lịch sử

| Bug lịch sử | Scenario hồi quy | Cách đối chiếu trong vòng này |
| --- | --- | --- |
| [nopCommerce #7467 — Null customer email khi bật Guest checkout](https://github.com/nopSolutions/nopCommerce/commit/3c0d6e89a278a834960e9be5c8bce65e0ef23dc0) | `CHK-02` | Các row guest PW-002/PW-007/PW-009 phải hoàn tất checkout và tạo order có customer/email fixture hợp lệ; không chỉ kiểm tra trang Completed. |
| [nopCommerce #7203 — Form billing/shipping bị xóa sau khi nhập address sai](https://github.com/nopSolutions/nopCommerce/commit/1fe42cc649f3780bc99c738f39b9d413af36d565) | `ADDR-02` | Gửi address chỉ thiếu `FirstName`; xác nhận warning xuất hiện, các field hợp lệ vẫn được giữ, order delta = 0 và cart không mất. Evidence hiện có xác nhận warning/order delta; việc giữ toàn bộ field cần được chụp rõ ở rerun. |

Finding hiện tại `D-01` (storefront hiển thị `100 đ`, Admin hiển thị `$100.00`)
được giữ ở `CHK-01` như một rủi ro cấu hình/hiển thị currency, không được coi là
một trong hai bug lịch sử nói trên.

## 5. Review và điều kiện đóng

| Reviewer | Trách nhiệm | Trạng thái |
| --- | --- | --- |
| Lê Anh Khoa | Chấm và bảo vệ lý do 11 dòng Checkout/luồng bổ sung; bổ sung evidence cho dòng mình sở hữu | Chờ review nhóm |
| Trần Thị Phương Trang | Đối chiếu Cart, tồn kho, merge cart và mức Impact | Chờ review nhóm |
| Đỗ Đặng Diệu Linh | Đối chiếu Pairwise K06, evidence Order/Payment và hai bug lịch sử | Chờ review nhóm |

Chỉ đóng SCRUM-80 khi đủ chữ ký/review của ba người; mọi dòng High đã có kết quả
thực thi hoặc quyết định `Accepted risk` có owner và lý do. Dòng `Blocked` cần
blocker và kế hoạch gỡ; dòng `Not Run` vẫn là việc còn mở. Link evidence phải
truy cập được; báo cáo không dùng `253/253` pair coverage thay cho risk coverage.
