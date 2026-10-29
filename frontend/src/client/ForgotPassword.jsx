import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword, sendOtp } from '../api/api.js';
import PasswordField from '../components/PasswordField.jsx';
import SiteLayout from '../layout/SiteLayout.jsx';
import '../style/Auth.css';

export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setMessage('Vui lòng nhập email để nhận mã OTP.');
      setMessageType('error');
      return;
    }

    setIsSendingOtp(true);
    setMessage('');
    try {
      await sendOtp({ email, purpose: 'RESET_PASSWORD' });
      setIsOtpSent(true);
      setMessage('Mã OTP đã được gửi đến email của bạn.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
      setMessageType('error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      await resetPassword({ email, otp, newPassword });
      navigate('/login', {
        replace: true,
        state: { authMessage: 'Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.' },
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteLayout mainClassName="auth-layout-main">
      <div className="auth-page">
        <section className="auth-card" aria-labelledby="forgot-password-title">
          <Link className="auth-reset-back" to="/login" aria-label="Quay lại đăng nhập">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Quay lại đăng nhập</span>
          </Link>

          <p className="auth-kicker">KHÔI PHỤC TÀI KHOẢN</p>
          <h1 id="forgot-password-title">Quên mật khẩu</h1>
          <p className="auth-subtitle">
            Nhập email để nhận mã OTP và tạo mật khẩu mới.
          </p>

          {message && (
            <p className={`auth-message ${messageType}`} role="status">
              {message}
            </p>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="forgot-password-email">Email</label>
            <input
              id="forgot-password-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              readOnly={isOtpSent}
              required
            />

            {isOtpSent ? (
              <>
                <label htmlFor="forgot-password-otp">Mã OTP</label>
                <div className="otp-group">
                  <input
                    id="forgot-password-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Nhập mã 6 chữ số"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <button type="button" onClick={handleSendOtp} disabled={isSendingOtp}>
                    {isSendingOtp ? 'Đang gửi...' : 'Gửi lại mã'}
                  </button>
                </div>

                <PasswordField
                  id="forgot-password-new-password"
                  label="Mật khẩu mới"
                  autoComplete="new-password"
                  placeholder="Ít nhất 8 ký tự"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />

                <button className="auth-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </button>
              </>
            ) : (
              <button
                className="auth-submit"
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Đang gửi mã...' : 'Gửi mã OTP'}
              </button>
            )}
          </form>
        </section>
      </div>
    </SiteLayout>
  );
}
