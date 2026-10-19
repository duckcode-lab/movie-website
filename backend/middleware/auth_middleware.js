const { verifyAccessToken } = require("../utils/token");
const otpService = require("../services/otp_service");

function requireLogin(req, res, next) {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const decoded = verifyAccessToken(accessToken);

        if (decoded.type !== "access") {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token"
        });
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

            await otpService.verifyOtp(email, otp, expectedPurpose);
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