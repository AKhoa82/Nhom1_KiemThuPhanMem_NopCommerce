# N06 — Hồi quy tích hợp Shopping Cart, Checkout và các luồng bổ sung

Issue: [SCRUM-108](https://anhkhoa080205.atlassian.net/browse/SCRUM-108). Thực thi ngày 27–28/11/2026 (Asia/Saigon). Người thực hiện và tự review số liệu: Lê Anh Khoa. Đây là lượt N06 độc lập trên baseline hiện có; nếu T11 thay đổi mã test hoặc dữ liệu sau lượt này thì phải chạy hồi quy lại trên commit mới.

## 1. Baseline và tiêu chí đánh giá

| Hạng mục | Giá trị đã xác minh |
| --- | --- |
| Nhánh kiểm thử | `test/SCRUM-108-n06-integrated-regression` |
| Commit gốc của mã test | `6f702568b0885528e81ecced13422f4cf831d398` (`origin/develop` lúc bắt đầu N06) |
| Ảnh container ứng dụng | `sha256:579145823784a5cd80aba6bcac50dc2184c53257646c0a514ed7cac04b5d1b8c` |
| Ảnh container SQL Server | `sha256:ef0b8db33970ecd01bed49c3a84a1d083c435a9891718df619298b67b352e74a` |
| Môi trường | nopCommerce local qua Docker; SQL Server 2019; Chromium; checkout nhiều bước; một worker, không retry |
| Fixture | `S2-ADV-CART-AUTO-v1`, N02 `SCRUM-87-N02-v1`; tài khoản QA `qa.n02.*@example.test` và `qa.n03.*@example.test` chỉ dùng trên máy test |
| Điều kiện Pass | Assertion giao diện và SQL khớp oracle của ca; với checkout thành công kiểm số đơn, dòng đơn và tồn kho; với luồng bị chặn kiểm không tạo đơn ngoài ý muốn |

`run-manifest.json` của các lượt tự động ghi `workingTreeDirty=true` vì trong lúc N06 cần sửa helper fixture và oracle cũ. Vì vậy commit gốc chỉ xác định baseline bắt đầu của mã test. Không suy diễn rằng ảnh container ứng dụng được build từ đúng commit Git này; mã định danh ảnh container được ghi riêng. Kết quả chỉ áp dụng cho môi trường và cấu hình trên.

## 2. Kết quả theo bộ chạy

| Bộ chạy / run ID | Kết quả cuối | Chứng cứ |
| --- | --- | --- |
| Model Pairwise gốc | 6.912 tổ hợp thô → 420 khả thi; 14 dòng PW hợp lệ; **253/253 cặp khả thi** | `qa/pairwise/validate.ps1`, `qa/pairwise/test-data/generated-cases.csv` |
| PW-001–PW-014 / `AUTO-20261127161500794` | **14 Pass, 0 Fail, 0 Blocked** | `qa/automation/reports/n06-20261127-pw/results.json`, JUnit và run manifest cùng thư mục |
| Model Pairwise N02 / PICT 3.7.4 | **8 dòng, 30/30 cặp khả thi**; độc lập với 253/253 của model gốc | `qa/pairwise/n02-cart/generated-cases.csv`, `coverage-report.md` |
| N02 Cart merge/repeat / `AUTO-20261127163615822` | **11 Pass, 0 Fail, 0 Blocked**: 8 dòng PICT và 3 ca nâng cao | `qa/automation/reports/n06-20261127-n02-final/results.json`, JUnit, ảnh và SQL đính kèm từng test |
| Cart risk / `AUTO-20261127170146642` | **15 Pass, 0 Fail, 0 Blocked**: CART-01–14 và CART-REPEAT-01 | `qa/automation/reports/n06-20261128-cart-risk/results.json`, JUnit |
| Checkout risk / `AUTO-20261127170930288` | **7 Pass, 1 Fail, 1 Blocked** ở lượt đầu. Fail là oracle cũ của `CART-MERGE-01-OVERSTOCK`; `PAY-FAIL-01` Blocked vì plugin QA decline không kích hoạt. | `qa/automation/reports/n06-20261128-checkout-risk/results.json`, ảnh lỗi và trace trong artifacts local |
| Retest oracle gộp giỏ vượt kho | **1 Pass** sau khi cập nhật test; guest giữ 2 món, có cảnh báo, tổng hai giỏ giữ nguyên 6. | `qa/automation/reports/n06-20261128-merge-legacy-retest/results.json`, ảnh và SQL đính kèm |
| CHK-RACE-01 / 10 lượt hai tab | **10/10 lượt hợp lệ**; 0/10 lộ SQL; 0/10 tạo hai đơn. Mỗi lượt một đơn, tồn kho 5→1, giỏ 1→0. | [Bảng 10 lượt](N06-RACE-10-RUNS.md), `qa/automation/n03-local-evidence/N06-20261127/` trên máy chạy |

Lượt N02 đầu tiên bị Skip vì helper fixture giả định tên database không có ký tự U+200B ở đầu; lượt kế tiếp có ba Fail do thiếu bản dịch cảnh báo tồn kho tiếng Việt và helper dùng tên DB cố định. Đây là sai lệch fixture/tooling, được sửa trước lượt N02 cuối 11/11 Pass. Tên DB được kiểm tra nghiêm ngặt và chỉ cho phép `nopcommerce` với hoặc không có U+200B đầu chuỗi. Bản dịch tồn kho được thêm riêng vào SQL local; không thay mã nguồn sản phẩm để làm test Pass. Cửa hàng QA thứ hai tạo cho ca multistore đã được xóa sau lượt chạy.

## 3. Ma trận truy vết scenario → case → test → run → defect

Input chi tiết của từng PW nằm trong [CSV model gốc](../../../qa/pairwise/test-data/generated-cases.csv) và precondition/expected đầy đủ nằm trong [scenario mapping](../../../qa/pairwise/test-data/scenario-mapping.csv), [test PW](../../../qa/automation/tests/pairwise.spec.ts). Mỗi dòng dưới đây có `actual = expected`, trạng thái Pass theo run `AUTO-20261127161500794` và bằng chứng riêng trong JSON/JUnit của run đó.

| Case | Scenario | Precondition / input và oracle chính | Actual |
| --- | --- | --- | --- |
| PW-001 | CART-05, CART-12, ADDR-02 | Registered, update trong kho, coupon sai, địa chỉ thiếu; chặn trước Shipping | Pass: cập nhật đúng, mã sai bị từ chối, địa chỉ chặn |
| PW-002 | CART-02,04,12, CHK-02, ADDR-01, SHP-01, PAY-LOCAL-01 | Guest, biến thể, nhiều dòng; checkout local hợp lệ | Pass: giỏ và đơn đúng, mã sai không làm hỏng checkout |
| PW-003 | CART-08,11 | Guest, coupon hợp lệ, xóa dòng cuối | Pass: giỏ rỗng, không checkout |
| PW-004 | CART-07 | Registered, update quá tồn kho ở trạng thái hết hàng | Pass: từ chối và giữ số lượng hợp lệ |
| PW-005 | CART-08 | Registered, xóa dòng cuối | Pass: giỏ rỗng |
| PW-006 | CART-14,11, CHK-01, ADDR-01, SHP-01, PAY-LOCAL-01 | Registered, số lượng bằng tồn kho, coupon hợp lệ; tạo đơn local | Pass: đúng biên, đơn và dữ liệu sau đặt hàng khớp |
| PW-007 | CART-02,04, CHK-02, ADDR-01, SHP-01, PAY-LOCAL-01 | Guest, biến thể, nhiều dòng; checkout local | Pass: đơn và nội dung đúng |
| PW-008 | CART-08,12 | Guest, mã sai, xóa dòng cuối | Pass: mã sai không áp dụng, giỏ rỗng |
| PW-009 | CART-14, CHK-02, ADDR-01, SHP-01, PAY-LOCAL-01 | Guest, update biến thể đúng tồn kho rồi checkout | Pass: đúng biên và tạo đơn đúng |
| PW-010 | CART-10 | Guest, biến thể hết hàng, thử thêm | Pass: không thêm và không checkout |
| PW-011 | CART-05,11, ADDR-02 | Guest, nhiều dòng, update và coupon; địa chỉ thiếu | Pass: xử lý Cart đúng, chặn ở Address |
| PW-012 | CART-14, ADDR-02 | Registered, biến thể đúng tồn kho; địa chỉ thiếu | Pass: thêm đúng biên, chặn ở Address |
| PW-013 | CART-07,12 | Registered, update quá tồn kho, coupon sai | Pass: từ chối vượt kho và mã sai |
| PW-014 | CART-07,11 | Registered, nhiều dòng, update quá tồn kho | Pass: giữ dữ liệu giỏ hợp lệ |

Input và tồn kho cụ thể của tám dòng N02 nằm trong [CSV N02](../../../qa/pairwise/n02-cart/generated-cases.csv); oracle/assertion và SQL trước–sau ở [test N02](../../../qa/automation/tests/n02-cart.spec.ts). Run của cả 11 ca là `AUTO-20261127163615822`, trạng thái cuối Pass. `SCRUM-96` là defect gộp giỏ được retest; không gán cho ca repeat.

| Case / test | Scenario | Input và expected chính | Actual |
| --- | --- | --- | --- |
| N02-PW-001 / MERGE-VALID | CART-MERGE-01 | Account 2 + guest 2, stock 5; gộp cùng biến thể thành 4 | Pass: gộp 4 |
| N02-PW-002 / REPEAT-BELOW | CART-REPEAT-01 | Thêm 1 rồi 2 trong cùng phiên, dưới kho 5 | Pass: một dòng số lượng 3 |
| N02-PW-003 / MERGE-EXACT | CART-MERGE-01 | Account 2 + guest 3, stock 5 | Pass: gộp đúng biên 5 |
| N02-PW-004 / REPEAT-OVER | CART-REPEAT-01 | Thêm 4 rồi 2, stock 5 | Pass: lần thêm vượt kho bị từ chối, giữ 4 |
| N02-PW-005 / REPEAT-SAME | CART-REPEAT-01 | Thêm 2 rồi 3 cùng biến thể, stock 5 | Pass: một dòng 5, tổng tiền đúng |
| N02-PW-006 / MERGE-OVER | CART-MERGE-01 / SCRUM-96 | Account 4 + guest 2, stock 5; từ chối gộp nhưng giữ guest 2 và báo lý do | Pass: guest 2 được giữ, cảnh báo xuất hiện |
| N02-PW-007 / MERGE-VARIANT | CART-MERGE-01 | Account Red/S, guest Blue/M | Pass: hai biến thể tách riêng |
| N02-PW-008 / REPEAT-DIFFERENT | CART-REPEAT-01 | Thêm Red/S rồi Blue/M | Pass: hai dòng riêng, số lượng và tổng đúng |
| ADV / MERGE-MIXED | CART-MERGE-01 / SCRUM-96 | Một dòng gộp được, một dòng vượt kho | Pass: dòng bị từ chối vẫn có thể khôi phục |
| ADV / MERGE-MULTISTORE | CART-MERGE-01 / SCRUM-96 | Giỏ thuộc hai store; một thao tác bị từ chối | Pass: mỗi store giữ đúng dữ liệu, có thể retry |
| ADV / MERGE-ACTIVATION | CART-MERGE-01 / SCRUM-96 | Guest kích hoạt account và gộp vượt kho | Pass: giữ giỏ guest và đường khôi phục |

Với `CHK-RACE-01` / `SCRUM-100`, test [n03-race.spec.ts](../../../qa/automation/tests/n03-race.spec.ts) tạo hai tab tại Confirm và gửi gần đồng thời 10 lần; mỗi lượt có reset fixture, thời điểm POST, response của hai tab, ảnh, SQL trước–sau và phân loại riêng. Cả 10 `n03-attempt.json` đều ghi `loserHasSafeMessage=true`, `leakedSql=false`, `orderDelta=1`; ảnh của run01 được kiểm tra trực quan. [Bảng tần suất](N06-RACE-10-RUNS.md) cho thấy 10/10 **không tái hiện** lỗi lộ SQL trên cấu hình này. Điều này là bằng chứng hồi quy tích cực, chưa chứng minh lỗi đã hết trong mọi lịch trình đồng thời.

## 4. Rủi ro cao và các trường hợp còn mở

Risk register [SCRUM-80](../../test-design/SCRUM-80-risk-register.md) có 17 scenario mức High. Trong lượt N06: **16/17 có thực thi**, trong đó 15 đạt oracle, `CHK-01` đạt luồng tạo đơn nhưng còn finding hiển thị tiền tệ D-01; **1/17 Blocked** là `PAY-FAIL-01`. Đây là risk coverage theo scenario, không phải 253/253 hay 30/30 pair coverage.

| Nhóm rủi ro cao | Kết quả N06 và bằng chứng |
| --- | --- |
| CART-02,04,05,07,10,11,13,14, CART-REPEAT-01 | Pass trực tiếp trong Cart risk 15/15; đối chiếu thêm PW/N02 ở các tổ hợp liên quan |
| CHK-01, ADDR-02, PAY-LOCAL-01 | Các PW tương ứng Pass; CHK-01 vẫn theo dõi finding D-01 về hiển thị tiền tệ |
| SHP-02 | 3/3 bộ dữ liệu sai bị từ chối; không tạo đơn |
| INV-01 | Pass: giảm tồn kho trước Confirm, không tạo đơn vượt kho |
| CART-MERGE-01 / SCRUM-96 | N02 7 nhánh merge Pass; legacy overstock retest Pass sau sửa oracle |
| CHK-RACE-01 / SCRUM-100 | 10/10 lượt hai tab có một đơn, không lộ SQL; báo Not Reproduced cho từng lượt |
| PAY-FAIL-01 | **Blocked hiện tại**: `Payments.QaDecline` chưa kích hoạt trong store chạy N06 nên không có phương thức decline local. Test trước đó đã Pass ngày 18/11/2026 trong môi trường có plugin; không dùng bằng chứng cũ để đổi trạng thái lượt N06. Owner Khoa: kích hoạt plugin QA và chạy lại khi cần xác nhận trên đúng môi trường N06. |

Lượt Checkout risk ban đầu có một Fail ở `CART-MERGE-01-OVERSTOCK`: test cũ yêu cầu thấy link tài khoản sau đăng nhập. Ảnh lỗi cho thấy ứng dụng hiện thông báo “Sign-in is incomplete”, giữ khách ở giỏ vãng lai với 2 món; đây là hành vi sau sửa `SCRUM-96`. Test đã đổi oracle để kiểm cảnh báo, trạng thái chưa đăng nhập, giỏ guest vẫn 2 và tổng hai giỏ vẫn 6; retest 1/1 Pass. Fail ban đầu được phân loại **lỗi test/oracle**, không ghi thành defect mới của ứng dụng. Các ca Checkout còn lại của lượt đầu vẫn giữ nguyên kết quả và bằng chứng.

## 5. Ảnh, SQL và khả năng chạy lại

Ảnh chọn lọc trong thư mục này: [guest trước login](N06-merge-over-before.png), [guest sau khi gộp bị từ chối](N06-merge-over-after.png), [thêm lại cùng biến thể](N06-repeat-same-after.png), [tab còn lại nhận thông báo an toàn](N06-race-run01-tab-B.png). Các ảnh được trích từ attachment Playwright bằng `qa/automation/scripts/export-n06-evidence.cjs`; không đính kèm cookie hay trace thô vào Git. SQL trước–sau của N02 và Checkout nằm trong attachment từng test của JSON/HTML local; bảng race ở file riêng tổng hợp Order, OrderItem, Stock và Cart của cả 10 lượt.

Lệnh chạy lại (PowerShell tại `qa/automation`, sau khi store và SQL đã sẵn sàng, biến `QA_*` được cấu hình cục bộ theo README):

```powershell
pwsh ../pairwise/validate.ps1
node ../pairwise/n02-cart/generate.mjs
npm run test:pw
npm run test:n02-cart
npm run test:cart-risk
npx playwright test tests/checkout-risk.spec.ts
pwsh scripts/run-n03-series.ps1 -Runs 10 -AccountEmail $env:QA_REGISTERED_EMAIL -Label N06-RETEST -Database $env:QA_DB_NAME
node scripts/summarize-n03-runs.cjs n03-local-evidence/N06-RETEST
```

N02 cần tài khoản QA chuyên dụng theo regex `qa.n02.*@example.test`, còn N03 cần tài khoản `qa.n03.*@example.test` đã có địa chỉ. `prepare-n06-race-account.cjs` chuẩn bị tài khoản N03 khi đặt `QA_N06_RACE_EMAIL` và mật khẩu trong biến môi trường; không ghi mật khẩu vào báo cáo. Các bộ sử dụng chung fixture phải chạy tuần tự. Nếu đổi model, fixture, cấu hình checkout, ảnh container hoặc nhận thay đổi T11, phải sinh lại dữ liệu và chạy lại những bộ chịu ảnh hưởng.

## 6. Kết luận nghiệm thu N06

Baseline 14 PW, model N02 8 ca/30 cặp, 3 ca Cart nâng cao và 10 lượt race đều có kết quả và truy vết riêng. SQL xác nhận các invariant quan trọng: gộp giỏ không mất món, checkout chỉ tạo một đơn trong race, tồn kho không bị trừ hai lần và dữ liệu bị chặn không tạo đơn. `PAY-FAIL-01` còn Blocked trên môi trường hiện tại với lý do fixture cụ thể; finding D-01 của CHK-01 vẫn được theo dõi. Số liệu đã được Khoa đối chiếu với run manifest, JSON/JUnit, CSV model, ảnh và SQL trước khi bàn giao sang T12. Việc T11 chưa hoàn tất không được xem là bằng chứng review chéo; khi T11 thay đổi test/data, cần một lượt hồi quy mới.
