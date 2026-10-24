const genreModel = require('../models/genreModel');

function isPositiveInteger(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function validateName(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Dữ liệu thể loại không hợp lệ' };
  }

  const fields = Object.keys(body);
  if (fields.length !== 1 || fields[0] !== 'name') {
    return { error: 'Chỉ hỗ trợ trường name' };
  }

  if (typeof body.name !== 'string' || !body.name.trim()) {
    return { error: 'Tên thể loại là bắt buộc' };
  }

  const name = body.name.trim();
  if (name.length > 100) {
    return { error: 'Tên thể loại không được vượt quá 100 ký tự' };
  }

  return { name };
}

function handleDuplicate(error, res, next) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Thể loại này đã tồn tại'
    });
  }

  return next(error);
}

async function index(req, res, next) {
  try {
    const genres = await genreModel.findAll();
    return res.json({ success: true, data: { genres } });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const { name, error: validationError } = validateName(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const genre = await genreModel.create(name);
    return res.status(201).json({
      success: true,
      message: 'Đã tạo thể loại',
      data: { genre }
    });
  } catch (error) {
    return handleDuplicate(error, res, next);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  if (!isPositiveInteger(id)) {
    return res.status(400).json({ success: false, message: 'ID thể loại không hợp lệ' });
  }

  const { name, error: validationError } = validateName(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    if (!await genreModel.findById(id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thể loại' });
    }

    const genre = await genreModel.update(id, name);
    return res.json({
      success: true,
      message: 'Đã cập nhật thể loại',
      data: { genre }
    });
  } catch (error) {
    return handleDuplicate(error, res, next);
  }
}

async function remove(req, res, next) {
  const { id } = req.params;
  if (!isPositiveInteger(id)) {
    return res.status(400).json({ success: false, message: 'ID thể loại không hợp lệ' });
  }

  try {
    const removed = await genreModel.remove(id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thể loại' });
    }

    return res.status(204).end();
  } catch (error) {
    if (error.code === 'GENRE_IN_USE') {
      return res.status(409).json({
        success: false,
        message: `Không thể xóa thể loại này vì đang được sử dụng bởi ${error.movieCount} phim.`,
        data: { movieCount: error.movieCount }
      });
    }
    return next(error);
  }
}

module.exports = { index, create, update, remove };
