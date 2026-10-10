const express = require('express');
const commentController = require('../controllers/commentController');
const { requireLogin, isAdmin, isUserOrAdmin } = require('../middleware/auth_middleware');

const router = express.Router();

// 1. Lấy danh sách bình luận (Hỗ trợ cả /api/comments/1 và /api/comments?movieId=1)
router.get('/', commentController.list);
router.get('/:movieId/comments', commentController.list);

// 2. Tạo bình luận (Hỗ trợ cả /api/comments VÀ /api/comments/:movieId/comments)
router.post('/', requireLogin, isUserOrAdmin, commentController.create);
router.post('/:movieId/comments', requireLogin, isUserOrAdmin, commentController.create);

// 3. Ẩn / Xóa bình luận
router.patch('/:movieId/comments/:commentId', requireLogin, isAdmin, commentController.hide);
router.delete('/:movieId/comments/:commentId', requireLogin, isAdmin, commentController.remove);

module.exports = router;