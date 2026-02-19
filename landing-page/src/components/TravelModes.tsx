import { IconCar, IconBus, IconRoute } from './Icons';

interface TravelModesProps {
  onViewAllTrips?: () => void;
}

const modes = [
  {
    Icon: IconCar,
    title: 'Carpool',
    tagline: 'Go everywhere, at low cost',
    href: '#',
  },
  {
    Icon: IconBus,
    title: 'Bus',
    tagline: 'Many destinations from 2,500 RWF',
    href: '#',
  },
  {
    Icon: IconRoute,
    title: 'Rides',
    tagline: 'All options in one place',
    href: '#',
  },
];

export default function TravelModes({ onViewAllTrips }: TravelModesProps) {
  return (
    <section className="lp-section travel-modes-section" id="how-you-travel">
      <div className="lp-container">
        <div className="lp-heading-block">
          <h2 className="lp-title">How do you travel?</h2>
          <p className="lp-subtitle">
            Choose carpool, bus, or browse all rides. Search and book in one place.
          </p>
        </div>

        <div className="travel-modes-grid">
          {modes.map((mode) => (
            <article key={mode.title} className="travel-mode-card">
              <mode.Icon className="travel-mode-icon" aria-hidden />
              <h3 className="travel-mode-title">{mode.title}</h3>
              <p className="travel-mode-tagline">{mode.tagline}</p>
              <button
                type="button"
                className="travel-mode-link"
                onClick={onViewAllTrips}
              >
                Search trips
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
