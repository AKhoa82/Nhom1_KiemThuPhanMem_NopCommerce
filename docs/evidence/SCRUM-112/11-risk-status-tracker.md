# Bảng theo dõi thay đổi 11 risk — SCRUM-112 / SCRUM-81

Bảng này ghi nhận trạng thái và liên kết bằng chứng thực thi độc lập cho 11 rủi ro Checkout và luồng bổ sung theo kế hoạch tại [`KE_HOACH_HOAN_THIEN_NHIEM_VU.md`](../../KE_HOACH_HOAN_THIEN_NHIEM_VU.md).

| ID | Trạng thái trước | Trạng thái sau | Run/evidence mới | Gap/defect còn mở | Owner/ngày tiếp theo |
| --- | --- | --- | --- | --- | --- |
| `CHK-01` | Pass có điều kiện | Pass có điều kiện | [RUN-CHK-01.md](RUN-CHK-01.md) | Finding D-01: Storefront hiển thị `100 đ`, Admin `$100.00`; order Pending/Pending | Khoa / 07/11/2026 |
| `CHK-02` | Pass theo PW-002/007/009 | Pass trong PW-002/PW-007/PW-009 | [RUN-CHK-02.md](RUN-CHK-02.md) | Đã có assertion SQL `assertCheckoutOrderEvidence`; đối chiếu hồi quy nopCommerce #7467 | Khoa / 04/11/2026 |
| `ADDR-01` | Pass theo evidence cũ | Pass | [RUN-ADDR-01.md](RUN-ADDR-01.md) | Gắn với baseline run `RUN-20261107-ADDR01-01`; Admin Order Details lưu đầy đủ Billing & Shipping address | Khoa / 07/11/2026 |
| `ADDR-02` | Pass theo evidence cũ | Pass (chờ ảnh giữ field) | [RUN-ADDR-02.md](RUN-ADDR-02.md) | Đã có validation `First name is required.` và order delta = 0; cần chụp ảnh giữ field hợp lệ khi rerun theo nopCommerce #7203 | Khoa / 04/11/2026 |
| `SHP-01` | Partial | Partial | [RUN-SHP-01.md](RUN-SHP-01.md) | Đã code test automation `checkout-risk.spec.ts`; cần chụp ảnh UI bước Shipping Method sau khi quay lại giữ option Ground | Khoa / 04/11/2026 |
| `SHP-02` | Blocked trong register | Not Run (đã code test 3 datasets) | [RUN-SHP-02.md](RUN-SHP-02.md) | Đã có test automation cho 3 dataset (rỗng, invalid-value, unknown option); chờ rerun trên local | Khoa / 04/11/2026 |
| `PAY-LOCAL-01` | Pass luồng tối giản | Pass trong luồng local tối giản | [RUN-PAY-LOCAL-01.md](RUN-PAY-LOCAL-01.md) | Xác nhận system name `Payments.CheckMoneyOrder` lưu đúng, không tạo order ở bước chọn, không gọi gateway ngoài | Khoa / 07/11/2026 |
| `PAY-FAIL-01` | Blocked | Blocked (chờ kích hoạt plugin) | [RUN-PAY-FAIL-01.md](RUN-PAY-FAIL-01.md) | Đã code plugin `Payments.QaDecline`, build DLL và copy vào `/app/Plugins/`; cần kích hoạt trên Admin UI và rerun | Khoa / 06/11/2026 |
| `INV-01` | Pass lượt bổ sung Jira | Chưa xác minh cục bộ | [RUN-INV-01.md](RUN-INV-01.md) | Đã code test automation `checkout-risk.spec.ts`; cần rerun stock 5→4 trước Confirm hoặc xác minh lại Jira run | Trang + Khoa / 07/11/2026 |
| `CART-MERGE-01` | Blocked trong register | Not Run (đã có test code) | [RUN-CART-MERGE-01.md](RUN-CART-MERGE-01.md) | Đã code test automation `checkout-risk.spec.ts` kiểm tra gộp dòng simple và tách biến thể Red/S, Blue/M | Trang + Khoa / 05/11/2026 |
| `CHK-RACE-01` | Blocked trong register | Not Run (harness đã dựng) | [RUN-CHK-RACE-01.md](RUN-CHK-RACE-01.md) | Đã dựng harness concurrency barrier trong `checkout-risk.spec.ts`; chờ chạy với local credentials | Khoa / 06/11/2026 |

## Tổng hợp trạng thái 26 scenario

```text
Risk register: 26 scenario
- Pass: 17 (15 dòng Cart + ADDR-01 + ADDR-02)
- Pass có điều kiện: 2 (CHK-01 + PAY-LOCAL-01)
- Pass trong PW test: 1 (CHK-02 trong PW-002/PW-007/PW-009)
- Partial: 1 (SHP-01)
- Not Run: 3 (SHP-02, CART-MERGE-01, CHK-RACE-01)
- Blocked: 1 (PAY-FAIL-01)
- Chưa xác minh cục bộ: 1 (INV-01)
- Fail: 0

Pairwise model coverage: 253/253 feasible pairs
Pairwise execution: 14/14 passed, 0 failed, 0 skipped (+ 1 HARNESS-001 passed)
```
