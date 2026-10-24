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
5. Cấp cho tài khoản database quyền tạo bảng. Khi khởi động, backend tự tạo
   bảng thể loại/liên kết và tách các giá trị `movie.genre` hiện có theo dấu
   phẩy thành từng thể loại riêng. Có thể chạy `backend/sql/genres.sql` thủ công
   thay cho bước khởi tạo tự động.
6. Cài dependencies bằng `npm install`, rồi chạy `npm run seed` để nhập danh
   sách phim mẫu đang có trong dự án. Lệnh này giữ nguyên dữ liệu hiện tại và
   chỉ thêm các phim mẫu có ID chưa tồn tại.
7. Khởi chạy bằng `npm start`.

Ứng dụng kiểm tra kết nối MySQL trước khi bắt đầu lắng nghe cổng HTTP. Nếu kết
nối thất bại, kiểm tra thông tin trong `.env`, quyền database, và việc đã chạy
schema hay chưa.

## API quản lý hồ sơ và phim

Các API hồ sơ yêu cầu access token trong header `Authorization: Bearer <token>`.
Hồ sơ thường được tạo trong luồng đăng ký (`POST /api/auth/register` sau khi xác
minh OTP). Tài khoản đã đăng nhập chưa có hồ sơ có thể tạo bằng `POST
/api/auth/profile`; người dùng chỉ có thể quản lý hồ sơ của chính mình:

- `POST /api/auth/profile` — tạo hồ sơ với `username` và `full_name` bắt buộc;
  có thể gửi thêm `avatar_url`, `date_of_birth`, `gender`, `bio`.
- `GET /api/auth/profile`
- `PATCH /api/auth/profile` — nhận các trường `username`, `full_name`,
  `avatar_url`, `date_of_birth` (định dạng `YYYY-MM-DD`), `gender`, `bio`.
  Email và role không thể đổi qua API hồ sơ.
- `DELETE /api/auth/profile` — xóa vĩnh viễn tài khoản, hồ sơ, bình luận, OTP
  và liên kết đăng nhập của tài khoản. Client nên xóa token đã lưu sau khi nhận
  phản hồi thành công.

Đọc và tìm kiếm phim vẫn công khai qua `GET /api/movies` và `GET /api/movies/:id`.
Tạo, cập nhật hoặc xóa phim chỉ dành cho tài khoản có role `admin`:

- `POST /api/movies` — tạo phim, bắt buộc `title`.
- `PUT` hoặc `PATCH /api/movies/:id` — cập nhật một phần thông tin phim.
- `DELETE /api/movies/:id` — xóa phim.

Quản lý thể loại (chỉ admin) tại `/admin/genres`; trang xem phim cho phép admin
gán nhiều thể loại cho phim. API `/api/genres` hỗ trợ CRUD và phim nhận
`genreIds` (mảng ID thể loại) khi tạo hoặc cập nhật.
