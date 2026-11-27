# T14 — Tự kiểm tra hướng dẫn chạy lại

Issue: [SCRUM-68](https://anhkhoa080205.atlassian.net/browse/SCRUM-68), gồm SCRUM-69/70/71. Người thực hiện theo phân công cập nhật: Lê Anh Khoa. Ngày kiểm tra: 28/11/2026 (giờ Việt Nam). [README chính](../../../README.md) là điểm bắt đầu; [README automation](../../../qa/automation/README.md) giữ chi tiết script/fixture.

## Baseline và những gì đã đối chiếu

Mã ứng dụng/test trên `develop` khi bắt đầu T14: `10d1757d28ca4bbf3ddd2b6667559b1c7a8f308f`. Nhánh tài liệu T14 được tạo từ SHA này. Máy local dùng Node v22.18.0, PowerShell 7.6.10, PICT 3.7.4 và Docker với container web/SQL **đã tồn tại**. Không tạo lại hoặc xóa container có dữ liệu. T14 chỉ sửa README, `.env.example` và ghi chú tài liệu setup; không sửa mã ứng dụng hoặc test.

| Bước theo README | Kết quả quan sát | Kết luận |
| --- | --- | --- |
| Kiểm tra 34 liên kết nội bộ của README chính bằng `fs.existsSync` | 34/34 trỏ đến tệp/thư mục tồn tại | Pass về đường dẫn tệp; anchor trang phải kiểm tra khi xem trên GitHub |
| `pwsh -NoProfile -File qa/pairwise/install-pict.ps1` | PICT 3.7.4 đã cài, hash đúng | Pass |
| `generate.ps1`, `validate.ps1`, `validate-invalid-combinations.ps1` | 14 PW, 420 tổ hợp khả thi từ 6.912 tổ hợp thô, 253/253 cặp, 0 vi phạm | Pass |
| `node qa/pairwise/n02-cart/generate.mjs` | 8 dòng N02-PW, 30/30 cặp khả thi | Pass |
| `npm ci`; cài Chromium bằng `npx playwright install chromium` | Dependency theo lockfile cài thành công; Chromium cài/kiểm tra xong | Pass |
| `npm run test:list` | 59 test được liệt kê trong 7 file, gồm PW/N02/Cart/Checkout/N03/offline/smoke | Pass cho bước phát hiện test; chưa phải thực thi 59 ca |
| `npm run test:offline` | 8/8 ca oracle nội bộ Pass | Pass |
| `npm run test:case -- 'PW-001\b'` trên store local đã có | Lệnh chọn đúng một ca, nhưng ca được Skipped/`FIXTURE_BLOCKED` do SQL Server từ chối `QA_SQL_PASSWORD` trong môi trường local | Blocked, **không tính Pass hoặc Fail sản phẩm** |
| Kiểm tra `reports/html/index.html` và run manifest | Có report HTML/JSON/JUnit; run ID ca local: `AUTO-20261127190355266`, checkout mode `MultiStep` | Pass cho bước tạo và tìm report |

File `.env` local và cấu hình môi trường container có cùng chuỗi mật khẩu được khai báo, nhưng tài khoản `sa` trong SQL Server đang chạy từ chối chuỗi đó. Điều này có thể xảy ra khi database tồn tại từ trước và mật khẩu `sa` đã thay đổi sau khi tạo container. T14 không đặt lại mật khẩu hoặc database trên store có dữ liệu. [README chính](../../../README.md#7-ci-giới-hạn-và-lỗi-thường-gặp) đã bổ sung cách xử lý và chỉ rõ môi trường dùng một lần là lựa chọn để chạy từ đầu.

## Đối chứng môi trường sạch

Lượt CI của [PR #28](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce/pull/28) trên cùng baseline ứng dụng đã hoàn thành [workflow 46051688896](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce/actions/runs/46051688896) với các job build, pairwise-model và e2e Pass. Workflow dựng store/SQL/fixture và tài khoản QA **mới**, chạy 14/14 PW cùng 11/11 ADV Cart, kiểm tra không có ca thiếu/Skip/Fail, rồi dọn container. Bản PR T14 sẽ chạy lại workflow này trên commit tài liệu mới; cần ghi link/kết quả của lượt đó trước khi đóng issue.

Lượt CI là máy runner độc lập, không phải laptop cá nhân của Trang hay Linh. Theo yêu cầu mới của nhóm, Khoa tự làm cả ba subtask T14 và dùng lượt CI trên môi trường sạch làm đối chứng tái lập. CI chỉ bao phủ gate PW/ADV Cart; Checkout risk, payment decline và N03 race có precondition/report riêng trong [T12](../SCRUM-60/T12-RESULTS.md).

## Các chỉnh sửa từ lượt tự kiểm tra

- README chính có lệnh cụ thể cho máy mới và store local, cài PICT, sinh/kiểm tra hai model, chạy một ca và các suite, xem JSON/JUnit/HTML/trace, CI và lỗi thường gặp.
- Các link model, test data, kịch bản, risk register, report, RCA, kiến trúc, automation và CI nằm ngay trong README chính để mở trực tiếp trên GitHub.
- `.env.example` dùng đúng slug `/pw-shirt-variants`, tách email PW/N02 và khai báo tên biến cần thiết cho bootstrap; không có mật khẩu thật.
- `setup.md` được gắn nhãn tài liệu seed thủ công của mốc đầu kỳ; README automation bỏ trạng thái “chưa kiểm chứng live” đã lỗi thời và trỏ về T12.
- Tệp do PICT sinh được kiểm tra rồi khôi phục về nội dung commit vì T14 không đổi model hoặc ca kiểm thử.

Giới hạn: ca local PW-001 hiện Blocked do mật khẩu SQL của database cũ; không dùng nó làm bằng chứng Pass. Workflow PR T14 phải Pass trên môi trường sạch trước khi coi README đã được nghiệm thu từ đầu.
