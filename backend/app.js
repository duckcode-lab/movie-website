const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Import CORS
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../views'));

// 1. Cho phép Frontend (Vite) truy cập API kèm Cookie/Credentials
app.use(cors({
  origin: 'http://localhost:5173', // Port mặc định của Vite Frontend
  credentials: true
}));

// Request body parsers & Cookie
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder (giữ lại nếu còn chứa ảnh/static uploads)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Chuyển tất cả prefix route về chuẩn REST API
app.use('/api/movies', movieRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.get('/', (req, res) => {
  res.json({
    message: "Movie Web API Server is running!",
    endpoints: {
      movies: "/api/movies",
      auth: "/api/auth",
      comments: "/api/comments"
    }
  });
});
// Error Middleware (Trả về JSON thay vì text/HTML)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi trên hệ thống!'
  });
});

app.listen(PORT, () => {
  console.log(`Server API đang chạy tại: http://localhost:${PORT}`);
});