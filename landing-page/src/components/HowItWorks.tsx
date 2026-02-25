const steps = [
  {
    title: 'Choose a Ride',
    text: 'Search through thousands of verified departures every day.',
    icon: 'fas fa-search',
    iconClass: 'blue',
  },
  {
    title: 'Select Your Seat',
    text: 'View car models and pick your preferred seating position.',
    icon: 'fas fa-couch',
    iconClass: 'indigo',
  },
  {
    title: 'Pay & Done!',
    text: 'Secure online payment with instant booking confirmation.',
    icon: 'fas fa-check',
    iconClass: 'emerald',
  },
];

export default function HowItWorks() {
  return (
    <section className="rs-how" id="how-it-works">
      <div className="rs-how-inner">
        <h2 className="rs-how-title">How it works</h2>
        <div className="rs-how-bar" aria-hidden />
        <div className="rs-how-grid">
          {steps.map((step) => (
            <div key={step.title} className="rs-how-card">
              <div className={`rs-how-icon ${step.iconClass}`}>
                <i className={step.icon} aria-hidden />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
