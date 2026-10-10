import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    fullname: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage('');
    navigate(nextMode === 'login' ? '/login' : '/register', { replace: true });
  }

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      if (mode === 'register') {
        // Gọi API Đăng ký
        await axios.post('/api/auth/register', {
          email: form.email,
          password: form.password,
          username: form.username,
          fullname: form.fullname
        });
        
        setForm({ email: '', password: '', username: '', fullname: '' });
        setIsError(false);
        switchMode('login');
        setMessage('Đăng ký thành công. Vui lòng đăng nhập.');
      } else {
        // Gọi API Đăng nhập
        const response = await axios.post('/api/auth/login', {
          email: form.email,
          password: form.password
        });

        const { accessToken, refreshToken, data: userData } = response.data;

        // Lưu Token và Thông tin User vào LocalStorage
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));

        setIsError(false);
        navigate('/', { replace: true });
      }
    } catch (requestError) {
      setIsError(true);
      setMessage(
        requestError.response?.data?.message ||
        'Không thể kết nối máy chủ. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link to="/" className="auth-logo">PhimHD</Link>
        <h1 id="auth-title">{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Đăng nhập để tiếp tục' : 'Đăng ký để tham gia cùng PhimHD'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Đăng ký
          </button>
        </div>

        {message && (
          <p className={`auth-message ${isError ? 'error' : 'success'}`} role="status">
            {message}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label htmlFor="auth-fullname">Họ và tên</label>
              <input
                id="auth-fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                value={form.fullname}
                onChange={updateField}
                required
              />

              <label htmlFor="auth-username">Tên tài khoản</label>
              <input
                id="auth-username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={updateField}
                required
              />
            </>
          )}

          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            required
          />

          <label htmlFor="auth-password">Mật khẩu</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={updateField}
            required
          />

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Đang xử lý...'
              : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Auth;