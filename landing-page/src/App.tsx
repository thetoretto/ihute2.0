import { useEffect, useState } from 'react';
import { isApiConfigured, type LandingUser } from './api';

const LANDING_AUTH_KEY = 'ihute_landing_auth';
function getStoredLandingAuth(): { user: LandingUser; token: string } | null {
  try {
    const raw = sessionStorage.getItem(LANDING_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { user: LandingUser; token: string };
  } catch {
    return null;
  }
}
function setStoredLandingAuth(user: LandingUser, token: string) {
  sessionStorage.setItem(LANDING_AUTH_KEY, JSON.stringify({ user, token }));
}
function clearStoredLandingAuth() {
  sessionStorage.removeItem(LANDING_AUTH_KEY);
}
import Navbar                   from './components/Navbar';
import Hero                     from './components/Hero';
import HowItWorks               from './components/HowItWorks';
import HotDestinations          from './components/HotDestinations';
import AppDownload              from './components/AppDownload';
import Footer                   from './components/Footer';
import AvailableTripsPage, { type TripSearchCriteria } from './components/AvailableTripsPage';
import TripDetailPage           from './components/TripDetailPage';
import BookingConfirmPage       from './components/BookingConfirmPage';
import InstantQueuePage         from './components/InstantQueuePage';
import PaymentCallbackPage      from './components/PaymentCallbackPage';
import WhatsAppSupport          from './components/WhatsAppSupport';

type Page = 'landing' | 'trips' | 'trip-detail' | 'booking-confirm' | 'instant-queue' | 'payment-callback';

const DEFAULT_CRITERIA: TripSearchCriteria = { fromId: '', toId: '', date: '', travelers: 1, type: 'all', sortBy: 'earliest' };

export default function App() {
  const [page, setPage]               = useState<Page>('landing');
  const [criteria, setCriteria]       = useState<TripSearchCriteria>(DEFAULT_CRITERIA);
  const [selectedTripId, setTripId]   = useState('');
  const [bookingId, setBookingId]     = useState('');
  const [paymentCallbackDepositId, setPaymentCallbackDepositId] = useState<string | null>(null);
  const [paymentCallbackBookingId, setPaymentCallbackBookingId] = useState<string | null>(null);
  const [landingAuth, setLandingAuth] = useState<{ user: LandingUser; token: string } | null>(getStoredLandingAuth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositId = params.get('depositId');
    const callbackBookingId = params.get('bookingId');
    if (depositId || callbackBookingId) {
      setPaymentCallbackDepositId(depositId);
      setPaymentCallbackBookingId(callbackBookingId);
      setPage('payment-callback');
      return;
    }
    const fromId = params.get('from') ?? '';
    const toId   = params.get('to')   ?? '';
    if (fromId && toId) {
      setPage('trips');
      const type = params.get('type');
      const sortBy = params.get('sortBy');
      setCriteria({
        fromId,
        toId,
        date:      params.get('date')      ?? '',
        travelers: Number(params.get('travelers') ?? '1') || 1,
        type:      (type === 'insta' || type === 'scheduled' ? type : 'all') as 'all' | 'insta' | 'scheduled',
        sortBy:    (sortBy === 'price' || sortBy === 'rating' ? sortBy : 'earliest') as 'earliest' | 'price' | 'rating',
      });
    }
  }, []);

  function pushUrl(search: string) {
    window.history.pushState({}, '', search ? `?${search}` : window.location.pathname);
  }

  function handleSearch(next: TripSearchCriteria) {
    setCriteria(next);
    setPage('trips');
    const q = new URLSearchParams({ from: next.fromId, to: next.toId, date: next.date || '', travelers: String(next.travelers) });
    if (next.type && next.type !== 'all') q.set('type', next.type);
    if (next.sortBy && next.sortBy !== 'earliest') q.set('sortBy', next.sortBy);
    pushUrl(q.toString());
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

  function handleViewInstantQueue() {
    setPage('instant-queue');
    window.scrollTo(0, 0);
  }

  if (!isApiConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
        <div className="bg-white rounded-2xl p-8 max-w-md shadow-sm border border-gray-200 text-center">
          <h1 className="text-xl font-bold text-gray-900 m-0 mb-3">Backend not configured</h1>
          <p className="text-sm text-gray-600 m-0">
            Set <code className="bg-gray-100 px-1 rounded">VITE_API_BASE_URL</code> in <code className="bg-gray-100 px-1 rounded">.env</code> (e.g. <code className="bg-gray-100 px-1 rounded">http://localhost:3000</code>) and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar
        onViewAllTrips={handleViewAllTrips}
        onViewInstantQueue={handleViewInstantQueue}
        onBackHome={handleBackHome}
        isTripsPage={page === 'trips' || page === 'trip-detail' || page === 'booking-confirm' || page === 'payment-callback'}
        isInstantQueuePage={page === 'instant-queue'}
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
            onPaymentCallback={({ bookingId: bid, depositId: did }) => {
              setPaymentCallbackBookingId(bid);
              setPaymentCallbackDepositId(did ?? null);
            }}
            landingUser={landingAuth?.user ?? null}
            landingToken={landingAuth?.token ?? null}
            onLogin={(user, token) => {
              setStoredLandingAuth(user, token);
              setLandingAuth({ user, token });
            }}
            onLogout={() => {
              clearStoredLandingAuth();
              setLandingAuth(null);
            }}
          />
        )}

        {page === 'booking-confirm' && (
          <BookingConfirmPage
            bookingId={bookingId}
            onGoHome={handleBackHome}
            onSearchAgain={() => { setPage('trips'); window.scrollTo(0, 0); }}
          />
        )}

        {page === 'instant-queue' && (
          <InstantQueuePage onBackHome={handleBackHome} />
        )}

        {page === 'payment-callback' && (
          <PaymentCallbackPage
            depositId={paymentCallbackDepositId}
            bookingId={paymentCallbackBookingId}
            onSuccess={(id) => {
              setBookingId(id);
              setPaymentCallbackDepositId(null);
              setPaymentCallbackBookingId(null);
              setPage('booking-confirm');
              window.scrollTo(0, 0);
            }}
            onBackHome={handleBackHome}
          />
        )}
      </main>
      <WhatsAppSupport />
      <Footer />
    </>
  );
}
