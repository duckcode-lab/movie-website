const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function refreshTokenCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: REFRESH_TOKEN_MAX_AGE
    };
}

function setRefreshTokenCookie(res, refreshToken) {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions());
}

function clearRefreshTokenCookie(res) {
    const { maxAge, ...options } = refreshTokenCookieOptions();
    res.clearCookie(REFRESH_TOKEN_COOKIE, options);
}

module.exports = {
    setRefreshTokenCookie,
    clearRefreshTokenCookie
};
