# SCRUM-85 — Thiết kế ca và oracle cho gộp giỏ, thêm lặp

**Issue:** [SCRUM-85](https://anhkhoa080205.atlassian.net/browse/SCRUM-85), thuộc [SCRUM-84](https://anhkhoa080205.atlassian.net/browse/SCRUM-84). **Người phụ trách review:** Khoa. Tài liệu đối chiếu mã test và [báo cáo SCRUM-86 của Trang](../evidence/SCRUM-86/N02-RESULTS.md) trên nhánh tích hợp; không nhận lượt chạy của Trang là lượt chạy của Khoa.

## 1. Baseline và phạm vi

- Hai scenario nghiệp vụ: `CART-MERGE-01` (guest đăng nhập vào tài khoản đã có giỏ) và `CART-REPEAT-01` (thêm lại sản phẩm). Sáu dataset dưới đây là **sáu ca cụ thể**, không phải sáu scenario mới trong mẫu số risk register N01.
- Fixture của lượt Trang: `PW-Shirt-Variants`, SKU `PW-SHIRT`, đơn giá 200; Red/S tồn 5, Blue/M tồn 3; theo dõi kho theo tổ hợp thuộc tính và không cho đặt vượt kho. Giá và tồn kho phải được xác minh lại trước mỗi lượt chạy. Dữ liệu không dùng coupon cho các phép tính tổng tiền trong bảng này.
- Checkout không tham gia hai scenario. Giỏ guest và account phải thuộc đúng hai customer ID khác nhau, cùng store; các ca test không được tạo đơn hàng. Trước mỗi ca, reset giỏ và stock về baseline, sau đó ghi ảnh hoặc SQL của **cả hai giỏ** trước/sau thao tác.
- Mã nguồn [MigrateShoppingCartAsync](../../src/Libraries/Nop.Services/Orders/ShoppingCartService.cs) gọi `AddToCartAsync` cho từng dòng guest rồi xóa các dòng nguồn. Giá trị cảnh báo trả về từ `AddToCartAsync` không được kiểm tra trước khi xóa; đây là vị trí cần retest sau sửa. Kết quả quan sát của ca vượt kho đã nối với [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96).

## 2. Quy tắc nghiệp vụ và oracle

Gọi **K** là khóa dòng giỏ gồm sản phẩm và bộ thuộc tính/biến thể; khi so sánh thực tế còn phải tôn trọng các thuộc tính dòng hàng mà nopCommerce dùng để nhận diện (store, giá khách nhập, kỳ thuê nếu có). Trong fixture này chỉ thay Color và Size. Vì vậy Red/S và Blue/M là hai K khác nhau dù cùng SKU cha.

1. **Bảo toàn số lượng theo K:** tổng số lượng của K trong giỏ account và giỏ guest sau thao tác phải bằng tổng trước thao tác, trừ khi người dùng đã chủ động xóa/đổi số lượng. Nếu gộp thất bại, dữ liệu guest phải còn và có đường xử lý rõ cho người dùng; không được xóa âm thầm.
2. **Gộp hợp lệ:** với cùng K, `q_account + q_guest <= stock(K)`, giỏ account sau login có đúng một dòng K với tổng số lượng; dòng guest nguồn chỉ được xóa sau khi chuyển thành công. Giỏ sau refresh vẫn giữ đúng kết quả.
3. **Vượt kho:** với cùng K, `q_account + q_guest > stock(K)`, không được âm thầm tạo giỏ vượt kho hoặc làm mất món guest. Oracle chọn cho ca hiện tại: giữ `q_account` không vượt kho, giữ `q_guest` ở giỏ nguồn/giải pháp khôi phục tương đương **và** hiển thị cảnh báo có thể hiểu. Nếu nhóm chọn chính sách chuyển một phần, phải đặc tả công khai lượng đã chuyển, lượng còn lại, cảnh báo và vẫn thỏa bảo toàn theo K trước khi đổi expected.
4. **Khác biến thể:** số lượng được kiểm theo tồn kho của từng K; không cộng Red/S với Blue/M để áp một giới hạn kho chung. Sau login hoặc thêm lặp phải có hai dòng riêng với đúng thuộc tính và số lượng.
5. **Thêm lặp:** thêm cùng K với `2` rồi `3` khi stock Red/S là `5` phải cho một dòng Red/S số lượng `5`, không có dòng trùng. Sau khi thêm Blue/M `1`, giỏ có hai dòng: Red/S `5`, Blue/M `1`.
6. **Tiền:** với fixture giá 200 và không coupon/thuế/phí trong giỏ, subtotal và total tương ứng là `4×200=800`, `5×200=1.000`, `2×200=400`, `6×200=1.200`. Đây là phép tính theo dữ liệu kiểm thử; nếu cấu hình thuế, tiền tệ hoặc discount đổi, phải tính lại oracle trước khi chạy.

**Bằng chứng tối thiểu để kết luận:** UI sau thao tác và sau refresh; thông báo khi thao tác thất bại; SQL `ShoppingCartItem` gắn đúng `CustomerId`, `StoreId`, `ProductId`, `AttributesXml`, `Quantity` trước/sau; stock đúng tổ hợp; giá/tổng tiền theo cấu hình. Đếm dòng hoặc tổng số lượng trong mọi customer chỉ là bằng chứng bổ sung, không thay thế truy vấn theo từng customer.

## 3. Phân lớp tương đương, giá trị biên và bảng quyết định

| Lớp | Điều kiện | Đại diện | Ý nghĩa |
| --- | --- | --- | --- |
| Gộp cùng K, dưới kho | `q_a + q_g < s_K` | `2 + 2 < 5` | Đối chứng gộp hợp lệ. |
| Gộp cùng K, đúng biên | `q_a + q_g = s_K` | `2 + 3 = 5` | Kiểm tra biên được chấp nhận. |
| Gộp cùng K, vượt biên | `q_a + q_g > s_K` | `4 + 2 > 5` | Kiểm tra từ chối và bảo toàn guest cart. |
| Khác K | Red/S khác Blue/M | `1 + 1` trên hai K | Kiểm tra tách dòng và kho riêng. |
| Thêm lặp cùng K | Cùng customer, cùng Red/S | `2` rồi `3` | Kiểm tra cộng số lượng vào một dòng. |
| Thêm lặp khác K | Thêm Blue/M sau Red/S | `5` Red/S và `1` Blue/M | Kiểm tra không gộp nhầm biến thể. |

| Thao tác | Cùng K? | Tổng cùng K so với kho | Quyết định mong đợi | Oracle quan sát |
| --- | --- | --- | --- | --- |
| Login merge | Có | Dưới hoặc bằng | Chuyển và cộng đúng số lượng | Một dòng account, nguồn hết dòng đã chuyển, không cảnh báo. |
| Login merge | Có | Vượt | Không được xóa món không chuyển được; cảnh báo | Tổng số lượng hai phía bảo toàn, account không vượt kho, có thông báo. |
| Login merge | Không | Mỗi K trong kho riêng | Chuyển thành các dòng riêng | Hai dòng đúng thuộc tính; không gộp chéo. |
| Thêm lặp | Có | Sau thêm không vượt | Cộng vào dòng cũ | Một dòng, số lượng mới, tổng tiền tính lại. |
| Thêm lặp | Không | Mỗi K trong kho riêng | Tạo dòng mới | Hai dòng với đúng số lượng từng K. |

## 4. Ma trận ca, bước và kết quả đã đối chiếu

Điều kiện chung: reset fixture; xác nhận stock Red/S = 5, Blue/M = 3, giá 200 và coupon của customer đang test rỗng. Với `MERGE-*`, chuẩn bị hai giỏ riêng rồi đăng nhập từ phiên guest; với `REPEAT-*`, thêm từ cùng một phiên. Mỗi ca đọc lại `/cart` sau refresh để xác nhận dữ liệu đã lưu.

| Case ID | Bước và đầu vào | Expected / assertion chính | Kết quả Trang 18/11 và bằng chứng |
| --- | --- | --- | --- |
| `MERGE-VALID` | Account Red/S 2; logout; guest Red/S 2; login. | Account một dòng Red/S 4, guest không còn dòng đã chuyển; subtotal/total 800, refresh vẫn 4. | **Pass**: [run merge](../evidence/SCRUM-86/RUN-20261118-CART-MERGE.md), ảnh account sau login. |
| `MERGE-EXACT` | Account Red/S 2; guest Red/S 3; login. | Một dòng Red/S 5 đúng biên, total 1.000; không cảnh báo vượt kho. | **Pass**: [run merge](../evidence/SCRUM-86/RUN-20261118-CART-MERGE.md), ảnh sau login. |
| `MERGE-OVER` | Account Red/S 4; guest Red/S 2; login. | Không mất 2 món guest; tổng hai giỏ vẫn 6, account không quá 5, có cảnh báo xử lý gộp thất bại. | **Fail**: account 4, guest gốc 0, không cảnh báo; [ảnh và SQL trước/sau](../evidence/SCRUM-86/RUN-20261118-CART-MERGE.md), [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96). |
| `MERGE-VARIANT` | Account Red/S 1; guest Blue/M 1; login. | Hai dòng riêng, mỗi dòng 1; total 400; refresh vẫn hai dòng. | **Pass**: [run merge](../evidence/SCRUM-86/RUN-20261118-CART-MERGE.md). |
| `REPEAT-SAME` | Cùng phiên thêm Red/S 2, sau đó Red/S 3. | Sau bước 1 một dòng 2/total 400; sau bước 2 một dòng 5/total 1.000, SQL và refresh khớp. | **Pass** cho kết quả cuối: [run repeat](../evidence/SCRUM-86/RUN-20261118-CART-REPEAT.md). Assertion bước trung gian được bổ sung trong review. |
| `REPEAT-DIFFERENT` | Sau Red/S 2+3, thêm Blue/M 1. | Hai dòng Red/S 5 và Blue/M 1; subtotal/total 1.200, SQL và refresh khớp. | **Pass** cho kết quả cuối: [run repeat](../evidence/SCRUM-86/RUN-20261118-CART-REPEAT.md). Assertion refresh được bổ sung trong review. |

Kết quả của Trang lấy từ hai lượt chạy độc lập: `MERGE-OVER` được tái hiện ở lượt riêng, còn một lượt chạy chung bị gián đoạn mạng (`ERR_NETWORK_IO_SUSPENDED`) được phân loại là lỗi môi trường, **không** tính thành Fail sản phẩm. Bằng chứng thủ công do Trang báo đã kiểm tra sáu tình huống nhưng chưa có bộ ảnh riêng; không gắn lượt thủ công đó với ảnh của lượt tự động. Chưa có bản sửa SCRUM-96 nên chưa thể ghi `Retest Pass`.

### Lượt xác nhận của Khoa ngày 18/11/2026

Sau khi bổ sung assertion, Khoa chạy năm ca đối chứng trên Chromium local: `MERGE-VALID`, `MERGE-EXACT`, `MERGE-VARIANT`, `REPEAT-SAME`, `REPEAT-DIFFERENT` đều **Pass (5/5)**. Kết quả này bao gồm việc kiểm guest nguồn sau gộp thành công, kiểm số lượng và tiền sau lần thêm đầu, và kiểm lại các dòng sau refresh. TypeScript `tsc --noEmit` cũng thành công.

Ca `MERGE-OVER` được chạy riêng, run ID `AUTO-20261118154313965`, **Fail đúng oracle**: số lượng account sau login là 4, guest gốc là 0, tổng chỉ còn 4 thay vì 6; file `login-feedback.txt` ghi không có cảnh báo hiển thị. Assertion bảo toàn thất bại trước khi chạy assertion cảnh báo, nên kết luận thiếu cảnh báo dựa trên attachment, không dựa trên assertion thứ hai. Run này tiếp tục xác nhận [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96), không phải một lỗi mới. Report/trace của run được lưu cục bộ trong `qa/automation/reports/` và `qa/automation/artifacts/`; không đưa các file chứa dữ liệu phiên kiểm thử lên Git. Các ảnh/SQL được chọn để chia sẻ đã có trong [báo cáo của Trang](../evidence/SCRUM-86/RUN-20261118-CART-MERGE.md).

## 5. Review mã kiểm thử và dịch vụ

- [Test Playwright N02](../../qa/automation/tests/n02-cart.spec.ts) đã kiểm tra UI, làm mới trang, và gắn ảnh/SQL cho nhiều bước. `MERGE-OVER` còn kiểm guest gốc bằng cookie khách sau login. Review bổ sung assertion sau lần thêm đầu tiên của `REPEAT-SAME`, sau refresh của `REPEAT-DIFFERENT`, và xác nhận guest nguồn rỗng trong nhánh merge hợp lệ.
- Snapshot `queryCartFixtureState()` hiện liệt kê các giỏ PW của **mọi** customer; nó không đủ để kết luận một dòng SQL thuộc đúng account hay guest. Linh cần bổ sung truy vấn theo `CustomerId` và `StoreId`, đồng thời đối chiếu `AttributesXml`, giá và coupon của đúng customer trong SCRUM-87. Ảnh UI và test hiện có vẫn đủ tái hiện lỗi mất hai món; giới hạn SQL được giữ rõ.
- Giá 200 đang viết cứng trong test của Trang. Preflight cần xác nhận giá thực tế 200 và không có discount/thuế ảnh hưởng phép tính, hoặc tính expected từ fixture đã đọc. Nếu fixture đổi thì đánh dấu `Blocked`, không đổi oracle để làm test Pass.
- Mức dịch vụ: cần một regression test cho `MigrateShoppingCartAsync` với giỏ đích 4, giỏ nguồn 2, stock 5. Mock/fixture phải làm `AddToCartAsync` trả cảnh báo và xác nhận `DeleteShoppingCartItemAsync` **không** xóa nguồn khi chuyển thất bại; thêm ca đối chứng 2+2, 2+3 và khác thuộc tính. Bài test này nên chạy sau khi thống nhất cách sửa để không đưa test Fail cố ý vào CI. Trong mã hiện tại, hai vòng lặp thêm rồi xóa là bằng chứng giải thích lỗi, không phải oracle tự thân.

## 6. Review model PICT

Model cũ [model.pict](../../qa/pairwise/model.pict) có `CartAction = Add/Update/Remove`, không có thao tác login merge, số lượng ở **hai** giỏ hay quan hệ giữa biến thể. Vì vậy 14 row/253 cặp của model cũ không bao phủ các ca N02. K06 vẫn là kỹ thuật tổ hợp chính của đề tài; sáu ca trực tiếp ở mục 4 là ca theo rủi ro, biên và trình tự để kiểm tra oracle.

Đề nghị Linh tạo model Cart riêng với các factor `Action={LoginMerge,RepeatAdd}`, `VariantRelation={Same,Different}`, `QuantityRelation={BelowStock,AtStock,AboveStock,PerVariant}`, `CustomerContext={GuestToRegistered,SameSession}`. Ràng buộc bắt buộc: `LoginMerge → GuestToRegistered`, `RepeatAdd → SameSession`; `Different → PerVariant`; `Same → QuantityRelation != PerVariant`. Giá trị `AboveStock` phải có fixture mà **mỗi giỏ trước login vẫn hợp lệ** nhưng tổng sau merge vượt kho (ví dụ 4+2 với stock 5). Với `RepeatAdd`, dùng số lượng trước/sau cùng customer; không dùng tổng của hai giỏ. Các lớp `Below/At/Above` là quan hệ **suy ra từ số lượng và kho**, nên validator phải kiểm tra lại giá trị số cụ thể của từng row; không coi nhãn do PICT sinh là bằng chứng dữ liệu đã được seed đúng.

Khi model riêng được chốt, Linh cần sinh row, kiểm constraint, tính feasible-pair coverage và lưu mapping case–row. Hiện **chưa có** model N02 được xác nhận hoặc coverage mới; không cộng các ca N02 vào 14 PW hoặc báo lại 253/253 như coverage của N02.

## 7. Kết luận review SCRUM-85

Oracle đủ để quyết định Pass/Fail cho sáu ca. Bốn ca merge và hai ca repeat có expected, bước, assertion và link evidence; lỗi `MERGE-OVER` được ghi Fail, các đối chứng Pass trong các lượt Trang và Khoa đã chạy. Phần SQL theo từng customer, xác nhận fixture và model PICT riêng là phạm vi SCRUM-87 của Linh; không giả định đã hoàn tất. Cần Trang và Linh review, chấp nhận hoặc ghi rõ thay đổi cho quy tắc giữ món khi gộp vượt kho trước khi coi oracle là baseline của nhóm. Bản review này không đóng [SCRUM-96](https://anhkhoa080205.atlassian.net/browse/SCRUM-96): lỗi chỉ được đóng sau bản sửa và retest cả nhánh vượt kho lẫn các ca đối chứng.
