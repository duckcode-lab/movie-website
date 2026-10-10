const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/auth_controller');

// 1. Route hiển thị giao diện Đăng nhập / Đăng ký (EJS)
router.get('/login', (req, res) => {
  res.render('auth', { error: null });
});

// 2. Các route xử lý API Auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh_token', authController.refreshToken);
router.get('/profile', authController.getProfile);

// 3. Route xử lý Đăng xuất (xóa token/cookie và chuyển về trang login)
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('accessToken');
  return res.redirect('/api/auth/login');
});

module.exports = router;