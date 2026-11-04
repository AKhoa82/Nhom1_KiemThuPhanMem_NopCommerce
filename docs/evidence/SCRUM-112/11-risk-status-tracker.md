# Bảng đối chiếu và theo dõi trạng thái 11 rủi ro Checkout — SCRUM-112 bàn giao SCRUM-81

Tài liệu này là kết quả rà soát độc lập và bàn giao chính thức của **SCRUM-112** (Issue cha: **SCRUM-80**, duyệt: **SCRUM-81**). Toàn bộ 11 rủi ro Checkout và luồng bổ sung được đối chiếu chi tiết theo tiêu chuẩn nghiệm thu, nguồn chạy xác định, fixture và chế độ multi-step checkout.

---

## 1. Bảng đối chiếu chi tiết 11 kịch bản nghiệm thu

| ID | Trạng thái đã xác minh | Scenario link | Test automation | Bằng chứng chạy thực tế (Report / Ảnh / SQL) | Commit SHA | Ngày chạy | Fixture | Chế độ checkout | Người phụ trách & Kế hoạch xử lý / Accepted Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CHK-01` | **Pass có điều kiện** | [cart-checkout-scenarios.md#chk-01](../test-design/cart-checkout-scenarios.md#chk-01---customer-đăng-nhập-hoàn-tất-checkout-thành-công) | [pairwise.spec.ts (PW-006)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-CHK-01.md](RUN-CHK-01.md)<br>• Ảnh: [REVIEW-02](../../image/review/REVIEW-02-confirm-order.png), [REVIEW-03](../../image/review/REVIEW-03-order-completed.png), [REVIEW-05](../../image/review/REVIEW-05-order-details.png)<br>• SQL: `ORDER_COUNT\|1`, `OrderStatus=10`, `PaymentStatus=10` | `1edaf26874f0` | 03/11/2026 | `PW-SIMPLE-001`, stock 10, coupon `PW-CART-10PCT`, registered customer, Ground, CheckMoneyOrder | `multi-step` | **Lê Anh Khoa**<br>Finding currency D-01 (storefront `100 đ` vs Admin `$100.00`) vẫn mở dưới dạng accepted risk; hạn rà soát 07/11/2026. |
| `CHK-02` | **Pass trong PW test** | [cart-checkout-scenarios.md#chk-02](../test-design/cart-checkout-scenarios.md#chk-02---guest-hoàn-tất-checkout-khi-được-hỗ-trợ) | [pairwise.spec.ts (PW-002, PW-007, PW-009)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-CHK-02.md](RUN-CHK-02.md)<br>• Mapping: [scenario-mapping.csv](../../qa/pairwise/test-data/scenario-mapping.csv)<br>• SQL: `assertCheckoutOrderEvidence`, order delta = 1, email = `qa.guest@example.test`, không null customer email | `1edaf26874f0` | 03/11/2026 | `PW-SIMPLE-001`, `PW-SHIRT`, `qa.guest@example.test`, Anonymous checkout allowed = True | `multi-step` | **Lê Anh Khoa**<br>Pass hồi quy lỗi lịch sử nopCommerce #7467; chạy sau review cũ, ghi đúng nguồn PW test. |
| `ADDR-01` | **Pass** | [cart-checkout-scenarios.md#addr-01](../test-design/cart-checkout-scenarios.md#addr-01---chấp-nhận-address-hợp-lệ) | [pairwise.spec.ts (PW-002, PW-006, PW-007, PW-009)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-ADDR-01.md](RUN-ADDR-01.md)<br>• Ảnh: Review 06–07 [linh-order-payment-review-summary.md](../linh-order-payment-review-summary.md#2-kết-quả-đọc-từ-evidence)<br>• SQL: Order lưu đúng Billing & Shipping Address | `1edaf26874f0` | 03/11/2026 | Form địa chỉ đầy đủ hợp lệ (VN, HCM, 1 Test Street, Zip 700000, Phone 0900000000) | `multi-step` | **Lê Anh Khoa**<br>Pass ổn định theo baseline run. |
| `ADDR-02` | **Pass** | [cart-checkout-scenarios.md#addr-02](../test-design/cart-checkout-scenarios.md#addr-02---từ-chối-address-thiếu-trường-bắt-buộc) | [pairwise.spec.ts (PW-001, PW-011, PW-012)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-ADDR-02.md](RUN-ADDR-02.md)<br>• Ảnh UI: [ADDR-02-keep-fields.png](../../../image/evidence/scrum-112/ADDR-02-keep-fields.png)<br>• Validation `First name is required.`, order delta = 0, form giữ nguyên các trường khác | `afb1e29145` (ảnh)<br>`1edaf26874f0` (test) | 03/11/2026 | Form địa chỉ để trống First Name, các trường khác hợp lệ | `multi-step` | **Lê Anh Khoa**<br>Pass hồi quy lỗi lịch sử nopCommerce #7203 (không bị reset trắng form). |
| `SHP-01` | **Partial** | [cart-checkout-scenarios.md#shp-01](../test-design/cart-checkout-scenarios.md#shp-01---chọn-phương-thức-giao-hàng-local-hợp-lệ) | [checkout-risk.spec.ts (SHP-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-SHP-01.md](RUN-SHP-01.md)<br>• Ảnh UI: [SHP-01-ground-persisted.png](../../../image/evidence/scrum-112/SHP-01-ground-persisted.png)<br>• Evidence review cũ chỉ xác nhận Ground ở Confirm (Finding D-03) | `afb1e29145` | 03/11/2026 | `PW-SIMPLE-001`, phương thức giao hàng Ground (`Shipping.FixedByWeightByTotal`) | `multi-step` | **Lê Anh Khoa**<br>Giữ Partial cho Sprint 2 theo rubric; đã có ảnh manual bù đắp, kế hoạch bổ sung assertion tự động đa option trước 04/11/2026. |
| `SHP-02` | **Not Run** | [cart-checkout-scenarios.md#shp-02](../test-design/cart-checkout-scenarios.md#shp-02---shipping-method-rỗng-sai-định-dạng-hoặc-không-còn-khả-dụng) | [checkout-risk.spec.ts (SHP-02 3 datasets)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-SHP-02.md](RUN-SHP-02.md)<br>• Đã hoàn thành mã test cho 3 dataset (rỗng, invalid-value, unknown option); chưa có execution log Sprint 2 | `afb1e29145` | Chưa chạy Sprint 2 | `PW-SIMPLE-001`, shipping option payload rỗng / invalid / unknown | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Phân loại đúng Not Run trong Sprint 2 (không ghi Blocked vì không có blocker hạ tầng); kế hoạch chạy nghiệm thu trước 04/11/2026. |
| `PAY-LOCAL-01` | **Pass trong luồng local tối giản** | [cart-checkout-scenarios.md#pay-local-01](../test-design/cart-checkout-scenarios.md#pay-local-01---chọn-payment-method-local) | [pairwise.spec.ts (PW-002, PW-006, PW-007, PW-009)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-PAY-LOCAL-01.md](RUN-PAY-LOCAL-01.md)<br>• SQL: `GenericAttribute` lưu đúng `SelectedPaymentMethod = Payments.CheckMoneyOrder`, không gọi gateway ngoài | `1edaf26874f0` | 03/11/2026 | `Payments.CheckMoneyOrder` active | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Pass ổn định trong luồng local tối giản. |
| `PAY-FAIL-01` | **Blocked** | [cart-checkout-scenarios.md#pay-fail-01](../test-design/cart-checkout-scenarios.md#pay-fail-01---payment-processor-local-từ-chối-giao-dịch) | [checkout-risk.spec.ts (PAY-FAIL-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-PAY-FAIL-01.md](RUN-PAY-FAIL-01.md)<br>• Plugin: [QaDeclinePaymentProcessor.cs](../../src/Plugins/Nop.Plugin.Payments.QaDecline/QaDeclinePaymentProcessor.cs)<br>• Ảnh UI manual: [PAY-FAIL-01-decline.png](../../../image/evidence/scrum-112/PAY-FAIL-01-decline.png) | `afb1e29145` | Bị Block trong Sprint 2 | Plugin `Payments.QaDecline` (trả `ProcessPaymentResult.Success = false`) | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Giữ Blocked do thiếu fake payment processor trong pipeline CI Sprint 2; điều kiện gỡ: kích hoạt plugin local và rerun hoặc trình phê duyệt Accepted Risk trước 06/11/2026. |
| `INV-01` | **Chưa xác minh cục bộ** | [cart-checkout-scenarios.md#inv-01](../test-design/cart-checkout-scenarios.md#inv-01---tồn-kho-giảm-xuống-không-đủ-trước-khi-xác-nhận-order) | [checkout-risk.spec.ts (INV-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-INV-01.md](RUN-INV-01.md)<br>• Dẫn nguồn: Lượt kiểm thử bổ sung trên Jira (không gán nhầm cho review cũ 05–06/10)<br>• Cần kiểm chứng lại hành vi backorder | `afb1e29145` | Lượt bổ sung Jira | `PW-SIMPLE-001`, stock ban đầu = 5, giảm về 4 trước khi bấm Confirm | `multi-step` | **Trần Thị Phương Trang + Lê Anh Khoa** *(High / P1)*<br>Kế hoạch rerun stock 5→4 hoặc đối chiếu policy backorder của nopCommerce trước 07/11/2026. |
| `CART-MERGE-01` | **Not Run** | [SCRUM-80-risk-register.md#cart-merge-01](../test-design/SCRUM-80-risk-register.md#cart-merge-01---merge-guest-cart-sau-khi-đăng-nhập) | [checkout-risk.spec.ts (CART-MERGE-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-CART-MERGE-01.md](RUN-CART-MERGE-01.md)<br>• Đã code test automation kiểm tra gộp dòng simple và tách variant Red/S, Blue/M; chưa chạy trong Sprint 2 | `afb1e29145` | Chưa chạy Sprint 2 | Giỏ guest (Simple qty 1, Red/S qty 1) + Giỏ account (Simple qty 1, Blue/M qty 1) | `multi-step` | **Trần Thị Phương Trang + Lê Anh Khoa** *(High / P1)*<br>Phân loại đúng Not Run trong Sprint 2 (không ghi Blocked); kế hoạch chạy nghiệm thu và snapshot SQL trước 05/11/2026. |
| `CHK-RACE-01` | **Not Run** | [SCRUM-80-risk-register.md#chk-race-01](../test-design/SCRUM-80-risk-register.md#chk-race-01---hai-request-confirm-order-đồng-thời) | [checkout-risk.spec.ts (CHK-RACE-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-CHK-RACE-01.md](RUN-CHK-RACE-01.md)<br>• Đã dựng harness concurrency barrier phát 2 Confirm đồng thời; chưa chạy trong Sprint 2 | `afb1e29145` | Chưa chạy Sprint 2 | `PW-SIMPLE-001`, stock hữu hạn, 2 request Confirm song song bằng barrier | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Phân loại đúng Not Run trong Sprint 2 (không ghi Blocked); kế hoạch chạy harness concurrency trước 06/11/2026. |

---

## 2. Báo cáo tổng hợp trạng thái theo mẫu số 26 (Tách riêng Pairwise Coverage)

Tuân thủ nghiêm ngặt nguyên tắc nghiệm thu: **Không dùng 253/253 pair coverage để suy diễn thành kết quả thực thi của 26 scenario rủi ro**.

```text
Risk register: 26 scenario
- Pass: 17 (15 dòng Cart + ADDR-01 + ADDR-02)
- Pass có điều kiện: 2 (CHK-01 finding currency D-01 + PAY-LOCAL-01)
- Pass trong PW test: 1 (CHK-02 trong PW-002/PW-007/PW-009)
- Partial: 1 (SHP-01)
- Not Run: 3 (SHP-02, CART-MERGE-01, CHK-RACE-01)
- Blocked: 1 (PAY-FAIL-01)
- Chưa xác minh cục bộ: 1 (INV-01)
- Fail: 0

Pairwise model coverage: 253/253 feasible pairs
Pairwise execution: 14/14 passed, 0 failed, 0 skipped (+ 1 HARNESS-001 passed)
```

---

## 3. Danh sách các ca Rủi ro cao (High / P1) còn mở & Kế hoạch xử lý

| ID | Điểm / Mức | Trạng thái hiện tại | Blocker / Khoảng trống | Người phụ trách | Hạn dự kiến / Quyết định chấp nhận rủi ro |
| --- | :---: | :--- | --- | --- | --- |
| `CHK-01` | 6 / High | Pass có điều kiện | Finding hiển thị currency D-01 (`100 đ` storefront vs `$100.00` Admin) | Lê Anh Khoa | 07/11/2026 (Đề xuất ghi nhận Accepted Risk về cấu hình format tiền tệ) |
| `PAY-FAIL-01` | 6 / High | Blocked | Thiếu fake payment processor tích hợp trong pipeline CI tự động | Lê Anh Khoa | 06/11/2026 (Điều kiện gỡ: kích hoạt plugin local hoặc xin quyết định Accepted Risk) |
| `SHP-02` | 6 / High | Not Run | Chưa chạy 3 dataset (rỗng, sai định dạng, option không tồn tại) trong Sprint 2 | Lê Anh Khoa | 04/11/2026 (Thực thi test tự động và lưu SQL request/response) |
| `INV-01` | 9 / High | Chưa xác minh cục bộ | Chưa đối chiếu hành vi trừ stock/backorder trực tiếp trên local | Trang + Khoa | 07/11/2026 (Kiểm chứng lại lượt bổ sung Jira và cấu hình Manage Inventory) |
| `CART-MERGE-01` | 6 / High | Not Run | Chưa chạy luồng merge giỏ guest vào account trong Sprint 2 | Trang + Khoa | 05/11/2026 (Thực thi test tự động, snapshot SQL giỏ hàng trước/sau) |
| `CHK-RACE-01` | 6 / High | Not Run | Chưa chạy concurrency barrier đồng thời trong Sprint 2 | Lê Anh Khoa | 06/11/2026 (Thực thi harness race condition và đối chiếu order delta <= 1) |

---

## 4. Đối chiếu 2 bug lịch sử nopCommerce

1. **nopCommerce #7467 (Null customer email khi Guest checkout)**:
   - Gắn với `CHK-02`.
   - Kết quả: PW-002, PW-007, PW-009 đã chạy sau review cũ, SQL snapshot xác nhận order tạo thành công gắn đúng email fixture `qa.guest@example.test`, không bị null email.
2. **nopCommerce #7203 (Form address bị reset trắng sau validation lỗi)**:
   - Gắn với `ADDR-02`.
   - Kết quả: Gửi form thiếu First Name, hệ thống báo lỗi `First name is required.`, ảnh bằng chứng [`ADDR-02-keep-fields.png`](../../../image/evidence/scrum-112/ADDR-02-keep-fields.png) xác nhận toàn bộ các ô dữ liệu khác vẫn giữ nguyên, order delta = 0, giỏ hàng còn nguyên.
