const commentModel = require('../models/commentModel');
const movieModel = require('../models/movieModel');
const userModel = require('../models/auth/users');

function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

async function list(req, res, next) {
  try {
    const movieId = req.params.movieId || req.query.movieId;
    if (!isPositiveInteger(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'ID phim không hợp lệ'
      });
    }

    const movie = await movieModel.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim'
      });
    }

    const comments = await commentModel.findVisibleByMovieId(movieId);
    return res.json({ success: true, data: comments });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const movieId = req.params.movieId || req.body?.movieId || req.body?.movie_id;

    if (!isPositiveInteger(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'ID phim không hợp lệ'
      });
    }

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận phải có từ 1 đến 2000 ký tự'
      });
    }

    const movie = await movieModel.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim'
      });
    }
    const accountId = req.user?.account_id || req.user?.accountId || req.user?.account?.id || req.user?.id;
    if (!isPositiveInteger(accountId)) {
      return res.status(401).json({
        success: false,
        message: 'Không xác thực được tài khoản người dùng'
      });
    }

    const user = await userModel.findByAccountId(accountId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ người dùng'
      });
    }

    await commentModel.create(movieId, accountId, content);
    return res.status(201).json({
      success: true,
      message: 'Đã gửi bình luận'
    });
  } catch (error) {
    console.error('Lỗi truy vấn SQL Bình luận:', error); 
    return next(error);
  }
}

async function hide(req, res, next) {
  try {
    const { movieId, commentId } = req.params;
    if (!isPositiveInteger(movieId) || !isPositiveInteger(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID phim hoặc bình luận không hợp lệ'
      });
    }

    const isHidden = req.body?.isHidden === undefined ? true : req.body.isHidden;
    if (typeof isHidden !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái ẩn không hợp lệ'
      });
    }

    const updated = await commentModel.setHidden(commentId, movieId, isHidden);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    return res.json({ success: true, message: isHidden ? 'Đã ẩn bình luận' : 'Đã hiện bình luận' });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { movieId, commentId } = req.params;
    if (!isPositiveInteger(movieId) || !isPositiveInteger(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID phim hoặc bình luận không hợp lệ'
      });
    }

    const removed = await commentModel.remove(commentId, movieId);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, create, hide, remove };