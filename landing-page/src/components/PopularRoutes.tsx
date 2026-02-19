import { popularRoutes } from '../data/popularRoutes';
import type { TripSearchCriteria } from './AvailableTripsPage';

interface PopularRoutesProps {
  onSearch: (criteria: TripSearchCriteria) => void;
}

export default function PopularRoutes({ onSearch }: PopularRoutesProps) {
  return (
    <section
      className="lp-section popular-routes-section best-price-section"
      id="popular-routes"
      data-testid="ab-top-axis-section"
    >
      <div className="lp-container best-price-inner">
        <h2 className="best-price-heading">Best prices by bus</h2>

        <div className="popular-routes-grid">
          {popularRoutes.map((route) => (
            <article key={`${route.fromId}-${route.toId}`} className="popular-route-card">
              <div className="popular-route-card-image-wrap">
                <img
                  src={route.imageUrl}
                  alt={`${route.fromName} to ${route.toName}`}
                  className="popular-route-card-image"
                />
              </div>
              <div className="popular-route-card-body">
                <div className="popular-route-card-top">
                  <span className="popular-route-route-label">
                    {route.fromName} {route.toName}
                  </span>
                  <span className="popular-route-from-badge">From {route.fromPrice}</span>
                </div>
                <a
                  href="#"
                  className="popular-route-title"
                  onClick={(e) => {
                    e.preventDefault();
                    onSearch({
                      fromId: route.fromId,
                      toId: route.toId,
                      date: '',
                      travelers: 1,
                    });
                  }}
                >
                  Bus from {route.fromName} to {route.toName}
                </a>
                <p className="popular-route-from-label">{route.toName} from</p>
                <ul className="popular-route-from-list">
                  {route.fromCities.map((fc) => (
                    <li key={fc.id}>
                      <button
                        type="button"
                        className="popular-route-from-link"
                        onClick={() =>
                          onSearch({
                            fromId: fc.id,
                            toId: route.toId,
                            date: '',
                            travelers: 1,
                          })
                        }
                      >
                        {fc.name} — {fc.price}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
