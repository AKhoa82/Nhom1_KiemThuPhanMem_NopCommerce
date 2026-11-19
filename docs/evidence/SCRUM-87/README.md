# SCRUM-87 — N02 fixture, SQL và PICT

## Lượt xác nhận

- Run ID: [`AUTO-20261119171317839`](AUTO-20261119171317839/manifest.json)
- Thời gian: 19/11/2026 17:13–17:15 UTC (20/11/2026 00:13–00:15 ICT)
- Source commit: `a4759a48ff82f19ec36c3e98b17b252d94b6857d`
- Fixture version: `SCRUM-87-N02-v2`; local Docker QA; store `1`, product `PW-SHIRT` (`ProductId=2`), account `4263`, guest `4264–4273`.
- Lệnh: `npm run test:n02-cart` qua runner QA local, sau đó `node qa/automation/scripts/export-n02-evidence.cjs`.
- Preflight SQL: giá 200, Red/S stock 5, Blue/M stock 3, backorder tắt, coupon 0. UI được kiểm subtotal và total theo giá fixture; `ShoppingCartItem` chỉ dùng để xác nhận dòng/biến thể/số lượng.
- Reset giới hạn theo customer, store và product; receipt của cả sáu ca ghi `otherCartRows` được bảo toàn (22–25 dòng tùy thời điểm). SQL xuất ra gồm đầy đủ `CustomerId`, `StoreId`, `ProductId`, `AttributesXml`, quantity và stock.
- Kiểm tra phạm vi riêng sau suite: thêm một dòng `PW-SIMPLE-001` vào guest QA, chạy reset rồi xác nhận dòng đó vẫn còn và các dòng N02 đã sạch; thêm coupon marker, chạy preflight rồi xác nhận `FIXTURE_BLOCKED` và coupon vẫn còn. Dữ liệu marker được xóa sau kiểm tra.

| Ca | SQL trước → sau | UI subtotal/total | Kết quả |
| --- | --- | --- | --- |
| MERGE-VALID | Account Red/S 2 + guest Red/S 2 → account Red/S 4, guest 0 | 800/800 | Pass |
| MERGE-EXACT | Account Red/S 2 + guest Red/S 3 → account Red/S 5, guest 0 | 1000/1000 | Pass |
| MERGE-OVER | Account Red/S 4 + guest Red/S 2 → account Red/S 4, guest 0; mất 2 món, không cảnh báo | Không khẳng định total do ca Fail trước assertion tiền | **Fail — [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96)** |
| MERGE-VARIANT | Account Red/S 1 + guest Blue/M 1 → hai dòng account, guest 0 | 400/400 | Pass |
| REPEAT-SAME | Red/S 2 → 5 sau thêm 3, giữ một dòng sau refresh | 1000/1000 | Pass |
| REPEAT-DIFFERENT | Red/S 2 → 5 sau thêm 3 → thêm Blue/M 1, hai dòng sau refresh | 1200/1200 | Pass |

Mỗi thư mục ca trong run ID chứa snapshot SQL và ảnh UI ở các mốc thao tác và sau refresh; `login-feedback.txt` ghi cảnh báo lúc login. Trace được giữ trong Playwright report local vì có thể chứa thông tin phiên đăng nhập. Assertion UI của lượt này ghi trong Playwright JSON report local.

PICT riêng của N02 sinh [8 rows](../../../qa/pairwise/n02-cart/generated-cases.csv), phủ [30/30 feasible pairs](../../../qa/pairwise/n02-cart/coverage-report.md). Sáu rows đã chạy: 5 Pass, 1 Fail; hai rows RepeatAdd/BelowStock và RepeatAdd/AboveStock chưa có UI test, ghi `NotCoded/NotRun`. Đây là coverage của model, không phải tỷ lệ pass UI. Lỗi SCRUM-96 vẫn mở, chưa có lượt retest sau sửa.

Lượt trước khi sửa phạm vi reset được giữ để đối chiếu: [`AUTO-20261119100034105`](AUTO-20261119100034105/manifest.json), fixture `SCRUM-87-N02-v1`, cũng có 5 Pass và 1 Fail. Lượt đó chưa kiểm tra việc giữ sản phẩm khác của cùng customer; dùng lượt v2 ở trên cho nghiệm thu fixture.
