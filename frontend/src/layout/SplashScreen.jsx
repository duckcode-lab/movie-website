import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <main className="splash-screen" role="status" aria-live="polite">
      <div className="splash-screen__brand" aria-label="PhimHD">
        <span className="splash-screen__brand-mark" aria-hidden="true">▶</span>
        <span>PHIM<span className="splash-screen__brand-highlight">HD</span></span>
      </div>
      <span className="splash-screen__spinner" aria-hidden="true" />
      <span className="splash-screen__message">Đang kiểm tra đăng nhập...</span>
    </main>
  );
}
