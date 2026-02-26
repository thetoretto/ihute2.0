import { mockHotpoints } from '@shared/mocks';
import { IconMapPin } from './Icons';

const cityIds = ['hp1', 'hp2', 'hp3', 'hp4', 'hp5', 'hp6'];

export default function PopularDestinations() {
  const cities = mockHotpoints.filter((point) => cityIds.includes(point.id));

  return (
    <section className="lp-section destination-section" id="destinations">
      <div className="lp-container">
        <div className="lp-heading-block">
          <IconMapPin className="section-icon" aria-hidden />
          <h2 className="lp-title">Where do you want to go</h2>
          <p className="lp-subtitle">Choose a destination and find rides that suit you.</p>
        </div>

        <div className="city-chip-row">
          {cities.map((city) => (
            <button key={city.id} className="city-chip" type="button">
              {city.name}
            </button>
          ))}
        </div>

        <button className="plain-link-btn">See more ride</button>
      </div>
    </section>
  );
}
