const authService = require("../../services/auth_service");
const otpService = require("../../services/otp_service");
const { setRefreshTokenCookie, clearRefreshTokenCookie } = require("../../utils/authCookies");

const profileFields = {
    username: 'username',
    full_name: 'full_name',
    avatar_url: 'avatar_url',
    date_of_birth: 'date_of_birth',
    gender: 'gender',
    bio: 'bio'
};

function validateProfile(body, requireIdentityFields = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Dữ liệu hồ sơ không hợp lệ' };
    }

    const fields = Object.keys(body);
    if (
        fields.length === 0 ||
        fields.some((field) => !Object.hasOwn(profileFields, field))
    ) {
        return { error: 'Cung cấp ít nhất một trường hồ sơ hợp lệ' };
    }

    const changes = {};
    for (const field of fields) {
        const value = body[field];
        if (value !== null && typeof value !== 'string') {
            return { error: `Giá trị ${field} không hợp lệ` };
        }

        const normalized = typeof value === 'string' ? value.trim() : value;
        if (
            ['username', 'full_name'].includes(field) &&
            (typeof normalized !== 'string' || !normalized)
        ) {
            return { error: `${field} không được để trống` };
        }

        if (field === 'date_of_birth' && normalized !== null) {
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
            if (match) {
                const [, year, month, day] = match.map(Number);
                const date = new Date(Date.UTC(year, month - 1, day));
                if (
                    date.getUTCFullYear() === year &&
                    date.getUTCMonth() === month - 1 &&
                    date.getUTCDate() === day
                ) {
                    changes[profileFields[field]] = normalized;
                    continue;
                }
            }

            return { error: 'Ngày sinh phải theo định dạng YYYY-MM-DD hợp lệ' };
        }

        changes[profileFields[field]] = normalized;
    }

    if (
        requireIdentityFields &&
        (!Object.hasOwn(changes, 'username') || !Object.hasOwn(changes, 'full_name'))
    ) {
        return { error: 'username và full_name là bắt buộc để tạo hồ sơ' };
    }

    return { changes };
}

// Đăng ký 
async function register(req, res) {
    try {
        const user = await otpService.completeOtpAction(
            req.otpVerification,
            async () => {
                const { email, password, username, fullname } = req.body || {};

                if (!email || !password || !username || !fullname) {
                    throw new Error("Email, password, username, and fullname are required");
                }

                return authService.register(
                    email,
                    password,
                    username,
                    fullname
                );
            }
        );

        return res.status(201).json({
            success: true,
            message: "Register successfully",
            data: user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// Đặt lại mật khẩu sau khi xác minh OTP
async function resetPassword(req, res) {
    try {
        const result = await otpService.completeOtpAction(
            req.otpVerification,
            async () => {
                const { email, newPassword } = req.body || {};

                if (!email || !newPassword) {
                    throw new Error("Email and new password are required");
                }

                return authService.changePassword(email, newPassword);
            }
        );
        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function changeAuthenticatedPassword(req, res, next) {
    const { currentPassword, newPassword } = req.body || {};
    if (
        typeof currentPassword !== 'string' ||
        !currentPassword ||
        typeof newPassword !== 'string' ||
        !newPassword
    ) {
        return res.status(400).json({
            success: false,
            message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
        });
    }

    try {
        await authService.changeAuthenticatedPassword(req.user.id, currentPassword, newPassword);
        return res.json({
            success: true,
            message: 'Đã đổi mật khẩu'
        });
    } catch (error) {
        if (error.message === 'Current password is incorrect') {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }
        return next(error);
    }
}

// Đăng nhập
async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await authService.login(email, password);
        const { accessToken, refreshToken } = await authService.generateTokens(user.accountId, user.role);

        return res.status(200).json({
            success: true,
            message: "Login successfully",
            accessToken,
            refreshToken,
            data: user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// Cấp lại accessToken
async function refreshToken(req, res) {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const accessToken = await authService.refreshToken(refreshToken);
        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            accessToken
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

function logout(req, res) {
    clearRefreshTokenCookie(res);
    return res.status(204).end();
}

// Lấy thông tin cá nhân
async function getProfile(req, res, next) {
    try {
        const user = await authService.getProfile(req.user.id);
        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            data: user
        });
    } catch (error) {
        if (error.message === 'User does not exist' || error.message === 'Account does not exist') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        return next(error);
    }
}

async function updateProfile(req, res, next) {
    try {
        const { changes, error } = validateProfile(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const profile = await authService.updateProfile(req.user.id, changes);
        return res.json({
            success: true,
            message: 'Đã cập nhật hồ sơ',
            data: profile
        });
    } catch (error) {
        if (error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        return next(error);
    }
}

async function createProfile(req, res, next) {
    try {
        const { changes, error } = validateProfile(req.body, true);
        if (error) {
            return res.status(400).json({ success: false, message: error });
        }

        const profile = await authService.createProfile(req.user.id, changes);
        return res.status(201).json({
            success: true,
            message: 'Đã tạo hồ sơ',
            data: profile
        });
    } catch (error) {
        if (error.message === 'Profile already exists' ||
            error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        return next(error);
    }
}

async function deleteProfile(req, res, next) {
    try {
        const deleted = await authService.deleteProfile(req.user.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ'
            });
        }

        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    register,
    resetPassword,
    changeAuthenticatedPassword,
    login,
    refreshToken,
    logout,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile
};
