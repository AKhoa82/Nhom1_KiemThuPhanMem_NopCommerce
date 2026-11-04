# Báo cáo kết quả bàn giao SCRUM-112 — Nghiệm thu 11 rủi ro Checkout phục vụ SCRUM-81

- **Mã công việc (Jira):** SCRUM-112
- **Issue cha:** [SCRUM-80](https://anhkhoa080205.atlassian.net/browse/SCRUM-80)
- **Đánh giá ban đầu:** [SCRUM-83](https://anhkhoa080205.atlassian.net/browse/SCRUM-83)
- **Người duyệt & nghiệm thu:** Lê Anh Khoa ([SCRUM-81](https://anhkhoa080205.atlassian.net/browse/SCRUM-81))
- **Chi nhánh Git:** `test/SCRUM-82-cart-risk`
- **Môi trường nghiệm thu:** Docker container `nopcommerce` (Web) & `nopcommerce_mssql_server` (MSSQL), `http://localhost/`

---

## 1. Bảng đối chiếu chi tiết 11 kịch bản Checkout và luồng bổ sung

Dưới đây là bảng đối chiếu độc lập đầy đủ 11 rủi ro trong phạm vi SCRUM-112, gắn đúng nguồn run, commit, ngày chạy, fixture và chế độ multi-step checkout:

| ID | Trạng thái đã xác minh | Scenario link | Test automation | Bằng chứng chạy thực tế (Report / Ảnh / SQL) | Commit SHA | Ngày chạy | Fixture | Chế độ checkout | Người phụ trách & Kế hoạch xử lý / Quyết định rủi ro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CHK-01` | **Pass có điều kiện** | [cart-checkout-scenarios.md#chk-01](../test-design/cart-checkout-scenarios.md#chk-01---customer-đăng-nhập-hoàn-tất-checkout-thành-công) | [pairwise.spec.ts (PW-006)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-CHK-01.md](RUN-CHK-01.md)<br>• Ảnh: [REVIEW-02](../../image/review/REVIEW-02-confirm-order.png), [REVIEW-03](../../image/review/REVIEW-03-order-completed.png), [REVIEW-05](../../image/review/REVIEW-05-order-details.png)<br>• SQL: `ORDER_COUNT\|1`, `OrderStatus=10` (Pending), `PaymentStatus=10` (Pending) | `1edaf26874f0` | 03/11/2026 | `PW-SIMPLE-001`, stock 10, coupon `PW-CART-10PCT`, registered customer, Ground, CheckMoneyOrder | `multi-step` | **Lê Anh Khoa**<br>Finding D-01: Storefront hiển thị `100 đ`, Admin `$100.00`; đề xuất ghi nhận Accepted Risk về format tiền tệ storefront/admin; hạn 07/11/2026. |
| `CHK-02` | **Pass trong PW test** | [cart-checkout-scenarios.md#chk-02](../test-design/cart-checkout-scenarios.md#chk-02---guest-hoàn-tất-checkout-khi-được-hỗ-trợ) | [pairwise.spec.ts (PW-002, PW-007, PW-009)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-CHK-02.md](RUN-CHK-02.md)<br>• Mapping: [scenario-mapping.csv](../../qa/pairwise/test-data/scenario-mapping.csv)<br>• SQL: `assertCheckoutOrderEvidence`, order delta = 1, email = `qa.guest@example.test`, không null email theo bug #7467 | `1edaf26874f0` | 03/11/2026 | `PW-SIMPLE-001`, `PW-SHIRT`, `qa.guest@example.test`, Anonymous checkout allowed = True | `multi-step` | **Lê Anh Khoa**<br>Chạy trong các ca Pairwise sau review cũ; đối chiếu đạt hồi quy lỗi lịch sử nopCommerce #7467. |
| `ADDR-01` | **Pass** | [cart-checkout-scenarios.md#addr-01](../test-design/cart-checkout-scenarios.md#addr-01---chấp-nhận-address-hợp-lệ) | [pairwise.spec.ts (PW-002, PW-006, PW-007, PW-009)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-ADDR-01.md](RUN-ADDR-01.md)<br>• Ảnh: Review 06–07 [linh-order-payment-review-summary.md](../linh-order-payment-review-summary.md#2-kết-quả-đọc-từ-evidence)<br>• SQL: Admin Order Details lưu đầy đủ Billing & Shipping address | `1edaf26874f0` | 03/11/2026 | Form địa chỉ đầy đủ (VN, HCM, 1 Test Street, Zip 700000, Phone 0900000000) | `multi-step` | **Lê Anh Khoa**<br>Pass ổn định theo baseline run. |
| `ADDR-02` | **Pass** | [cart-checkout-scenarios.md#addr-02](../test-design/cart-checkout-scenarios.md#addr-02---từ-chối-address-thiếu-trường-bắt-buộc) | [pairwise.spec.ts (PW-001, PW-011, PW-012)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-ADDR-02.md](RUN-ADDR-02.md)<br>• Ảnh UI: [ADDR-02-keep-fields.png](../../../image/evidence/scrum-112/ADDR-02-keep-fields.png)<br>• Lỗi `First name is required.`, form giữ nguyên các trường khác, order delta = 0, giỏ hàng còn | `afb1e29145` (ảnh)<br>`1edaf26874f0` (test) | 03/11/2026 | Form địa chỉ để trống First Name, các trường khác hợp lệ | `multi-step` | **Lê Anh Khoa**<br>Pass hồi quy lỗi lịch sử nopCommerce #7203 (form không bị xóa trắng khi lỗi). |
| `SHP-01` | **Partial** | [cart-checkout-scenarios.md#shp-01](../test-design/cart-checkout-scenarios.md#shp-01---chọn-phương-thức-giao-hàng-local-hợp-lệ) | [checkout-risk.spec.ts (SHP-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-SHP-01.md](RUN-SHP-01.md)<br>• Ảnh UI: [SHP-01-ground-persisted.png](../../../image/evidence/scrum-112/SHP-01-ground-persisted.png)<br>• Bằng chứng cũ chỉ xác nhận Ground ở Confirm (Finding D-03) | `afb1e29145` | 03/11/2026 | `PW-SIMPLE-001`, shipping method Ground (`Shipping.FixedByWeightByTotal`) | `multi-step` | **Lê Anh Khoa**<br>Giữ Partial cho Sprint 2; đã có ảnh manual bù đắp lựa chọn Ground giữ nguyên khi back; hạn bổ sung test tự động hoàn chỉnh 04/11/2026. |
| `SHP-02` | **Not Run** | [cart-checkout-scenarios.md#shp-02](../test-design/cart-checkout-scenarios.md#shp-02---shipping-method-rỗng-sai-định-dạng-hoặc-không-còn-khả-dụng) | [checkout-risk.spec.ts (SHP-02 3 datasets)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-SHP-02.md](RUN-SHP-02.md)<br>• Kịch bản 3 dataset (rỗng, invalid-value, unknown option) đã có mã test, chưa có execution log Sprint 2 | `afb1e29145` | Chưa chạy Sprint 2 | `PW-SIMPLE-001`, shipping option payload rỗng / invalid / unknown | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Phân loại đúng Not Run trong Sprint 2 (không ghi Blocked vì không có điều kiện kỹ thuật cản trở); kế hoạch chạy nghiệm thu trước 04/11/2026. |
| `PAY-LOCAL-01` | **Pass trong luồng local tối giản** | [cart-checkout-scenarios.md#pay-local-01](../test-design/cart-checkout-scenarios.md#pay-local-01---chọn-payment-method-local) | [pairwise.spec.ts (PW-002, PW-006, PW-007, PW-009)](../../qa/automation/tests/pairwise.spec.ts) | [RUN-PAY-LOCAL-01.md](RUN-PAY-LOCAL-01.md)<br>• SQL: `GenericAttribute` lưu `SelectedPaymentMethod = Payments.CheckMoneyOrder`, không gọi gateway ngoài | `1edaf26874f0` | 03/11/2026 | `Payments.CheckMoneyOrder` active | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Pass ổn định trong luồng local tối giản. |
| `PAY-FAIL-01` | **Blocked** | [cart-checkout-scenarios.md#pay-fail-01](../test-design/cart-checkout-scenarios.md#pay-fail-01---payment-processor-local-từ-chối-giao-dịch) | [checkout-risk.spec.ts (PAY-FAIL-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-PAY-FAIL-01.md](RUN-PAY-FAIL-01.md)<br>• Mã plugin: [QaDeclinePaymentProcessor.cs](../../src/Plugins/Nop.Plugin.Payments.QaDecline/QaDeclinePaymentProcessor.cs)<br>• Ảnh UI manual: [PAY-FAIL-01-decline.png](../../../image/evidence/scrum-112/PAY-FAIL-01-decline.png) | `afb1e29145` | Bị Block trong Sprint 2 | Plugin `Payments.QaDecline` (trả `ProcessPaymentResult.Success = false`) | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Giữ Blocked do thiếu fake payment processor trong pipeline CI Sprint 2; điều kiện gỡ: kích hoạt plugin local và rerun hoặc trình phê duyệt Accepted Risk trước 06/11/2026. |
| `INV-01` | **Chưa xác minh cục bộ** | [cart-checkout-scenarios.md#inv-01](../test-design/cart-checkout-scenarios.md#inv-01---tồn-kho-giảm-xuống-không-đủ-trước-khi-xác-nhận-order) | [checkout-risk.spec.ts (INV-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-INV-01.md](RUN-INV-01.md)<br>• Dẫn đúng nguồn lượt kiểm thử bổ sung trên Jira (không gán nhầm cho review cũ 05–06/10) | `afb1e29145` | Lượt bổ sung Jira | `PW-SIMPLE-001`, stock ban đầu = 5, giảm về 4 trước khi bấm Confirm | `multi-step` | **Trần Thị Phương Trang + Lê Anh Khoa** *(High / P1)*<br>Kế hoạch rerun stock 5→4 hoặc đối chiếu policy backorder của nopCommerce trước 07/11/2026. |
| `CART-MERGE-01` | **Not Run** | [SCRUM-80-risk-register.md#cart-merge-01](../test-design/SCRUM-80-risk-register.md#cart-merge-01---merge-guest-cart-sau-khi-đăng-nhập) | [checkout-risk.spec.ts (CART-MERGE-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-CART-MERGE-01.md](RUN-CART-MERGE-01.md)<br>• Kịch bản gộp dòng simple và tách variant Red/S, Blue/M đã có mã test, chưa có execution log Sprint 2 | `afb1e29145` | Chưa chạy Sprint 2 | Giỏ guest (Simple qty 1, Red/S qty 1) + Giỏ account (Simple qty 1, Blue/M qty 1) | `multi-step` | **Trần Thị Phương Trang + Lê Anh Khoa** *(High / P1)*<br>Phân loại đúng Not Run trong Sprint 2 (không ghi Blocked); kế hoạch chạy nghiệm thu và snapshot SQL trước 05/11/2026. |
| `CHK-RACE-01` | **Not Run** | [SCRUM-80-risk-register.md#chk-race-01](../test-design/SCRUM-80-risk-register.md#chk-race-01---hai-request-confirm-order-đồng-thời) | [checkout-risk.spec.ts (CHK-RACE-01)](../../qa/automation/tests/checkout-risk.spec.ts) | [RUN-CHK-RACE-01.md](RUN-CHK-RACE-01.md)<br>• Concurrency barrier harness phát 2 Confirm đồng thời đã dựng mã, chưa có execution log Sprint 2 | `afb1e29145` | Chưa chạy Sprint 2 | `PW-SIMPLE-001`, stock hữu hạn, 2 request Confirm song song bằng barrier | `multi-step` | **Lê Anh Khoa** *(High / P1)*<br>Phân loại đúng Not Run trong Sprint 2 (không ghi Blocked); kế hoạch chạy harness concurrency trước 06/11/2026. |

---

## 2. Báo cáo tổng hợp trạng thái 26 Scenario (Mẫu số 26)

Tuân thủ nghiêm ngặt nguyên tắc: **Không dùng 253/253 pair coverage để suy diễn thành kết quả thực thi của 26 scenario rủi ro**.

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

## 3. Danh sách các ca High Risk còn mở & Kế hoạch xử lý chi tiết

| ID | Điểm / Mức | Trạng thái hiện tại | Blocker / Khoảng trống | Người phụ trách | Hạn dự kiến / Quyết định chấp nhận rủi ro |
| --- | :---: | :--- | --- | --- | --- |
| `CHK-01` | 6 / High | Pass có điều kiện | Finding hiển thị currency D-01 (`100 đ` storefront vs `$100.00` Admin) | Lê Anh Khoa | 07/11/2026 (Ghi nhận Accepted Risk format tiền tệ) |
| `PAY-FAIL-01` | 6 / High | Blocked | Thiếu fake payment processor tích hợp trong pipeline CI | Lê Anh Khoa | 06/11/2026 (Điều kiện gỡ: kích hoạt plugin local hoặc xin quyết định Accepted Risk) |
| `SHP-02` | 6 / High | Not Run | Chưa chạy 3 dataset (rỗng, invalid, unknown) trong Sprint 2 | Lê Anh Khoa | 04/11/2026 (Thực thi test tự động và lưu SQL request/response) |
| `INV-01` | 9 / High | Chưa xác minh cục bộ | Chưa đối chiếu hành vi trừ stock/backorder trực tiếp trên local | Trang + Khoa | 07/11/2026 (Kiểm chứng lại lượt bổ sung Jira và cấu hình Manage Inventory) |
| `CART-MERGE-01` | 6 / High | Not Run | Chưa chạy luồng merge giỏ guest vào account trong Sprint 2 | Trang + Khoa | 05/11/2026 (Thực thi test tự động, snapshot SQL giỏ hàng trước/sau) |
| `CHK-RACE-01` | 6 / High | Not Run | Chưa chạy concurrency barrier đồng thời trong Sprint 2 | Lê Anh Khoa | 06/11/2026 (Thực thi harness race condition và đối chiếu order delta <= 1) |

---

## 4. Mẫu comment bàn giao chính thức trên Jira SCRUM-81

```markdown
Đã hoàn thành rà soát độc lập bằng chứng và trạng thái 11 rủi ro Checkout và luồng bổ sung theo yêu cầu SCRUM-112 phục vụ Khoa duyệt SCRUM-81 tại commit afb1e29145 (branch test/SCRUM-82-cart-risk):

1. Tài liệu bàn giao & Bảng đối chiếu 11 case: docs/evidence/SCRUM-112/SCRUM-112-KET-QUA-BAN-GIAO.md
2. Bảng theo dõi thay đổi: docs/evidence/SCRUM-112/11-risk-status-tracker.md
3. Risk register cập nhật: docs/test-design/SCRUM-80-risk-register.md
4. Run manifests: docs/evidence/SCRUM-112/RUN-*.md (đủ 11 manifest cho từng scenario)
5. Bằng chứng hình ảnh UI trực tiếp:
   - image/evidence/scrum-112/ADDR-02-keep-fields.png (giữ form field khi validation lỗi theo nopCommerce #7203)
   - image/evidence/scrum-112/SHP-01-ground-persisted.png (giữ lựa chọn Ground khi back bước, bù đắp finding D-03)
   - image/evidence/scrum-112/PAY-FAIL-01-decline.png (thông báo decline xác định từ fake payment processor)
6. Risk coverage theo mẫu số 26:
   - Pass: 17 (15 dòng Cart + ADDR-01 + ADDR-02)
   - Pass có điều kiện: 2 (CHK-01 finding currency D-01 + PAY-LOCAL-01)
   - Pass trong PW test: 1 (CHK-02 trong PW-002/PW-007/PW-009)
   - Partial: 1 (SHP-01)
   - Not Run: 3 (SHP-02, CART-MERGE-01, CHK-RACE-01)
   - Blocked: 1 (PAY-FAIL-01)
   - Chưa xác minh cục bộ: 1 (INV-01)
   - Fail: 0
7. Pairwise model coverage: 253/253 feasible pairs (Pairwise execution: 14/14 passed)
8. Các vấn đề High risk còn mở:
   - CHK-01: Finding D-01 ký hiệu currency storefront (100 đ) vs Admin ($100.00); đề xuất Accepted Risk (Khoa, 07/11).
   - PAY-FAIL-01: Blocked do thiếu fake payment processor trong CI (Khoa, 06/11).
   - SHP-02: Not Run trong Sprint 2; kế hoạch chạy 3 dataset (Khoa, 04/11).
   - INV-01: Chưa xác minh cục bộ trong Sprint 2; ghi nhận đúng lượt bổ sung Jira (Trang + Khoa, 07/11).
   - CART-MERGE-01: Not Run trong Sprint 2; kế hoạch chạy merge cart (Trang + Khoa, 05/11).
   - CHK-RACE-01: Not Run trong Sprint 2; kế hoạch chạy barrier concurrency (Khoa, 06/11).

Đề nghị Khoa đối chiếu từng link scenario, test, manifest và ký duyệt SCRUM-81.
```
