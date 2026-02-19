import { useState } from 'react';
import { mockUsers } from '@shared/mocks';
import { BOOKING_ID_PREFIX } from '@shared/constants';
import { getTripsStore, getBookingsStore, setBookingsStore, setTripsStore } from '../store';
import type { PaymentMethod } from '@shared/types';

interface TripDetailPageProps {
  tripId: string;
  travelers: number;
  onBack: () => void;
  onBooked: (bookingId: string) => void;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash on pickup',
  mobile_money: 'Mobile Money',
  card: 'Card',
};

export default function TripDetailPage({ tripId, travelers, onBack, onBooked }: TripDetailPageProps) {
  const trip = getTripsStore().find((t) => t.id === tripId);

  const maxSeats = trip?.seatsAvailable ?? 1;
  const [seats, setSeats] = useState(Math.min(Math.max(1, travelers), maxSeats));
  const [isFullCar, setIsFullCar] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!trip) {
    return (
      <section className="trips-page">
        <div className="lp-container">
          <button className="trips-back-btn" type="button" onClick={onBack}>← Back to results</button>
          <p className="lp-mt-24">Trip not found.</p>
        </div>
      </section>
    );
  }

  const currentTrip = trip;
  const isFull = currentTrip.status === 'full' || currentTrip.seatsAvailable === 0;
  const effectiveSeats = isFullCar ? currentTrip.seatsAvailable : seats;
  const totalPrice = effectiveSeats * currentTrip.pricePerSeat;

  async function handleBook() {
    if (!paymentMethod) { setError('Please select a payment method.'); return; }
    if (!currentTrip.paymentMethods.includes(paymentMethod as PaymentMethod)) {
      setError('That payment method is not accepted for this trip.');
      return;
    }
    if (effectiveSeats < 1 || effectiveSeats > currentTrip.seatsAvailable) {
      setError(`Choose between 1 and ${currentTrip.seatsAvailable} seats.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 700));

      const passenger = mockUsers.find((u) => u.roles.includes('passenger')) ?? mockUsers[0];
      const bookingId = `${BOOKING_ID_PREFIX}web_${Date.now()}`;
      const now = new Date().toISOString();
      const method = paymentMethod as PaymentMethod;

      const newBooking = {
        id: bookingId,
        trip: currentTrip,
        passenger,
        seats: effectiveSeats,
        paymentMethod: method,
        isFullCar,
        status: 'upcoming' as const,
        createdAt: now,
        ticketId: `tk_${bookingId}`,
        ticketNumber: `IHT-${bookingId.toUpperCase()}-${new Date().getFullYear()}`,
        ticketIssuedAt: now,
        paymentStatus: (method === 'cash' ? 'cash_on_pickup' : 'paid') as 'cash_on_pickup' | 'paid',
      };

      const remaining = currentTrip.seatsAvailable - effectiveSeats;
      const updatedTrip: typeof currentTrip = {
        ...currentTrip,
        seatsAvailable: Math.max(0, remaining),
        status: (remaining <= 0 ? 'full' : 'active') as typeof currentTrip.status,
      };

      setBookingsStore([...getBookingsStore(), newBooking]);
      setTripsStore(getTripsStore().map((t) => (t.id === currentTrip.id ? updatedTrip : t)));

      onBooked(bookingId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="trips-page">
      <div className="lp-container">
        <button className="trips-back-btn" type="button" onClick={onBack}>
          ← Back to results
        </button>

        <div className="trips-topbar lp-mb-24">
          <h1>Trip details</h1>
          <p>{currentTrip.departureHotpoint.name} → {currentTrip.destinationHotpoint.name}</p>
        </div>

        <div className="td-layout">
          {/* ── Left column: trip summary ─────────────────────── */}
          <div className="td-summary-card">
            <div className="td-route">
              <div className="td-route-point">
                <span className="td-dot td-dot-from" />
                <div>
                  <strong>{currentTrip.departureHotpoint.name}</strong>
                  <span className="td-time">{currentTrip.departureTime}</span>
                </div>
              </div>
              <div className="td-route-line" />
              <div className="td-route-point">
                <span className="td-dot td-dot-to" />
                <div>
                  <strong>{currentTrip.destinationHotpoint.name}</strong>
                  <span className="td-time">{currentTrip.arrivalTime ?? '--:--'}</span>
                </div>
              </div>
            </div>

            <div className="td-meta-row">
              <span>⏱ {currentTrip.durationMinutes ?? 0} min</span>
              <span>💺 {currentTrip.seatsAvailable} seats left</span>
              <span className={`td-type-chip ${currentTrip.type}`}>
                {currentTrip.type === 'insta' ? 'Instatrip' : 'Scheduled'}
              </span>
            </div>

            <div className="td-divider" />

            <div className="td-driver-row">
              <div className="td-avatar">
                {currentTrip.driver.avatarUri ? (
                  <img src={currentTrip.driver.avatarUri} alt="" className="td-avatar-img" />
                ) : (
                  currentTrip.driver.name[0]
                )}
              </div>
              <div>
                <strong>{currentTrip.driver.name}</strong>
                <p>⭐ {currentTrip.driver.rating?.toFixed(1) ?? '—'} · {currentTrip.driver.statusBadge ?? 'Driver'}</p>
              </div>
            </div>

            <div className="td-vehicle-row">
              <span>🚗 {currentTrip.vehicle.make} {currentTrip.vehicle.model}</span>
              <span className="td-vehicle-badge">{currentTrip.vehicle.color}</span>
              <span className="td-plate">{currentTrip.vehicle.licensePlate}</span>
            </div>

            <div className="td-divider" />

            <p className="td-section-label">Accepted payment methods</p>
            <div className="td-pay-chips">
              {currentTrip.paymentMethods.map((m) => (
                <span key={m} className="td-pay-chip">{PAYMENT_LABELS[m]}</span>
              ))}
            </div>
          </div>

          {/* ── Right column: booking panel ───────────────────── */}
          <div className="td-booking-panel">
            <h2>Book your seat</h2>

            {isFull ? (
              <div className="td-full-msg">
                <span>⚠</span> This trip is fully booked.
              </div>
            ) : (
              <>
                {currentTrip.allowFullCar && (
                  <label className="td-checkbox-row">
                    <input
                      type="checkbox"
                      checked={isFullCar}
                      onChange={(e) => {
                        setIsFullCar(e.target.checked);
                        if (e.target.checked) setSeats(currentTrip.seatsAvailable);
                      }}
                    />
                    Book entire car ({currentTrip.seatsAvailable} seats)
                  </label>
                )}

                {!isFullCar && (
                  <div className="td-stepper-row">
                    <span>Seats</span>
                    <div className="td-stepper">
                      <button type="button" onClick={() => setSeats((s) => Math.max(1, s - 1))} disabled={seats <= 1}>−</button>
                      <span>{seats}</span>
                      <button type="button" onClick={() => setSeats((s) => Math.min(currentTrip.seatsAvailable, s + 1))} disabled={seats >= currentTrip.seatsAvailable}>+</button>
                    </div>
                  </div>
                )}

                <div className="td-pay-section">
                  <p className="td-section-label">Payment method</p>
                  <div className="td-pay-radios">
                    {currentTrip.paymentMethods.map((m) => (
                      <label key={m} className={`td-pay-radio${paymentMethod === m ? ' selected' : ''}`}>
                        <input
                          type="radio"
                          name="pay"
                          value={m}
                          checked={paymentMethod === m}
                          onChange={() => { setPaymentMethod(m); setError(''); }}
                        />
                        {PAYMENT_LABELS[m]}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="td-price-box">
                  <div className="td-price-row">
                    <span>{effectiveSeats} seat{effectiveSeats !== 1 ? 's' : ''} × {Number(trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</span>
                    <strong>{Number(totalPrice).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</strong>
                  </div>
                  {paymentMethod === 'cash' && (
                    <p className="td-cash-note">Cash paid directly to driver at pickup.</p>
                  )}
                </div>

                {error && <p className="td-error">{error}</p>}

                <button
                  className="td-confirm-btn"
                  type="button"
                  onClick={handleBook}
                  disabled={loading || !paymentMethod}
                >
                  {loading ? 'Processing…' : `Confirm booking · ${Number(totalPrice).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
