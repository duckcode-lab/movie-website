import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminMovieService } from '../../services/AdminMovieService.jsx';
import '../../styles/admin-movies.css';

function getMovieGenreIds(movie, genres) {
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres.map((genre) => Number(genre.id));
  }

  const movieGenreNames = new Set(
    (movie.genre || '')
      .split(',')
      .map((name) => name.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
  return genres
    .filter((genre) => movieGenreNames.has(genre.name.toLocaleLowerCase()))
    .map((genre) => Number(genre.id));
}

function splitEpisodes(value) {
  const [current = '', ...totalParts] = String(value || '').split('/');
  return {
    episodeCurrent: current.trim(),
    episodeTotal: totalParts.join('/').trim(),
  };
}

function createEmptyForm() {
  return {
    title: '',
    englishTitle: '',
    year: '',
    quality: '',
    rating: '',
    episodeCurrent: '',
    episodeTotal: '',
    studio: '',
    director: '',
    cast: '',
    description: '',
    country: '',
    posterUrl: '',
    bannerUrl: '',
    videoUrl: '',
    genreIds: [],
  };
}

function MoviePoster({ movie }) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <div className="admin-movie-poster">
      {movie.posterUrl && !hasImageError ? (
        <img
          src={movie.posterUrl}
          alt={`Poster phim ${movie.title}`}
          loading="lazy"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span aria-label="Chưa có ảnh">Không có ảnh</span>
      )}
    </div>
  );
}

export default function MovieManagementPage() {
  const {
    movies,
    genres,
    loading,
    saving,
    error,
    notice,
    loadData,
    createMovie,
    updateMovie,
    deleteMovie,
  } = useAdminMovieService();
  const [search, setSearch] = useState('');
  const [editingMovie, setEditingMovie] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [formError, setFormError] = useState('');

  const filteredMovies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return movies;
    return movies.filter((movie) => (
      [movie.title, movie.englishTitle, movie.genre]
        .some((value) => value?.toLocaleLowerCase().includes(query))
    ));
  }, [movies, search]);

  const closeForm = () => {
    setEditingMovie(null);
    setForm(createEmptyForm());
    setFormError('');
  };

  const openCreateForm = () => {
    closeForm();
    setEditingMovie(false);
  };

  const openEditForm = (movie) => {
    setEditingMovie(movie);
    const episodeParts = splitEpisodes(movie.episodes);
    setForm({
      title: movie.title || '',
      englishTitle: movie.englishTitle || '',
      year: movie.year == null ? '' : String(movie.year),
      quality: movie.quality || '',
      rating: movie.rating == null ? '' : String(movie.rating),
      ...episodeParts,
      studio: movie.studio || '',
      director: movie.director || '',
      cast: movie.cast || '',
      description: movie.description || '',
      country: movie.country || '',
      posterUrl: movie.posterUrl || '',
      bannerUrl: movie.bannerUrl || '',
      videoUrl: movie.videoUrl || '',
      genreIds: getMovieGenreIds(movie, genres),
    });
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setFormError('Vui lòng nhập tên phim.');
      return;
    }

    const episodes = [form.episodeCurrent.trim(), form.episodeTotal.trim()]
      .filter(Boolean)
      .join(' / ');
    const payload = {
      title,
      englishTitle: form.englishTitle.trim(),
      year: form.year.trim() ? Number(form.year) : null,
      quality: form.quality.trim(),
      rating: form.rating.trim() ? Number(form.rating) : null,
      episodes,
      studio: form.studio.trim(),
      director: form.director.trim(),
      cast: form.cast.trim(),
      description: form.description.trim(),
      country: form.country.trim(),
      posterUrl: form.posterUrl.trim(),
      bannerUrl: form.bannerUrl.trim(),
      videoUrl: form.videoUrl.trim(),
      genreIds: form.genreIds,
    };
    const savedMovie = editingMovie
      ? await updateMovie(editingMovie.id, payload)
      : await createMovie(payload);

    if (savedMovie) closeForm();
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phim "${movie.title}"?`)) return;
    await deleteMovie(movie);
  };

  return (
    <section className="admin-movies-page">
      <header className="admin-movies-heading">
        <div>
          <h1>Quản lý phim</h1>
          <p>Danh sách phim, thể loại và số tập hiện tại.</p>
        </div>
        <button
          className="admin-movies-primary-button"
          onClick={openCreateForm}
          type="button"
        >
          + Thêm phim
        </button>
      </header>

      {error && (
        <div className="admin-movies-message is-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadData}>Thử lại</button>
        </div>
      )}
      {notice && <p className="admin-movies-message is-success" role="status">{notice}</p>}

      <div className="admin-movies-toolbar">
        <span>{filteredMovies.length} / {movies.length} phim</span>
        <label>
          <span className="sr-only">Tìm phim</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc thể loại..."
          />
        </label>
      </div>

      {editingMovie !== null && (
        <form className="admin-movie-form" onSubmit={handleSubmit}>
          <div className="admin-movie-form-heading">
            <h2>{editingMovie ? 'Sửa thông tin phim' : 'Thêm phim'}</h2>
            <button type="button" onClick={closeForm} aria-label="Đóng form">×</button>
          </div>
          <div className="admin-movie-form-grid">
            <label>
              <span>Tên phim <b>*</b></span>
              <input
                autoFocus
                name="title"
                maxLength={255}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Tên tiếng Anh</span>
              <input
                name="englishTitle"
                maxLength={255}
                value={form.englishTitle}
                onChange={(event) => setForm((current) => ({ ...current, englishTitle: event.target.value }))}
              />
            </label>
            <label>
              <span>Năm phát hành</span>
              <input
                name="year"
                type="number"
                step="1"
                value={form.year}
                onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label>
              <span>Chất lượng</span>
              <input
                name="quality"
                maxLength={50}
                value={form.quality}
                onChange={(event) => setForm((current) => ({ ...current, quality: event.target.value }))}
                placeholder="Ví dụ: HD, Full HD, 4K"
              />
            </label>
            <label>
              <span>Điểm</span>
              <input
                name="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.rating}
                onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
              />
            </label>
            <fieldset className="admin-movie-episodes-field">
              <legend>Tập (hiện tại / tổng số)</legend>
              <div className="admin-movie-episodes-inputs">
                <input
                  aria-label="Số tập hiện tại"
                  maxLength={23}
                  value={form.episodeCurrent}
                  onChange={(event) => setForm((current) => ({ ...current, episodeCurrent: event.target.value }))}
                  placeholder="Đã chiếu"
                />
                <span aria-hidden="true">/</span>
                <input
                  aria-label="Tổng số tập"
                  maxLength={23}
                  value={form.episodeTotal}
                  onChange={(event) => setForm((current) => ({ ...current, episodeTotal: event.target.value }))}
                  placeholder="Tổng số"
                />
              </div>
            </fieldset>
            <label>
              <span>Nhà xuất bản</span>
              <input
                name="studio"
                maxLength={100}
                value={form.studio}
                onChange={(event) => setForm((current) => ({ ...current, studio: event.target.value }))}
              />
            </label>
            <label>
              <span>Tác giả / Đạo diễn</span>
              <input
                name="director"
                maxLength={100}
                value={form.director}
                onChange={(event) => setForm((current) => ({ ...current, director: event.target.value }))}
              />
            </label>
            <label>
              <span>Diễn viên</span>
              <input
                name="cast"
                value={form.cast}
                onChange={(event) => setForm((current) => ({ ...current, cast: event.target.value }))}
              />
            </label>
            <label>
              <span>Quốc gia</span>
              <input
                name="country"
                maxLength={50}
                value={form.country}
                onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
              />
            </label>
            <label>
              <span>Poster URL</span>
              <input
                name="posterUrl"
                type="url"
                maxLength={500}
                value={form.posterUrl}
                onChange={(event) => setForm((current) => ({ ...current, posterUrl: event.target.value }))}
                placeholder="https://"
              />
            </label>
            <label>
              <span>Banner URL</span>
              <input
                name="bannerUrl"
                type="url"
                maxLength={500}
                value={form.bannerUrl}
                onChange={(event) => setForm((current) => ({ ...current, bannerUrl: event.target.value }))}
                placeholder="https://"
              />
            </label>
            <label>
              <span>Video URL</span>
              <input
                name="videoUrl"
                type="url"
                maxLength={500}
                value={form.videoUrl}
                onChange={(event) => setForm((current) => ({ ...current, videoUrl: event.target.value }))}
                placeholder="https://"
              />
            </label>
            <label className="admin-movie-description-field">
              <span>Mô tả</span>
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <fieldset>
              <legend>Thể loại phim</legend>
              {genres.length === 0 ? (
                <p>Chưa có thể loại. <Link to="/admin/genres">Tạo thể loại</Link> trước.</p>
              ) : (
                <div className="admin-movie-genre-options">
                  {genres.map((genre) => (
                    <label key={genre.id}>
                      <input
                        type="checkbox"
                        checked={form.genreIds.includes(Number(genre.id))}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          genreIds: event.target.checked
                            ? [...current.genreIds, Number(genre.id)]
                            : current.genreIds.filter((id) => id !== Number(genre.id)),
                        }))}
                      />
                      {genre.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </div>
          {formError && <p className="admin-movies-message is-error" role="alert">{formError}</p>}
          <div className="admin-movie-form-actions">
            <button type="button" className="admin-movies-secondary-button" onClick={closeForm}>
              Hủy
            </button>
            <button className="admin-movies-primary-button" disabled={saving} type="submit">
              {saving ? 'Đang lưu...' : editingMovie ? 'Lưu thay đổi' : 'Thêm phim'}
            </button>
          </div>
        </form>
      )}

      <div className="admin-movies-list">
        {loading ? (
          <p className="admin-movies-empty" role="status">Đang tải danh sách phim...</p>
        ) : filteredMovies.length === 0 ? (
          <p className="admin-movies-empty">
            {movies.length ? 'Không tìm thấy phim phù hợp.' : 'Chưa có phim nào.'}
          </p>
        ) : (
          filteredMovies.map((movie) => (
            <article className="admin-movie-card" key={movie.id}>
              <MoviePoster movie={movie} />
              <div className="admin-movie-info">
                <h2>{movie.title || 'Chưa có tên phim'}</h2>
                {movie.englishTitle && <p><strong>Tên tiếng Anh:</strong> {movie.englishTitle}</p>}
                <p>
                  <strong>Thể loại:</strong>{' '}
                  {(movie.genres?.map((genre) => genre.name).filter(Boolean).join(', ') || movie.genre) || 'Chưa phân loại'}
                </p>
                <p><strong>Số tập hiện tại:</strong> {movie.episodes || 'Chưa cập nhật'}</p>
                {(movie.year || movie.quality || movie.rating != null) && (
                  <p>
                    {[movie.year, movie.quality, movie.rating != null && `★ ${movie.rating}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <div className="admin-movie-actions">
                <button
                  type="button"
                  className="admin-movies-secondary-button"
                  onClick={() => openEditForm(movie)}
                  disabled={saving}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="admin-movies-delete-button"
                  onClick={() => handleDelete(movie)}
                  disabled={saving}
                >
                  Xóa
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
