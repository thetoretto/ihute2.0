interface NavbarProps {
  onViewAllTrips?: () => void;
  onBackHome?: () => void;
  isTripsPage?: boolean;
}

export default function Navbar({ onViewAllTrips, onBackHome, isTripsPage }: NavbarProps) {
  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    onBackHome?.();
  };

  return (
    <nav className="rs-nav">
      <div className="rs-nav-inner">
        <a
          href="/"
          className="rs-logo"
          onClick={goHome}
          aria-label="ihute home"
        >
          <img src="/B%26Y.svg" alt="" className="rs-logo-img" />
          <span>ihute</span>
        </a>

        {isTripsPage ? (
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
