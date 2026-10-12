const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/auth_controller');
const otpController = require('../controllers/auth/otp_controller');
const { verifyOtp } = require('../middleware/auth_middleware');

router.post('/register', verifyOtp('REGISTER'), authController.register);
router.post('/reset_password', verifyOtp('RESET_PASSWORD'), authController.resetPassword);
router.post('/verify_otp', verifyOtp(), authController.completeOtpAction);
router.post('/login', authController.login);
router.post('/refresh_token', authController.refreshToken);
router.get('/profile', authController.getProfile);
router.post('/send_otp', otpController.sendOtp);


module.exports = router;