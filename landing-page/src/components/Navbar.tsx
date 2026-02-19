import { useState } from 'react';

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

interface NavbarProps {
  onViewAllTrips?: () => void;
}

export default function Navbar({ onViewAllTrips }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearchTrips = () => {
    onViewAllTrips?.();
    setMenuOpen(false);
  };

  return (
    <header className="lp-header">
      <div className="lp-container lp-header-row">
        <a href="/" className="lp-brand" aria-label="ihute home">
          <img src="/logo.png" className="lp-logo-img" alt="ihute" />
        </a>

        {onViewAllTrips ? (
          <button
            type="button"
            className="lp-search-trips-btn"
            onClick={handleSearchTrips}
            aria-label="Search trips"
          >
            <SearchIcon />
            <span>Search trips</span>
          </button>
        ) : null}

        <button
          className="lp-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && onViewAllTrips && (
        <div className="lp-mobile-menu">
          <div className="lp-mobile-links">
            <button
              type="button"
              className="lp-search-trips-btn lp-search-trips-btn-mobile"
              onClick={handleSearchTrips}
              aria-label="Search trips"
            >
              <SearchIcon />
              <span>Search trips</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
