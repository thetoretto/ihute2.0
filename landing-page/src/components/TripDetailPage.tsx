import { useState } from 'react';
import { getTripsStore, getBookingsStore, setBookingsStore, setTripsStore } from '../store';
import { createBooking, createGuestBooking, createPaymentIntent, createDeposit } from '../api';
import type { PaymentMethod } from '@shared/types';
import type { GuestDetails } from '../api';
import CardPaymentForm from './CardPaymentForm';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const USE_GUEST_BOOKING = API_BASE.length > 0;
const STRIPE_PUBLISHABLE = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '').trim();

interface TripDetailPageProps {
  tripId: string;
  travelers: number;
  onBack: () => void;
  onBooked: (bookingId: string) => void;
  onPaymentCallback?: (params: { depositId?: string; bookingId: string }) => void;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash on pickup',
  mobile_money: 'Mobile Money',
  card: 'Card',
};

export default function TripDetailPage({ tripId, travelers, onBack, onBooked, onPaymentCallback }: TripDetailPageProps) {
  const trip = getTripsStore().find((t) => t.id === tripId);

  const maxSeats = trip?.seatsAvailable ?? 1;
  const [seats, setSeats] = useState(Math.min(Math.max(1, travelers), maxSeats));
  const [isFullCar, setIsFullCar] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [guest, setGuest] = useState<GuestDetails>({ name: '', phone: '', email: '', deliveryMethod: 'email' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'pay-card' | 'redirecting'>('form');
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  if (!trip) {
    return (
      <section className="trips-page trips-page-v2">
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
    if (USE_GUEST_BOOKING) {
      if (!guest.name?.trim()) { setError('Please enter your name.'); return; }
      if (!guest.phone?.trim()) { setError('Please enter your phone number.'); return; }
      if (!guest.email?.trim()) { setError('Please enter your email.'); return; }
    }
    setError('');
    setLoading(true);
    try {
      const booking = USE_GUEST_BOOKING
        ? await createGuestBooking({
            tripId: currentTrip.id,
            seats: effectiveSeats,
            paymentMethod: paymentMethod as PaymentMethod,
            isFullCar,
            guest: {
              name: guest.name.trim(),
              phone: guest.phone.trim(),
              email: guest.email.trim(),
              deliveryMethod: guest.deliveryMethod ?? 'email',
            },
          })
        : await createBooking({
            tripId: currentTrip.id,
            seats: effectiveSeats,
            paymentMethod: paymentMethod as PaymentMethod,
            isFullCar,
          });
      setBookingsStore([...getBookingsStore(), booking]);
      const trips = getTripsStore();
      const updatedTrips = trips.map((t) => (t.id === currentTrip.id && booking.trip ? { ...booking.trip } : t));
      setTripsStore(updatedTrips);
      setLastBookingId(booking.id);

      if (paymentMethod === 'cash') {
        onBooked(booking.id);
        return;
      }
      if (paymentMethod === 'card') {
        const { clientSecret: secret } = await createPaymentIntent(booking.id);
        setClientSecret(secret);
        setStep('pay-card');
        return;
      }
      if (paymentMethod === 'mobile_money') {
        setStep('redirecting');
        const { depositId, redirectUrl } = await createDeposit(booking.id, guest.phone?.trim());
        if (redirectUrl) {
          if (onPaymentCallback) onPaymentCallback({ depositId, bookingId: booking.id });
          window.location.href = redirectUrl;
          return;
        }
        if (onPaymentCallback) onPaymentCallback({ depositId, bookingId: booking.id });
        window.location.search = `?bookingId=${booking.id}${depositId ? `&depositId=${depositId}` : ''}`;
        return;
      }
      onBooked(booking.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="trips-page trips-page-v2">
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
            ) : step === 'pay-card' && clientSecret && lastBookingId && STRIPE_PUBLISHABLE ? (
              <div className="td-card-pay">
                <button type="button" className="trips-back-btn mb-4" onClick={() => { setStep('form'); setClientSecret(null); setError(''); }}>
                  ← Back
                </button>
                <CardPaymentForm
                  clientSecret={clientSecret}
                  bookingId={lastBookingId}
                  publishableKey={STRIPE_PUBLISHABLE}
                  onSuccess={(id) => { onBooked(id); setStep('form'); setClientSecret(null); setLastBookingId(null); }}
                  onError={setError}
                />
                {error && <p className="td-error mt-2">{error}</p>}
              </div>
            ) : step === 'redirecting' ? (
              <div className="td-redirecting">
                <p className="text-gray-600">Redirecting to payment…</p>
                <div className="mt-3 h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
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

                {USE_GUEST_BOOKING && (
                  <div className="td-guest-section space-y-3 mb-4">
                    <p className="td-section-label">Your details</p>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={guest.name}
                      onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={guest.phone}
                      onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={guest.email}
                      onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg"
                    />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ticket delivery</label>
                      <select
                        value={guest.deliveryMethod ?? 'email'}
                        onChange={(e) => setGuest((g) => ({ ...g, deliveryMethod: e.target.value as GuestDetails['deliveryMethod'] }))}
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="download">Download only</option>
                      </select>
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
