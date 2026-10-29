import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGenres, getMovies } from '../api/api';
import SiteLayout from '../layout/SiteLayout.jsx';
import '../style/App.css';

export default function App() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [appliedGenreIds, setAppliedGenreIds] = useState([]);
  const [hoveredMovieId, setHoveredMovieId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [genreError, setGenreError] = useState('');

  const requestMovies = useCallback(async (query = '') => {
    const res = await getMovies(query.trim());
    const result = res.data?.data?.movies;

    if (!Array.isArray(result)) {
      throw new Error('Dữ liệu danh sách phim không hợp lệ.');
    }

    return result;
  }, []);

  const fetchMovies = useCallback((query = '') => {
    setLoading(true);
    setError('');

    requestMovies(query)
      .then(setMovies)
      .catch((err) => {
        console.error('Lỗi khi tải danh sách phim:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách phim. Vui lòng thử lại.');
      })
      .finally(() => setLoading(false));
  }, [requestMovies]);

  useEffect(() => {
    let isActive = true;

    requestMovies()
      .then((result) => {
        if (isActive) setMovies(result);
      })
      .catch((err) => {
        if (isActive) {
          console.error('Lỗi khi tải danh sách phim:', err);
          setError(err.response?.data?.message || 'Không thể tải danh sách phim. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    getGenres()
      .then((res) => {
        const result = res.data?.data?.genres;
        if (!Array.isArray(result)) {
          throw new Error('Dữ liệu thể loại không hợp lệ.');
        }
        if (isActive) setGenres(result);
      })
      .catch((err) => {
        if (isActive) {
          console.error('Lỗi khi tải danh sách thể loại:', err);
          setGenreError(err.response?.data?.message || 'Không thể tải danh sách thể loại.');
        }
      });

    return () => {
      isActive = false;
    };
  }, [requestMovies]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies(searchQuery);
  };

  const toggleGenre = (genreId) => {
    setSelectedGenreIds((current) =>
      current.includes(genreId)
        ? current.filter((id) => id !== genreId)
        : [...current, genreId]
    );
  };

  const clearGenreFilters = () => {
    setSelectedGenreIds([]);
    setAppliedGenreIds([]);
  };

  const filteredMovies = appliedGenreIds.length > 0
    ? movies.filter((movie) =>
        movie.genres?.some((genre) => appliedGenreIds.includes(Number(genre.id)))
      )
    : movies;
  const appliedGenreNames = genres
    .filter((genre) => appliedGenreIds.includes(Number(genre.id)))
    .map((genre) => genre.name);

  const hoveredMovie = movies.find((movie) => movie.id === hoveredMovieId);
  const searchForm = (
    <form className="search-form" onSubmit={handleSearch} role="search">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="search-icon">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        type="search"
        aria-label="Tìm phim"
        placeholder="Tìm tên phim, diễn viên..."
        className="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && (
        <button
          type="button"
          className="search-clear"
          aria-label="Xóa từ khóa tìm kiếm"
          onClick={() => {
            setSearchQuery('');
            fetchMovies();
          }}
        >
          ×
        </button>
      )}
      <button type="submit" className="search-submit" disabled={loading}>
        Tìm kiếm
      </button>
    </form>
  );

  return (
    <SiteLayout headerContent={searchForm} mainClassName="home-layout-main">
      <div className="app-container">
      <div className="dynamic-background" aria-hidden="true">
        {hoveredMovie?.bannerUrl || hoveredMovie?.posterUrl ? (
          <img
            key={hoveredMovie.id}
            className="dynamic-background-image is-visible"
            src={hoveredMovie.bannerUrl || hoveredMovie.posterUrl}
            alt=""
            onError={() => setHoveredMovieId(null)}
          />
        ) : (
          <div className="dynamic-background-image" />
        )}
      </div>
      <div className="background-overlay" aria-hidden="true" />

      <div className="page-content">
        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">KHÁM PHÁ THẾ GIỚI ĐIỆN ẢNH</p>
              <h2 id="catalog-title">
                {searchQuery.trim()
                  ? `Kết quả cho “${searchQuery.trim()}”`
                  : appliedGenreNames.length > 0
                    ? `Phim thể loại ${appliedGenreNames.join(' hoặc ')}`
                    : 'Danh sách phim nổi bật'}
              </h2>
            </div>
            {!loading && !error && (
              <span className="result-count">{filteredMovies.length} phim</span>
            )}
          </div>

          <div className="catalog-layout">
            <div className="catalog-results">
              {loading ? (
                <div className="catalog-message" role="status">
                  <span className="loading-spinner" />
                  <p>Đang tìm những bộ phim hay...</p>
                </div>
              ) : error ? (
                <div className="catalog-message" role="alert">
                  <p>{error}</p>
                  <button type="button" className="retry-button" onClick={() => fetchMovies(searchQuery)}>
                    Thử lại
                  </button>
                </div>
              ) : filteredMovies.length > 0 ? (
                <div
                  className="movie-grid"
                  onMouseLeave={() => setHoveredMovieId(null)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setHoveredMovieId(null);
                  }}
                >
                  {filteredMovies.map((movie) => (
                    <Link
                      to={`/watch/${movie.id}`}
                      key={movie.id}
                      className="movie-card"
                      onMouseEnter={() => setHoveredMovieId(movie.id)}
                      onFocus={() => setHoveredMovieId(movie.id)}
                    >
                      <div className="movie-poster-area">
                        <div className="poster-wrap">
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl}
                              alt={`Poster phim ${movie.title}`}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.hidden = true;
                              }}
                            />
                          ) : null}
                          <div className="poster-fallback" aria-hidden="true">
                            <span className="poster-fallback-mark">▶</span>
                            <span>{movie.title}</span>
                          </div>
                          <span className="poster-play" aria-hidden="true">▶</span>
                          {movie.quality && <span className="poster-quality">{movie.quality}</span>}
                        </div>
                        <div className="movie-hover-card">
                          <h3>{movie.title}</h3>
                          <div className="movie-hover-meta">
                            {movie.quality && <span className="movie-hover-quality">{movie.quality}</span>}
                            {movie.rating !== null && movie.rating !== undefined && movie.rating !== '' && (
                              <span className="movie-hover-rating">
                                <span aria-hidden="true">★</span> {Number(movie.rating).toFixed(1)}
                              </span>
                            )}
                            {movie.episodes && <span className="movie-hover-muted">{movie.episodes}</span>}
                            {movie.year && <span className="movie-hover-muted">{movie.year}</span>}
                          </div>
                          {movie.description && <p className="movie-hover-description">{movie.description}</p>}
                          <div className="movie-hover-details">
                            {movie.studio && (
                              <p>
                                <span aria-hidden="true">▣</span>
                                <span>{movie.studio}</span>
                              </p>
                            )}
                            {movie.genre && (
                              <p>
                                <span aria-hidden="true">▤</span>
                                <span>{movie.genre}</span>
                              </p>
                            )}
                            {movie.cast && (
                              <p>
                                <span aria-hidden="true">♟</span>
                                <span>{movie.cast}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="movie-info">
                        <h3>{movie.title}</h3>
                        <p>
                          {movie.year && <span>{movie.year}</span>}
                          {movie.year && movie.genre && <span className="meta-divider">·</span>}
                          {movie.genre && <span>{movie.genre}</span>}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="catalog-message">
                  <span className="empty-icon" aria-hidden="true">⌕</span>
                  <h3>Chưa tìm thấy phim phù hợp</h3>
                  <p>Thử tìm với tên phim hoặc chọn thể loại khác nhé.</p>
                </div>
              )}
            </div>
            <aside className="genre-filter" aria-labelledby="genre-filter-title">
              <div className="genre-filter-heading">
                <div>
                  <p className="section-kicker">LỌC DANH SÁCH</p>
                  <h3 id="genre-filter-title">Thể loại</h3>
                </div>
                {selectedGenreIds.length > 0 && (
                  <span className="genre-selection-count">{selectedGenreIds.length} đã chọn</span>
                )}
              </div>

              {genreError ? (
                <p className="genre-filter-error" role="alert">{genreError}</p>
              ) : genres.length > 0 ? (
                <div className="genre-options">
                  {genres.map((genre) => {
                    const genreId = Number(genre.id);
                    return (
                      <label className="genre-option" key={genre.id}>
                        <input
                          type="checkbox"
                          checked={selectedGenreIds.includes(genreId)}
                          onChange={() => toggleGenre(genreId)}
                        />
                        <span>{genre.name}</span>
                        <span className="genre-movie-count">{Number(genre.movieCount) || 0}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="genre-filter-hint">Chưa có thể loại để lọc.</p>
              )}

              {genres.length > 0 && !genreError && (
                <p className="genre-filter-hint">
                  Chọn một hoặc nhiều thể loại; phim khớp ít nhất một thể loại sẽ hiển thị.
                </p>
              )}

              <div className="genre-filter-actions">
                <button
                  type="button"
                  className="genre-apply-button"
                  onClick={() => setAppliedGenreIds(selectedGenreIds)}
                  disabled={Boolean(genreError) || genres.length === 0}
                >
                  Lọc phim
                </button>
                <button
                  type="button"
                  className="genre-clear-button"
                  onClick={clearGenreFilters}
                  disabled={selectedGenreIds.length === 0 && appliedGenreIds.length === 0}
                >
                  Xóa chọn
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
      </div>
    </SiteLayout>
  );
}
