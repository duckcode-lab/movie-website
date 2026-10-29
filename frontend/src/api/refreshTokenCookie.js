const REFRESH_TOKEN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
const REFRESH_TOKEN_COOKIE_PATH = '/api/auth';

function getCookieAttributes() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  return `Path=${REFRESH_TOKEN_COOKIE_PATH}; SameSite=Lax${secure}`;
}

export function saveRefreshTokenCookie(refreshToken) {
  const expires = new Date(Date.now() + REFRESH_TOKEN_COOKIE_MAX_AGE * 1000).toUTCString();
  document.cookie = `refreshToken=${encodeURIComponent(refreshToken)}; Expires=${expires}; Max-Age=${REFRESH_TOKEN_COOKIE_MAX_AGE}; ${getCookieAttributes()}`;
}

export function clearRefreshTokenCookie() {
  document.cookie = `refreshToken=; Max-Age=0; ${getCookieAttributes()}`;
}
