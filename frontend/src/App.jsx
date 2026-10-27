import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
      const res = await axios.get('/api/movies', {
        params: { q: searchQuery.trim() }
      });
      if (res.data.success) {
        setMovies(res.data.data.movies || []);
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm phim:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
      />

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