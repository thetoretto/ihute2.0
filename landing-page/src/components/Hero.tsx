import { useMemo, useState } from 'react';
import { mockHotpoints } from '@shared/mocks';
import DateTimePicker from './DateTimePicker';
import SearchSelect from './SearchSelect';
import type { TripSearchCriteria } from './AvailableTripsPage';

interface HeroProps {
  onSearch: (criteria: TripSearchCriteria) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dateOutbound, setDateOutbound] = useState<Date | null>(null);
  const [travelers] = useState(1);

  const cities = useMemo(
    () =>
      mockHotpoints
        .filter(
          (point) =>
            !point.name.startsWith('SP ') &&
            !point.name.startsWith('Simba') &&
            !point.name.startsWith('Nyabugogo') &&
            !point.name.startsWith('Remera') &&
            !point.name.startsWith('Goma Border'),
        )
        .slice(0, 12),
    [],
  );

  return (
    <section className="rs-hero" id="hero">
      <div className="rs-hero-inner">
        <h1>
          Travel light, <br />
          <span className="accent">travel together.</span>
        </h1>
        <p className="rs-hero-sub">
          Connect with drivers heading your way. Simple, affordable, and sustainable travel across East Africa.
        </p>
      </div>

      <div className="rs-search-widget">
        <form
          className="rs-search-grid"
          onSubmit={(e) => {
            e.preventDefault();
            if (!from || !to) return;
            onSearch({
              fromId: from,
              toId: to,
              date: dateOutbound ? dateOutbound.toISOString().slice(0, 10) : '',
              travelers,
            });
          }}
        >
          <div className="rs-search-cell">
            <label htmlFor="from" className="rs-search-label">From</label>
            <SearchSelect
              id="from"
              options={cities}
              value={from}
              onChange={setFrom}
              placeholder="Departure city"
              aria-label="Departure city"
            />
          </div>
          <div className="rs-search-cell">
            <label htmlFor="to" className="rs-search-label">To</label>
            <SearchSelect
              id="to"
              options={cities}
              value={to}
              onChange={setTo}
              placeholder="Arrival city"
              aria-label="Arrival city"
              excludeId={from}
            />
          </div>
          <div className="rs-search-cell">
            <label className="rs-search-label">When</label>
            <div className="rs-search-select-wrap rs-search-dropdown-wrap">
              <DateTimePicker
                variant="search"
                label="When"
                mode="date"
                value={dateOutbound}
                onChange={(d) => setDateOutbound(d)}
                minDate={new Date()}
                placeholder="Date"
              />
            </div>
          </div>
          <button type="submit" className="rs-search-btn rs-search-btn-cell">
            <i className="fas fa-search" aria-hidden />
            <span>Search Rides</span>
          </button>
        </form>
      </div>
    </section>
  );
}
