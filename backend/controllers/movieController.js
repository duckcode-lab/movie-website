const movieModel = require('../models/movieModel');

async function index(req, res, next) {
  try {
    const searchQuery = req.query.q ? req.query.q.trim() : '';
    const movies = await movieModel.search(searchQuery);

    res.render('index', {
      pageTitle: searchQuery ? `Tìm kiếm "${searchQuery}" - Phim` : 'Kho Phim Lẻ',
      movies,
      searchQuery
    });
  } catch (error) {
    next(error);
  }
}

async function watch(req, res, next) {
  try {
    const movie = await movieModel.findById(req.params.id);

    if (!movie) {
      return res.status(404).send('Không tìm thấy phim!');
    }

    res.render('watch', {
      pageTitle: `Xem phim ${movie.title}`,
      movie
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { index, watch };