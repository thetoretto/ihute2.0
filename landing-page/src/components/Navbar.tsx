interface NavbarProps {
  onViewAllTrips?: () => void;
}

export default function Navbar({ onViewAllTrips }: NavbarProps) {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <nav className="rs-nav">
      <div className="rs-nav-inner">
        <a
          href="/"
          className="rs-logo"
          onClick={(e) => {
            e.preventDefault();
            scrollTop();
          }}
          aria-label="ihute home"
        >
          <div className="rs-logo-icon">
            <i className="fas fa-paper-plane" aria-hidden />
          </div>
          <span>ihute</span>
        </a>

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
      </div>
    </nav>
  );
}
