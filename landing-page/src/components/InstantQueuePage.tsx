import { useCallback, useEffect, useState } from 'react';
import { MapPin, Navigation, Car } from 'lucide-react';
import { mockHotpoints } from '@shared/mocks';
import type { DriverInstantQueueEntry } from '@shared/types';
import { fetchInstantQueue } from '../api';

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

interface InstantQueuePageProps {
  onBackHome: () => void;
}

function formatRwf(value: number) {
  return `${Number(value).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`;
}

export default function InstantQueuePage({ onBackHome }: InstantQueuePageProps) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [entries, setEntries] = useState<DriverInstantQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { fromId?: string; toId?: string } = {};
      if (fromId) params.fromId = fromId;
      if (toId) params.toId = toId;
      const list = await fetchInstantQueue(params);
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load drivers');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [fromId, toId]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  return (
    <section className="trips-page trips-page-v2">
      <div className="trips-v2-wrap">
        <div className="trips-v2-layout">
          <aside className="trips-sidebar">
            <div className="trips-finder">
              <h3 className="trips-finder-title">
                <Car size={18} />
                Filter queue
              </h3>
              <div className="tf-field">
                <label className="tf-label" htmlFor="iq-to">Destination (To)</label>
                <div className="tf-input-wrap">
                  <Navigation size={16} />
                  <select
                    id="iq-to"
                    value={toId}
                    onChange={(e) => setToId(e.target.value)}
                  >
                    <option value="">Any destination</option>
                    {cityOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="tf-field">
                <label className="tf-label" htmlFor="iq-from">From</label>
                <div className="tf-input-wrap">
                  <MapPin size={16} />
                  <select
                    id="iq-from"
                    value={fromId}
                    onChange={(e) => setFromId(e.target.value)}
                  >
                    <option value="">Any origin</option>
                    {cityOptions
                      .filter((c) => c.id !== toId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>
              <button type="button" className="tf-submit" onClick={() => void loadQueue()}>
                Update
              </button>
            </div>
          </aside>

          <div className="trips-feed">
            <div className="trips-feed-header">
              <div>
                <h2 className="trips-feed-title">Drivers available now</h2>
                <p className="trips-feed-subtitle">
                  {loading ? 'Loading…' : `${entries.length} driver${entries.length !== 1 ? 's' : ''} in drive mode`}
                </p>
              </div>
            </div>

            {error && (
              <p className="trips-feed-error" role="alert">
                {error}
              </p>
            )}

            {!error && loading && (
              <p className="trips-feed-muted">Loading queue…</p>
            )}

            {!error && !loading && entries.length === 0 && (
              <p className="trips-feed-muted">
                No drivers in drive mode match your filters. Try changing or clearing the destination and from filters.
              </p>
            )}

            {!error && !loading && entries.length > 0 && (
              <ul className="trips-feed-list" aria-label="Drivers available now">
                {entries.map((entry) => (
                  <li key={entry.driver?.id ?? Math.random()}>
                    <article className="trip-card-v2 trip-card-v2--expanded">
                      <div className="trip-card-v2-main">
                        <div className="trip-card-v2-route">
                          <div className="trip-card-v2-from">
                            <strong>{entry.from?.name ?? '—'}</strong>
                          </div>
                          <div className="trip-card-v2-to">
                            <strong>{entry.to?.name ?? '—'}</strong>
                            <span className="trip-card-v2-insta">
                              <Car size={12} />
                              <small>Drive mode</small>
                            </span>
                          </div>
                        </div>
                        <div className="trip-card-v2-meta">
                          <span className="trip-card-v2-price">{formatRwf(entry.pricePerSeat)}</span>
                          <span className="trip-card-v2-seats">{entry.seatsAvailable} seats</span>
                          <div className="trip-card-v2-driver">
                            {entry.driver?.name && (
                              <span className="trip-card-v2-driver-name">{entry.driver.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
