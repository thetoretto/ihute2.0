import { useEffect, useMemo, useState } from 'react';
import { mockHotpoints } from '@shared/mocks';
import { getTripsStore } from '../store';

export interface TripSearchCriteria {
  fromId: string;
  toId: string;
  date: string;
  travelers: number;
}

interface AvailableTripsPageProps {
  criteria: TripSearchCriteria;
  onSearch: (criteria: TripSearchCriteria) => void;
  onBackHome: () => void;
  onSelectTrip: (tripId: string) => void;
}

const cityOptions = mockHotpoints
  .filter(
    (point) =>
      !point.name.startsWith('SP ') &&
      !point.name.startsWith('Simba') &&
      !point.name.startsWith('Nyabugogo') &&
      !point.name.startsWith('Remera') &&
      !point.name.startsWith('Goma Border'),
  )
  .slice(0, 12);

function normalizeTimeLabel(time?: string) {
  if (!time) return '--:--';
  return time;
}

type TripCategory = 'all' | 'public' | 'private';

function isPublicTrip(trip: { driver: { roles?: string[] } }) {
  return trip.driver.roles?.includes('agency') ?? false;
}

export default function AvailableTripsPage({ criteria, onSearch, onBackHome, onSelectTrip }: AvailableTripsPageProps) {
  const [fromId, setFromId] = useState(criteria.fromId);
  const [toId, setToId] = useState(criteria.toId);
  const [date, setDate] = useState(criteria.date);
  const [travelers, setTravelers] = useState(String(criteria.travelers));
  const [tripCategory, setTripCategory] = useState<TripCategory>('all');

  useEffect(() => {
    setFromId(criteria.fromId);
    setToId(criteria.toId);
    setDate(criteria.date);
    setTravelers(String(criteria.travelers));
  }, [criteria.date, criteria.fromId, criteria.toId, criteria.travelers]);

  const fromLabel = cityOptions.find((city) => city.id === criteria.fromId)?.name ?? 'Any city';
  const toLabel = cityOptions.find((city) => city.id === criteria.toId)?.name ?? 'Any city';

  const trips = useMemo(() => {
    const requestedSeats = Number(travelers) || 1;

    let list = getTripsStore()
      .filter((trip) => (fromId ? trip.departureHotpoint.id === fromId : true))
      .filter((trip) => (toId ? trip.destinationHotpoint.id === toId : true))
      .filter((trip) => trip.seatsAvailable >= requestedSeats || trip.status === 'full');

    if (tripCategory === 'public') {
      list = list.filter(isPublicTrip);
    } else if (tripCategory === 'private') {
      list = list.filter((trip) => !isPublicTrip(trip));
    }

    return list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  }, [fromId, toId, travelers, tripCategory]);

  const availableCount = trips.filter((trip) => trip.status !== 'full').length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({
      fromId,
      toId,
      date,
      travelers: Math.max(1, Number(travelers) || 1),
    });
  }

  return (
    <section className="trips-page">
      <div className="lp-container">
        <div className="trips-topbar">
          <button type="button" className="trips-back-btn" onClick={onBackHome}>
            ← Back to landing
          </button>
          <h1>Available trips</h1>
          <p>
            {fromLabel} → {toLabel}
          </p>
        </div>

        <form className="trips-filter-bar" onSubmit={handleSubmit}>
          <div className="trips-filter-field">
            <label htmlFor="filter-from">Leaving from</label>
            <select id="filter-from" value={fromId} onChange={(event) => setFromId(event.target.value)}>
              <option value="">All</option>
              {cityOptions.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="trips-filter-field">
            <label htmlFor="filter-to">Going to</label>
            <select id="filter-to" value={toId} onChange={(event) => setToId(event.target.value)}>
              <option value="">All</option>
              {cityOptions
                .filter((city) => city.id !== fromId)
                .map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="trips-filter-field">
            <label htmlFor="filter-date">Date</label>
            <input
              id="filter-date"
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="trips-filter-field small">
            <label htmlFor="filter-travelers">Travelers</label>
            <select id="filter-travelers" value={travelers} onChange={(event) => setTravelers(event.target.value)}>
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="trips-search-btn">
            Search
          </button>
        </form>

        <div className="trips-layout">
          <div className="trips-list-head">
            <h2>
              {trips.length} trips found
              <span> · {availableCount} available</span>
            </h2>
            <div className="trips-category-chips">
              <button
                type="button"
                className={`trips-category-chip ${tripCategory === 'all' ? 'active' : ''}`}
                onClick={() => setTripCategory('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`trips-category-chip ${tripCategory === 'public' ? 'active' : ''}`}
                onClick={() => setTripCategory('public')}
              >
                Public
              </button>
              <button
                type="button"
                className={`trips-category-chip ${tripCategory === 'private' ? 'active' : ''}`}
                onClick={() => setTripCategory('private')}
              >
                Private
              </button>
            </div>
          </div>

          <div className="trips-list">
            {trips.map((trip) => {
              const isFull = trip.status === 'full' || trip.seatsAvailable === 0;
              const perSeat = `${Number(trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`;

              return (
                <article className="trip-card" key={trip.id}>
                  <div className="trip-time-col">
                    <strong>{normalizeTimeLabel(trip.departureTime)}</strong>
                    <span>{normalizeTimeLabel(trip.arrivalTime)}</span>
                  </div>

                  <div className="trip-main-col">
                    <h3>
                      {trip.departureHotpoint.name} → {trip.destinationHotpoint.name}
                    </h3>
                    <p className="trip-driver-row">
                      {trip.driver.avatarUri ? (
                        <img src={trip.driver.avatarUri} alt="" className="trip-driver-avatar" />
                      ) : (
                        <span className="trip-driver-avatar trip-driver-avatar-initial">
                          {trip.driver.name.trim().slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span>
                        {trip.driver.name} · {trip.vehicle.make} {trip.vehicle.model} · {trip.durationMinutes ?? 0} min
                      </span>
                    </p>
                    <div className="trip-chips">
                      <span>{trip.type === 'insta' ? 'Insta' : 'Scheduled'}</span>
                      <span>{trip.paymentMethods.join(' · ')}</span>
                      <span>{trip.allowFullCar ? 'Full car allowed' : 'Seat booking only'}</span>
                    </div>
                  </div>

                  <div className="trip-side-col">
                    <strong>{perSeat}</strong>
                    <small>{trip.seatsAvailable} seats left</small>
                    <button type="button" disabled={isFull} onClick={() => !isFull && onSelectTrip(trip.id)}>
                      {isFull ? 'Full' : 'Select trip'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
