# Nhóm 1 | Kiểm thử phần mềm - nopCommerce

> Hướng dẫn dành cho thành viên nhóm: clone mã nguồn, khởi chạy cửa hàng và bắt đầu kiểm thử.

> Kiến trúc Shopping Cart và Checkout: [T03 - Architecture](docs/architecture.md).
[![Repository](https://img.shields.io/badge/GitHub-Nhom1__KiemThuPhanMem__NopCommerce-181717?logo=github)](https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce)
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

## Bắt đầu nhanh

### 1. Chuẩn bị

- Cài [Git](https://git-scm.com/downloads).
- Cài và mở [Docker Desktop](https://www.docker.com/products/docker-desktop/) (khuyên dùng), hoặc cài [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) nếu muốn chạy trực tiếp.

### 2. Clone dự án

```bash
git clone https://github.com/AKhoa82/Nhom1_KiemThuPhanMem_NopCommerce.git
cd Nhom1_KiemThuPhanMem_NopCommerce
```

### 3. Chạy bằng Docker

Từ thư mục gốc của dự án, chạy:

```bash
docker compose up --build
```

Lần chạy đầu tiên sẽ build ứng dụng và tải các image cần thiết, vì vậy có thể mất vài phút. Khi hoàn tất, mở **http://localhost** để bắt đầu cài đặt nopCommerce.

Ở bước cấu hình database trong trình cài đặt, nhập thông tin SQL Server của Docker Compose:

| Trường        | Giá trị                   |
| --------------- | --------------------------- |
| Database server | `nopcommerce_database`    |
| Database name   | `nopcommerce`             |
| Authentication  | SQL Server account          |
| Username        | `sa`                      |
| Password        | `nopCommerce_db_password` |

> Tài khoản database trên chỉ dành cho môi trường phát triển của nhóm. Không dùng cấu hình này cho môi trường thật.

Để dừng các container, nhấn `Ctrl+C` trong terminal. Cấu hình Compose hiện tại chưa gắn volume lưu bền cho database; xóa container bằng `docker compose down` có thể làm mất dữ liệu cửa hàng đã tạo.

## Chạy trực tiếp bằng .NET

Nếu không dùng Docker, hãy cài và khởi động SQL Server trước, sau đó mở terminal tại thư mục gốc dự án và chạy:

```bash
dotnet restore src/NopCommerce.sln
dotnet run --project src/Presentation/Nop.Web/Nop.Web.csproj
```

Mở địa chỉ HTTP/HTTPS được hiển thị trong terminal. Ở lần truy cập đầu tiên, hoàn tất trình cài đặt và nhập thông tin kết nối tới SQL Server đang chạy trên máy.

Có thể thay terminal bằng Visual Studio: mở `src/NopCommerce.sln`, đặt `Nop.Web` làm Startup Project rồi nhấn `F5`.

## Một vài lỗi thường gặp

- **Cổng 80 đã được sử dụng:** dừng ứng dụng đang chiếm cổng hoặc đổi mapping `80:80` thành `8080:80` trong `docker-compose.yml`; sau đó truy cập **http://localhost:8080**.
- **Không kết nối được database khi vừa khởi động:** chờ SQL Server khởi tạo xong rồi tải lại trang cài đặt.
- **Lệnh Docker Compose không chạy:** kiểm tra Docker Desktop đang mở và chạy `docker compose version`.

## Công nghệ

- nopCommerce, ASP.NET Core và .NET 10
- Microsoft SQL Server
- Docker Compose
