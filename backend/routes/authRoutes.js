const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/auth_controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh_token', authController.refreshToken);
router.get('/profile', authController.getProfile);
module.exports = router;