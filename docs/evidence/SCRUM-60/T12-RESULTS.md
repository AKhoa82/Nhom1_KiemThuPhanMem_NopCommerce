# T12 — Kết quả chạy test và metrics

Issue: [SCRUM-60](https://anhkhoa080205.atlassian.net/browse/SCRUM-60). Người chạy và đối chiếu: Lê Anh Khoa. Lượt thực thi: 27–28/11/2026 (giờ Việt Nam). Báo cáo này dùng đơn vị **lượt thực thi test**, không coi các ca lặp lại trên CI/local là ca thiết kế mới.

## 1. Mã nguồn và môi trường cố định

| Hạng mục | CI dữ liệu sạch | Local sau reset fixture |
| --- | --- | --- |
| Commit/nguồn | GitHub Actions PR #27, merge ref `c83c128e92b48e7274a546401ad7b04ab8dbebdf` | `develop` `450d486bd19049f406290138e905644fe782bebc` |
| Tree SHA | `d3b43c9485d8ded772b4eb02f8028efc393e1ea0` | `d3b43c9485d8ded772b4eb02f8028efc393e1ea0` |
| Cách dựng | GitHub runner dựng mới store, SQL Server, tài khoản, fixture và store thứ hai; bootstrap báo `CI_BOOTSTRAP|PASS` | Container local có sẵn; reset PW/N02 trước từng ca, xác nhận store sẵn sàng và dọn store QA thứ hai sau N02 |
| Checkout/fixture | MultiStep; `S2-ADV-CART-AUTO-v1` | MultiStep; `S2-ADV-CART-AUTO-v1`, N02 `SCRUM-87-N02-v1` |
| Công cụ | Node `v22.23.5`, Playwright `1.64.0`, Chromium; Docker/.NET theo workflow | Node `v22.18.0`, Playwright `1.64.0`, Chromium; image app `sha256:579145823784a5cd80aba6bcac50dc2184c53257646c0a514ed7cac04b5d1b8c`, SQL `sha256:ef0b8db33970ecd01bed49c3a84a1d083c435a9891718df619298b67b352e74a` |
| Cách chạy test | Một worker, retry 0, `npm ci` và Chromium trên máy runner độc lập | Một worker, retry 0, `npm ci`; tài khoản QA và SQL nằm trên máy cục bộ |

CI và local có **cùng nội dung mã Git** vì tree SHA bằng nhau. Ảnh container local được tạo trước commit `450d486`; không khẳng định nó được build từ chính commit đó. CI dựng ảnh mới từ merge ref nên là đối chứng trên máy độc lập. Đây là GitHub runner, **không phải laptop của Trang/Linh**; yêu cầu “máy thành viên khác” được đối chiếu theo mục tiêu chạy trên máy thứ hai, còn việc chạy trực tiếp trên laptop thành viên khác chưa có bằng chứng.

## 2. Dữ liệu sinh và coverage

| Model | Số tổ hợp trước/sau ràng buộc | Số dòng PICT | Cặp khả thi bao phủ | Kiểm chứng |
| --- | --- | ---: | ---: | --- |
| Pairwise gốc Shopping Cart/Checkout | 6.912 / 420 | **14** (`PW-001`–`PW-014`) | **253/253 = 100%** | `qa/pairwise/validate.ps1` Pass; CI job `pairwise-model` Pass |
| Pairwise N02 Cart merge/repeat | Model riêng, không cộng với 6.912/420 | **8** (`N02-PW-001`–`008`) | **30/30 = 100%** | PICT 3.7.4, `qa/pairwise/n02-cart/generate.mjs` Pass; CI model Pass |

N02 còn 3 ca nâng cao `MERGE-MIXED`, `MERGE-MULTISTORE`, `MERGE-ACTIVATION`, nên suite N02 có **11 lượt test**. Ba ca này không được tính thành dòng PICT mới. 253/253 và 30/30 là độ bao phủ thiết kế input; chúng không chứng minh mọi hành vi ứng dụng đều đúng. Kết quả Pass/Fail/Blocked nằm ở bảng thực thi bên dưới.

## 3. Kết quả thực thi và thời gian

Quy ước: `Tổng = Pass + Fail + Blocked/Skipped + Not Run`. `Pass%` và `Fail%` dùng **Tổng** của từng bộ làm mẫu số; `Skipped` của Checkout được phân loại thành Blocked nhờ annotation `FIXTURE_BLOCKED` trong JSON. Một scenario xuất hiện ở nhiều bộ không được cộng thành nhiều scenario duy nhất.

| Lượt / run ID | Tổng | Pass | Fail | Blocked | Not Run | Pass% / Fail% | Thời gian | Bằng chứng |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| CI sạch, PW / `AUTO-20261127174757185` | 14 | 14 | 0 | 0 | 0 | 100% / 0% | 346 giây | [JSON đã lọc](t12-pw-ci-clean.json), [chi tiết từng ca](T12-PW-CI-DETAIL.md) |
| CI sạch, N02/ADV / `AUTO-20261127175344192` | 11 | 11 | 0 | 0 | 0 | 100% / 0% | 328 giây | [JSON đã lọc](t12-adv-ci-clean.json), [chi tiết từng ca](T12-ADV-CI-DETAIL.md) |
| Local sau reset, PW / `AUTO-20261127175133654` | 14 | 14 | 0 | 0 | 0 | 100% / 0% | 479 giây | [JSON đã lọc](t12-pw-local-reset.json), [chi tiết từng ca](T12-PW-LOCAL-DETAIL.md) |
| Local sau reset, N02/ADV / `AUTO-20261127180056547` | 11 | 11 | 0 | 0 | 0 | 100% / 0% | 430 giây | [JSON đã lọc](t12-adv-local-reset.json), [chi tiết từng ca](T12-ADV-LOCAL-DETAIL.md) |
| Local, Cart risk / `AUTO-20261127180850890` | 15 | 15 | 0 | 0 | 0 | 100% / 0% | 427 giây | [JSON đã lọc](t12-cart-risk.json) |
| Local, Checkout risk / `AUTO-20261127181620957` | 9 | 8 | 0 | 1 | 0 | 88,89% / 0% | 330 giây | [JSON đã lọc](t12-checkout-risk.json); PAY-FAIL-01 có lý do Skip cụ thể |
| Local, CHK-RACE-01 hai tab / 10 lượt | 10 | 10 | 0 | 0 | 0 | 100% / 0% | 932 giây từ test đầu đến test cuối, gồm reset và chụp SQL | [bảng 10 lượt](T12-RACE-10-RUNS.md) |

CI [workflow run 46043889144](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce/actions/runs/46043889144) đã **Pass cả `pairwise-model`, `build` và `e2e`**. Bước xác nhận sau mỗi suite từ chối mọi ca thiếu, Fail hoặc Skip; cả hai bước xác nhận đều Pass. Bước CI chạy PW mất 347 giây theo timestamp job, ADV 329 giây; JSON run manifest đo lần lượt 346 và 328 giây. Toàn job E2E tính cả dựng môi trường, cài đặt và dọn dẹp kéo dài 17 phút 6 giây. [Artifact CI](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce/actions/runs/46043889144) lưu `bootstrap.log`, JUnit, JSON, HTML, manifest và ảnh/trace khi có lỗi; artifact ID `15222826207`, SHA-256 `09b43be1b2651e0389ca7e411a0112034ac8136609bb46e3804e64e01240e59b`, hết hạn dự kiến 04/12/2026. Các JSON đã lọc và bảng chi tiết trong thư mục này được giữ trong Git để metrics không mất khi artifact hết hạn.

Nếu chỉ đếm các lượt **local T12** trong bảng, có 59 lượt test: **58 Pass, 0 Fail, 1 Blocked, 0 Not Run**. Đây là tổng lượt chạy từ nhiều suite và 10 lần lặp race, không phải 59 test case thiết kế khác nhau. CI sạch có 25/25 lượt Pass ở hai suite PW và N02/ADV, được báo riêng để không cộng cùng ca trên hai máy.

## 4. Đối chiếu expected/actual, SQL và rủi ro

- Các bảng `T12-PW-*-DETAIL.md` và `T12-ADV-*-DETAIL.md` ghi precondition, input, expected, invariant, actual classification và tình trạng từng ca. Hai máy đều có 14/14 PW và 11/11 ADV Pass. Riêng `CART-MERGE-01` gồm các nhánh gộp hợp lệ/vượt kho/khác biến thể, multistore và activation; `CART-REPEAT-01` gồm thêm lại cùng/khác biến thể và dưới/bằng/vượt kho.
- Bộ Cart risk chạy đủ CART-01–14 và CART-REPEAT-01: 15/15 Pass. Bộ Checkout risk xác nhận SHP-01, ba bộ dữ liệu SHP-02, INV-01, hai nhánh CART-MERGE-01 và một ca CHK-RACE-01 bằng UI và SQL. `PAY-FAIL-01` ở lượt **T12 hiện tại** không được diễn giải là Pass: Playwright Skip với lý do `Payments.QaDecline is inactive; checkout skipped Payment Method`. Risk register có một lượt Pass lịch sử ngày 18/11 khi plugin QA được bật; hai lượt có cấu hình khác nhau.
- `INV-01`: sau khi giảm tồn kho trước Confirm, đơn không được tạo; giỏ không bị mất. Gộp giỏ vượt kho: account có 4, guest có 2, tồn kho 5; guest giữ 2 và thấy cảnh báo. Các attachment SQL của test nằm trong `reports/t12-20261128-checkout-risk/results.json` trên máy chạy. [Bảng race](T12-RACE-10-RUNS.md) ghi Order/OrderItem/Stock/Cart trước–sau cả 10 lượt: 10/10 có hai POST Confirm hợp lệ, 0/10 tái hiện lỗi SQL, 0/10 tạo đơn trùng. Test cũng kiểm tra tab thua có thông báo dễ hiểu. Đây là tần suất trong 10 lượt trên cấu hình này, không phải xác suất lỗi chung.
- [Risk register 26 scenario](../../test-design/SCRUM-80-risk-register.md) có **17 High**. T12 có bằng chứng thực thi cho 16/17; `PAY-FAIL-01` Blocked ở môi trường local, owner Khoa và điều kiện gỡ là kích hoạt plugin QA decline rồi chạy lại. `CHK-01` đi qua PW và tạo đơn đúng nhưng finding D-01 về hiển thị tiền tệ vẫn được theo dõi. Risk coverage 16/17 không phải pair coverage.

## 5. Fail, defect và retest

Lượt T12 hiện tại không có Fail sản phẩm trong PW, N02/ADV, Cart risk hoặc Checkout risk. Lịch sử N06 trước khi chốt baseline có một Fail ở `CART-MERGE-01-OVERSTOCK` do **oracle test cũ** yêu cầu người dùng ở trạng thái đăng nhập dù xử lý mới của [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96) chủ động giữ khách ở giỏ guest khi gộp vượt kho. [Lượt đầu](n06-checkout-risk-initial.json) có 7 Pass, 1 Fail test/oracle, 1 Blocked; sau khi sửa oracle, [retest](n06-merge-retest.json) 1/1 Pass. T12 trên baseline mới đã chạy lại chính ca đó và Pass. Đây là lỗi test đã phân loại, không phải defect sản phẩm mới.

Defect [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96) và [SCRUM-100](https://anhkhoa080205.atlassian.net/browse/SCRUM-100) đang ở trạng thái Done trên Jira. Trạng thái Jira không thay thế bằng chứng retest: `SCRUM-96` có ca merge overstock trên baseline T12; `SCRUM-100` cần nhìn số lượt race, SQL và thông báo của tab thua. Không kết luận lỗi đồng thời đã hết vĩnh viễn từ một hoặc vài lượt không tái hiện.

## 6. Log, ảnh và chạy lại

Các report local gốc ở `qa/automation/reports/t12-20261128-*` gồm `results.json`, `junit.xml`, HTML và `run-manifest.json`; ảnh/trace lỗi nếu có ở `qa/automation/artifacts/t12-20261128-*`. Chúng được giữ local và không đưa raw trace/cookie vào Git. Ảnh minh chứng đã chọn: [giỏ guest trước login](../SCRUM-108/N06-merge-over-before.png), [giỏ guest sau từ chối](../SCRUM-108/N06-merge-over-after.png), [thêm lại cùng biến thể](../SCRUM-108/N06-repeat-same-after.png), [tab thua có thông báo an toàn](../SCRUM-108/N06-race-run01-tab-B.png). Đây là ảnh từ N06, không gắn nhãn giả là ảnh T12.

Lượt T12 có ảnh riêng của race run01: [tab nhận cảnh báo và vẫn ở Confirm](T12-RACE-run01-tab-A-after.png), [tab tạo đơn thành công](T12-RACE-run01-tab-B-after.png). Hai ảnh cùng với snapshot SQL trước/sau trong [bảng 10 lượt](T12-RACE-10-RUNS.md) chứng minh một yêu cầu thắng, yêu cầu còn lại có thông báo nghiệp vụ và chỉ một đơn được ghi nhận ở run01.

Lệnh tái lập từ `qa/automation` sau khi dựng store, tài khoản QA và đặt các biến `QA_*` trong terminal hoặc kho bí mật (không commit mật khẩu):

```powershell
pwsh ../pairwise/validate.ps1
node ../pairwise/n02-cart/generate.mjs
npm ci
npm run test:pw
npm run test:n02-cart
npm run test:cart-risk
npx playwright test tests/checkout-risk.spec.ts
pwsh scripts/run-n03-series.ps1 -Runs 10 -AccountEmail $env:QA_REGISTERED_EMAIL -Label T12-RETEST -Database $env:QA_DB_NAME
node scripts/summarize-n03-runs.cjs n03-local-evidence/T12-RETEST
```

Tài khoản N02 cần `qa.n02.*@example.test`, N03 cần `qa.n03.*@example.test` đã có địa chỉ. Các bộ dùng chung fixture phải chạy tuần tự. Nếu chạy trên laptop thành viên khác, cần giữ cùng tree SHA, checkout mode, fixture và image hoặc ghi rõ khác biệt trước khi so sánh metrics.
