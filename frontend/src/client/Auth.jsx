import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, register, sendOtp } from '../api/api';
import SiteLayout from '../layout/SiteLayout.jsx';
import '../style/Auth.css';

export default function Auth({ onLoginSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname !== '/register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const res = await login({ email, password });
        if (!res.data?.accessToken) {
          throw new Error('Đăng nhập không thành công. Vui lòng thử lại.');
        }

        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        if (onLoginSuccess) onLoginSuccess(res.data.data);
        navigate('/');
      } else {
        await register({ email, password, username, fullname, otp });
        navigate('/login', {
          replace: true,
          state: { authMessage: 'Tạo tài khoản thành công. Hãy đăng nhập để tiếp tục.' },
        });
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setMessage('Vui lòng nhập email trước khi lấy mã OTP.');
      setMessageType('error');
      return;
    }

    setIsSendingOtp(true);
    setMessage('');
    try {
      await sendOtp({ email, purpose: 'REGISTER' });
      setMessage('Mã OTP đã được gửi đến email của bạn.');
      setMessageType('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
      setMessageType('error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const routeMessage = location.state?.authMessage;

  return (
    <SiteLayout mainClassName="auth-layout-main">
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="auth-kicker">THẾ GIỚI PHIM TRONG TẦM TAY</p>
        <h1 id="auth-title">{isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h1>
        <p className="auth-subtitle">
          {isLogin
            ? 'Đăng nhập để tiếp tục khám phá những bộ phim yêu thích.'
            : 'Tham gia cộng đồng và lưu lại những bộ phim bạn yêu thích.'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Chọn hình thức">
          <Link
            to="/login"
            role="tab"
            aria-selected={isLogin}
            className={isLogin ? 'active' : ''}
            onClick={() => setMessage('')}
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            role="tab"
            aria-selected={!isLogin}
            className={!isLogin ? 'active' : ''}
            onClick={() => setMessage('')}
          >
            Đăng ký
          </Link>
        </div>

        {(routeMessage || message) && (
          <p className={`auth-message ${routeMessage ? 'success' : messageType}`} role="status">
            {routeMessage || message}
          </p>
        )}

        <form className="auth-form" onSubmit={handleAuth}>
          {!isLogin && (
            <>
              <label htmlFor="auth-username">Tên người dùng</label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                placeholder="Ví dụ: phimthu"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label htmlFor="auth-fullname">Họ và tên</label>
              <input
                id="auth-fullname"
                type="text"
                autoComplete="name"
                placeholder="Tên hiển thị của bạn"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="auth-password">Mật khẩu</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {!isLogin && (
            <>
              <label htmlFor="auth-otp">Mã xác thực OTP</label>
              <div className="otp-group">
                <input
                  id="auth-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <button type="button" onClick={handleSendOtp} disabled={isSendingOtp}>
                  {isSendingOtp ? 'Đang gửi...' : 'Lấy mã'}
                </button>
              </div>
            </>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Đang xử lý...'
              : isLogin
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="auth-footer">
          Bằng việc tiếp tục, bạn đồng ý với các điều khoản sử dụng của PhimHD.
        </p>
      </section>
    </div>
    </SiteLayout>
  );
}
