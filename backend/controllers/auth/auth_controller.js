const authService = require("../../services/auth_service");

// Đăng ký 
async function register(req, res) {
    try {
        const { email, password, username, fullname } = req.body || {};

        if (!email || !password || !username || !fullname) {
            return res.status(400).json({
                success: false,
                message: "Email, password, username, and fullname are required"
            });
        }

        const user = await authService.register(
            email,
            password,
            username,
            fullname
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
        console.log("ALL COOKIES:", req.cookies);
        
        const refreshToken = req.cookies?.refreshToken;
        console.log("refreshToken: ", refreshToken);
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

// Lấy thông tin cá nhân
async function getProfile(req, res) {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];

        const user = await authService.getProfile(accessToken);
        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            data: user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { register, login, refreshToken, getProfile };