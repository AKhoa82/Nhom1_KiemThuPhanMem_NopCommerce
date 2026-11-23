# SCRUM-87 — Plan fixture, SQL và PICT cho N02 Cart

Ngày lập: 19/11/2026. Issue: [SCRUM-87](https://anhkhoa080205.atlassian.net/browse/SCRUM-87), subtask của [SCRUM-84](https://anhkhoa080205.atlassian.net/browse/SCRUM-84). Theo cách phân việc mới của nhóm, Trang chịu trách nhiệm hoàn tất phần còn thiếu này; Jira đã đồng bộ assignee sang Trang ngày 19/11/2026.

## Chức năng của SCRUM-87

SCRUM-87 tạo **dữ liệu kiểm thử lặp lại được và bằng chứng ở mức database** cho sáu ca N02 đã được thiết kế/chạy trong SCRUM-85/86. Phần fixture bảo đảm giỏ account, giỏ guest, stock và biến thể đúng trước mỗi lần chạy. Phần SQL xác nhận chính xác từng dòng `ShoppingCartItem` trước/sau login hoặc thêm lặp. Phần PICT mô hình hóa các kết hợp đầu vào khả thi của hai luồng Cart và báo pair coverage **riêng**. Đây là công việc QA và dữ liệu kiểm thử, không phải bản sửa lỗi sản phẩm SCRUM-96.

## Baseline đã kiểm tra

- [PR #11](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce/pull/11) đã chứa oracle SCRUM-85, sáu test và evidence SCRUM-86. Dùng nhánh PR này làm nền; không tạo lại test của Trang hoặc oracle của Khoa.
- `qa/automation/scripts/reset-fixture.ps1` hiện nhận `PW-xxx`, đặt Red/S stock 5 nhưng xóa mọi Cart row của các SKU PW liên quan, không giới hạn hai customer N02. Không dùng nguyên script này làm reset N02 cuối cùng nếu môi trường có giỏ PW khác cần giữ.
- `qa/automation/tests/helpers/sql-fixture.ts` hiện xuất dòng `CART` cho các SKU PW của mọi customer mà không có `CustomerId`/`StoreId`; ảnh SQL cũ vì vậy chưa chứng minh riêng giỏ account và guest.
- Validator PICT hiện có gắn với `PW-xxx` và model cũ. Model/rows N02 cần file và validator riêng; không cộng vào 14 PW hoặc 253 cặp.

## Kế hoạch thực hiện

### 1. Chốt fixture và phạm vi reset

1. Ghi cấu hình N02 thành manifest: store/container/database QA local, `ProductId`/SKU `PW-SHIRT`, hai customer thử nghiệm riêng, Red/S stock 5, Blue/M stock 3, giá 200, chế độ không backorder, không coupon và cách tính thuế/phí ảnh hưởng total.
2. Thêm bước preflight chỉ đọc để xác nhận container/database/store, sản phẩm Published, hai biến thể, tồn kho, giá, customer IDs và việc mỗi giỏ ban đầu hợp lệ. Thiếu dữ liệu thì dừng với `FIXTURE_BLOCKED`; không tự đổi expected cho khớp dữ liệu sai.
3. Tạo hoặc điều chỉnh reset N02 theo **CustomerId + StoreId + ProductId** đã xác nhận. Chỉ xóa/seed dòng giỏ của hai customer test và chỉ đổi stock của tổ hợp N02; chạy trong transaction, kiểm số dòng bị tác động và ghi baseline trước/sau. Không dùng reset rộng của PW cho N02 nếu nó chạm tới customer khác.
4. Seed độc lập cho `MERGE-VALID` 2+2, `MERGE-EXACT` 2+3, `MERGE-OVER` 4+2, `MERGE-VARIANT` Red/S 1 + Blue/M 1, `REPEAT-SAME` 2 rồi 3 và `REPEAT-DIFFERENT` thêm Blue/M 1. Mỗi ca có ID, lệnh seed/reset và trạng thái đầu mong đợi; bảo đảm chạy lại không phụ thuộc thứ tự.

**Đầu ra:** manifest fixture, script preflight/reset/seed N02 và hướng dẫn tái lập, có bằng chứng reset không tác động giỏ ngoài hai customer test.

### 2. SQL và đối chiếu tiền

1. Bổ sung helper truy vấn **chỉ đọc**, nhận đúng account ID và guest ID của lượt chạy. Snapshot `ShoppingCartItem` theo `CustomerId`, `StoreId`, `ProductId`, `ShoppingCartTypeId`, `AttributesXml`, `Quantity`; kèm stock của tổ hợp thuộc tính và tổng số lượng theo từng khóa sản phẩm + biến thể.
2. Gắn snapshot tại các mốc: sau reset, hai giỏ trước login, hai giỏ sau login, sau refresh; với Repeat chụp sau lần thêm 2, sau lần thêm 3 và sau khi thêm biến thể khác. Lưu SQL và ảnh UI cùng run ID để so sánh đúng một lượt.
3. Kiểm invariant theo từng ca: gộp hợp lệ thành một dòng đúng qty; khác biến thể là hai dòng; vượt kho không được mất âm thầm hai món guest; thêm lặp cùng biến thể là một dòng qty 5. `ShoppingCartItem` không tự chứng minh số tiền: đối chiếu subtotal/total trên UI với giá, coupon và cấu hình thuế/phí đã xác nhận trong manifest.
4. Ghi rõ expected, actual và Pass/Fail/Blocked cho mỗi snapshot; liên kết `MERGE-OVER` với SCRUM-96, không ghi là retest sau sửa khi chưa có bản sửa.

**Đầu ra:** bảng sáu ca → customer IDs → SQL trước/sau → ảnh UI → quantity/total → kết quả → defect.

### 3. Model PICT N02 riêng

1. Tạo model mới, ví dụ `qa/pairwise/n02-cart/model.pict`, với các factor tĩnh phù hợp: `Action={LoginMerge,RepeatAdd}`, `VariantRelation={Same,Different}`, `QuantityRelation={BelowStock,AtStock,AboveStock,PerVariant}`, `CustomerContext={GuestToRegistered,SameSession}`. Ghi rõ giá trị số cụ thể ánh xạ vào từng lớp.
2. Thêm constraint: `LoginMerge` đi với `GuestToRegistered`; `RepeatAdd` đi với `SameSession`; `Different` đi với `PerVariant`; `Same` không đi với `PerVariant`. Kiểm lớp `AboveStock` có hai giỏ trước login đều hợp lệ nhưng tổng 4+2 vượt stock 5.
3. Sinh rows với PICT, viết validator riêng để kiểm domain/constraint, mỗi row có fixture số cụ thể hợp lệ và mapping tới test hoặc ghi `Not Run` nếu row chưa được thực thi. Tính **feasible pair coverage** của model N02, ghi tổng cặp khả thi, cặp đã phủ và cặp chưa phủ. Không dùng validator hard-code `PW-xxx` hiện tại mà không sửa phạm vi.
4. Ghi giới hạn: PICT kiểm tổ hợp factor tĩnh; trình tự login, thêm 2 rồi 3, refresh và kiểm không mất hàng vẫn được bảo đảm bởi sáu ca nghiệp vụ và assertion của SCRUM-86.

**Đầu ra:** model, rows, validator, mapping và báo cáo coverage N02 riêng với lệnh sinh/kiểm tra tái lập được.

### 4. Chạy xác nhận và bàn giao

1. Chạy preflight, seed/reset và SQL cho cả sáu ca trên QA local; chạy lại `npm run test:n02-cart` trên cùng fixture. Ghi ngày giờ, SHA PR #11 tại thời điểm chạy, phiên bản manifest, lệnh và kết quả từng lượt. Giữ report cũ để đối chiếu lịch sử.
2. Nếu `MERGE-OVER` vẫn Fail, báo đúng lỗi sản phẩm SCRUM-96 và giữ defect mở. Nếu môi trường/fixture không đạt, ghi `Blocked` với nguyên nhân cụ thể. Không biến Fail/Blocked thành Pass.
3. Commit chỉ file thuộc SCRUM-87 và evidence đã làm sạch lên nhánh PR #11; cập nhật mô tả PR/Jira với bảng truy vết. Yêu cầu review fixture/SQL/model trước khi merge PR.

## Checklist nghiệm thu

- [x] Seed/reset N02 có guard cho QA local, giới hạn đúng hai customer test và tái lập được sáu trạng thái đầu.
- [x] SQL và ảnh UI chứng minh hai giỏ và stock đúng trước/sau, có `CustomerId`, `StoreId`, variant, quantity.
- [x] Tổng tiền được đối chiếu với cấu hình giá/coupon/thuế của fixture và ảnh UI; không suy từ `ShoppingCartItem` đơn lẻ.
- [x] Model PICT N02 có factor/value/constraint, rows hợp lệ, mapping và pair coverage riêng.
- [ ] Báo cáo ghi SHA, run ID, Pass/Fail/Blocked, link evidence và SCRUM-96; PR #11 được review trước khi merge. Báo cáo đã có tại `docs/evidence/SCRUM-87/README.md`; còn chờ review PR.
