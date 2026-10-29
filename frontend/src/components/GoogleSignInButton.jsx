import { useEffect, useRef, useState } from 'react';

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '466952248226-eei55rl05fvt8gh9bh7huq548savrtpn.apps.googleusercontent.com';

let googleScriptPromise;

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = GOOGLE_IDENTITY_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          resolve(window.google);
          return;
        }

        googleScriptPromise = undefined;
        reject(new Error('Google Sign-In không khởi tạo được.'));
      };
      script.onerror = () => {
        googleScriptPromise = undefined;
        script.remove();
        reject(new Error('Không thể tải dịch vụ đăng nhập Google.'));
      };
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const buttonElement = buttonRef.current;
    let isMounted = true;

    loadGoogleIdentityServices()
      .then((google) => {
        if (!isMounted || !buttonElement) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        });
        google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.min(360, buttonElement.clientWidth || 360),
          locale: 'vi',
        });
      })
      .catch((error) => {
        console.error('Lỗi khởi tạo đăng nhập Google:', error);
        if (isMounted) {
          setLoadError('Không thể tải đăng nhập Google. Vui lòng thử lại sau.');
        }
      });

    return () => {
      isMounted = false;
      buttonElement?.replaceChildren();
    };
  }, [onCredential]);

  return (
    <div className={`google-sign-in${disabled ? ' is-disabled' : ''}`}>
      <div
        ref={buttonRef}
        className="google-sign-in__button"
        aria-label="Đăng nhập bằng Google"
        aria-busy={disabled}
      />
      {loadError && <p className="google-sign-in__error" role="alert">{loadError}</p>}
    </div>
  );
}
