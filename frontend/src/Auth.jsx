import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
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
    setStep('form');
    setOtp('');
    setMessage('');
    navigate(nextMode === 'register' ? '/register' : '/login', { replace: true });
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
      if (step === 'otp') {
        const payload = {
          email: form.email,
          otp,
          ...(mode === 'register'
            ? {
                password: form.password,
                username: form.username,
                fullname: form.fullname
              }
            : { newPassword: form.password })
        };

        if (mode === 'register') {
          await axios.post('/api/auth/register', payload);
        } else {
          await axios.put('/api/auth/reset_password', payload);
        }
        setStep('form');
        setOtp('');
        setForm({ email: '', password: '', username: '', fullname: '' });
        setIsError(false);
        setMode('login');
        navigate('/login', { replace: true });
        setMessage(mode === 'register'
          ? 'Đăng ký thành công. Vui lòng đăng nhập.'
          : 'Đổi mật khẩu thành công. Vui lòng đăng nhập.');
      } else if (mode === 'register' || mode === 'resetPassword') {
        const purpose = mode === 'register' ? 'REGISTER' : 'RESET_PASSWORD';
        await axios.post('/api/auth/send_otp', {
          email: form.email,
          purpose
        });
        setStep('otp');
        setIsError(false);
        setMessage('Mã OTP đã được gửi đến email của bạn.');
      } else {
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
        <h1 id="auth-title">
          {step === 'otp'
            ? 'Xác minh email'
            : mode === 'login'
              ? 'Chào mừng trở lại'
              : mode === 'register' ? 'Tạo tài khoản' : 'Đổi mật khẩu'}
        </h1>
        <p className="auth-subtitle">
          {step === 'otp'
            ? `Nhập mã 6 chữ số đã gửi đến ${form.email}`
            : mode === 'login'
              ? 'Đăng nhập để tiếp tục'
              : mode === 'register'
                ? 'Đăng ký để tham gia cùng PhimHD'
                : 'Nhập email và mật khẩu mới để tiếp tục'}
        </p>

        {step === 'form' && mode !== 'resetPassword' && (
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
        )}

        {message && (
          <p className={`auth-message ${isError ? 'error' : 'success'}`} role="status">
            {message}
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {step === 'otp' ? (
            <>
              <label htmlFor="auth-otp">Mã OTP</label>
              <input
                id="auth-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                required
              />
              <button
                className="auth-secondary-action"
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtp('');
                  setMessage('');
                }}
              >
                Quay lại
              </button>
            </>
          ) : (
          <>
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
            minLength={mode === 'login' ? undefined : 8}
            value={form.password}
            onChange={updateField}
            required
          />
          {mode === 'login' && (
            <button
              className="auth-secondary-action"
              type="button"
              onClick={() => switchMode('resetPassword')}
            >
              Quên mật khẩu?
            </button>
          )}
          </>
          )}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Đang xử lý...'
              : step === 'otp'
                ? mode === 'register' ? 'Xác minh và đăng ký' : 'Xác minh và đổi mật khẩu'
                : mode === 'login'
                  ? 'Đăng nhập'
                  : mode === 'register' ? 'Gửi mã OTP' : 'Gửi mã OTP'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Auth;