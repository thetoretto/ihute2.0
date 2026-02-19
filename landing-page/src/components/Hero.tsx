import { useMemo, useRef, useState } from 'react';
import { mockHotpoints } from '@shared/mocks';
import { SLOGAN } from '../constants/contact';
import type { TripSearchCriteria } from './AvailableTripsPage';

interface HeroProps {
  onSearch: (criteria: TripSearchCriteria) => void;
  onViewAllTrips?: () => void;
}

function formatDisplayDate(value: string): string {
  if (!value) return 'Today';
  const d = new Date(value);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Hero({ onSearch, onViewAllTrips }: HeroProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelers, setTravelers] = useState(1);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);

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
    <section className="hero-shell hero-bbc" id="hero">
      <div className="hero-bbc-main">
        <div className="hero-bbc-inner">
          <h1 className="hero-bbc-title">
            Bus, carpool: ihute takes you where you want to go.
          </h1>
          <p className="hero-bbc-slogan">{SLOGAN}.</p>

          <div className="hero-search-bar">
            <form
              className="hero-search hero-search-bbc"
              onSubmit={(event) => {
                event.preventDefault();
                if (!from || !to) return;
                onSearch({
                  fromId: from,
                  toId: to,
                  date: date || '',
                  travelers,
                });
              }}
            >
              <div className="hero-search-cell">
                <label htmlFor="from" className="hero-search-label">Departure</label>
                <select id="from" value={from} onChange={(e) => setFrom(e.target.value)} className="hero-search-input" aria-label="Your departure">
                  <option value="">Your departure</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div className="hero-search-cell">
                <label htmlFor="to" className="hero-search-label">Destination</label>
                <select id="to" value={to} onChange={(e) => setTo(e.target.value)} className="hero-search-input" aria-label="Your destination">
                  <option value="">Your destination</option>
                  {cities.filter((c) => c.id !== from).map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div className="hero-search-cell">
                <label htmlFor="travel-date" className="hero-search-label">When?</label>
                <button
                  type="button"
                  className="hero-search-when-trigger"
                  onClick={() => dateInputRef.current?.click()}
                  aria-label="Outbound date"
                >
                  {formatDisplayDate(date)}
                </button>
                <input
                  ref={dateInputRef}
                  id="travel-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="hero-search-date-hidden"
                  aria-hidden
                />
              </div>
              <div className="hero-search-cell">
                <label htmlFor="return-date" className="hero-search-label">Return</label>
                <button
                  type="button"
                  className="hero-search-when-trigger"
                  onClick={() => returnInputRef.current?.click()}
                  aria-label="Return date"
                >
                  {returnDate ? formatDisplayDate(returnDate) : '—'}
                </button>
                <input
                  ref={returnInputRef}
                  id="return-date"
                  type="date"
                  value={returnDate}
                  min={date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="hero-search-date-hidden"
                  aria-hidden
                />
              </div>
              <div className="hero-search-cell hero-search-cell-who">
                <label htmlFor="travelers" className="hero-search-label">Who?</label>
                <select id="travelers" value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} className="hero-search-input" aria-label="Number of passengers">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>
                  ))}
                </select>
                <span className="hero-search-helper">No discount card required</span>
              </div>
              <div className="hero-search-cell hero-search-cell-btn">
                <button type="submit" className="hero-search-btn hero-search-btn-bbc" disabled={!from || !to}>
                  Search
                </button>
              </div>
            </form>
          </div>

          <div className="hero-search-footer">
            <button type="button" className="hero-search-footer-link" onClick={onViewAllTrips}>
              View all trips
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
