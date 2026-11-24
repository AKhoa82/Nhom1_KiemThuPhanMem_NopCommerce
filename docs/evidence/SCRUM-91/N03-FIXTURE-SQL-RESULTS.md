# SCRUM-91 — N03 fixture, SQL trước/sau và tần suất qua các lượt

Thuộc [N03 / SCRUM-88](https://anhkhoa080205.atlassian.net/browse/SCRUM-88). Scenario `CHK-RACE-01`; defect liên quan [B02 / SCRUM-100](https://anhkhoa080205.atlassian.net/browse/SCRUM-100). Harness hai tab là SCRUM-90 (Trang); oracle là [SCRUM-89](../../test-design/SCRUM-89-n03-race-oracle-khoa.md) (Khoa). Tài liệu này là phần SCRUM-91 (Linh).

## 1. Fixture N03 (chuẩn)

| Hạng mục | Giá trị | Cách đảm bảo |
| --- | --- | --- |
| Tài khoản | Registered, dành riêng `qa.n03.*@example.test`, có địa chỉ đã lưu | Tạo một lần bằng `node scripts/register-local-qa.cjs`; reset từ chối email khác mẫu |
| Sản phẩm / biến thể | `PW-SHIRT` Red/S (đúng như `n03-race.spec.ts` của SCRUM-90) | Reset kiểm sản phẩm quản lý tồn kho theo thuộc tính, không backorder, Red/S không cho out-of-stock |
| Giỏ | Đúng 1 dòng, số lượng 4 | `reset-n03-fixture.ps1` xóa dòng PW-SHIRT của tài khoản rồi chèn lại; dừng nếu tài khoản có dòng giỏ/wishlist khác |
| Tồn kho | Red/S = 5 | `UPDATE` đúng một `ProductAttributeCombination` |
| Shipping / Payment | Ground; Check / Money Order | Do test của Trang xác nhận khi đi qua checkout |
| Order lịch sử | Giữ nguyên | Reset tự kiểm số order không đổi, stock biến thể khác không đổi, giỏ khách khác không đổi, rồi mới COMMIT |
| `ProcessPaymentRequest` | Xóa cho tài khoản N03 | Tránh dùng lại `OrderGuid` ở lượt sau |
| Cache tồn kho | Khởi động lại container store | Giống N02; chờ `/cart` trả 200 |

Giữa hai lượt `run-n03-series.ps1` chờ `MinimumOrderPlacementInterval` + 2 giây (đọc từ SQL) để lượt sau không bị chặn vì lý do không liên quan B02.

## 2. Cách chạy

```powershell
cd qa/automation
$env:QA_SQL_PASSWORD = '<mat-khau-SQL-cuc-bo>'
$env:QA_REGISTERED_EMAIL = 'qa.n03.<ten>@example.test'
$env:QA_REGISTERED_PASSWORD = '<mat-khau>'
$env:NOP_BASE_URL = 'http://localhost/'

# 1) kiểm tra không ghi gì
powershell -File scripts/reset-n03-fixture.ps1 -AccountEmail $env:QA_REGISTERED_EMAIL -ValidateOnly
# 2) chạy 10 lượt, mỗi lượt reset -> SQL trước -> test hai tab -> SQL sau
powershell -File scripts/run-n03-series.ps1 -Runs 10 -AccountEmail $env:QA_REGISTERED_EMAIL -Label BEFORE-FIX
# 3) tổng hợp
node scripts/summarize-n03-runs.cjs n03-local-evidence/BEFORE-FIX --md ../../docs/evidence/SCRUM-91/RUN-BEFORE-FIX.md
```

Playwright thoát mã khác 0 khi B02 còn mở; đó là kết quả mong đợi, không phải lỗi script. Raw (trace, HTML, ảnh) nằm trong `qa/automation/n03-local-evidence/`, đã bị `.gitignore`.

Mỗi lượt lưu: `sql-before.txt`, `sql-after.txt` (Order, OrderGuid, OrderItem, stock, giỏ, GUID trùng, payment request, cấu hình `PlaceOrderWithLock` / `MinimumOrderPlacementInterval` / `RegenerateOrderGuidInterval`), `results.json` (chứa `n03-attempt.json`), `reset.txt`. Script tổng hợp tính verdict **từ SQL** rồi đối chiếu với log của test.

## 3. Bằng chứng đã có (lấy từ SCRUM-90, chưa phải lượt chạy của SCRUM-91)

Nguồn: [N03-RESULTS.md](../SCRUM-90/N03-RESULTS.md). Chỉ ba lượt tự động có mốc thời gian từng request. Hai lượt thủ công không có mốc nên **không** đưa vào tần suất.

| Lượt | Gap POST | Tab A | Tab B | Orders trước→sau | Stock | Giỏ | OrderGuid / OrderItem | Kết quả |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `AUTO-20261118152916203` | 1.78 ms | 302 → `/checkout/completed/12` | 200, lỗi SQL `AK_Order_OrderGuid` | 4→5 (Δ1) | 5→1 | 1→0 | Chưa ghi nhận trong lượt này | Reproduced B02 |
| `AUTO-20261118153817734` | 24.74 ms | 200, lỗi SQL | 302 → `/checkout/completed/14` | 5→6 (Δ1) | 5→1 | 1→0 | Chưa ghi nhận | Reproduced B02 |
| `AUTO-20261118154837774` | 20.73 ms | 302 → `/checkout/completed/16` | 200, lỗi SQL | 6→7 (Δ1) | 5→1 | 1→0 | Chưa ghi nhận | Reproduced B02 (commit `06e894101c`) |

**Tần suất:** 3/3 lượt hợp lệ có lộ lỗi SQL (khoảng tin cậy Wilson 95%: khoảng 58%–100% vì n chỉ bằng 3). **Số đơn:** cả 3 lượt đều Δ = 1, không có order trùng. Lỗi nằm ở xử lý/thông báo, không phải tạo hai đơn.

Giới hạn: một máy, build có SHA chưa được kiểm chứng độc lập, cấu hình `PlaceOrderWithLock` / `RegenerateOrderGuidInterval` chưa ghi lại, `OrderGuid` và `OrderItem` chưa đối chiếu, reset trước đó làm bằng tay của Trang. Các lượt chạy bằng `run-n03-series.ps1` sẽ lấp các khoảng trống này.

## 4. Kết quả các lượt SCRUM-91

Series `BEFORE-FIX`: 10 lượt tự động (24/11/2026), bảng đầy đủ ở [RUN-BEFORE-FIX.md](RUN-BEFORE-FIX.md). Môi trường: cửa hàng mới cài trên Docker local, SQL Server image `2019-CU18-ubuntu-20.04`, checkout nhiều bước (One-page tắt), `PlaceOrderWithLock=False`, `MinimumOrderPlacementInterval=1`, `RegenerateOrderGuidInterval=180`. Fixture do `reset-n03-fixture.ps1` khôi phục trước mỗi lượt (giỏ 4, stock Red/S = 5).

| Series | Số lượt | Hợp lệ | B02 reproduced | Double order | Order delta | Stock | Giỏ |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| BEFORE-FIX | 10 | 10 | 10/10 (Wilson 95%: 72%–100%) | 0 | 1 ở cả 10 lượt | 5→1 ở cả 10 lượt | 1→0 ở cả 10 lượt |

- Mỗi lượt tạo đúng **một** order với một `OrderGuid` riêng và một OrderItem `PW-SHIRT` × 4; không có `OrderGuid` trùng. Lỗi SCRUM-100 là lỗi **xử lý/thông báo** (một tab hiện lỗi SQL `AK_Order_OrderGuid`), không phải tạo hai đơn.
- Tab nhận lỗi thay đổi giữa các lượt (A: 5 lượt, B: 5 lượt); chênh lệch gửi hai POST từ 2.7 ms đến 32.6 ms.

Ảnh minh họa lượt `run01` (đối chiếu với bảng: Tab A 200 + lỗi SQL, Tab B 302): [tab A lộ lỗi `AK_Order_OrderGuid`](run01-tab-A-sql-error.png) và [tab B Completed, order number 3](run01-tab-B-completed.png). `OrderGuid` trong thông báo lỗi (`2847559a-67f6-4c32-afb4-267e9e5d6195`) trùng với `OrderGuid` của order duy nhất mới tạo trong SQL; order có `Id=3` vì lần chèn lỗi đã tiêu một giá trị identity. Các ảnh còn lại và trace chỉ lưu local. Chỉ ảnh `run01` được xem lại bằng mắt; các lượt khác dựa vào cờ lỗi SQL của Playwright.

**Giới hạn bằng chứng:** một máy, một cấu hình ở trên, cửa hàng mới cài (khác môi trường của SCRUM-90). SHA ghi trong `series.json` là commit của repo test, chưa chứng minh build đang chạy trong container; các lượt không kiểm tra riêng nội dung thông báo của tab còn lại ngoài việc có/không lỗi SQL. Kết quả không áp dụng cho cấu hình `PlaceOrderWithLock=True` hay checkout một trang. Hai lượt thủ công của SCRUM-90 không có mốc thời gian nên không được tính.

## 5. Dữ liệu và checklist retest SCRUM-100 (B02)

Dữ liệu retest: cùng fixture ở mục 1, cùng tài khoản và cùng quy trình reset; **chỉ đổi mã nguồn và nhãn `-Label AFTER-FIX-<sha>`**. Chạy thêm một lượt đối chứng tuần tự (`CTRL-SEQUENTIAL` trong tài liệu SCRUM-89) để biết môi trường ổn trước khi chạy race.

| # | Điều kiện đóng B02 | Cách kiểm |
| --- | --- | --- |
| 1 | Không có order trùng trong mọi lượt | `summary.md`: `Double-order runs = 0`, `N03_DUP_ORDERGUID groups=0` |
| 2 | Không tab nào lộ SQL | Cột Tab A/B không có `SQL-error`; xem lại ảnh từng tab |
| 3 | Tab còn lại có thông báo nghiệp vụ hoặc cùng một order | Xem ảnh/HTML của tab thua (kiểm tay, script không tự phán) |
| 4 | Stock 5→1, giỏ rỗng, một OrderItem 4 | Cột Stock/Cart/OrderItem trong bảng |
| 5 | Cỡ mẫu tương đương lượt trước sửa (≥ 10 lượt, cùng gap) | Cột POST gap, số lượt hợp lệ |
| 6 | Đường checkout một trang (`OpcConfirmOrder`) nếu bản sửa chạm đến | Chạy riêng, ghi `onepagecheckoutenabled` |

Một chuỗi sau sửa không gặp lỗi chỉ cho phép ghi **Not Reproduced trong phạm vi các lượt đã chạy**; không tự kết luận B02 đã sửa nếu số lượt hợp lệ ít.
