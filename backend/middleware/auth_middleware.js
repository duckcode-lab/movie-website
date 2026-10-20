const { verifyAccessToken } = require("../utils/token");
const otpService = require("../services/otp_service");
const accountModel = require("../models/auth/accounts");

async function requireLogin(req, res, next) {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    let decoded;
    try {
        decoded = verifyAccessToken(accessToken);
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token"
        });
    }

    if (decoded.type !== "access" || !decoded.id) {
        return res.status(401).json({
            success: false,
            message: "Invalid access token"
        });
    }

    try {
        const account = await accountModel.findById(decoded.id);
        if (!account) {
            return res.status(401).json({
                success: false,
                message: "Account no longer exists"
            });
        }

        req.user = { ...decoded, role: account.role };
        return next();
    } catch (error) {
        return next(error);
    }
}

// Kiểm tra là admin (Chấp nhận cả ADMIN và admin)
function isAdmin(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    const role = (user.role || '').toLowerCase();
    if (role === "admin") return next();

    return res.status(403).json({
        success: false,
        message: "Forbidden"
    });
}

// Kiểm tra là user (Chấp nhận cả USER và user)
function isUser(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    const role = (user.role || '').toLowerCase();
    if (role === "user") return next();

    return res.status(403).json({
        success: false,
        message: "Forbidden"
    });
}

// Kiểm tra là user hoặc admin
function isUserOrAdmin(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    const role = (user.role || '').toLowerCase();
    if (role === "user" || role === "admin") return next();

    return res.status(403).json({
        success: false,
        message: "Forbidden"
    });
}

// Kiểm tra otp
function verifyOtp(expectedPurpose) {
    return async function verifyOtpMiddleware(req, res, next) {
        try {
            const { email, otp} = req.body || {};

            if (!expectedPurpose) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP purpose'
                });
            }

            req.otpVerification = await otpService.verifyOtp(
                email,
                otp,
                expectedPurpose
            );
            return next();
        } catch (error) {
            if (
                error.message === 'Invalid email' ||
                error.message === 'Invalid or expired OTP'
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('Verify OTP error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unable to verify OTP'
            });
        }
    };
}

module.exports = {
    requireLogin,
    isAdmin,
    isUser,
    isUserOrAdmin,
    verifyOtp
};