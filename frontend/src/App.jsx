import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Khởi tạo state user từ localStorage trực tiếp (không bị cảnh báo ESLint)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        console.error('Lỗi khi đọc dữ liệu user từ localStorage:', err);
        return null;
      }
    }
    return null;
  });

  // Tải danh sách phim ban đầu
  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/movies');
        if (isMounted && res.data.success) {
          setMovies(res.data.data.movies || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phim:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovies();

    return () => {
      isMounted = false;
    };
  }, []);

  // Xử lý tìm kiếm phim
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`/api/movies?q=${searchQuery}`);
      if (res.data.success) {
        setMovies(res.data.data.movies || []);
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm phim:', err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <Link to="/" className="logo">🎬 PhimHD</Link>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Tìm kiếm phim..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-submit">Tìm</button>
        </form>

        <div className="auth-buttons">
          {user ? (
            <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                👋 {user.username || user.fullname}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn-login" 
                style={{ background: '#333', border: 'none', cursor: 'pointer' }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="btn-login">Đăng nhập</Link>
              <Link to="/register" className="btn-login" style={{ background: '#333' }}>Đăng ký</Link>
            </div>
          )}
        </div>
      </header>

      <main className="container">
        <h2 className="section-title">
          {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Danh Sách Phim Nổi Bật'}
        </h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Đang tải danh sách phim...</p>
        ) : movies.length > 0 ? (
          <div className="movie-grid">
            {movies.map((movie) => (
              <Link to={`/watch/${movie.id}`} key={movie.id} className="movie-card">
                <img src={movie.posterUrl} alt={movie.title} />
                <h3 className="movie-title">{movie.title}</h3>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#aaa', marginTop: '40px' }}>Không tìm thấy phim phù hợp.</p>
        )}
      </main>
    </div>
  );
}

export default App;