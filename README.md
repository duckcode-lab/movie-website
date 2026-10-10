# Kho Phim lẻ

## Kết nối MySQL

1. Tạo database `movie` nếu chưa có:

   ```sql
   CREATE DATABASE movie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Cấp quyền cho tài khoản MySQL `user` trên database `movie`, sau đó chạy
   `sql/schema.sql` trong database đó để tạo bảng `movie`.
3. Chạy tiếp `backend/sql/comments.sql` trên đúng database được cấu hình trong
   `DB_NAME` (ví dụ `movieDB`) để tạo bảng bình luận. Ví dụ, nếu `DB_NAME=movieDB`:

   ```bash
   mysql -u user -p movieDB < sql/comments.sql
   ```

   Bảng này lưu bình luận theo phim và tài khoản; chỉ admin được ẩn hoặc xóa.
   Trang xem phim đọc access token từ `localStorage` với khóa `accessToken` để
   hiện form cho tài khoản đã đăng nhập.
4. Sao chép `.env.example` thành `.env` và cập nhật `DB_HOST`, `DB_PORT`,
   `DB_USER`, `DB_PASSWORD`, và `DB_NAME` theo cấu hình MySQL của bạn.
5. Cài dependencies bằng `npm install`, rồi chạy `npm run seed` để nhập danh
   sách phim mẫu đang có trong dự án. Lệnh này giữ nguyên dữ liệu hiện tại và
   chỉ thêm các phim mẫu có ID chưa tồn tại.
6. Khởi chạy bằng `npm start`.

Ứng dụng kiểm tra kết nối MySQL trước khi bắt đầu lắng nghe cổng HTTP. Nếu kết
nối thất bại, kiểm tra thông tin trong `.env`, quyền database, và việc đã chạy
schema hay chưa.
