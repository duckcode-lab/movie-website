import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function readStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu user từ localStorage:', error);
    return null;
  }
}

function Header({
  searchQuery = '',
  onSearchQueryChange,
  onSearch,
  showSearch = true,
  logoHref = '/',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(readStoredUser);
  const isAdminPage =
    location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }

  return (
    <header className="navbar">
      <Link to={logoHref} className="logo">🎬 PhimHD</Link>

      {showSearch && !isAdminPage && (
        <form className="search-form" onSubmit={onSearch}>
          <input
            type="search"
            placeholder="Tìm phim hoặc thể loại (ví dụ: hành động)..."
            className="search-input"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange?.(event.target.value)}
          />
          <button type="submit" className="search-submit">Tìm</button>
        </form>
      )}

      <div className="auth-buttons">
        {user ? (
          <div className="user-info header-user-info">
            <span className="header-user-greeting">
              👋 {user.username || user.fullname || user.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="btn-login header-logout"
              type="button"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="header-guest-actions">
            <Link to="/login" className="btn-login">Đăng nhập</Link>
            <Link to="/register" className="btn-login header-register">Đăng ký</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
