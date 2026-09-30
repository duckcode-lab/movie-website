const movieModel = require('../models/movieModel');

function index(req, res) {
  const searchQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  res.render('index', {
    pageTitle: searchQuery ? `Tìm kiếm "${searchQuery}" - Kho Phim lẻ` : 'Kho Phim lẻ',
    movies: movieModel.search(searchQuery),
    searchQuery
  });
}

function watch(req, res) {
  const movie = movieModel.findById(req.params.id);

  if (!movie) {
    return res.status(404).send('Không tìm thấy phim!');
  }

  res.render('watch', {
    pageTitle: `Xem phim ${movie.title} - kho phim lẻ`,
    movie
  });
}

module.exports = { index, watch };