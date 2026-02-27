import logoSrc from '../assets/logo.svg';

interface NavbarProps {
  onViewAllTrips?: () => void;
  onViewInstantQueue?: () => void;
  onBackHome?: () => void;
  isTripsPage?: boolean;
  isInstantQueuePage?: boolean;
}

export default function Navbar({ onViewAllTrips, onViewInstantQueue, onBackHome, isTripsPage, isInstantQueuePage }: NavbarProps) {
  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    onBackHome?.();
  };

  const showBack = isTripsPage || isInstantQueuePage;

  return (
    <nav className="rs-nav">
      <div className="rs-nav-inner">
        <a
          href="/"
          className="rs-logo"
          onClick={goHome}
          aria-label="ihute home"
        >
          <img src={logoSrc} alt="ihute logo" className="rs-logo-img" width="32" height="32" />
          <span>ihute</span>
        </a>

        {showBack ? (
          <a
            href="#"
            className="rs-nav-back"
            onClick={(e) => {
              e.preventDefault();
              onBackHome?.();
            }}
          >
            Back to home
          </a>
        ) : (
          <>
            <div className="rs-nav-links">
              <a href="#how-it-works">How it works</a>
              <a href="#hot-destinations">Destinations</a>
              <button
                type="button"
                className="rs-nav-cta"
                onClick={() => onViewAllTrips?.()}
              >
                Search trips
              </button>
              {onViewInstantQueue && (
                <button
                  type="button"
                  className="rs-nav-link-cta"
                  onClick={onViewInstantQueue}
                >
                  Drivers available now
                </button>
              )}
            </div>
            <button
              type="button"
              className="rs-nav-cta rs-nav-cta-mobile"
              onClick={() => onViewAllTrips?.()}
              aria-label="Search trips"
            >
              <i className="fas fa-search" aria-hidden />
              <span>Search trips</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
