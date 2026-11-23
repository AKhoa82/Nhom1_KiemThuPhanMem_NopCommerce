# SCRUM-112 — Đối chiếu 11 rủi ro Checkout và luồng bổ sung

Bảng này cập nhật kết quả cũ của Linh bằng lượt chạy local ngày **18/11/2026**. Linh đã bàn giao phần rà soát 11 ID; lượt chạy mới và kết luận bên dưới là bước tích hợp của Khoa. Không gán lượt chạy mới cho Linh. [Risk register 26 dòng](../../test-design/SCRUM-80-risk-register.md) là nguồn chấm I/L và lý do; [run mới](RUN-20261118-N01.md) ghi cấu hình, lệnh, kết quả và giới hạn.

| ID | I × L / mức | Trạng thái hiện tại | Bằng chứng | Owner và việc tiếp theo |
| --- | --- | --- | --- | --- |
| CHK-01 | 3 × 2 = 6 / High | Pass có điều kiện | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/pairwise.spec.ts), [manifest](RUN-CHK-01.md) | Khoa: rà soát finding tiền tệ D-01; chưa tự ghi Accepted risk. |
| CHK-02 | 2 × 2 = 4 / Medium | Pass trong PW test | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/pairwise.spec.ts), [manifest](RUN-CHK-02.md) | Khoa: giữ bằng chứng guest PW riêng với review cũ. |
| ADDR-01 | 2 × 2 = 4 / Medium | Pass | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/pairwise.spec.ts), [manifest](RUN-ADDR-01.md) | Khoa: giữ bằng chứng lịch sử đúng nguồn. |
| ADDR-02 | 3 × 2 = 6 / High | Pass | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/pairwise.spec.ts), [manifest](RUN-ADDR-02.md) | Khoa: giữ ảnh và đối chiếu order delta. |
| SHP-01 | 2 × 2 = 4 / Medium | Pass 18/11 | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/checkout-risk.spec.ts), [run](RUN-20261118-N01.md) | Khoa: lưu report khi bàn giao cuối kỳ. |
| SHP-02 | 3 × 2 = 6 / High | Pass 3/3 dataset 18/11 | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/checkout-risk.spec.ts), [run](RUN-20261118-N01.md) | Khoa: lưu response đã làm sạch. |
| PAY-LOCAL-01 | 3 × 2 = 6 / High | Pass trong luồng local | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/pairwise.spec.ts), [manifest](RUN-PAY-LOCAL-01.md) | Khoa: không suy diễn đã thu tiền. |
| PAY-FAIL-01 | 3 × 2 = 6 / High | Pass 18/11 | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/checkout-risk.spec.ts), [run](RUN-20261118-N01.md) | Khoa: plugin QA local đã chạy decline/retry, giỏ giữ nguyên và không tạo đơn. |
| INV-01 | 3 × 3 = 9 / High | Pass 18/11 với cache reset | [Scenario](../../test-design/cart-checkout-scenarios.md), [test](../../../qa/automation/tests/checkout-risk.spec.ts), [run](RUN-20261118-N01.md) | Trang + Khoa: ghi rõ stock đổi qua SQL rồi restart web. |
| CART-MERGE-01 | 3 × 2 = 6 / High | Fail: nhánh vượt kho mất 2 món guest | [Scenario](../../test-design/SCRUM-80-risk-register.md), [test](../../../qa/automation/tests/checkout-risk.spec.ts), [run](RUN-20261118-N01.md) | Trang + Khoa: theo dõi defect, sửa và retest; nhánh hợp lệ Pass. |
| CHK-RACE-01 | 3 × 2 = 6 / High | Fail 18/11 | [Scenario](../../test-design/SCRUM-80-risk-register.md), [test](../../../qa/automation/tests/checkout-risk.spec.ts), [run](RUN-20261118-N01.md) | Khoa: ghi defect lộ SQL, sửa và retest. Chỉ một order được tạo. |

## Risk coverage theo 26 scenario

- Pass **21**; Pass có điều kiện **2**; Pass trong PW test **1**; Fail **2**; Partial/Blocked/Not Run **0**. Tổng **26**.
- Scenario có bằng chứng đủ kết luận Pass/Fail: **24/26** (21 Pass, 1 Pass trong PW, 2 Fail). Hai Pass có điều kiện được giữ riêng để theo dõi finding.
- Pairwise model coverage **253/253 cặp khả thi** là chỉ số khác. Lượt Pairwise 14/14 Pass là lượt cũ.
- Mọi scenario High đã có execution evidence. `CART-MERGE-01` và `CHK-RACE-01` Fail, cần theo dõi defect/retest riêng; `CHK-01` còn finding D-01 về định dạng tiền tệ nhưng có bằng chứng checkout thành công. Không tự ghi Accepted risk cho finding này.
