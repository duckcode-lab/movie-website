const movieModel = require('../models/movieModel');

const editableFields = new Set([
  'title',
  'englishTitle',
  'genre',
  'cast',
  'director',
  'studio',
  'country',
  'bannerUrl',
  'posterUrl',
  'videoUrl',
  'quality',
  'rating',
  'episodes',
  'year',
  'description'
]);

const maxLengths = {
  title: 255,
  englishTitle: 255,
  genre: 255,
  studio: 100,
  director: 100,
  country: 50,
  quality: 50,
  episodes: 50,
  posterUrl: 500,
  bannerUrl: 500,
  videoUrl: 500
};

function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function validateMovie(body, requireTitle) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Dữ liệu phim không hợp lệ' };
  }

  const fields = Object.keys(body);
  if (fields.some((field) => !editableFields.has(field))) {
    return { error: 'Có trường dữ liệu phim không được hỗ trợ' };
  }

  if (fields.length === 0) {
    return { error: 'Vui lòng cung cấp ít nhất một trường dữ liệu phim' };
  }

  const movie = {};
  for (const field of fields) {
    const value = body[field];
    if (['year', 'rating'].includes(field) && value !== null) {
      const number = typeof value === 'string' && value.trim() ? Number(value) : value;
      if (
        typeof number !== 'number' ||
        !Number.isFinite(number) ||
        (field === 'year' && !Number.isInteger(number))
      ) {
        return { error: `Giá trị ${field} không hợp lệ` };
      }
      movie[field] = number;
      continue;
    }

    if (value !== null && typeof value !== 'string' && typeof value !== 'number') {
      return { error: `Giá trị ${field} không hợp lệ` };
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return { error: `Giá trị ${field} không hợp lệ` };
    }
    movie[field] = typeof value === 'string' ? value.trim() : value;
    if (
      typeof movie[field] === 'string' &&
      maxLengths[field] &&
      movie[field].length > maxLengths[field]
    ) {
      return { error: `${field} vượt quá ${maxLengths[field]} ký tự` };
    }
  }

  if ((requireTitle || Object.hasOwn(movie, 'title')) &&
      (typeof movie.title !== 'string' || !movie.title)) {
    return { error: 'Tên phim là bắt buộc' };
  }

  return { movie };
}

// GET /api/movies?q=search_term
// Lấy danh sách phim hoặc tìm kiếm phim
async function index(req, res, next) {
  try {
    const searchQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
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

async function create(req, res, next) {
  try {
    const { movie, error } = validateMovie(req.body, true);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const createdMovie = await movieModel.create(movie);
    return res.status(201).json({
      success: true,
      message: 'Đã tạo phim',
      data: { movie: createdMovie }
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    if (!isPositiveInteger(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phim không hợp lệ'
      });
    }

    const { movie, error } = validateMovie(req.body, false);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const existingMovie = await movieModel.findById(id);
    if (!existingMovie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim!'
      });
    }

    const updatedMovie = await movieModel.update(id, movie);
    return res.json({
      success: true,
      message: 'Đã cập nhật phim',
      data: { movie: updatedMovie }
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    if (!isPositiveInteger(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phim không hợp lệ'
      });
    }

    const removed = await movieModel.remove(id);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim!'
      });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

module.exports = { index, watch, create, update, remove };