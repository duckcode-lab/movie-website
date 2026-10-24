import { useCallback, useEffect, useState } from 'react';
import { createGenre, deleteGenre, getGenres, updateGenre } from '../api/api';
import SiteLayout from '../layout/SiteLayout.jsx';
import '../style/Genres.css';

export default function Genres() {
  const [genres, setGenres] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!deleteError) return undefined;
    const timeoutId = window.setTimeout(() => setDeleteError(''), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [deleteError]);

  const loadGenres = useCallback(async () => {
    setError('');
    const response = await getGenres();
    const result = response.data?.data?.genres;
    if (!Array.isArray(result)) {
      throw new Error('Dữ liệu danh sách thể loại không hợp lệ.');
    }
    setGenres(result);
  }, []);

  useEffect(() => {
    let isActive = true;

    getGenres()
      .then((response) => {
        const result = response.data?.data?.genres;
        if (!Array.isArray(result)) {
          throw new Error('Dữ liệu danh sách thể loại không hợp lệ.');
        }
        if (isActive) setGenres(result);
      })
      .catch((err) => {
        if (isActive) {
          setError(err.response?.data?.message || err.message || 'Không thể tải thể loại.');
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('Vui lòng nhập tên thể loại.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    let saved = false;
    try {
      if (editingId === null) {
        await createGenre({ name: normalizedName });
        setMessage('Đã tạo thể loại.');
      } else {
        await updateGenre(editingId, { name: normalizedName });
        setMessage('Đã cập nhật thể loại.');
      }
      saved = true;
      setName('');
      setEditingId(null);
      await loadGenres();
    } catch (err) {
      setError(saved
        ? 'Đã lưu thể loại nhưng không thể tải lại danh sách.'
        : err.response?.data?.message || 'Không thể lưu thể loại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (genre) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thể loại "${genre.name}"?`)) {
      return;
    }

    setDeletingId(genre.id);
    setDeleteError('');
    setError('');
    setMessage('');
    let deleted = false;
    try {
      await deleteGenre(genre.id);
      deleted = true;
      if (editingId === genre.id) {
        setName('');
        setEditingId(null);
      }
      setMessage(`Đã xóa thể loại "${genre.name}".`);
      await loadGenres();
    } catch (err) {
      if (!deleted) {
        setDeleteError(
          err.response?.data?.message || 'Không thể xóa thể loại. Vui lòng thử lại.'
        );
      } else {
        setError('Đã xóa thể loại nhưng không thể tải lại danh sách.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SiteLayout
      title="Quản lý thể loại"
      description="Tạo và cập nhật thể loại dùng chung cho danh sách phim."
    >
      <div className="genre-admin-page">
        {deleteError && (
          <div className="genre-delete-toast" role="alert">
            <span className="genre-delete-toast-icon" aria-hidden="true">!</span>
            <span>{deleteError}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setDeleteError('')}
            >
              ×
            </button>
          </div>
        )}
        <section className="genre-admin-card" aria-labelledby="genre-form-title">
        <h2 id="genre-form-title">{editingId === null ? 'Thêm thể loại' : 'Sửa thể loại'}</h2>
        <form className="genre-admin-form" onSubmit={handleSubmit}>
          <label htmlFor="genre-name">Tên thể loại</label>
          <div className="genre-admin-form-row">
            <input
              id="genre-name"
              type="text"
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ví dụ: Hành động"
              required
            />
            <button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : editingId === null ? 'Thêm thể loại' : 'Lưu thay đổi'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                className="genre-secondary-button"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                  setError('');
                  setMessage('');
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>

        {error && <p className="genre-admin-alert" role="alert">{error}</p>}
        {message && <p className="genre-admin-success" role="status">{message}</p>}
        </section>

        <section className="genre-admin-card" aria-labelledby="genre-list-title">
        <div className="genre-admin-list-heading">
          <h2 id="genre-list-title">Danh sách thể loại</h2>
          {!loading && !error && <span>{genres.length} thể loại</span>}
        </div>

        {loading ? (
          <p className="genre-admin-empty" role="status">Đang tải thể loại...</p>
        ) : genres.length === 0 ? (
          <p className="genre-admin-empty">Chưa có thể loại nào. Hãy tạo thể loại đầu tiên.</p>
        ) : (
          <ul className="genre-admin-list">
            {genres.map((genre) => (
              <li key={genre.id} className="genre-admin-item">
                <div>
                  <strong>{genre.name}</strong>
                  <span>{Number(genre.movieCount) || 0} phim</span>
                </div>
                <div className="genre-admin-actions">
                  <button
                    type="button"
                    className="genre-secondary-button"
                    onClick={() => {
                      setEditingId(genre.id);
                      setName(genre.name);
                      setError('');
                      setMessage('');
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="genre-delete-button"
                    disabled={deletingId === genre.id}
                    onClick={() => handleDelete(genre)}
                  >
                    {deletingId === genre.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        </section>
      </div>
    </SiteLayout>
  );
}
