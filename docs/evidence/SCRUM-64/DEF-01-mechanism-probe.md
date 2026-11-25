# DEF-01 — Xác nhận cơ chế bằng thực thi (probe 25/11/2026)

> **Lưu ý:** probe chạy trên mã **trước** bản sửa SCRUM-96 (`ef90fd26b1`). Sau khi PR #16 được merge, `MigrateShoppingCartAsync` đã đổi (trả về danh sách warning, chỉ xóa dòng chuyển thành công), nên chạy lại probe trên `develop` sẽ cho kết quả khác. Bản sửa của SCRUM-96 khớp với cơ chế mà probe này xác nhận.


Mục đích: chứng minh `ShoppingCartService.MigrateShoppingCartAsync` làm mất món guest khi tổng vượt tồn kho, bằng cách chạy **dịch vụ thật** (SQLite, DI của `Nop.Tests`) thay vì chỉ đọc mã.

## Cách chạy

- Mã probe: `DEF-01-mechanism-probe.cs.txt` (đổi đuôi thành `.cs` và đặt vào `src/Tests/Nop.Tests/Nop.Services.Tests/Orders/` để chạy; **không** thêm vào repo chính vì nó là test thăm dò, luôn Pass).
- Lệnh: `dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj --filter "FullyQualifiedName~Scrum64CartMergeProbeTests" --logger "console;verbosity=detailed"`
- Kịch bản: sản phẩm stock 5 (`ManageStock`, `NoBackorders`); giỏ account 4; giỏ guest 2 cùng sản phẩm; sau đó gọi `AddToCartAsync` với đúng tham số mà vòng lặp của `MigrateShoppingCartAsync` dùng, rồi gọi `MigrateShoppingCartAsync`.
- Môi trường: .NET SDK 10.0.401, source commit `ef90fd26b1`.

## Kết quả (nguyên văn từ log)

```
PROBE setup: stock=5 | add 4 to account -> warnings=[] | add 2 to guest -> warnings=[]
PROBE before: account=[product=48 qty=4] guest=[product=48 qty=2]
PROBE direct AddToCartAsync(account, qty=2) warnings=[Your quantity exceeds stock on hand. The maximum quantity that can be added is 5.] (count=1)
PROBE after direct add: account=[product=48 qty=4]
PROBE after Migrate: account=[product=48 qty=4] guest=[]
PROBE RESULT: total before=6, total after=4
```

## Diễn giải

1. `AddToCartAsync` cho dòng guest (4 + 2 = 6 > 5) **trả warning và không cập nhật giỏ** (account vẫn qty 4). Khớp dòng 1641–1642 của `ShoppingCartService.cs`.
2. `MigrateShoppingCartAsync` không dùng giá trị trả về đó, rồi xóa dòng guest. Kết quả: guest `[]`, tổng 6 → 4, không có thông báo nào cho khách.
3. Kết quả này trùng với test Playwright (`6 → 4`) và ảnh chụp tay, nên root cause cơ chế của DEF-01 được xác nhận.

## Giới hạn

- Probe chạy ở tầng dịch vụ (SQLite), không đi qua UI và không dùng DB SQL Server của container; nó chứng minh logic của `MigrateShoppingCartAsync`, còn hành vi UI đã có bằng chứng riêng (`DEF-01-repro.md`).
- Chỉ thử một sản phẩm simple. Chưa thử sản phẩm có thuộc tính (Red/S) bằng probe, dù test N02 `MERGE-OVER` đã tái hiện trên Red/S qua UI.
