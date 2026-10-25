import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/api';
import '../style/SiteLayout.css';

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export default function SiteLayout({
  children,
  headerContent,
  title,
  description,
  mainClassName = '',
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(readStoredUser);
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));
  const isAdmin = typeof user?.role === 'string' && user.role.toLowerCase() === 'admin';

  useEffect(() => {
    const syncUser = (event) => setUser(event.detail ?? readStoredUser());
    window.addEventListener('phimhd:user-updated', syncUser);
    return () => window.removeEventListener('phimhd:user-updated', syncUser);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    }
  };

  return (
    <div className="site-layout">
      <header className="site-layout-header">
        <div className={`site-layout-header-inner${headerContent ? ' has-header-content' : ''}`}>
          <Link to="/" className="site-layout-brand" aria-label="PhimHD - Trang chủ">
            <span className="site-layout-brand-mark" aria-hidden="true">▶</span>
            <span>PHIM<span>HD</span></span>
          </Link>

          {headerContent && (
            <div className="site-layout-header-content">{headerContent}</div>
          )}

          <nav className="site-layout-nav" aria-label="Điều hướng chính">
            {isAuthenticated ? (
              <>
                <details className="site-layout-user-menu">
                  <summary className="site-layout-user-greeting">
                    Xin chào, {user?.username || 'người dùng'}
                  </summary>
                  <div className="site-layout-user-dropdown">
                    <NavLink to="/profile">Xem profile</NavLink>
                    {isAdmin && (
                      <>
                        <NavLink to="/admin/genres">Thể loại</NavLink>
                        <NavLink to="/admin/movies/new">Thêm movie</NavLink>
                      </>
                    )}
                  </div>
                </details>
                <button type="button" className="site-layout-nav-button" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={location.pathname === '/login' ? 'is-current' : ''}
                >
                  Đăng nhập
                </NavLink>
                <NavLink
                  to="/register"
                  className={`site-layout-register${location.pathname === '/register' ? ' is-current' : ''}`}
                >
                  Đăng ký
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={`site-layout-main ${mainClassName}`.trim()}>
        {title && (
          <header className="site-layout-page-heading">
            <span className="site-layout-kicker">QUẢN TRỊ NỘI DUNG</span>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </header>
        )}
        {children}
      </main>

      <footer className="site-layout-footer">
        <Link to="/" className="site-layout-footer-brand">PHIMHD</Link>
        <span>Thế giới phim trong tầm tay</span>
      </footer>
    </div>
  );
}
