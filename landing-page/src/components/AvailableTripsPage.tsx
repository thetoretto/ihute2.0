import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Calendar,
  SlidersHorizontal,
  Star,
  Zap,
  Car,
  Wind,
  Info,
  Navigation,
  ChevronDown,
} from 'lucide-react';
import { mockHotpoints } from '@shared/mocks';
import type { Trip } from '@shared/types';
import { getTripsStore, setTripsStore } from '../store';
import { fetchTripsFromApi } from '../api';
import DateTimePicker from './DateTimePicker';

export interface TripSearchCriteria {
  fromId: string;
  toId: string;
  date: string;
  travelers: number;
  type?: 'all' | 'insta' | 'scheduled';
  sortBy?: 'earliest' | 'price' | 'rating';
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

type TripTypeFilter = 'all' | 'insta' | 'scheduled';
type SortOption = 'earliest' | 'price' | 'rating';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  card: 'Card',
};

function TripCardV2({
  trip,
  isExpanded,
  onToggle,
  onSelectTrip,
}: {
  trip: Trip;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectTrip: (tripId: string) => void;
}) {
  const isFull = trip.status === 'full' || trip.seatsAvailable === 0;
  const priceStr = `${Number(trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`;
  const paymentStr = trip.paymentMethods.map((m) => PAYMENT_LABELS[m] ?? m).join(' · ');

  return (
    <article
      className={`trip-card-v2 ${isExpanded ? 'trip-card-v2--expanded' : ''}`}
      onClick={!isExpanded ? onToggle : undefined}
    >
      <div className="trip-card-v2-main">
        <div className="trip-card-v2-time">
          <span className="trip-card-v2-time-dep">{normalizeTimeLabel(trip.departureTime)}</span>
          <div className="trip-card-v2-line" aria-hidden />
          <span className="trip-card-v2-time-arr">{normalizeTimeLabel(trip.arrivalTime)}</span>
        </div>

        <div className="trip-card-v2-route">
          <div className="trip-card-v2-from">
            <strong>{trip.departureHotpoint.name}</strong>
            {trip.departureHotpoint.address && (
              <small>{trip.departureHotpoint.address}</small>
            )}
          </div>
          <div className="trip-card-v2-to">
            <strong>{trip.destinationHotpoint.name}</strong>
            <span className={`trip-card-v2-type ${trip.type === 'insta' ? 'trip-card-v2-insta' : ''}`}>
              {trip.type === 'insta' ? (
                <><Zap size={12} /><small>Instant</small></>
              ) : (
                <small>{trip.departureDate ? new Date(trip.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Scheduled'}</small>
              )}
            </span>
            {trip.destinationHotpoint.address && (
              <small>{trip.destinationHotpoint.address}</small>
            )}
          </div>
        </div>

        <div className="trip-card-v2-meta">
          <span className="trip-card-v2-price">{priceStr}</span>
          <span className="trip-card-v2-seats">{trip.seatsAvailable} seats left</span>
          <div className="trip-card-v2-driver">
            {trip.driver.avatarUri ? (
              <img
                src={trip.driver.avatarUri}
                alt=""
                className="trip-card-v2-driver-avatar"
              />
            ) : (
              <span className="trip-card-v2-driver-initial">
                {trip.driver.name.trim().slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="trip-card-v2-driver-info">
              <span className="trip-card-v2-driver-name">{trip.driver.name}</span>
              <span className="trip-card-v2-driver-rating">
                <Star size={10} fill="currentColor" /> {trip.driver.rating?.toFixed(1) ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          className="trip-card-v2-expanded"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="trip-card-v2-details">
            <div className="trip-card-v2-detail-item">
              <p>Vehicle</p>
              <p>
                <Car size={14} />
                {trip.vehicle.make} {trip.vehicle.model}
              </p>
            </div>
            <div className="trip-card-v2-detail-item">
              <p>Amenities</p>
              <p>
                <Wind size={14} />
                {paymentStr}
              </p>
            </div>
          </div>
          <div className="trip-card-v2-actions">
            <button
              type="button"
              className="trip-card-v2-btn-book"
              disabled={isFull}
              onClick={() => !isFull && onSelectTrip(trip.id)}
            >
              Book Ride
            </button>
            <button type="button" className="trip-card-v2-btn-info" aria-label="More info">
              <Info size={18} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function AvailableTripsPage({
  criteria,
  onSearch,
  onBackHome,
  onSelectTrip,
}: AvailableTripsPageProps) {
  const [fromId, setFromId] = useState(criteria.fromId);
  const [toId, setToId] = useState(criteria.toId);
  const [date, setDate] = useState<Date | null>(
    criteria.date ? new Date(criteria.date) : null
  );
  const [travelers, setTravelers] = useState(String(criteria.travelers));
  const [typeFilter, setTypeFilter] = useState<TripTypeFilter>(criteria.type ?? 'all');
  const [sortBy, setSortBy] = useState<SortOption>(criteria.sortBy ?? 'earliest');
  const [apiTrips, setApiTrips] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  useEffect(() => {
    setFromId(criteria.fromId);
    setToId(criteria.toId);
    setDate(criteria.date ? new Date(criteria.date) : null);
    setTravelers(String(criteria.travelers));
    if (criteria.type) setTypeFilter(criteria.type);
    if (criteria.sortBy) setSortBy(criteria.sortBy);
  }, [criteria.date, criteria.fromId, criteria.toId, criteria.travelers, criteria.type, criteria.sortBy]);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTripsFromApi({
        fromId: fromId || undefined,
        toId: toId || undefined,
        date: date ? date.toISOString().slice(0, 10) : undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        passengerCount: Math.max(1, Number(travelers) || 1),
        sortBy,
      });
      setApiTrips(data);
      setTripsStore(data);
    } catch {
      setApiTrips(null);
    } finally {
      setLoading(false);
    }
  }, [fromId, toId, date, typeFilter, travelers, sortBy]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const trips = useMemo(() => {
    const requestedSeats = Number(travelers) || 1;
    const baseList = apiTrips !== null ? apiTrips : getTripsStore();
    return baseList
      .filter((trip) => (fromId ? trip.departureHotpoint.id === fromId : true))
      .filter((trip) => (toId ? trip.destinationHotpoint.id === toId : true))
      .filter((trip) => trip.seatsAvailable >= requestedSeats || trip.status === 'full');
  }, [apiTrips, fromId, toId, travelers]);

  const availableCount = trips.filter((trip) => trip.status !== 'full').length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({
      fromId,
      toId,
      date: date ? date.toISOString().slice(0, 10) : '',
      travelers: Math.max(1, Number(travelers) || 1),
      type: typeFilter,
      sortBy,
    });
  }

  const dayLabel = date
    ? date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Today';

  return (
    <section className="trips-page trips-page-v2">
      <div className="trips-v2-wrap">
        <div className="trips-v2-layout">
          <aside className="trips-sidebar">
            <div className="trips-finder">
              <h3 className="trips-finder-title">
                <SlidersHorizontal size={18} />
                Trip Finder
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="tf-field">
                  <label className="tf-label" htmlFor="tf-from">From</label>
                  <div className="tf-input-wrap">
                    <MapPin size={16} />
                    <select
                      id="tf-from"
                      value={fromId}
                      onChange={(e) => setFromId(e.target.value)}
                    >
                      <option value="">Any city</option>
                      {cityOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="tf-field">
                  <label className="tf-label" htmlFor="tf-to">To</label>
                  <div className="tf-input-wrap">
                    <Navigation size={16} />
                    <select
                      id="tf-to"
                      value={toId}
                      onChange={(e) => setToId(e.target.value)}
                    >
                      <option value="">Anywhere</option>
                      {cityOptions
                        .filter((c) => c.id !== fromId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="tf-field">
                  <label className="tf-label">Date</label>
                  <DateTimePicker
                    mode="date"
                    value={date}
                    onChange={(d) => setDate(d)}
                    minDate={new Date()}
                    placeholder="Any date"
                    label=""
                  />
                </div>
                <div className="tf-preferences">
                  <p className="tf-pref-label">Trip type</p>
                  <div className="tf-chips">
                    <button
                      type="button"
                      className={`tf-chip ${typeFilter === 'all' ? 'tf-chip-on' : ''}`}
                      onClick={() => setTypeFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`tf-chip ${typeFilter === 'insta' ? 'tf-chip-on' : ''}`}
                      onClick={() => setTypeFilter('insta')}
                    >
                      <Zap size={12} /> Instant
                    </button>
                    <button
                      type="button"
                      className={`tf-chip ${typeFilter === 'scheduled' ? 'tf-chip-on' : ''}`}
                      onClick={() => setTypeFilter('scheduled')}
                    >
                      Scheduled
                    </button>
                  </div>
                </div>
                <div className="tf-field">
                  <label className="tf-label" htmlFor="tf-sort">Sort by</label>
                  <div className="tf-input-wrap">
                    <select
                      id="tf-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                    >
                      <option value="earliest">Earliest departure</option>
                      <option value="price">Lowest price</option>
                      <option value="rating">Highest rating</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="tf-submit">
                  Update Search
                </button>
              </form>
            </div>
          </aside>

          <div className="trips-feed">
            <div className="trips-feed-header">
              <div>
                <h2 className="trips-feed-title">All Trips</h2>
                <p className="trips-feed-subtitle">
                  Showing {trips.length} trips{availableCount !== trips.length ? ` · ${availableCount} available` : ''} across East Africa
                </p>
              </div>
              <div className="trips-feed-toolbar">
                <button type="button" className="trips-feed-sort">
                  Sort: Latest <ChevronDown size={14} />
                </button>
                <button type="button" className="trips-feed-sort">
                  Currency: RWF <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className="trips-day-sep">
              <span>{dayLabel}</span>
            </div>

            <div className="trips-feed-list">
              {loading ? (
                <p className="trips-feed-loading">
                  Loading trips…
                </p>
              ) : (
                trips.map((trip) => (
                  <TripCardV2
                    key={trip.id}
                    trip={trip}
                    isExpanded={expandedTripId === trip.id}
                    onToggle={() =>
                      setExpandedTripId((id) => (id === trip.id ? null : trip.id))
                    }
                    onSelectTrip={onSelectTrip}
                  />
                ))
              )}
            </div>

            {!loading && trips.length > 0 && (
              <div className="trips-load-more">
                <button type="button" className="trips-load-more-btn">
                  Load More Trips
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
