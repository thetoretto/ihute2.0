import { useEffect, useState } from 'react';
import { IconMapPin } from './Icons';
import { fetchHotpointsFromApi } from '../api';
import type { Hotpoint } from '@shared/types';

export default function PopularDestinations() {
  const [cities, setCities] = useState<Hotpoint[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchHotpointsFromApi().then((list) => { if (!cancelled) setCities(list.slice(0, 6)); }).catch(() => { if (!cancelled) setCities([]); });
    return () => { cancelled = true; };
  }, []);

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
