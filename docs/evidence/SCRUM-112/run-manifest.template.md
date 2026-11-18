# Run manifest — `<RUN-ID>`

| Trường | Giá trị |
| --- | --- |
| Run ID | `<RUN-ID>` |
| Scenario ID | `<ID>` |
| Ngày giờ chạy | `<YYYY-MM-DD HH:mm timezone>` |
| Source commit | `<SHA>` |
| Runtime/build commit | `<SHA hoặc image tag>` |
| Checkout mode | `Multi-step` / `<khác — giải thích>` |
| Base URL/store | `<URL/store ID>` |
| Database/container | `<container/database>` |
| Fixture version | `<seed/reset script hoặc version>` |
| Customer type | `Registered` / `Guest` |
| Customer fixture | `<synthetic identifier, không ghi password>` |
| Product/SKU và stock | `<SKU, quantity, stock trước/sau>` |
| Shipping method | `<system name/tên option>` |
| Payment method | `<system name/tên method>` |
| Command/procedure | `<lệnh hoặc link scenario>` |
| Result | `Pass` / `Fail` / `Partial` / `Not Run` / `Blocked` |
| Evidence | `<report/ảnh/SQL/Jira links>` |
| Known limitations | `<giới hạn còn lại>` |

## Expected và observed

### Expected

`<Ghi expected result và invariant liên quan>`

### Observed

`<Ghi kết quả quan sát được, order delta, cart, stock, status>`

## SQL/evidence hygiene

- [ ] Chỉ dùng truy vấn read-only.
- [ ] Không có password, cookie, token hoặc dữ liệu cá nhân thật.
- [ ] SQL snapshot trước/sau đã được đính kèm.
- [ ] Report/ảnh có thể truy cập bởi reviewer.

