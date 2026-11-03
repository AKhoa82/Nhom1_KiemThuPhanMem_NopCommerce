# Kế hoạch hoàn thiện nghiệm thu 11 rủi ro Checkout và luồng bổ sung

## 1. Mục tiêu

Hoàn thiện các phần còn thiếu của [`NhiemVu.md`](NhiemVu.md) để Lê Anh Khoa có
đủ căn cứ review và ký SCRUM-81. Phạm vi chỉ gồm 11 ID:

`CHK-01`, `CHK-02`, `ADDR-01`, `ADDR-02`, `SHP-01`, `SHP-02`,
`PAY-LOCAL-01`, `PAY-FAIL-01`, `INV-01`, `CART-MERGE-01`, `CHK-RACE-01`.

Không chấm lại 15 dòng Cart của Trang. Kết quả `253/253` chỉ là pair coverage,
không được dùng làm execution evidence cho 11 rủi ro trên.

## 2. Nguyên tắc thực hiện

1. Mỗi kết luận Pass/Fail phải gắn với một lượt chạy xác định, gồm commit SHA,
   ngày giờ, fixture, checkout mode, môi trường, lệnh chạy và report/evidence.
2. `Not Run` nghĩa là chưa chạy. Chỉ dùng `Blocked` khi có điều kiện tiên quyết
   cụ thể đang thiếu và ghi rõ cách gỡ blocker.
3. Không nâng `Partial` thành `Pass` từ mapping, mã test hoặc ảnh chưa chứng minh
   đủ expected result.
4. Không dùng lỗi hoặc ảnh lịch sử để kết luận Pass cho full case mới.
5. Không commit mật khẩu, cookie, token hoặc dữ liệu cá nhân thật. Evidence SQL
   phải là truy vấn chỉ đọc và đã loại dữ liệu nhạy cảm.
6. Checkout chuẩn của vòng nghiệm thu là multi-step. Nếu một lượt chạy dùng
   one-page checkout, phải tách thành run khác và không gộp kết quả.

## 3. Phân công đề xuất

| Vai trò | Người phụ trách đề xuất | Trách nhiệm |
| --- | --- | --- |
| Execution owner Checkout | Lê Anh Khoa | Chuẩn bị fixture, chạy/rerun và lưu evidence cho các case Checkout |
| Evidence reviewer | Đỗ Đặng Diệu Linh | Đối chiếu expected, nguồn run và trạng thái của đủ 11 dòng |
| Cart/inventory support | Trần Thị Phương Trang | Hỗ trợ `INV-01`, `CART-MERGE-01` và kiểm tra SQL stock/cart |
| Final approver | Lê Anh Khoa | Review bảng bàn giao và ký SCRUM-81 |

Phân công trên cần được xác nhận trên Jira. Cột `Owner` trong risk register phải
chỉ người chịu trách nhiệm xử lý tiếp; nếu người chạy, người review và người
duyệt khác nhau thì ghi thành các cột riêng.

## 4. Lịch thực hiện đề xuất

Kế hoạch bắt đầu từ ngày 02/11/2026. Nếu không thể giữ các ngày dưới đây, owner
phải cập nhật ngày mới trên Jira trước khi mốc cũ hết hạn.

| Giai đoạn | Thời hạn | Đầu ra bắt buộc |
| --- | --- | --- |
| 1. Chốt baseline và mẫu evidence | 02/11/2026 | Commit, môi trường, fixture, multi-step mode và mẫu manifest |
| 2. Sửa assertion và bổ sung test khả dụng | 03–04/11/2026 | Test cho guest/order, address, shipping negative, inventory và merge |
| 3. Tạo harness còn thiếu | 05–06/11/2026 | Fake payment processor và harness concurrency hoặc blocker cụ thể |
| 4. Chạy nghiệm thu và thu evidence | 07/11/2026 | Report, ảnh và SQL trước/sau cho từng case |
| 5. Review 11 dòng và bàn giao | 08/11/2026 | Risk register cập nhật, bảng thay đổi và comment SCRUM-81 |

## 5. Giai đoạn 1 — Chốt baseline và cấu trúc evidence

### 5.1. Việc thực hiện

- Chốt commit nguồn dùng để chạy; không chỉ ghi commit của tài liệu.
- Xác nhận storefront/container thực tế được build từ commit nào.
- Ghi rõ multi-step checkout, anonymous checkout, currency, tax, shipping và
  payment settings.
- Xác nhận các fixture `PW-*`, coupon, customer tổng hợp, local shipping method,
  local payment method và stock baseline.
- Tạo manifest cho mỗi run theo mẫu:

```text
Run ID:
Scenario ID:
Executed at:
Source commit:
Runtime/build commit:
Checkout mode:
Base URL/store:
Database/fixture version:
Customer type:
Product/SKU and stock:
Shipping method:
Payment method:
Command/manual procedure:
Result:
Evidence links:
Known limitations:
```

### 5.2. Nơi lưu đề xuất

- Manifest và bảng tổng hợp: `docs/evidence/SCRUM-112/`.
- Ảnh đã làm sạch dữ liệu nhạy cảm: `image/evidence/scrum-112/`.
- Test tự động: `qa/automation/tests/`.
- SQL helper chỉ đọc: `qa/automation/tests/helpers/`.
- Report lớn có thể giữ ngoài Git, nhưng phải có URL/attachment Jira truy cập
  được và manifest phải ghi checksum hoặc run ID.

### 5.3. Điều kiện hoàn thành

- Có một baseline duy nhất cho vòng nghiệm thu chính.
- Reviewer có thể xác định bằng chứng thuộc run nào mà không suy đoán từ tên
  ảnh hoặc ngày commit tài liệu.

## 6. Giai đoạn 2 — Hoàn thiện evidence/test theo từng ID

| ID | Trạng thái cần dùng trước khi chạy | Công việc còn thiếu | Evidence để đóng | Owner đề xuất | Hạn |
| --- | --- | --- | --- | --- | --- |
| `CHK-01` | Pass có điều kiện | Rerun hoặc xác minh cấu hình currency; kiểm tra đúng một order, total, OrderStatus và PaymentStatus | Ảnh Confirm/Admin, SQL order delta, manifest; defect/accepted risk cho currency nếu chưa sửa | Khoa | 07/11 |
| `CHK-02` | Partial cho tới khi đủ assertion | Mở rộng PW-002/PW-007/PW-009 để kiểm tra order gắn đúng guest/customer và email fixture, Pending/Pending, chỉ một order | Report ba case, SQL order/customer/email và cart sau checkout | Khoa | 04/11 |
| `ADDR-01` | Pass theo evidence cũ | Gắn evidence cũ với đúng run hoặc rerun; xác minh billing/shipping address lưu đúng | Ảnh/SQL order address và manifest | Khoa | 07/11 |
| `ADDR-02` | Partial cho tới khi đủ regression assertion | Gửi thiếu `FirstName` phía server; kiểm tra các field hợp lệ còn nguyên, order delta = 0, cart không mất, address không được lưu | Screenshot form sau lỗi, SQL order/cart/address trước-sau | Khoa | 04/11 |
| `SHP-01` | Partial | Tắt bypass khi chỉ có một option; chọn Ground, quay lại và xác minh lựa chọn vẫn được giữ; order delta = 0 trước Confirm | Ảnh trước/sau quay lại, checkout-state hoặc SQL generic attribute | Khoa | 04/11 |
| `SHP-02` | Not Run | Thực thi ba data set: rỗng, sai định dạng, option không khả dụng; xác nhận không đi tiếp, không lưu option, order delta = 0 và cart còn nguyên | Request/response đã làm sạch, ảnh UI và SQL trước-sau | Khoa | 04/11 |
| `PAY-LOCAL-01` | Pass trong luồng tối giản | Bổ sung assertion system name được lưu đúng và không tạo order chỉ từ bước chọn payment; ghi rõ không gọi gateway ngoài | Checkout-state/SQL, ảnh Confirm và order sau hoàn tất | Khoa | 07/11 |
| `PAY-FAIL-01` | Blocked | Tạo plugin fake local trả `Success=false` và lỗi xác định; chạy decline và retry; nếu không tạo được, xin quyết định Accepted risk | Plugin/system name, cấu hình decline, response, order delta = 0, cart còn nguyên | Khoa | 06/11 |
| `INV-01` | Chưa xác minh cục bộ | Gắn lại evidence lượt bổ sung đúng nguồn hoặc rerun stock 5→4 trước Confirm; không gán cho review 05–06/10 | Warning, order delta = 0, cart quantity 5, stock giữ 4, manifest | Trang + Khoa | 07/11 |
| `CART-MERGE-01` | Not Run | Tạo guest cart và account cart có dòng trùng/khác variant; đăng nhập, kiểm tra merge, total, coupon, stock và cô lập guest | UI và SQL cart/customer/store trước-sau; persistence sau refresh/login lại | Trang + Khoa | 05/11 |
| `CHK-RACE-01` | Not Run; chỉ Blocked nếu không dựng được harness | Dùng barrier phát hai Confirm request đồng thời từ cùng checkout state; không dùng hai click tuần tự | Timestamp/request ID, hai response, SQL order/order item/cart/stock/payment trước-sau | Khoa | 06/11 |

## 7. Yêu cầu kỹ thuật cho automation

### 7.1. Bổ sung SQL evidence helper

Helper mới hoặc mở rộng helper hiện có phải cung cấp snapshot chỉ đọc cho:

- số order và order mới theo customer/email;
- `OrderStatus`, `PaymentStatus`, payment system name và tổng tiền;
- billing/shipping address của order;
- shopping-cart item theo customer, store, product và attributes;
- stock product/variant;
- selected shipping/payment checkout attributes;
- payment transaction/history nếu fixture có dữ liệu này.

Mỗi test đính kèm snapshot trước và sau vào Playwright report. Không log password,
connection string đầy đủ, cookie hoặc token.

### 7.2. Nâng assertion Pairwise

- `assertCheckoutCompleted` không được chỉ kiểm tra trang Completed và cart rỗng.
- Với guest cases, assert order tồn tại đúng một lần, đúng guest/customer/email,
  đúng payment status và order status.
- Với address negative, assert order/cart/address state, không chỉ URL và warning.
- Mapping Pairwise chỉ dùng để truy vết case; mapping không thay thế assertion.

### 7.3. Fake payment processor

Fake processor phải:

- chạy hoàn toàn local và không có network call ra gateway;
- có chế độ decline xác định;
- trả `ProcessPaymentResult.Success = false` cùng lỗi quan sát được;
- có system name/version và hướng dẫn cài/kích hoạt;
- không tạo order Paid/Complete và không làm mất cart khi retry.

Nếu không hoàn thành trước 06/11/2026, owner phải ghi blocker kỹ thuật cụ thể và
đề xuất `Accepted risk` để người có thẩm quyền quyết định; không tự chuyển trạng
thái sang Accepted risk.

### 7.4. Concurrency harness

Harness cho `CHK-RACE-01` phải:

- chuẩn bị hai request hợp lệ từ cùng checkout state;
- đồng bộ bằng barrier và phát gần như đồng thời;
- lưu timestamp/request ID/response của cả hai request;
- đối chiếu tối đa một order, một lần trừ stock và một lần xử lý payment;
- ghi nhận rõ nếu sản phẩm thực tế tạo duplicate order để mở defect.

## 8. Giai đoạn 3 — Chạy và phân loại kết quả

### 8.1. Thứ tự chạy

1. Preflight môi trường và fixture.
2. Chạy từng case riêng để thu evidence dễ truy vết.
3. Reset fixture giữa các case.
4. Chạy lại suite liên quan để phát hiện ảnh hưởng chéo.
5. Lưu report, ảnh, SQL và manifest trước khi reset dữ liệu lần cuối.

### 8.2. Quy tắc kết luận

| Trạng thái | Điều kiện sử dụng |
| --- | --- |
| Pass | Tất cả expected và invariant bắt buộc có execution evidence |
| Fail | Có sai lệch sản phẩm tái hiện được; mở defect và liên kết run |
| Partial | Đã chạy nhưng evidence/assertion chưa bao phủ toàn bộ expected |
| Not Run | Chưa thực hiện full case trong vòng này |
| Blocked | Có precondition cụ thể không thể đáp ứng, kèm cách gỡ và owner |
| Accepted risk | Có quyết định của người có thẩm quyền, owner và lý do |

## 9. Giai đoạn 4 — Cập nhật risk register và tổng trạng thái

Cập nhật đủ 11 dòng trong
[`test-design/SCRUM-80-risk-register.md`](test-design/SCRUM-80-risk-register.md):

- trạng thái cuối cùng;
- run ID, commit, ngày chạy, fixture và checkout mode;
- link scenario, test, report, ảnh/SQL;
- owner xử lý tiếp;
- defect hoặc accepted-risk decision nếu có.

Báo cáo tổng phải dùng mẫu số 26 và tách riêng:

```text
Risk register: 26 scenario
- Pass:
- Pass có điều kiện:
- Fail:
- Partial:
- Not Run:
- Blocked:
- Accepted risk:

Pairwise model coverage: 253/253 feasible pairs
Pairwise execution: <passed>/<total>, <failed>, <skipped>
```

Không cộng 14 Pairwise row hoặc `HARNESS-001` vào mẫu số 26.

## 10. Giai đoạn 5 — Bàn giao SCRUM-81

### 10.1. Bảng thay đổi bắt buộc

| ID | Trạng thái trước | Trạng thái sau | Run/evidence mới | Gap hoặc defect còn mở | Owner/ngày tiếp theo |
| --- | --- | --- | --- | --- | --- |
| Điền đủ 11 ID |  |  |  |  |  |

### 10.2. Mẫu comment bàn giao

```text
Đã hoàn thành rà soát evidence/trạng thái 11 rủi ro Checkout và luồng bổ sung
phục vụ SCRUM-81 tại commit <SHA>.

- Risk register: <link>
- Bảng thay đổi 11 dòng: <link>
- Run manifests/report: <link>
- Risk coverage theo mẫu số 26: <summary>
- Pairwise coverage giữ riêng: 253/253; execution: <summary>
- High còn mở: <ID, trạng thái, owner, ngày/accepted-risk decision>

Đề nghị Khoa đối chiếu từng link, ghi nhận finding còn mở và chỉ ký SCRUM-81
khi các điều kiện đóng đã được đáp ứng hoặc accepted risk đã được phê duyệt.
```

## 11. Definition of Done

Nhiệm vụ chỉ hoàn thành khi đồng thời đáp ứng:

- [ ] Đủ 11/11 ID với I/L, score, mức, lý do, ưu tiên và owner.
- [ ] Mỗi Pass/Fail có run ID, commit, ngày, fixture, checkout mode và evidence.
- [ ] `CHK-01` giữ finding currency cho tới khi đóng hoặc chấp nhận rủi ro.
- [ ] `SHP-01` chỉ Pass sau khi chứng minh lựa chọn được giữ.
- [ ] `SHP-02`, `CART-MERGE-01`, `CHK-RACE-01` dùng đúng `Not Run`/`Blocked`.
- [ ] `PAY-FAIL-01` có fake processor evidence hoặc accepted-risk decision.
- [ ] `INV-01` dẫn đúng lượt bổ sung/rerun, không gán cho review cũ.
- [ ] Các High chưa đủ evidence có owner và ngày xử lý hoặc accepted risk.
- [ ] Tổng trạng thái dùng mẫu số 26; `253/253` được báo riêng.
- [ ] Mọi link nội bộ tồn tại và link Jira/report truy cập được với reviewer.
- [ ] Có bảng thay đổi và comment bàn giao trên SCRUM-81.
- [ ] Risk register đã cập nhật và được Khoa review trước khi ký.

