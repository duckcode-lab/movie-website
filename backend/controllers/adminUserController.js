const adminUserModel = require('../models/adminUserModel');

function parsePositiveInteger(value) {
  if (!/^[1-9]\d*$/.test(String(value))) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function list(req, res, next) {
  try {
    const page = req.query.page === undefined ? 1 : parsePositiveInteger(req.query.page);
    const requestedLimit = req.query.limit === undefined ? 20 : parsePositiveInteger(req.query.limit);
    const role = req.query.role === undefined ? '' : String(req.query.role).toLowerCase();
    const query = req.query.q === undefined ? '' : String(req.query.q).trim();

    if (!page || !requestedLimit || requestedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'page phải là số nguyên dương; limit phải từ 1 đến 100'
      });
    }

    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role chỉ nhận giá trị admin hoặc user'
      });
    }

    const filters = { query, role };
    const [users, total] = await Promise.all([
      adminUserModel.findAll({
        ...filters,
        limit: requestedLimit,
        offset: (page - 1) * requestedLimit
      }),
      adminUserModel.countAll(filters)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit: requestedLimit,
          total,
          totalPages: Math.ceil(total / requestedLimit)
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const accountId = parsePositiveInteger(req.params.id);
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'ID tài khoản phải là số nguyên dương'
      });
    }

    const user = await adminUserModel.findById(accountId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const accountId = parsePositiveInteger(req.params.id);
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'ID tài khoản phải là số nguyên dương'
      });
    }

    if (
      !req.body ||
      Array.isArray(req.body) ||
      Object.keys(req.body).length !== 1 ||
      !Object.hasOwn(req.body, 'role') ||
      !['admin', 'user'].includes(String(req.body.role).toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Body chỉ được chứa role với giá trị admin hoặc user'
      });
    }

    if (accountId === Number(req.user.id)) {
      return res.status(409).json({
        success: false,
        message: 'Không thể tự thay đổi quyền của chính mình'
      });
    }

    const result = await adminUserModel.updateRole(
      accountId,
      String(req.body.role).toLowerCase()
    );
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    if (result.lastAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Không thể hạ quyền admin cuối cùng'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật quyền tài khoản',
      data: result.user
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const accountId = parsePositiveInteger(req.params.id);
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'ID tài khoản phải là số nguyên dương'
      });
    }

    if (accountId === Number(req.user.id)) {
      return res.status(409).json({
        success: false,
        message: 'Không thể tự xóa tài khoản đang đăng nhập'
      });
    }

    const result = await adminUserModel.remove(accountId);
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    if (result.lastAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Không thể xóa admin cuối cùng'
      });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

module.exports = { list, getById, updateRole, remove };
