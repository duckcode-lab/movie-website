const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/auth_controller');
const otpController = require('../controllers/auth/otp_controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh_token', authController.refreshToken);
router.get('/profile', authController.getProfile);
router.post('/send_otp', otpController.sendOtp);
router.post('/verify_otp', otpController.verifyOtp);

module.exports = router;