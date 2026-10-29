import { useState } from 'react';

export default function PasswordField({ id, label, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="auth-password-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-field__control">
        <input id={id} type={isVisible ? 'text' : 'password'} {...inputProps} />
        <button
          className="auth-password-field__toggle"
          type="button"
          aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.9 7.8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 3.1-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
