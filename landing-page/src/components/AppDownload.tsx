import { APP_STORE_URL, PLAY_STORE_URL } from '../constants/contact';

export default function AppDownload() {
  return (
    <section className="rs-app">
      <div className="rs-app-inner">
        <div className="rs-app-copy">
          <h2>Everything happens on the app.</h2>
          <p>
            Book in seconds, chat with your driver, and track your ride in real-time. The best way to use ihute is on your phone.
          </p>
          <div className="rs-app-btns">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rs-app-btn"
              aria-label="Download on the App Store"
            >
              <i className="fab fa-apple" aria-hidden />
              <span>App Store</span>
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rs-app-btn"
              aria-label="Get it on Google Play"
            >
              <i className="fab fa-google-play" aria-hidden />
              <span>Play Store</span>
            </a>
          </div>
        </div>
        <div className="rs-app-mockup">
          <div className="rs-app-phone">
            <div className="rs-app-phone-inner">
              <div className="rs-app-phone-icon">
                <i className="fas fa-car-side" aria-hidden />
              </div>
              <h4>Finding a ride...</h4>
              <p>Matching you with top-rated drivers nearby</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
