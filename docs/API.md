# Tài liệu API Movie Website

Tài liệu này mô tả các endpoint được khai báo trong backend hiện tại. Một số
endpoint trả lỗi với thông báo tiếng Anh, một số trả tiếng Việt; frontend nên
ưu tiên xử lý theo HTTP status và trường `success` khi có.

## Tổng quan

- Base URL khi chạy local: `http://localhost:3000`
- API prefix: `/api`
- Dữ liệu request/response: JSON, trừ khi có ghi chú khác.
- CORS hiện chỉ cho phép origin `http://localhost:5173` và bật credentials.
- Backend đọc JSON body và URL-encoded body.
- Không có phân trang cho danh sách phim hoặc bình luận.

| Nhóm | Prefix |
|---|---|
| Phim | `/api/movies` |
| Thể loại | `/api/genres` |
| Tài khoản | `/api/auth` |
| Bình luận | `/api/comments` |

Endpoint kiểm tra server `GET /` trả về:

```json
{
  "message": "Movie Web API Server is running!",
  "endpoints": {
    "movies": "/api/movies",
    "genres": "/api/genres",
    "auth": "/api/auth",
    "comments": "/api/comments"
  }
}
```

## Xác thực

Các route được bảo vệ yêu cầu header `Authorization`, với giá trị gồm scheme
`Bearer` theo sau là access token.

Đăng nhập thường và Google login trả `accessToken` trong JSON và đặt
`refreshToken` vào cookie `HttpOnly` có thời hạn 30 ngày. Gửi request từ trình
duyệt cần bật credentials để cookie được gửi kèm. Role được lấy từ tài khoản
trong database; giá trị `admin` không phân biệt chữ hoa/chữ thường.

Lấy giá trị `accessToken` từ response đăng nhập, sau đó gửi trong header của
mỗi request cần xác thực (không gửi token trong query string hoặc JSON body):

```http
Authorization: Bearer <accessToken>
```

Ví dụ gọi API lấy hồ sơ:

```http
GET /api/auth/profile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <accessToken>
Accept: application/json
```

Các endpoint cần header này:

| Endpoint | Quyền |
|---|---|
| `GET`, `POST`, `PATCH`, `DELETE /api/auth/profile` | Đăng nhập |
| `POST /api/movies`, `PUT` hoặc `PATCH /api/movies/:id`, `DELETE /api/movies/:id` | Admin |
| `GET`, `POST`, `PUT`, `PATCH`, `DELETE /api/genres` | Admin |
| `POST /api/comments`, `POST /api/comments/:movieId/comments` | User/Admin |
| `PATCH`, `DELETE /api/comments/:movieId/comments/:commentId` | Admin |

Các endpoint ghi là **Công khai** không cần access token. Với API tạo/cập nhật
dữ liệu JSON, gửi thêm `Content-Type: application/json`. Thiếu token, token
không hợp lệ hoặc hết hạn sẽ nhận `401`; token hợp lệ nhưng không đủ quyền sẽ
nhận `403`.

| Quyền | Ý nghĩa |
|---|---|
| Công khai | Không cần đăng nhập |
| Đăng nhập | Cần access token hợp lệ |
| User/Admin | Chỉ role `user` hoặc `admin` |
| Admin | Chỉ role `admin` |

## Auth API

### Gửi OTP

`POST /api/auth/send_otp` — Công khai.

```json
{
  "email": "user@example.com",
  "purpose": "REGISTER"
}
```

`purpose` chỉ nhận `REGISTER` hoặc `RESET_PASSWORD` (phân biệt chữ hoa/thường).
OTP gồm 6 chữ số, mặc định có hiệu lực 5 phút; chỉ gửi lại sau thời gian chờ
mặc định 60 giây.

Thành công `200`:

```json
{ "message": "OTP sent successfully" }
```

Lỗi: `400` email hoặc purpose không hợp lệ; `429` yêu cầu gửi lại quá sớm;
`500` không gửi được email.

### Đăng ký

`POST /api/auth/register` — Công khai, nhưng bắt buộc OTP `REGISTER` hợp lệ
trong cùng request.

```json
{
  "email": "user@example.com",
  "password": "your-password",
  "username": "movie_fan",
  "fullname": "Nguyen Van A",
  "otp": "123456"
}
```

Thành công `201`:

```json
{
  "success": true,
  "message": "Register successfully",
  "data": {
    "accountId": 1,
    "username": "movie_fan",
    "email": "user@example.com",
    "fullname": "Nguyen Van A"
  }
}
```

Lỗi OTP hoặc dữ liệu đăng ký: `400` với `{ "success": false, "message": "..." }`.
Email hoặc username đã tồn tại cũng được trả về `400`. Đăng ký không tự đăng
nhập và không trả token; gọi login sau khi đăng ký thành công.

### Đăng nhập

`POST /api/auth/login` — Công khai.

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Thành công `200`:

```json
{
  "success": true,
  "message": "Login successfully",
  "accessToken": "<JWT>",
  "data": {
    "id": 1,
    "account_id": 1,
    "username": "movie_fan",
    "full_name": "Nguyen Van A",
    "avatar_url": null,
    "date_of_birth": null,
    "gender": null,
    "bio": null,
    "created_at": "<timestamp>",
    "updated_at": "<timestamp>",
    "accountId": 1,
    "role": "user"
  }
}
```

Các giá trị trong `data` phản ánh dữ liệu người dùng hiện có; trường thời gian
có định dạng do MySQL driver trả về. Lỗi thiếu thông tin hoặc thông tin đăng
nhập sai: `400`, cùng cấu trúc `{ "success": false, "message": "..." }`.

### Đăng nhập Google

`POST /api/auth/google/login` — Công khai. `credential` là Google ID token,
không phải access token của ứng dụng.

```json
{ "credential": "<Google ID token>" }
```

Thành công `200` đặt cookie `refreshToken` và trả `accessToken` cùng `data`
tương tự profile người dùng kèm `role`. Cookie có thuộc tính `HttpOnly`, thời
hạn 30 ngày và `SameSite=Lax`; thuộc tính `Secure` được bật trong production.
Nếu tài khoản Google chưa liên kết, backend tạo account và profile mới. Lỗi
xác thực Google: `401`.

### Cấp lại access token

`POST /api/auth/refresh_token` — Công khai theo khai báo route.

Backend chỉ đọc refresh token từ cookie tên `refreshToken`; body JSON hoặc
header Authorization không được dùng cho endpoint này. Thành công `200`:

```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "accessToken": "<JWT mới>"
}
```

Thiếu cookie hoặc token không hợp lệ: `400`. Cookie được gửi với request khi
client bật credentials.

### Đăng xuất

`POST /api/auth/logout` — Công khai. Xóa cookie `refreshToken`, trả `204` khi
thành công. Client cần bật credentials để cookie được xóa đúng.

### Lấy hồ sơ

`GET /api/auth/profile` — Đăng nhập.

Thành công `200`:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "account_id": 1,
    "username": "movie_fan",
    "full_name": "Nguyen Van A",
    "avatar_url": null,
    "date_of_birth": null,
    "gender": null,
    "bio": null,
    "created_at": "<timestamp>",
    "updated_at": "<timestamp>",
    "accountId": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Tạo hồ sơ

`POST /api/auth/profile` — Đăng nhập. Dùng cho account hiện chưa có hồ sơ.

```json
{
  "username": "movie_fan",
  "full_name": "Nguyen Van A",
  "avatar_url": "https://example.com/avatar.jpg",
  "date_of_birth": "2000-01-31",
  "gender": "other",
  "bio": "Tôi thích phim"
}
```

`username` và `full_name` bắt buộc, không được để trống. Các trường còn lại là
tùy chọn và có thể là `null`; ngày sinh phải là ngày hợp lệ theo `YYYY-MM-DD`.
Thành công `201` trả `{ "success": true, "message": "Đã tạo hồ sơ", "data": <profile> }`.
Hồ sơ đã tồn tại hoặc username trùng: `409`; dữ liệu không hợp lệ: `400`.

### Cập nhật hồ sơ

`PATCH /api/auth/profile` — Đăng nhập. Chỉ gửi các trường cần cập nhật; endpoint
`PUT` không được khai báo.

```json
{
  "full_name": "Nguyen Van B",
  "bio": null
}
```

Các trường được phép: `username`, `full_name`, `avatar_url`, `date_of_birth`,
`gender`, `bio`. Phải có ít nhất một trường; không nhận field lạ. `username` và
`full_name` không được là chuỗi rỗng; `date_of_birth` phải là ngày hợp lệ
`YYYY-MM-DD`. Giá trị khác nhận chuỗi hoặc `null`. Thành công `200` trả
`{ "success": true, "message": "Đã cập nhật hồ sơ", "data": <profile> }`.
Username trùng: `409`; dữ liệu không hợp lệ: `400`.

### Xóa hồ sơ / tài khoản

`DELETE /api/auth/profile` — Đăng nhập.

Thành công `204`, không có response body. Hành động này xóa vĩnh viễn account,
hồ sơ, bình luận của account, OTP theo email và liên kết provider của account.
Không tìm thấy hồ sơ/account: `404`. Frontend nên xóa token cục bộ sau `204`.

### Đặt lại mật khẩu

`PUT /api/auth/reset_password` — Công khai, nhưng bắt buộc OTP
`RESET_PASSWORD` hợp lệ trong cùng request.

```json
{
  "email": "user@example.com",
  "newPassword": "new-password",
  "otp": "123456"
}
```

Thành công `200`:

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": { "email": "user@example.com" }
}
```

Lỗi OTP, thiếu dữ liệu hoặc email không tồn tại: `400`.

## Movie API

### Danh sách và tìm kiếm phim

`GET /api/movies` — Công khai.

Tùy chọn query `q` tìm gần đúng theo `title`, `englishTitle`, `genre`, `cast`,
`director`, `studio` và `country`. Không có `q` hoặc `q` rỗng sẽ trả danh sách
phim mới nhất trước (ID giảm dần).

```http
GET /api/movies?q=batman
```

Thành công `200`:

```json
{
  "success": true,
  "message": "Kết quả tìm kiếm cho \"batman\"",
  "data": {
    "movies": [
      {
        "id": 1,
        "title": "Batman",
        "englishTitle": "Batman",
        "genre": "Action",
        "genres": [{ "id": 2, "name": "Action" }],
        "cast": "...",
        "director": "...",
        "studio": "...",
        "country": "...",
        "bannerUrl": "...",
        "posterUrl": "...",
        "videoUrl": "...",
        "quality": "HD",
        "rating": 8.5,
        "episodes": "1",
        "year": 2024,
        "description": "..."
      }
    ],
    "searchQuery": "batman"
  }
}
```

Danh sách trả các cột bảng `movie`, kèm `genres` là mảng `{ id, name }`.
`genre` vẫn được trả dưới dạng chuỗi tên phân cách bằng dấu phẩy để tương thích
với client cũ.

### Chi tiết phim

`GET /api/movies/:id` hoặc `GET /api/movies/watch/:id` — Công khai.

Thành công `200`: `{ "success": true, "data": { "movie": <movie> } }`.
ID không phải số nguyên dương: `400`; không tìm thấy phim: `404`.

### Tạo phim

`POST /api/movies` — Admin.

```json
{
  "title": "Tên phim",
  "englishTitle": "Movie title",
  "genreIds": [2, 5],
  "cast": "Actor A, Actor B",
  "director": "Director",
  "studio": "Studio",
  "country": "Vietnam",
  "bannerUrl": "https://example.com/banner.jpg",
  "posterUrl": "https://example.com/poster.jpg",
  "videoUrl": "https://example.com/video",
  "quality": "HD",
  "rating": 8.5,
  "episodes": "12",
  "year": 2025,
  "description": "Mô tả phim"
}
```

`title` bắt buộc. Các field còn lại tùy chọn. Field được hỗ trợ: `title`,
`englishTitle`, `genreIds`, `genre`, `cast`, `director`, `studio`, `country`, `bannerUrl`,
`posterUrl`, `videoUrl`, `quality`, `rating`, `episodes`, `year`, `description`.
`genreIds` là mảng ID thể loại đã tồn tại; gửi mảng rỗng để gỡ toàn bộ thể loại.
`genre` chuỗi vẫn được nhận để tương thích client cũ và được xem là một tên thể
loại nếu không gửi `genreIds`.
Field chuỗi có thể gửi `null`; `rating` là số hữu hạn hoặc `null`, `year` là số
nguyên hoặc `null`. Dữ liệu chuỗi được trim. Giới hạn chuỗi: `title` và
`englishTitle` 255; `genre` 255; `studio`/`director` 100; `country`/`quality`/
`episodes` 50; `bannerUrl`/`posterUrl`/`videoUrl` 500 ký tự.

Thành công `201`: `{ "success": true, "message": "Đã tạo phim", "data": { "movie": <movie> } }`.
Dữ liệu không hợp lệ hoặc field lạ: `400`.

### Cập nhật phim

`PUT /api/movies/:id` hoặc `PATCH /api/movies/:id` — Admin.

Nhận cùng tập field và quy tắc kiểu dữ liệu như tạo phim, nhưng chỉ cần gửi các
field cần thay đổi; không bắt buộc `title`. Thành công `200` trả
`{ "success": true, "message": "Đã cập nhật phim", "data": { "movie": <movie> } }`.
ID không hợp lệ hoặc body không hợp lệ: `400`; không tìm thấy phim: `404`.

### Xóa phim

`DELETE /api/movies/:id` — Admin.

Thành công `204`, không có response body. ID không hợp lệ: `400`; không tìm thấy
phim: `404`.

## Genre API

Tất cả endpoint thể loại yêu cầu đăng nhập bằng tài khoản `admin`. Backend tự
tạo bảng thể loại/liên kết và tách giá trị `movie.genre` theo dấu phẩy thành
các thể loại riêng lúc khởi động; tài khoản database cần có quyền tạo bảng.
Các hàng gộp cũ không còn được liên kết sẽ được dọn sau khi chuyển dữ liệu. Có
thể chạy `backend/sql/genres.sql` thủ công nếu cần.

### Danh sách thể loại

`GET /api/genres` — Admin.

Thành công `200`:

```json
{
  "success": true,
  "data": {
    "genres": [
      { "id": 2, "name": "Action", "movieCount": 4 }
    ]
  }
}
```

### Tạo thể loại

`POST /api/genres` — Admin.

```json
{ "name": "Drama" }
```

Tên bắt buộc, được trim và giới hạn 100 ký tự. Thành công `201`; tên trùng
nhận `409`, dữ liệu không hợp lệ nhận `400`.

### Cập nhật thể loại

`PUT /api/genres/:id` hoặc `PATCH /api/genres/:id` — Admin. Nhận body
`{ "name": "Tên mới" }`. Thành công `200`; ID không hợp lệ hoặc body không hợp
lệ nhận `400`, không tìm thấy nhận `404`, tên trùng nhận `409`.

### Xóa thể loại

`DELETE /api/genres/:id` — Admin. Chỉ xóa được thể loại chưa được phim nào sử
dụng. Thành công `204`; ID không hợp lệ nhận `400`, không tìm thấy nhận `404`,
thể loại đang được sử dụng nhận `409` kèm số phim đang liên kết.

## Comment API

### Danh sách bình luận theo phim

`GET /api/comments?movieId=:id` hoặc `GET /api/comments/:movieId/comments` —
Công khai.

```http
GET /api/comments?movieId=1
```

Thành công `200` trả danh sách trực tiếp tại `data`, theo thứ tự mới nhất trước:

```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "movieId": 1,
      "content": "Phim rất hay",
      "createdAt": "<timestamp>",
      "username": "movie_fan",
      "fullName": "Nguyen Van A"
    }
  ]
}
```

Danh sách chỉ bao gồm bình luận chưa ẩn. Thiếu/sai `movieId`: `400`; phim không
tồn tại: `404`.

### Tạo bình luận

`POST /api/comments` hoặc `POST /api/comments/:movieId/comments` — User/Admin.

Có thể gửi `movieId` hoặc `movie_id` trong body khi dùng route gốc. Khi dùng
route có `:movieId`, ID trên path được ưu tiên.

```json
{
  "movieId": 1,
  "content": "Phim rất hay"
}
```

`content` sau khi trim phải có từ 1 đến 2000 ký tự. Thành công `201`:

```json
{ "success": true, "message": "Đã gửi bình luận" }
```

ID phim sai hoặc nội dung không hợp lệ: `400`; phim không tồn tại: `404`; account
không có profile: `404`. Cần đăng nhập và tài khoản phải có hồ sơ người dùng.

### Ẩn / hiện bình luận

`PATCH /api/comments/:movieId/comments/:commentId` — Admin.

```json
{ "isHidden": true }
```

`isHidden` tùy chọn; nếu bỏ qua mặc định là `true` (ẩn). Gửi `false` để hiện lại.
Thành công `200`: `{ "success": true, "message": "Đã ẩn bình luận" }` hoặc
`{ "success": true, "message": "Đã hiện bình luận" }`. ID không hợp lệ hoặc
`isHidden` không phải boolean: `400`; không tìm thấy bình luận thuộc phim đó:
`404`.

### Xóa bình luận

`DELETE /api/comments/:movieId/comments/:commentId` — Admin.

Thành công `204`, không có response body. ID không hợp lệ: `400`; không tìm thấy
bình luận thuộc phim đó: `404`.

## Mã lỗi và xử lý phía frontend

| HTTP status | Ý nghĩa thường gặp |
|---|---|
| `400` | Body/query/ID không hợp lệ, OTP không hợp lệ, hoặc lỗi đăng nhập/đăng ký |
| `401` | Thiếu/sai access token hoặc Google authentication thất bại |
| `403` | Đã đăng nhập nhưng role không đủ quyền |
| `404` | Không tìm thấy phim, hồ sơ hoặc bình luận |
| `409` | Username trùng hoặc hồ sơ đã tồn tại |
| `429` | Gửi lại OTP quá sớm |
| `500` | Lỗi server hoặc dịch vụ gửi OTP |

Phần lớn lỗi có dạng `{ "success": false, "message": "..." }`. Một số lỗi OTP
được trả không có `success`; các thao tác `204` không có body. Không có endpoint
logout trong backend hiện tại.

## Cấu hình môi trường liên quan

Backend đọc các biến sau (ngoài cấu hình database trong `backend/.env.example`):

| Biến | Mục đích |
|---|---|
| `JWT_SECRET`, `JWT_ACCESS_TIME` | Ký access token và thời hạn |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_TIME` | Ký refresh token và thời hạn |
| `GOOGLE_CLIENT_ID` | Xác thực Google ID token |
| `OTP_SECRET` | HMAC hash OTP |
| `OTP_EXPIRES_MINUTES` | Thời hạn OTP, mặc định 5 phút |
| `OTP_RESEND_COOLDOWN_SECONDS` | Khoảng chờ gửi lại OTP, mặc định 60 giây |
| `OTP_MAX_ATTEMPTS` | Số lần nhập OTP tối đa, mặc định 5 |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Kết nối SMTP gửi OTP |
| `SMTP_PORT` | Cổng SMTP, mặc định 587 |
| `SMTP_SECURE` | Bật TLS trực tiếp khi giá trị là `true` |
| `SMTP_FROM` | Email người gửi tùy chọn |

Không đưa các giá trị bí mật vào frontend; chỉ cấu hình chúng trong môi trường
backend.
