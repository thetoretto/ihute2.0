export default function DriverCTA() {
  return (
    <section className="lp-section driver-cta-bbc">
      <div className="lp-container driver-cta-bbc-inner">
        <h2 className="driver-cta-bbc-title">Earn from every trip</h2>
        <p className="driver-cta-bbc-copy">
          Have a car? Put it to work. Publish your trips on ihute and earn when you drive. Share the ride, share the cost.
        </p>
        <a href="#" className="driver-cta-bbc-btn" onClick={(e) => { e.preventDefault(); }}>
          Publish your trips
        </a>
      </div>
    </section>
  );
}
