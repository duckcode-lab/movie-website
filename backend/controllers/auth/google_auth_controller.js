const googleAuthService = require('../../services/google_auth_service');

async function loginByGoogle(req, res) {
    try {
        const { credential } = req.body;

        const result = await googleAuthService.loginWithLinkedAccount(credential);

        return res.status(200).json({
            success: true,
            message: 'Login successfully',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
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