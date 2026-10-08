const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT =  3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../views'));

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', movieRoutes);
app.use('/api/auth', authRoutes);

// Error Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Đã xảy ra lỗi trên hệ thống!');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});