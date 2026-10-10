const movieModel = require('../models/movieModel');

// GET /api/movies?q=search_term
// Lấy danh sách phim hoặc tìm kiếm phim
async function index(req, res, next) {
  try {
    const searchQuery = req.query.q ? req.query.q.trim() : '';
    const movies = await movieModel.search(searchQuery);

    return res.status(200).json({
      success: true,
      message: searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Danh sách phim',
      data: {
        movies,
        searchQuery
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/movies/:id
// Lấy thông tin chi tiết một phim.
async function watch(req, res, next) {
  try {
    const movieId = req.params.id;
    const movie = await movieModel.findById(movieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim!'
      });
    }

    return res.status(200).json({
      success: true,
      data: { movie }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { index, watch };