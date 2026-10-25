import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  changePassword,
  deleteProfile,
  getProfile,
  logout,
  updateProfile,
} from '../api/api';
import SiteLayout from '../layout/SiteLayout.jsx';
import '../style/Profile.css';

function toProfileForm(profile) {
  return {
    username: profile.username || '',
    full_name: profile.full_name || profile.fullName || '',
    avatar_url: profile.avatar_url || profile.avatarUrl || '',
    date_of_birth: (profile.date_of_birth || profile.dateOfBirth || '').slice(0, 10),
    gender: profile.gender || '',
    bio: profile.bio || '',
  };
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let isActive = true;
    getProfile()
      .then((res) => {
        const result = res.data?.data;
        if (!result || typeof result !== 'object') {
          throw new Error('Dữ liệu hồ sơ không hợp lệ.');
        }
        if (isActive) {
          setProfile(result);
          setForm(toProfileForm(result));
        }
      })
      .catch((error) => {
        console.error('Lỗi khi tải hồ sơ:', error);
        if (isActive) setProfileError(getErrorMessage(error, 'Không thể tải hồ sơ.'));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => { isActive = false; };
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');
    setProfileError('');

    try {
      const res = await updateProfile({
        ...form,
        date_of_birth: form.date_of_birth || null,
      });
      const updatedProfile = res.data?.data;
      if (!updatedProfile) throw new Error('Không nhận được dữ liệu hồ sơ sau khi cập nhật.');

      setProfile(updatedProfile);
      setForm(toProfileForm(updatedProfile));
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('phimhd:user-updated', { detail: updatedProfile }));
      setProfileMessage('Đã cập nhật thông tin hồ sơ.');
      setActivePanel(null);
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Không thể cập nhật hồ sơ.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu mới nhập lại không khớp.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Đã đổi mật khẩu thành công.');
      setActivePanel(null);
    } catch (error) {
      setPasswordError(getErrorMessage(error, 'Không thể đổi mật khẩu.'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      'Bạn có chắc muốn xóa tài khoản và toàn bộ hồ sơ không? Thao tác này không thể hoàn tác.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteProfile();
      try {
        await logout();
      } catch (error) {
        console.error('Không thể xóa cookie đăng nhập sau khi xóa tài khoản:', error);
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('phimhd:user-updated', { detail: null }));
      navigate('/', { replace: true });
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Không thể xóa tài khoản.'));
      setDeleting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="profile-page" aria-labelledby="profile-title">
        <header className="profile-heading">
          <p className="profile-kicker">TÀI KHOẢN CỦA BẠN</p>
          <h1 id="profile-title">Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
        </header>

        {loading ? (
          <p className="profile-status" role="status">Đang tải hồ sơ...</p>
        ) : profileError && !profile ? (
          <p className="profile-message error" role="alert">{profileError}</p>
        ) : (
          <div className="profile-sections">
            {!activePanel ? (
              <section className="profile-card" aria-labelledby="profile-info-title">
                <div className="profile-card-heading">
                  <h2 id="profile-info-title">Thông tin cá nhân</h2>
                  <p>Thông tin hiện tại của tài khoản của bạn.</p>
                </div>
                {profile.avatar_url || profile.avatarUrl ? (
                  <img
                    className="profile-avatar"
                    src={profile.avatar_url || profile.avatarUrl}
                    alt={`Ảnh đại diện của ${profile.username || 'người dùng'}`}
                  />
                ) : null}
                <dl className="profile-details">
                  <div>
                    <dt>Email</dt>
                    <dd>{profile.email || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Tên người dùng</dt>
                    <dd>{profile.username || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Họ và tên</dt>
                    <dd>{profile.full_name || profile.fullName || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Ngày sinh</dt>
                    <dd>{(profile.date_of_birth || profile.dateOfBirth || '').slice(0, 10) || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt>Giới tính</dt>
                    <dd>{profile.gender || 'Chưa cập nhật'}</dd>
                  </div>
                  <div className="profile-detail-bio">
                    <dt>Giới thiệu</dt>
                    <dd>{profile.bio || 'Chưa cập nhật'}</dd>
                  </div>
                </dl>
                {profileMessage && <p className="profile-message success" role="status">{profileMessage}</p>}
                <div className="profile-actions">
                  <button
                    className="profile-primary-button"
                    type="button"
                    onClick={() => {
                      setForm(toProfileForm(profile));
                      setProfileError('');
                      setActivePanel('edit');
                    }}
                  >
                    Sửa profile
                  </button>
                  <button
                    className="profile-secondary-button"
                    type="button"
                    onClick={() => {
                      setPasswordError('');
                      setPasswordMessage('');
                      setActivePanel('password');
                    }}
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </section>
            ) : null}

            {activePanel === 'edit' && (
              <form className="profile-card" onSubmit={handleProfileSubmit}>
                <div className="profile-card-heading">
                  <h2>Sửa profile</h2>
                  <p>Cập nhật thông tin cá nhân của bạn.</p>
                </div>

                <label className="profile-field">
                  <span>Email</span>
                  <input type="email" value={profile.email || ''} readOnly />
                  <small>Email hiện chưa thể chỉnh sửa.</small>
                </label>
                <label className="profile-field">
                  <span>Tên người dùng</span>
                  <input name="username" value={form.username} onChange={handleProfileChange} required />
                </label>
                <label className="profile-field">
                  <span>Họ và tên</span>
                  <input name="full_name" value={form.full_name} onChange={handleProfileChange} required />
                </label>
                <label className="profile-field">
                  <span>Ảnh đại diện (URL)</span>
                  <input name="avatar_url" type="url" value={form.avatar_url} onChange={handleProfileChange} />
                </label>
                <div className="profile-field-row">
                  <label className="profile-field">
                    <span>Ngày sinh</span>
                    <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleProfileChange} />
                  </label>
                  <label className="profile-field">
                    <span>Giới tính</span>
                    <input name="gender" value={form.gender} onChange={handleProfileChange} />
                  </label>
                </div>
                <label className="profile-field">
                  <span>Giới thiệu</span>
                  <textarea name="bio" rows="4" value={form.bio} onChange={handleProfileChange} />
                </label>

                {profileError && <p className="profile-message error" role="alert">{profileError}</p>}
                <div className="profile-actions">
                  <button className="profile-primary-button" type="submit" disabled={profileSaving}>
                    {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button className="profile-secondary-button" type="button" onClick={() => setActivePanel(null)}>
                    Quay lại
                  </button>
                </div>
              </form>
            )}

            {activePanel === 'password' && (
              <form className="profile-card" onSubmit={handlePasswordSubmit}>
                <div className="profile-card-heading">
                  <h2>Đổi mật khẩu</h2>
                  <p>Vui lòng điền đầy đủ cả ba mục để cập nhật mật khẩu.</p>
                </div>
                <label className="profile-field">
                  <span>Mật khẩu cũ</span>
                  <input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>
                <label className="profile-field">
                  <span>Mật khẩu mới</span>
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>
                <label className="profile-field">
                  <span>Nhập lại mật khẩu mới</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>

                {passwordError && <p className="profile-message error" role="alert">{passwordError}</p>}
                {passwordMessage && <p className="profile-message success" role="status">{passwordMessage}</p>}
                <div className="profile-actions">
                  <button className="profile-primary-button" type="submit" disabled={passwordSaving}>
                    {passwordSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                  </button>
                  <button className="profile-secondary-button" type="button" onClick={() => setActivePanel(null)}>
                    Quay lại
                  </button>
                </div>
              </form>
            )}

            {activePanel === 'edit' && (
              <section className="profile-card profile-danger-zone" aria-labelledby="profile-delete-title">
                <div className="profile-card-heading">
                  <h2 id="profile-delete-title">Xóa tài khoản</h2>
                  <p>Xóa hồ sơ sẽ xóa tài khoản và các dữ liệu liên quan, không thể khôi phục.</p>
                </div>
                {deleteError && <p className="profile-message error" role="alert">{deleteError}</p>}
                <button
                  className="profile-delete-button"
                  type="button"
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xóa tài khoản và hồ sơ'}
                </button>
              </section>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
