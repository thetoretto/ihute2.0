import { getBookingsStore } from '../store';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash on pickup',
  mobile_money: 'Mobile Money',
  card: 'Card',
};

const STATUS_LABELS: Record<string, string> = {
  cash_on_pickup: 'Pay at pickup',
  paid: 'Paid',
  pending: 'Pending',
};

interface BookingConfirmPageProps {
  bookingId: string;
  onGoHome: () => void;
  onSearchAgain: () => void;
}

export default function BookingConfirmPage({ bookingId, onGoHome, onSearchAgain }: BookingConfirmPageProps) {
  const booking = getBookingsStore().find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <section className="trips-page">
        <div className="lp-container">
          <div className="bc-card">
            <p>Booking not found.</p>
            <button className="td-confirm-btn" type="button" onClick={onGoHome}>Back to home</button>
          </div>
        </div>
      </section>
    );
  }

  const { trip, seats, paymentMethod, ticketNumber, paymentStatus } = booking;
  const total = seats * trip.pricePerSeat;

  return (
    <section className="trips-page">
      <div className="lp-container">
        <div className="bc-shell">
          <div className="bc-card">
            <div className="bc-success-icon" aria-hidden="true">✓</div>
            <h1 className="bc-title">Booking confirmed!</h1>
            <p className="bc-subtitle">
              Your seat on the {trip.departureHotpoint.name} → {trip.destinationHotpoint.name} trip is reserved.
            </p>

            <div className="bc-ticket-badge">
              <span>Ticket</span>
              <strong>{ticketNumber ?? bookingId.toUpperCase()}</strong>
            </div>

            <div className="bc-detail-grid">
              <div className="bc-detail-row">
                <span>From</span>
                <strong>{trip.departureHotpoint.name}</strong>
              </div>
              <div className="bc-detail-row">
                <span>To</span>
                <strong>{trip.destinationHotpoint.name}</strong>
              </div>
              <div className="bc-detail-row">
                <span>Departure</span>
                <strong>{trip.departureTime}</strong>
              </div>
              <div className="bc-detail-row">
                <span>Arrival</span>
                <strong>{trip.arrivalTime ?? '--:--'}</strong>
              </div>
              <div className="bc-detail-row">
                <span>Driver</span>
                <strong>{trip.driver.name}</strong>
              </div>
              <div className="bc-detail-row">
                <span>Vehicle</span>
                <strong>{trip.vehicle.make} {trip.vehicle.model} · {trip.vehicle.licensePlate}</strong>
              </div>
              <div className="bc-detail-row">
                <span>Seats</span>
                <strong>{seats}</strong>
              </div>
              <div className="bc-detail-row">
                <span>Payment</span>
                <strong>{PAYMENT_LABELS[paymentMethod] ?? paymentMethod}</strong>
              </div>
              <div className="bc-detail-row">
                <span>Status</span>
                <span className="bc-status-chip">{STATUS_LABELS[paymentStatus ?? ''] ?? paymentStatus ?? '—'}</span>
              </div>
              <div className="bc-detail-row bc-total-row">
                <span>Total</span>
                <strong className="bc-total">{Number(total).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</strong>
              </div>
            </div>

            <div className="bc-actions">
              <button type="button" className="td-confirm-btn" onClick={onSearchAgain}>
                Search more rides
              </button>
              <button type="button" className="trips-back-btn bc-home-btn" onClick={onGoHome}>
                Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
