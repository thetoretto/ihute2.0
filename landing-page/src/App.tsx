import { useEffect, useState } from 'react';
import Navbar                from './components/Navbar';
import Hero                  from './components/Hero';
import HowItWorks            from './components/HowItWorks';
import HotDestinations       from './components/HotDestinations';
import AppDownload           from './components/AppDownload';
import Footer                from './components/Footer';
import AvailableTripsPage, { type TripSearchCriteria } from './components/AvailableTripsPage';
import TripDetailPage        from './components/TripDetailPage';
import BookingConfirmPage    from './components/BookingConfirmPage';

type Page = 'landing' | 'trips' | 'trip-detail' | 'booking-confirm';

const DEFAULT_CRITERIA: TripSearchCriteria = { fromId: '', toId: '', date: '', travelers: 1 };

export default function App() {
  const [page, setPage]               = useState<Page>('landing');
  const [criteria, setCriteria]       = useState<TripSearchCriteria>(DEFAULT_CRITERIA);
  const [selectedTripId, setTripId]   = useState('');
  const [bookingId, setBookingId]     = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromId = params.get('from') ?? '';
    const toId   = params.get('to')   ?? '';
    if (fromId && toId) {
      setPage('trips');
      setCriteria({
        fromId,
        toId,
        date:      params.get('date')      ?? '',
        travelers: Number(params.get('travelers') ?? '1') || 1,
      });
    }
  }, []);

  function pushUrl(search: string) {
    window.history.pushState({}, '', search ? `?${search}` : window.location.pathname);
  }

  function handleSearch(next: TripSearchCriteria) {
    setCriteria(next);
    setPage('trips');
    pushUrl(new URLSearchParams({ from: next.fromId, to: next.toId, date: next.date, travelers: String(next.travelers) }).toString());
    window.scrollTo(0, 0);
  }

  function handleSelectTrip(tripId: string) {
    setTripId(tripId);
    setPage('trip-detail');
    window.scrollTo(0, 0);
  }

  function handleBooked(id: string) {
    setBookingId(id);
    setPage('booking-confirm');
    window.scrollTo(0, 0);
  }

  function handleBackHome() {
    setPage('landing');
    pushUrl('');
    window.scrollTo(0, 0);
  }

  function handleBackToTrips() {
    setPage('trips');
    window.scrollTo(0, 0);
  }

  function handleViewAllTrips() {
    setCriteria(DEFAULT_CRITERIA);
    setPage('trips');
    pushUrl('');
    window.scrollTo(0, 0);
  }

  return (
    <>
      <Navbar
        onViewAllTrips={handleViewAllTrips}
        onBackHome={handleBackHome}
        isTripsPage={page === 'trips' || page === 'trip-detail' || page === 'booking-confirm'}
      />
      <main className="lp-main" role="main">
        {page === 'landing' && (
          <div className="landing-rs">
            <Hero onSearch={handleSearch} />
            <HowItWorks />
            <HotDestinations onSearch={handleSearch} />
            <AppDownload />
          </div>
        )}

        {page === 'trips' && (
          <AvailableTripsPage
            criteria={criteria}
            onSearch={handleSearch}
            onBackHome={handleBackHome}
            onSelectTrip={handleSelectTrip}
          />
        )}

        {page === 'trip-detail' && (
          <TripDetailPage
            tripId={selectedTripId}
            travelers={criteria.travelers}
            onBack={handleBackToTrips}
            onBooked={handleBooked}
          />
        )}

        {page === 'booking-confirm' && (
          <BookingConfirmPage
            bookingId={bookingId}
            onGoHome={handleBackHome}
            onSearchAgain={() => { setPage('trips'); window.scrollTo(0, 0); }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
