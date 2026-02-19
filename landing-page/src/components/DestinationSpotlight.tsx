interface DestinationSpotlightProps {
  onSearch?: () => void;
}

export default function DestinationSpotlight({ onSearch }: DestinationSpotlightProps) {
  return (
    <section className="lp-section spotlight-section">
      <div className="lp-container">
        <article className="spotlight-card">
          <h2 className="spotlight-title">Kigali, gateway to East Africa</h2>
          <p className="spotlight-copy">
            From the capital, reach Rubavu, Kampala, Goma and more by bus or carpool. Book your seat and travel at low prices.
          </p>
          <button type="button" className="spotlight-btn" onClick={onSearch}>
            Book your trip
          </button>
        </article>
      </div>
    </section>
  );
}
