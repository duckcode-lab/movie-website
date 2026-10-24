const googleAuthService = require('../../services/google_auth_service');
const { setRefreshTokenCookie } = require('../../utils/authCookies');

async function loginByGoogle(req, res) {
    try {
        const { credential } = req.body;

        const result = await googleAuthService.loginWithLinkedAccount(credential);
        setRefreshTokenCookie(res, result.refreshToken);

        return res.status(200).json({
            success: true,
            message: 'Login successfully',
            accessToken: result.accessToken,
            data: result.exitsUser
        });
    } catch (error) {
        console.error('Google token verification failed:', error.message);

        return res.status(401).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
}

module.exports = { loginByGoogle };