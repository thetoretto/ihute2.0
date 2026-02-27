import { CheckCircle2, ArrowRight, QrCode, Download, Share2 } from 'lucide-react';
import { getBookingsStore } from '../store';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash on pickup',
  mobile_money: 'Mobile Money',
  card: 'Card',
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
      <section className="trips-page trips-page-v2">
        <div className="lp-container">
          <div className="bc-card bc-card-standalone">
            <p>Booking not found.</p>
            <button className="td-confirm-btn" type="button" onClick={onGoHome}>Back to home</button>
          </div>
        </div>
      </section>
    );
  }

  const { trip, seats, paymentMethod, ticketNumber } = booking;
  const reference = ticketNumber ?? `#IHUTE-${bookingId.slice(-6).toUpperCase()}`;

  return (
    <section className="trips-page trips-page-v2">
      <div className="lp-container">
        <div className="bc-ticket-wrap">
        <div className="bc-ticket">
          <div className="bc-ticket-header">
            <div className="bc-ticket-header-icon">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="bc-ticket-header-title">Booking Confirmed!</h2>
            <p className="bc-ticket-header-ref">{reference}</p>
          </div>

          <div className="bc-ticket-body">
            <div className="bc-ticket-route">
              <div className="bc-ticket-departure">
                <p className="bc-ticket-label">Departure</p>
                <h4 className="bc-ticket-city">{trip.departureHotpoint.name}</h4>
                <p className="bc-ticket-point">{trip.departureHotpoint.address ?? '—'}</p>
              </div>
              <ArrowRight className="bc-ticket-arrow" size={24} aria-hidden />
              <div className="bc-ticket-arrival">
                <p className="bc-ticket-label">Arrival</p>
                <h4 className="bc-ticket-city">{trip.destinationHotpoint.name}</h4>
                <p className="bc-ticket-point">{trip.destinationHotpoint.address ?? '—'}</p>
              </div>
            </div>

            <div className="bc-ticket-meta">
              <div>
                <p className="bc-ticket-label">Date & Time</p>
                <p className="bc-ticket-meta-value">
                  {trip.departureDate
                    ? new Date(trip.departureDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                    : '—'}
                  {' • '}
                  {trip.departureTime}
                </p>
              </div>
              <div className="bc-ticket-meta-right">
                <p className="bc-ticket-label">Seat & Payment</p>
                <p className="bc-ticket-meta-value">
                  {seats} seat{seats !== 1 ? 's' : ''} • {PAYMENT_LABELS[paymentMethod] ?? paymentMethod}
                </p>
              </div>
            </div>

            <div className="bc-ticket-qr-wrap">
              <div className="bc-ticket-qr-box">
                <QrCode size={160} className="bc-ticket-qr" aria-hidden />
                <div className="bc-ticket-qr-overlay">
                  <span className="bc-ticket-qr-badge">SCAN AT BOARDING</span>
                </div>
              </div>
              <p className="bc-ticket-qr-hint">Scan QR code at pickup terminal</p>
            </div>
          </div>

          <div className="bc-ticket-footer">
            <button type="button" className="bc-ticket-footer-btn" onClick={() => window.print()}>
              <Download size={14} aria-hidden />
              Download PDF
            </button>
            <button
              type="button"
              className="bc-ticket-footer-btn"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'ihute booking',
                    text: `Booking ${reference}: ${trip.departureHotpoint.name} → ${trip.destinationHotpoint.name}`,
                  }).catch(() => {});
                }
              }}
            >
              <Share2 size={14} aria-hidden />
              Share Ticket
            </button>
          </div>
        </div>
        </div>

        <button
          type="button"
          className="bc-back-dashboard"
          onClick={onGoHome}
        >
          Back to home
        </button>
      </div>
    </section>
  );
}
