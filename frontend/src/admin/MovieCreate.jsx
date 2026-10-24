import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createMovie, getGenres } from '../api/api';
import SiteLayout from '../layout/SiteLayout.jsx';
import '../style/MovieCreate.css';

const textFields = [
  { name: 'englishTitle', label: 'Tên tiếng Anh', maxLength: 255 },
  { name: 'cast', label: 'Diễn viên' },
  { name: 'director', label: 'Đạo diễn', maxLength: 100 },
  { name: 'studio', label: 'Hãng phim', maxLength: 100 },
  { name: 'country', label: 'Quốc gia', maxLength: 50 },
  { name: 'quality', label: 'Chất lượng', maxLength: 50 },
  { name: 'episodes', label: 'Số tập / thời lượng', maxLength: 50 },
  { name: 'posterUrl', label: 'URL poster', maxLength: 500 },
  { name: 'bannerUrl', label: 'URL banner', maxLength: 500 },
  { name: 'videoUrl', label: 'URL video', maxLength: 500 },
];

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

async function fetchGenreList() {
  const response = await getGenres();
  const result = response.data?.data?.genres;
  if (!Array.isArray(result)) {
    throw new Error('Dữ liệu danh sách thể loại không hợp lệ.');
  }
  return result;
}

export default function MovieCreate() {
  const [isAdmin] = useState(
    () => readStoredUser()?.role?.toLowerCase() === 'admin'
  );
  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState('');
  const [form, setForm] = useState({
    title: '',
    englishTitle: '',
    cast: '',
    director: '',
    studio: '',
    country: '',
    quality: '',
    episodes: '',
    posterUrl: '',
    bannerUrl: '',
    videoUrl: '',
    rating: '',
    year: '',
    description: '',
  });
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdMovie, setCreatedMovie] = useState(null);

  const loadGenres = async () => {
    setGenresLoading(true);
    setGenresError('');
    try {
      setGenres(await fetchGenreList());
    } catch (err) {
      setGenresError(
        err.response?.data?.message || err.message || 'Không thể tải thể loại.'
      );
    } finally {
      setGenresLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return undefined;
    let isActive = true;

    fetchGenreList()
      .then((result) => {
        if (isActive) setGenres(result);
      })
      .catch((err) => {
        if (isActive) {
          setGenresError(
            err.response?.data?.message || err.message || 'Không thể tải thể loại.'
          );
        }
      })
      .finally(() => {
        if (isActive) setGenresLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isAdmin]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
    setCreatedMovie(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setCreatedMovie(null);

    const payload = Object.fromEntries(
      Object.entries(form)
        .filter(([key, value]) => key === 'title' || value.trim() !== '')
        .map(([key, value]) => [
          key,
          ['rating', 'year'].includes(key) ? Number(value) : value.trim(),
        ])
    );
    payload.genreIds = selectedGenreIds;

    try {
      const response = await createMovie(payload);
      const movie = response.data?.data?.movie;
      if (!response.data?.success || !movie?.id) {
        throw new Error('Tạo phim không thành công. Vui lòng thử lại.');
      }
      setCreatedMovie(movie);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Không thể tạo phim.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <SiteLayout
        title="Không có quyền truy cập"
        description="Trang này chỉ dành cho quản trị viên."
      >
        <div className="movie-create-page">
          <section className="movie-create-card movie-create-denied">
            <Link to="/" className="movie-create-secondary">Quay về trang chủ</Link>
          </section>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout
      title="Thêm phim mới"
      description="Nhập thông tin phim và chọn một hoặc nhiều thể loại."
    >
      <div className="movie-create-page">
        {createdMovie && (
          <div className="movie-create-success" role="status">
            <span>Đã thêm phim “{createdMovie.title}”.</span>
            <Link to={`/watch/${createdMovie.id}`}>Xem phim</Link>
            <button type="button" onClick={() => setCreatedMovie(null)}>Thêm phim khác</button>
          </div>
        )}

      <form className="movie-create-card" onSubmit={handleSubmit}>
        <section className="movie-create-section">
          <h2>Thông tin cơ bản</h2>
          <div className="movie-create-grid">
            <label className="movie-create-field">
              <span>Tên phim <b>*</b></span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={255}
                required
              />
            </label>
            {textFields.slice(0, 1).map((field) => (
              <label className="movie-create-field" key={field.name}>
                <span>{field.label}</span>
                <input
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  maxLength={field.maxLength}
                />
              </label>
            ))}
            <label className="movie-create-field">
              <span>Năm phát hành</span>
              <input
                name="year"
                type="number"
                step="1"
                value={form.year}
                onChange={handleChange}
              />
            </label>
            <label className="movie-create-field">
              <span>Điểm đánh giá</span>
              <input
                name="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.rating}
                onChange={handleChange}
              />
            </label>
            {textFields.slice(1, 7).map((field) => (
              <label className="movie-create-field" key={field.name}>
                <span>{field.label}</span>
                <input
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  maxLength={field.maxLength}
                />
              </label>
            ))}
            <label className="movie-create-field movie-create-wide">
              <span>Mô tả</span>
              <textarea
                name="description"
                rows="5"
                value={form.description}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="movie-create-section">
          <h2>Thể loại</h2>
          {genresLoading ? (
            <p className="movie-create-hint" role="status">Đang tải thể loại...</p>
          ) : genresError ? (
            <div className="movie-create-inline-error" role="alert">
              <span>{genresError}</span>
              <button type="button" onClick={loadGenres}>Thử lại</button>
            </div>
          ) : genres.length === 0 ? (
            <p className="movie-create-hint">
              Chưa có thể loại nào. <Link to="/admin/genres">Tạo thể loại</Link> trước khi gán.
            </p>
          ) : (
            <div className="movie-create-genres">
              {genres.map((genre) => (
                <label key={genre.id}>
                  <input
                    type="checkbox"
                    checked={selectedGenreIds.includes(Number(genre.id))}
                    onChange={(event) => {
                      setSelectedGenreIds((current) => (
                        event.target.checked
                          ? [...current, Number(genre.id)]
                          : current.filter((id) => id !== Number(genre.id))
                      ));
                    }}
                  />
                  <span>{genre.name}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="movie-create-section">
          <h2>Hình ảnh và video</h2>
          <div className="movie-create-grid">
            {textFields.slice(7).map((field) => (
              <label className="movie-create-field movie-create-wide" key={field.name}>
                <span>{field.label}</span>
                <input
                  name={field.name}
                  type="url"
                  value={form[field.name]}
                  onChange={handleChange}
                  maxLength={field.maxLength}
                  placeholder="https://"
                />
              </label>
            ))}
          </div>
        </section>

        {error && <p className="movie-create-error" role="alert">{error}</p>}

        <div className="movie-create-actions">
          <Link to="/" className="movie-create-secondary">Hủy</Link>
          <button type="submit" disabled={saving || genresLoading || Boolean(genresError)}>
            {saving ? 'Đang tạo phim...' : 'Tạo phim'}
          </button>
        </div>
        </form>
      </div>
    </SiteLayout>
  );
}
