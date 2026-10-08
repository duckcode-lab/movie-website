const { verifyAccessToken } = require("../utils/token");

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

// Kiểm tra là admin
function isAdmin(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    if (user.role === "admin") return next();

    return res.status(403).json({
        success: false,
        message: "Forbidden"
    });
}

// Kiểm tra là user
function isUser(req, res, next) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    if (user.role === "user") return next();

    return res.status(403).json({
        success: false,
        message: "Forbidden"
    });
}

module.exports = {
    requireLogin,
    isAdmin,
    isUser
};