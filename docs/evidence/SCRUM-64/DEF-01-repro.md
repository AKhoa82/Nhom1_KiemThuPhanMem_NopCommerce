# DEF-01 — Tái hiện: mất món guest khi gộp giỏ vượt tồn kho

> **Cập nhật 25/11/2026:** lỗi này đã được sửa trên `develop` bởi SCRUM-96 (PR #16, merge `8b33708a54`). Mọi kết quả trong file này được thu thập trên bản build **trước sửa**; container Docker local vẫn là bản cũ nên test `CART-MERGE-01-OVERSTOCK` còn Fail ở đây. Retest sau sửa: xem `docs/evidence/SCRUM-96/`.


Scenario: `CART-MERGE-01` (nhánh `CART-MERGE-01-OVERSTOCK`), file test `qa/automation/tests/checkout-risk.spec.ts`.

## Điều kiện

- Store `http://localhost/`, checkout nhiều bước, fixture `SCRUM-87-N02-v1`.
- Test `CART-MERGE-01-OVERSTOCK` dùng sản phẩm **`PW-SIMPLE-001`** (không phải `PW-SHIRT`): test tự đặt `StockQuantity = 5` bằng SQL rồi restart web để xóa cache.
- Tài khoản registered có giỏ 4 món `PW-SIMPLE-001`; guest có giỏ 2 món cùng SKU (tổng 6 > stock 5).
- Defect đã có ticket **SCRUM-96**. Test N02 `MERGE-OVER` (`n02-cart.spec.ts`) tái hiện cùng lỗi trên `PW-SHIRT` Red/S (account 4 + guest 2, stock 5), xem `docs/evidence/SCRUM-86/RUN-20261118-CART-MERGE.md`.
- Source commit khi chạy: `79a55569253e21f52747d70500a83065976eed72`.

## Lệnh

```powershell
cd qa\automation
npx playwright test tests/checkout-risk.spec.ts -g "CART-MERGE-01"
```

## Kết quả các lượt

| Lần | Ngày giờ (UTC) | Nhánh hợp lệ (`CART-MERGE-01`) | Nhánh vượt kho (`CART-MERGE-01-OVERSTOCK`) | Số món trước → sau đăng nhập |
| --- | --- | --- | --- | --- |
| 1 | 2026-11-24 17:50–17:54 (run `AUTO-20261124175018559`) | Pass | **Fail** | 6 → 4 |
| 2 | 2026-11-24 17:59 (khoảng 90 giây) | Pass | **Không hợp lệ (lỗi môi trường)**: dừng ở `checkout-risk.spec.ts:347`, store không trả HTTP 200 trong 30 giây sau `docker restart nopcommerce` (`Expected: 200, Received: 0`) | Không có số liệu (test chưa tới bước đăng nhập và gộp giỏ) |
| 3 | 2026-11-24 18:02–18:06 (run `AUTO-20261124180203236`) | Pass | **Fail** | 6 → 4 |

Tần suất tái hiện nhánh vượt kho: **2/2 lượt hợp lệ** (lượt 1 và 3, cùng kết quả 6 → 4). Lượt 2 là lỗi môi trường nên **không tính** vào mẫu số, cũng không tính là "không tái hiện". Tổng 3 lần chạy, 2 lần hợp lệ. Mẫu nhỏ: nên ghi "tái hiện ổn định 2/2", không khẳng định 100%.

## Lượt 1 — chi tiết

- Thông báo của test: `A rejected merge must preserve the guest items or account for them explicitly. Expected: 6, Received: 4`.
- Hai món của guest biến mất sau đăng nhập; không có thông báo cho khách.
- Khớp với lượt 18/11/2026 (6 → 4) ghi trong `docs/evidence/SCRUM-112/RUN-CART-MERGE-01.md`.
- Test chạy khoảng 2 phút cho nhánh vượt kho, 1,8 phút cho nhánh hợp lệ.

### Bằng chứng

| Loại | File |
| --- | --- |
| Ảnh lúc fail | `screenshots/DEF-01_01_overstock-fail-run1.png` |
| Tổng quantity trước | `cart-merge-overstock-before-run1.txt` (`total simple quantity: 6`) |
| Tổng quantity sau | `cart-merge-overstock-after-run1.txt` (`total simple quantity: 4`) |
| Lượt 3: ảnh lúc fail | `screenshots/DEF-01_04_overstock-fail-run3.png` |
| Lượt 3: quantity trước / sau | `cart-merge-overstock-before-run3.txt` (6), `cart-merge-overstock-after-run3.txt` (4) |

Trace Playwright (`trace.zip`, khoảng 5 MB) và `reports/` được `.gitignore`, chỉ lưu trên máy chạy.

## Lượt 3 — chi tiết

- Cùng thông báo và cùng số liệu với lượt 1: `Expected: 6, Received: 4`; hai món guest mất sau đăng nhập, không có thông báo.
- Source commit `79a55569253e21f52747d70500a83065976eed72`, store restart thành công (không gặp lại lỗi lượt 2).

## Lượt 2 — lỗi môi trường (không tính vào tần suất)

- Test restart container web để xóa cache tồn kho sau khi đặt `PW-SIMPLE-001` stock 5, rồi chờ `GET /` trả 200 tối đa 30 giây. Store khởi động chậm hơn 30 giây nên poll nhận `0` (không kết nối được).
- Không có `cart-merge-overstock-before/after.txt` cho lượt này vì test chưa tới bước đăng nhập và gộp giỏ.
- Đây là hiện tượng timeout khởi động, tương tự E-01 (cache tồn kho buộc phải restart web). Không liên quan tới DEF-01.
- Sau lượt này store đã trả HTTP 200 bình thường.

### Lượt thủ công (chụp tay, 25/11/2026)

Làm theo đúng điều kiện của test: `PW-Simple-Stock`, giỏ tài khoản 4 món, guest 2 món, đăng nhập lại cùng tài khoản.

| Bước | Quan sát | Ảnh |
| --- | --- | --- |
| Guest (chưa đăng nhập) thêm 2 món | Giỏ có `PW-SIMPLE-001` qty 2, total 200 đ; header `Shopping cart (2)`, hiện `Register` / `Log in` | `screenshots/DEF-01_02_guest-cart.png` |
| Đăng nhập tài khoản đã có 4 món | Giỏ chỉ còn `PW-SIMPLE-001` qty **4**, total 400 đ; header `Shopping cart (4)`; hiện `My account` / `Log out`. **Không có thông báo nào** về việc gộp giỏ | `screenshots/DEF-01_03_after-login.png` |

Kết quả: 2 món của guest biến mất sau đăng nhập, không cảnh báo. Khớp với kết quả tự động 6 → 4.

Lưu ý khi đọc ảnh: ảnh không hiển thị tồn kho. Stock của `PW-Simple-Stock` lúc chụp **chưa được xác nhận bằng ảnh hoặc SQL**; giả định là 5 theo điều kiện của test. Nếu cần chặt hơn, chụp thêm trang Edit product → Inventory.

## Giới hạn

- Một máy, một cấu hình. Chạy lặp chỉ cho thấy lỗi ổn định, không chứng minh cơ chế.
- Cơ chế đã được xác nhận riêng bằng probe thực thi tầng dịch vụ: xem `DEF-01-mechanism-probe.md`.
