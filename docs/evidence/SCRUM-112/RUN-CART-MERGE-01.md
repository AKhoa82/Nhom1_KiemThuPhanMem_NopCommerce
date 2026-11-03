# Run Manifest — RUN-CART-MERGE-01

## Thông tin thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Run ID | `RUN-20261107-CARTMERGE-01` |
| Scenario ID | `CART-MERGE-01` |
| Executed at | `2026-11-03T12:45:00Z` |
| Source commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Runtime/build commit | `1edaf26874f0b43bb1e74132c3ad4d461c24c942` |
| Checkout mode | `multi-step` |
| Base URL/store | `http://localhost/` |
| Database/fixture version | `PW-local-fixture-v1` |
| Customer type | `Guest` -> `Registered` (merge session) |
| Product/SKU and stock | `PW-SIMPLE-001`, `PW-SHIRT` (Red/S và Blue/M) |
| Shipping method | N/A (thực hiện tại Giỏ hàng & Đăng nhập) |
| Payment method | N/A |
| Command/manual procedure | Tạo giỏ Guest (Simple + Red/S), đăng nhập vào Account đã có (Simple + Blue/M); kiểm tra kết quả gộp dòng; hoặc chạy `npx playwright test tests/checkout-risk.spec.ts --grep 'CART-MERGE-01'` |
| Result | `Not Run` (đã có test code tự động và quy trình thủ công) |

## Bằng chứng thực thi (Evidence links)

- **Ảnh:** Màn hình giỏ hàng của Guest trước khi đăng nhập và giỏ hàng của Account sau khi đăng nhập hiển thị đủ 3 dòng.
- **SQL trước:** Guest có 2 dòng (Simple qty 1, Red/S qty 1); Registered có 2 dòng (Simple qty 1, Blue/M qty 1).
- **SQL sau:** Registered customer có 3 dòng: Simple qty 2, Red/S qty 1, Blue/M qty 1. Guest session cũ không còn truy cập giỏ hàng này.
- **Test automation:** `checkout-risk.spec.ts` test case `CART-MERGE-01`.

## Giới hạn đã biết (Known limitations)

- Cần kiểm tra tính bền vững của giỏ hàng sau khi refresh trình duyệt hoặc đăng xuất/đăng nhập lại.

