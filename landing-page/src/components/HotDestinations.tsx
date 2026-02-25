import { hotDestinations } from '../data/hotDestinations';
import type { TripSearchCriteria } from './AvailableTripsPage';

interface HotDestinationsProps {
  onSearch: (criteria: TripSearchCriteria) => void;
}

export default function HotDestinations({ onSearch }: HotDestinationsProps) {
  return (
    <section className="rs-dest" id="hot-destinations">
      <div className="rs-dest-inner">
        <div className="rs-dest-header">
          <h2 className="rs-dest-title">Hot Destinations</h2>
          <a href="#hero" className="rs-dest-link">See all</a>
        </div>
        <div className="rs-dest-grid">
          {hotDestinations.map((dest) => (
            <button
              key={dest.id}
              type="button"
              className="rs-dest-card"
              onClick={() => onSearch({ fromId: '', toId: dest.toId, date: '', travelers: 1 })}
            >
              <img src={dest.imageUrl} alt={dest.name} />
              <div className="rs-dest-card-caption">
                <p className="rs-dest-card-tag">{dest.tagline}</p>
                <h4 className="rs-dest-card-name">{dest.name}</h4>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
