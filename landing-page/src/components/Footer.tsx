import logoSrc from '../assets/logo.svg';

export default function Footer() {
  return (
    <footer className="rs-footer">
      <div className="rs-footer-inner">
        <a href="/" className="rs-footer-logo" aria-label="ihute home">
          <img src={logoSrc} alt="ihute logo" className="rs-logo-img" width="32" height="32" />
          <span>ihute</span>
        </a>
        <p className="rs-footer-copy">
          © {new Date().getFullYear()} ihute. All rights reserved.
        </p>
        <div className="rs-footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Safety</a>
        </div>
      </div>
    </footer>
  );
}
