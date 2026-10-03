require('dotenv').config();
const express = require('express');
const path = require('path');
const movieRoutes = require('./routes/movieRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', movieRoutes);

// Error Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Đã xảy ra lỗi trên hệ thống!');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});