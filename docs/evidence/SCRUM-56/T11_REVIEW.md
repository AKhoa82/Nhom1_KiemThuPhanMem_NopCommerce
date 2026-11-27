# T11 — Review model, test data và automation

Baseline: `origin/develop` tại `6f702568b0` (PR #21 đã merge). Người thực hiện
toàn bộ SCRUM-57/58/59: Trang. Báo cáo này tách **độ phủ model** khỏi **kết quả
chạy ứng dụng**; `PASS` của validator không thay cho Playwright Pass.

## SCRUM-57 — Quality gate tổng thể

| Gate | Kiểm tra | Kết quả |
| --- | --- | --- |
| Model chính | `validate.ps1`, `validate-generated-rows.ps1`, `validate-invalid-combinations.ps1`, `calculate-pairwise-coverage.ps1` | 14/14 row hợp lệ, 0 tổ hợp cấm, 253/253 feasible pair; PASS |
| Model Cart độc lập | `node qa/pairwise/n02-cart/generate.mjs` | 8 row, 30/30 feasible pair; PASS; không cộng với 253 pair chính |
| Mapping | `generated-cases.csv` → `scenario-mapping.csv` → `cart-case-catalog.json` → `pairwise.spec.ts` | 14 ID duy nhất, đúng thứ tự; các case có precondition, input, expected, invariant và nhánh code |
| Catalog ADV | 8 N02 PICT row → 8 UI case, thêm MERGE-MIXED/MULTISTORE/ACTIVATION | 11 ID riêng, tách khỏi 14 PW gốc |
| Kiểu dữ liệu và unit/offline | `npx tsc --noEmit`, `npm run test:offline` | TypeScript PASS; 8/8 offline PASS |
| CI baseline trước thay đổi T11 | [run N04 sau merge](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce/actions/runs/45956562634) | model, build và E2E xanh; bằng chứng baseline, cần retest phần T11 đã sửa |

## SCRUM-58/59 — Ma trận truy vết 14 PW

Nguồn: `qa/pairwise/test-data/generated-cases.csv`, `scenario-mapping.csv`,
`qa/automation/test-data/cart-case-catalog.json` và
`qa/automation/tests/pairwise.spec.ts`. Mỗi row có precondition QA fixture, loại
khách hàng, input cụ thể, expected `lines/subtotal/discount/total/outcome`,
invariant và annotation trong report. Các nhánh code đều có ID trùng row.

| ID | Factor cần quan sát / input chính | Expected, assertion chính | Review |
| --- | --- | --- | --- |
| PW-001 | Registered, Simple, Update 1→2, coupon sai, thiếu billing | AddressBlocked; cart 2, coupon bị từ chối, không tạo order | PASS |
| PW-002 | Guest, Configurable Red/S 1 + Simple 1, coupon sai, checkout | OrderCreated; 2 line, coupon sai độc lập, order SQL | PASS |
| PW-003 | Guest, Red/S 2, coupon đúng, Remove line cuối | CartEmpty; cart rỗng sau remove | PASS |
| PW-004 | Registered, Red/S 1 + Simple 1, Update Simple 11/stock10 | StockBlocked; cart và tồn kho SQL không đổi | PASS |
| PW-005 | Registered, Simple 1, Remove line cuối | CartEmpty; cart rỗng | PASS |
| PW-006 | Registered, Simple 10/stock10, coupon đúng, checkout | OrderCreated; boundary và order SQL | PASS |
| PW-007 | Guest, Red/S 2 + Simple 1, checkout | OrderCreated; 2 line và order SQL | PASS |
| PW-008 | Guest, Blue/M 3, coupon sai, Remove line cuối | CartEmpty; coupon sai độc lập, cart rỗng | PASS |
| PW-009 | Guest, Blue/M 1 + Simple 1, Update Blue/M 3/stock3, checkout | OrderCreated; boundary và order SQL | PASS |
| PW-010 | Guest, Simple 1 + coupon đúng; thử Add Configurable Red/S 6/stock5 | StockBlocked; warning, Simple 1/coupon còn nguyên; cart và stock SQL không đổi | **FIX F-01; Chromium PASS** |
| PW-011 | Guest, Simple 1 + Red/S 1, coupon đúng, thiếu billing | AddressBlocked; cart 2 line, không tạo order | PASS |
| PW-012 | Registered, Blue/M 3/stock3, thiếu billing | AddressBlocked; boundary, không tạo order | PASS |
| PW-013 | Registered, Red/S 1, coupon sai, Update 6/stock5 | StockBlocked; cart và stock SQL không đổi | PASS |
| PW-014 | Registered, Red/S 1 + Simple 1, coupon đúng, Update Simple 11/stock10 | StockBlocked; cart và stock SQL không đổi | PASS |

`CartComposition` được đo sau Add (hoặc sau Add bị từ chối), trước Remove, và
không đổi qua Update. `ProductType` là line đang thao tác. Định nghĩa cũ “trước
mọi CartAction” đã gây hiểu sai PW-002/006/007/012; xem F-04.

## Các suite ngoài model PW chính

| Bộ | ID và phạm vi | Precondition / input / expected được đối chiếu |
| --- | --- | --- |
| N02 PICT | N02-PW-001…008 → MERGE-VALID, REPEAT-BELOW, MERGE-EXACT, REPEAT-OVER, REPEAT-SAME, MERGE-OVER, MERGE-VARIANT, REPEAT-DIFFERENT | `generated-cases.csv` và catalog ADV: SKU/variant/stock, quantity A/B, merge hoặc repeat, cart expected và SQL invariant; 30/30 pair riêng |
| ADV ngoài model | MERGE-MIXED, MERGE-MULTISTORE, MERGE-ACTIVATION | Catalog ADV có precondition/input/expected; test N02 kiểm UI, cart, SQL và recovery; MULTISTORE cần store thứ hai |
| Cart risk | CART-01…14, CART-REPEAT-01 | `cart-risk.spec.ts`: reset PW fixture và login QA trước mỗi ca; tên case/steps xác định input; UI/SQL kiểm line, quantity, stock, coupon, tiền và empty cart |
| Checkout risk | SHP-01, SHP-02-DS01…03, PAY-FAIL-01, INV-01, CART-MERGE-01, CART-MERGE-01-OVERSTOCK, CHK-RACE-01 | `checkout-risk.spec.ts`: QA account, fixture reset và checkout; từng case có input shipping/payment/stock/merge/race và assertion URL, order/cart SQL. PAY-FAIL cần plugin QA decline, nếu thiếu phải Blocked |
| Race chuyên biệt | CHK-RACE-01 trong `n03-race.spec.ts` | Hai tab cùng session, cart 4/stock5; 2 Confirm gần đồng thời; tối đa 1 order, không lộ SQL exception. Khác ca API POST trong `checkout-risk.spec.ts` |
| Offline/harness | ORACLE-001…008, HARNESS-001 | Không cần DB cho ORACLE; input HTML/CSV/diagnostic giả lập và expected trong từng test. HARNESS cần store sẵn sàng, GET `/cart` trả 200 |

Hai tên `CHK-RACE-01` cùng đo invariant tối đa một order nhưng khác cách phát
request (hai tab UI so với hai API POST). `CART-REPEAT-01` Cart risk là ca kết
hợp gộp/tách trên fixture PW; N02 REPEAT-SAME/DIFFERENT là hai ca riêng với
reset và SQL evidence riêng. Giữ cả hai nhóm, không cộng chúng vào 14 PW.

### Checklist Cart risk

Precondition chung: store QA với Simple 100/stock10, Shirt Red/S stock5 và
Blue/M stock3, coupon 10%, giỏ reset, tài khoản QA đăng nhập. Bước vào và
assertion ở `cart-risk.spec.ts`; các ca dưới đây có ID, input và expected riêng.

| ID | Input | Expected quan sát |
| --- | --- | --- |
| CART-01 | Thêm Simple 2 | Một line 2, subtotal/total 200, SQL cart 2 |
| CART-02 | Thêm Red/S 2 | Đúng variant, subtotal 400, SQL cart 2 |
| CART-03 | Thêm Simple 1 | Một line 1, subtotal 100 |
| CART-04 | Thêm Simple 1 và Blue/M 1 | Hai line, subtotal 300 |
| CART-05 | Simple 2 → 4 | Một line 4, subtotal 400 |
| CART-06 | Xóa Simple khỏi cart Simple 1 + Blue/M 1 | Còn Blue/M 1, subtotal 200 |
| CART-07 | Red/S 4 → 6 khi stock5 | Bị từ chối, cart 4 và stock5 |
| CART-08 | Xóa Simple cuối | UI/SQL cart rỗng |
| CART-09 | Mở cart rỗng | UI/SQL cart rỗng |
| CART-10 | Thêm SKU hết hàng | Bị từ chối, cart không có SKU đó |
| CART-11 | Simple 2 + coupon đúng | Subtotal 200, total 180, coupon lưu |
| CART-12 | Simple 2 + coupon sai | Subtotal/total vẫn 200, báo lỗi |
| CART-13 | Simple 1 + Red/S 2 + coupon đúng + refresh | Subtotal 500, discount 50, total 450 bền sau refresh |
| CART-14 | Simple đúng stock10 | Quantity 10, subtotal 1000 |
| CART-REPEAT-01 | Red/S thêm 2 rồi 3, sau đó Blue/M 1 | Red/S gộp thành 5, Blue/M tách line, SQL hai line |

### Checklist Checkout risk

Precondition chung: store QA, fixture PW reset, tài khoản QA đăng nhập, Simple
1 và checkout nhiều bước; ca merge/race tự chuẩn bị cart riêng. Assertion nằm ở
`checkout-risk.spec.ts`; các ca phụ thuộc plugin/stock có preflight riêng.

| ID | Input | Expected quan sát |
| --- | --- | --- |
| SHP-01 | Chọn Ground, sang bước sau rồi quay lại shipping | Ground vẫn được chọn, không order mới, cart còn |
| SHP-02-DS01 | POST shipping value rỗng | Vẫn ở shipping, không order mới |
| SHP-02-DS02 | POST `invalid-value` | Vẫn ở shipping, không order mới |
| SHP-02-DS03 | POST method không tồn tại | Vẫn ở shipping, không order mới |
| PAY-FAIL-01 | Chọn QA decline, Confirm hai lần | Cả hai lần decline, không order mới, cart còn; Blocked nếu plugin thiếu |
| INV-01 | Giảm tồn kho trước Confirm | Checkout bị chặn, không order mới |
| CART-MERGE-01 | Account Simple/BlueM, guest Simple/RedS rồi login | Ba line đúng quantity, SQL cart 3 |
| CART-MERGE-01-OVERSTOCK | Account Simple4 + guest Simple2 khi stock5 rồi login | Tổng item trước/sau bằng nhau, không mất guest cart |
| CHK-RACE-01 | Hai API Confirm POST đồng thời | Tối đa một order, không lộ lỗi SQL |

`n03-race.spec.ts` kiểm cùng invariant bằng **hai tab trình duyệt**, có mốc thời
gian gửi, phản hồi, ảnh, HTML, SQL trước/sau. ORACLE-001…008 có input giả lập
và expected ngay trong `cart-oracle.spec.ts`, HARNESS-001 GET `/cart` phải 200.

## Fixture, thứ tự, log và phân loại

- PW/Cart risk chạy tuần tự (`workers: 1`), reset trước từng ca, kiểm SKU, giá,
  tồn kho, coupon, shipping/payment và chờ store sau restart. N02 dùng reset
  riêng cho guest GUID + QA account; không chạy hai suite dùng cùng tồn kho
  đồng thời. Order-check có isolated, reverse và seeded shuffle; kết quả live
  được ghi riêng bên dưới.
- `attachFailureLog` giữ case ID, expected/actual, failed step, URL bỏ query,
  SQL snapshot và totals HTML; Playwright giữ screenshot/trace khi fail. Lỗi
  thu thập evidence được bắt riêng để không che lỗi gốc. Không ghi password vào
  report; screenshot/trace có session chỉ lưu trong artifact runtime.
- `FixtureBlockedError` và `FIXTURE_BLOCKED` là Blocked, không tính Pass;
  `FAILED_PRODUCT`, `FAILED_AUTOMATION`, `FAILED_ENVIRONMENT` được phân loại
  riêng. CI gate từ chối missing/failed/skipped/blocked.

## Finding và xử lý

| ID | Mức độ | Phát hiện | Xử lý / retest |
| --- | --- | --- | --- |
| F-01 | Major | PW-010 model yêu cầu Configurable, giỏ một line và coupon Valid; code cũ dùng giỏ rỗng với sản phẩm Simple hết hàng, nên không kiểm tổ hợp được khai báo | Sửa branch PW-010, catalog, preflight; Chromium 14/14 PASS, riêng PW-010 lặp 2/2 PASS |
| F-02 | Major | `cart-risk.spec.ts` so tiền bằng regex chứa chuỗi; expected 200 có thể khớp actual 1200 | Dùng `readCartTotals` và so số chính xác; ORACLE-008 kiểm regression, Cart risk live 15/15 PASS |
| F-03 | Minor | README N02 ghi 6 UI case và 2 NotCoded/NotRun, trái CSV và coverage report 8/8 | Sửa hai README; `generate.mjs` xác nhận 8 row, 30/30 pair |
| F-04 | Minor | Định nghĩa CartComposition “trước mọi CartAction” không khớp các Add case | Đính chính trong `docs/pict-pairwise.md` và report model; giữ nguyên model/output đã sinh |
| F-05 | Major | Checkout shipping risk lấy SQL `before` từ trước khi reset fixture: customer ID 5 có một order, trong khi sau reset customer ID 6 chưa có order; bốn ca báo sai dù hành vi UI đúng | Chụp `before` sau khi chuẩn bị cart/checkout; SHP-01 và SHP-02-DS01…03 chạy lại 4/4 PASS |
| F-06 | Minor | CART-MERGE-01-OVERSTOCK chờ `ico-account` sau login; ứng dụng chủ ý từ chối merge quá stock, giữ guest cart và báo đăng nhập chưa hoàn tất | Assert thông báo từ chối, guest cart quantity 2 và tổng SQL quantity 6 không mất; retest PASS |
| F-07 | Major | Checkout risk dùng chung tài khoản N02, để lại Simple trong cart; reset N02 chỉ xóa Shirt nên MERGE-OVER/MIXED báo sai số line khi chạy sau Checkout | Chuyển Checkout risk sang tài khoản PW riêng; N02 preflight báo `FIXTURE_BLOCKED` nếu cùng store còn cart/wishlist ngoài N02. Retest full order-check 150/150 PASS, Checkout risk 9/9 PASS |

## Retest sau thay đổi T11

| Kiểm tra | Kết quả |
| --- | --- |
| Validator chính, N02 và TypeScript | PASS như bảng đầu báo cáo |
| Offline Playwright | 8/8 PASS, gồm ORACLE-008 |
| PW-010 trên store QA dùng một lần | PASS trên Chromium 1/1 và `--repeat-each=2` PASS 2/2; cart/stock SQL không đổi sau lần Add bị từ chối |
| Toàn bộ 14 PW | Chromium 14/14 PASS; `verify-results.cjs PW reports`: 14/14, 0 skipped, 0 errors |
| Cart risk | Chromium 15/15 PASS, gồm CART-13 đối chiếu tiền và CART-REPEAT-01 |
| N02/ADV | Chromium 11/11 PASS; `verify-results.cjs ADV reports`: 11/11, 0 skipped, 0 errors |
| Checkout risk | Lần đầu 3 PASS, 5 FAIL do F-05/F-06, 1 Blocked; sau sửa F-05/F-06 đạt 8 PASS/1 Blocked. Sau khi tách tài khoản và bật plugin QA, toàn suite **9/9 PASS, 0 skipped, 0 errors** |
| PAY-FAIL-01 | Đã bật plugin `Payments.QaDecline` trên fixture QA dùng một lần; ca riêng 1/1 PASS và full suite 1/1 PASS. Hai lần decline, cart còn và không tạo order |
| N03 hai tab | Đã tạo tài khoản QA riêng, reset cart Red/S 4/stock5; `n03-race.spec.ts` Chromium 1/1 PASS với hai POST Confirm gần đồng thời, tối đa một order và không lộ SQL error |
| Order independence | `scripts/run-order-check.ps1` receipt `RUN-20261127144241592` **PASSED**: 76 lượt gọi, tổng 150/150 kết quả PASS, 0 sai khác; gồm mặc định 25, cô lập 25, đảo 50, seed `10387` 50. PW-010 riêng lặp 2/2 PASS |

## Gói nghiệm thu theo Jira

| Subtask | Bằng chứng chính | Kết luận review |
| --- | --- | --- |
| SCRUM-57 — quality gate | Bảng gate, ma trận 14 PW, validator, TypeScript, offline, CI baseline và kết quả live ở trên | Hoàn thành tự review; F-01…F-07 đã xử lý và retest; order-check 150/150 PASS |
| SCRUM-58 — Cart/test data | Checklist CART-01…14, CART-REPEAT-01, N02 8 row + 3 ca ADV; F-02/F-03/F-06/F-07 và retest Cart 15/15, ADV 11/11 | Hoàn thành tự review Cart và dữ liệu; không cộng coverage N02 vào model chính |
| SCRUM-59 — Checkout/PICT | Ma trận 14 PW, 253/253 pair, SHP/PAY/INV/MERGE/RACE; F-01/F-04/F-05/F-07 và retest PW 14/14, Checkout 9/9, N03 hai tab PASS | Hoàn thành tự review và sửa automation Checkout/PICT; không còn ca Blocked trên fixture QA đã chuẩn bị |

## Kết luận tự review

Trang đã đối chiếu lại diff sau khi sửa, kiểm tra từng case ID, dữ liệu đầu vào,
expected UI/SQL, điều kiện reset và nhánh skip/blocked. `git diff --check`,
`npx tsc --noEmit` và offline 8/8 đều PASS. Không còn finding F-01…F-07 mở;
không có comment review của người khác cần xử lý. Plugin QA decline chỉ được bật
trong fixture dùng một lần; file `.env`, screenshot, trace và receipt chi tiết ở
`qa/automation/reports` không đưa vào Git. Bằng chứng đã kiểm tra trực tiếp và
không ghi nhận review thay Khoa/Linh.

Assignee và tiêu đề SCRUM-57/59 đã cập nhật sang Trang theo phân công mới;
SCRUM-58 vốn do Trang phụ trách. Parent SCRUM-56 đã đổi tiêu chí thành Trang
review toàn bộ ba phần theo phân công mới. Không ghi nhận review của Khoa/Linh
vì không có bằng chứng của họ. Báo cáo và mã sửa được đưa vào nhánh T11 để
nhóm kiểm tra qua pull request.
