import type {
  User,
  Hotpoint,
  Trip,
  Booking,
  Vehicle,
  PaymentMethod,
  PaymentStatus,
  TripType,
  DriverTripActivity,
  BookingTicket,
  DriverRating,
  TicketQrValidationResult,
} from '../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { trackMockEvent } from './mockTelemetry';
import {
  pushDriverNotification,
  setPendingOtp,
  getPendingOtp,
  clearPendingOtp,
  getMockStore,
  updateMockStore,
} from './mockPersistence';
import { BOOKING_ID_PREFIX } from '../../../shared/src/constants';
import {
  mockHotpoints,
  mockUsers,
  mockVehicles,
  getTripsStore,
  setTripsStore,
  getBookingsStore,
  setBookingsStore,
  getRatingsStore,
  setRatingsStore,
} from './mockData';

const DELAY_MS = 400;

type MockScenarioMode = 'normal' | 'slow';
type MockOperation = 'login' | 'register' | 'search' | 'book' | 'publish' | 'scan' | 'rate';

interface MockScenarioConfig {
  mode: MockScenarioMode;
  failNext: Partial<Record<MockOperation, string>>;
}

const scenario: MockScenarioConfig = {
  mode: 'normal',
  failNext: {},
};

export function setMockScenarioMode(mode: MockScenarioMode) {
  scenario.mode = mode;
}

export function getMockScenarioMode() {
  return scenario.mode;
}

export function failNextMockOperation(operation: MockOperation, message: string) {
  scenario.failNext[operation] = message;
}

function consumeMockFailure(operation: MockOperation) {
  const message = scenario.failNext[operation];
  if (message) {
    delete scenario.failNext[operation];
    throw new Error(message);
  }
}

function delay<T>(value: T): Promise<T> {
  const ms = scenario.mode === 'slow' ? DELAY_MS * 3 : DELAY_MS;
  return new Promise((r) => setTimeout(() => r(value), ms));
}

function normalizePaymentStatus(method: PaymentMethod): PaymentStatus {
  if (method === 'cash') {
    return 'cash_on_pickup';
  }
  return 'paid';
}

function buildPaymentReference(method: PaymentMethod): string {
  const stamp = `${Date.now()}`.slice(-8);
  if (method === 'mobile_money') {
    return `MM-${stamp}`;
  }
  if (method === 'card') {
    return `CARD-${stamp}`;
  }
  return `CASH-${stamp}`;
}

function buildTicketNumber(bookingId: string): string {
  return `IHT-${bookingId.toUpperCase()}-${new Date().getFullYear()}`;
}

function buildQrChecksum(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) {
    sum = (sum + seed.charCodeAt(i) * (i + 1)) % 100000;
  }
  return `${sum}`.padStart(5, '0');
}

function buildTicketQrPayload(params: {
  ticketId: string;
  bookingId: string;
  passengerId: string;
  driverId: string;
  issuedAt: string;
}): string {
  const seed = `${params.ticketId}|${params.bookingId}|${params.passengerId}|${params.driverId}|${params.issuedAt}`;
  return `IHTQR|${seed}|${buildQrChecksum(seed)}`;
}

function renderTicketHtml(ticket: BookingTicket): string {
  const paymentMethodLabel = ticket.paymentMethod.replace('_', ' ').toUpperCase();
  return `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 24px; color: #171C22;">
        <h1 style="margin-bottom: 4px;">ihute Ticket</h1>
        <p style="margin-top: 0; color: #94A9BC;">Ticket Number: ${ticket.ticketNumber}</p>
        <hr />
        <h3>Passenger</h3>
        <p>${ticket.passengerName}</p>
        <h3>Route</h3>
        <p>${ticket.from} to ${ticket.to}</p>
        <h3>Trip</h3>
        <p>Departure: ${ticket.departureTime}</p>
        <p>Driver: ${ticket.driverName}</p>
        <p>Seats: ${ticket.seats} ${ticket.isFullCar ? '(Full car)' : ''}</p>
        <h3>Payment</h3>
        <p>Method: ${paymentMethodLabel}</p>
        <p>Status: ${ticket.paymentStatus.replace('_', ' ').toUpperCase()}</p>
        <p>Total: ${Number(ticket.amountTotal).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF</p>
        <p style="margin-top: 24px; color: #94A9BC;">Issued at: ${new Date(ticket.issuedAt).toLocaleString()}</p>
      </body>
    </html>
  `;
}

export async function getHotpoints(): Promise<Hotpoint[]> {
  return delay([...mockHotpoints]);
}

export async function searchTrips(params: {
  fromId?: string;
  toId?: string;
  date?: string;
  type?: TripType;
}): Promise<Trip[]> {
  consumeMockFailure('search');
  const trips = getTripsStore();
  let filtered = trips.filter((t) => t.status === 'active');
  if (params.fromId) {
    filtered = filtered.filter((t) => t.departureHotpoint.id === params.fromId);
  }
  if (params.toId) {
    filtered = filtered.filter((t) => t.destinationHotpoint.id === params.toId);
  }
  if (params.type) {
    filtered = filtered.filter((t) => t.type === params.type);
  }
  trackMockEvent('trip_search', {
    fromId: params.fromId ?? null,
    toId: params.toId ?? null,
    type: params.type ?? null,
    resultCount: filtered.length,
  });
  return delay(filtered);
}

export async function getUser(userId?: string): Promise<User | null> {
  const user = mockUsers.find((u) => u.id === (userId || 'u1')) ?? mockUsers[0];
  return delay({ ...user });
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const bookings = getBookingsStore();
  const userBookings = bookings.filter((b) => b.passenger.id === userId);
  return delay([...userBookings]);
}

export async function cancelBooking(bookingId: string, passengerId: string): Promise<Booking> {
  const bookings = getBookingsStore();
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  if (booking.passenger.id !== passengerId) {
    throw new Error('Only the booking passenger can cancel this booking');
  }
  if (booking.status !== 'upcoming') {
    throw new Error('Only upcoming bookings can be cancelled');
  }

  const updatedBooking: Booking = { ...booking, status: 'cancelled' };
  setBookingsStore(bookings.map((item) => (item.id === bookingId ? updatedBooking : item)));

  const trips = getTripsStore();
  const trip = trips.find((item) => item.id === booking.trip.id);
  if (trip) {
    const nextSeats = trip.seatsAvailable + booking.seats;
    const updatedTrip: Trip = {
      ...trip,
      seatsAvailable: nextSeats,
      status: 'active',
    };
    setTripsStore(trips.map((item) => (item.id === trip.id ? updatedTrip : item)));
  }

  return delay(updatedBooking);
}

export async function getUserPublishedTrips(userId: string): Promise<Trip[]> {
  const trips = getTripsStore();
  const published = trips.filter((t) => t.driver.id === userId);
  return delay([...published]);
}

export async function getUserVehicles(userId: string): Promise<Vehicle[]> {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user || (!user.roles.includes('driver') && !user.roles.includes('agency'))) {
    return delay([]);
  }
  const ownerId = user.agencySubRole === 'agency_scanner' && user.agencyId
    ? user.agencyId
    : userId;
  const vehicles = mockVehicles.filter(
    (v) => v.driverId === ownerId || (v as Vehicle).ownerId === ownerId
  );
  return delay([...vehicles]);
}

export async function getDriverTripActivities(userId: string): Promise<DriverTripActivity[]> {
  const user = mockUsers.find((u) => u.id === userId);
  const driverId = user?.agencySubRole === 'agency_scanner' && user.agencyId
    ? user.agencyId
    : userId;
  const trips = getTripsStore().filter((t) => t.driver.id === driverId);
  const bookings = getBookingsStore();

  const activities: DriverTripActivity[] = trips.map((trip) => {
    const tripBookings = bookings.filter(
      (b) => b.trip.id === trip.id && b.status !== 'cancelled'
    );
    const bookedSeats = tripBookings.reduce((sum, b) => sum + b.seats, 0);
    const collectedAmount = tripBookings.reduce(
      (sum, b) => sum + b.seats * trip.pricePerSeat,
      0
    );

    return {
      trip,
      bookingsCount: tripBookings.length,
      bookedSeats,
      remainingSeats: Math.max(0, trip.seatsAvailable),
      collectedAmount,
    };
  });

  return delay(activities);
}

export async function updateDriverTripStatus(params: {
  tripId: string;
  driverId: string;
  status: 'active' | 'completed';
}): Promise<Trip> {
  const trips = getTripsStore();
  const trip = trips.find((item) => item.id === params.tripId);
  if (!trip) {
    throw new Error('Trip not found');
  }
  if (trip.driver.id !== params.driverId) {
    throw new Error('Only the trip driver can update this trip.');
  }
  const updatedTrip: Trip = {
    ...trip,
    status: params.status,
  };
  setTripsStore(trips.map((item) => (item.id === trip.id ? updatedTrip : item)));
  return delay(updatedTrip);
}

export async function getDriverActivitySummary(userId: string): Promise<{
  doneCount: number;
  activeCount: number;
  bookingsCount: number;
  remainingSeats: number;
  income: number;
}> {
  const activities = await getDriverTripActivities(userId);
  const doneCount = activities.filter((a) => a.trip.status === 'completed').length;
  const activeCount = activities.filter((a) => a.trip.status === 'active').length;
  const bookingsCount = activities.reduce((sum, a) => sum + a.bookingsCount, 0);
  const remainingSeats = activities.reduce((sum, a) => sum + a.remainingSeats, 0);
  const income = activities.reduce((sum, a) => sum + a.collectedAmount, 0);

  return delay({
    doneCount,
    activeCount,
    bookingsCount,
    remainingSeats,
    income,
  });
}

export async function publishTrip(tripData: Omit<Trip, 'id'>): Promise<Trip> {
  consumeMockFailure('publish');
  const id = `t${Date.now()}`;
  const trip: Trip = { ...tripData, id } as Trip;
  const store = getTripsStore();
  setTripsStore([trip, ...store]);
  trackMockEvent('trip_publish', {
    tripId: trip.id,
    type: trip.type,
    driverId: trip.driver.id,
  });
  return delay(trip);
}

/** Generate time slots from startTime (HH:mm) every intervalMinutes until endTime (HH:mm) or maxSlots. */
function generateTimeSlots(
  startTime: string,
  intervalMinutes: number,
  endTime?: string,
  maxSlots = 48
): string[] {
  const [sh, sm] = startTime.split(':').map((x) => Number.parseInt(x, 10) || 0);
  let totalMins = sh * 60 + sm;
  const slots: string[] = [];
  const endMins = endTime
    ? (() => {
        const [eh, em] = endTime.split(':').map((x) => Number.parseInt(x, 10) || 0);
        return eh * 60 + em;
      })()
    : totalMins + intervalMinutes * maxSlots;
  while (slots.length < maxSlots && totalMins <= endMins) {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    totalMins += intervalMinutes;
  }
  return slots;
}

export async function publishTrips(
  baseTripData: Omit<Trip, 'id'>,
  options: {
    departureDate: string;
    startTime: string;
    intervalMinutes: number;
    endTime?: string;
  }
): Promise<Trip[]> {
  consumeMockFailure('publish');
  const slots = generateTimeSlots(
    options.startTime,
    options.intervalMinutes,
    options.endTime
  );
  const trips: Trip[] = [];
  const durationMins = baseTripData.durationMinutes ?? 180;
  const store = getTripsStore();
  let currentStore = [...store];
  for (let i = 0; i < slots.length; i++) {
    const depTime = slots[i];
    const [dh, dm] = depTime.split(':').map((x) => Number.parseInt(x, 10) || 0);
    const depMins = dh * 60 + dm;
    const arrMins = (depMins + durationMins) % (24 * 60);
    const arrTime = `${Math.floor(arrMins / 60)
      .toString()
      .padStart(2, '0')}:${(arrMins % 60).toString().padStart(2, '0')}`;
    const id = `t${Date.now()}_${i}`;
    const trip: Trip = {
      ...baseTripData,
      id,
      departureTime: depTime,
      arrivalTime: arrTime,
      departureDate: options.departureDate,
    } as Trip;
    trips.push(trip);
    currentStore = [trip, ...currentStore];
  }
  setTripsStore(currentStore);
  for (const trip of trips) {
    trackMockEvent('trip_publish', {
      tripId: trip.id,
      type: trip.type,
      driverId: trip.driver.id,
    });
  }
  return delay(trips);
}

export async function bookTrip(bookingData: {
  tripId: string;
  passenger: User;
  seats: number;
  paymentMethod: PaymentMethod;
  isFullCar: boolean;
}): Promise<Booking> {
  consumeMockFailure('book');
  const trips = getTripsStore();
  const trip = trips.find((t) => t.id === bookingData.tripId);
  if (!trip) {
    throw new Error('Trip not found');
  }
  if (trip.status !== 'active') {
    throw new Error('Trip is not available');
  }
  if (bookingData.seats <= 0) {
    throw new Error('Seats must be greater than zero');
  }
  if (!trip.paymentMethods.includes(bookingData.paymentMethod)) {
    throw new Error('Selected payment method is not accepted for this trip');
  }
  if (bookingData.isFullCar && !trip.allowFullCar) {
    throw new Error('Full car booking is not allowed for this trip');
  }

  const requestedSeats = bookingData.isFullCar ? trip.seatsAvailable : bookingData.seats;
  if (requestedSeats <= 0 || requestedSeats > trip.seatsAvailable) {
    throw new Error('Not enough seats available');
  }

  const nextSeatsAvailable = Math.max(0, trip.seatsAvailable - requestedSeats);
  const updatedTrip: Trip = {
    ...trip,
    seatsAvailable: nextSeatsAvailable,
    status: nextSeatsAvailable === 0 ? 'full' : trip.status,
  };

  const id = `${BOOKING_ID_PREFIX}${Date.now()}`;
  const ticketIssuedAt = new Date().toISOString();
  const paymentStatus = normalizePaymentStatus(bookingData.paymentMethod);
  const paymentReference = buildPaymentReference(bookingData.paymentMethod);
  const booking: Booking = {
    id,
    trip: updatedTrip,
    passenger: bookingData.passenger,
    seats: requestedSeats,
    paymentMethod: bookingData.paymentMethod,
    isFullCar: bookingData.isFullCar || requestedSeats === trip.seatsAvailable,
    status: 'upcoming',
    createdAt: ticketIssuedAt,
    ticketId: `tk_${id}`,
    ticketNumber: buildTicketNumber(id),
    ticketIssuedAt,
    paymentStatus,
    paymentReference,
  };

  const store = getBookingsStore();
  setBookingsStore([...store, booking]);
  const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
  setTripsStore(updatedTrips);
  void pushDriverNotification({
    type: 'booking',
    bookingId: booking.id,
    tripId: trip.id,
    driverId: trip.driver.id,
    passengerName: bookingData.passenger.name,
    seats: requestedSeats,
    createdAt: ticketIssuedAt,
  });
  trackMockEvent('trip_book', {
    tripId: booking.trip.id,
    bookingId: booking.id,
    passengerId: booking.passenger.id,
    paymentMethod: booking.paymentMethod,
    seats: booking.seats,
  });
  return delay(booking);
}

export async function getBookingTicket(bookingId: string): Promise<BookingTicket> {
  const bookings = getBookingsStore();
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) {
    throw new Error('Ticket not found');
  }

  const hydratedTicketId = booking.ticketId ?? `tk_${booking.id}`;
  const hydratedTicketNumber = booking.ticketNumber ?? buildTicketNumber(booking.id);
  const hydratedTicketIssuedAt = booking.ticketIssuedAt ?? booking.createdAt;
  if (
    booking.ticketId !== hydratedTicketId ||
    booking.ticketNumber !== hydratedTicketNumber ||
    booking.ticketIssuedAt !== hydratedTicketIssuedAt
  ) {
    const hydratedBookings = bookings.map((item) =>
      item.id === booking.id
        ? {
            ...item,
            ticketId: hydratedTicketId,
            ticketNumber: hydratedTicketNumber,
            ticketIssuedAt: hydratedTicketIssuedAt,
            paymentStatus: item.paymentStatus ?? normalizePaymentStatus(item.paymentMethod),
          }
        : item
    );
    setBookingsStore(hydratedBookings);
  }

  return delay({
    bookingId: booking.id,
    ticketId: hydratedTicketId,
    ticketNumber: hydratedTicketNumber,
    issuedAt: hydratedTicketIssuedAt,
    fileUri: booking.ticketFileUri,
    passengerName: booking.passenger.name,
    driverName: booking.trip.driver.name,
    from: booking.trip.departureHotpoint.name,
    to: booking.trip.destinationHotpoint.name,
    departureTime: booking.trip.departureTime,
    seats: booking.seats,
    isFullCar: booking.isFullCar,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus ?? normalizePaymentStatus(booking.paymentMethod),
    amountTotal: booking.seats * booking.trip.pricePerSeat,
    qrPayload: buildTicketQrPayload({
      ticketId: hydratedTicketId,
      bookingId: booking.id,
      passengerId: booking.passenger.id,
      driverId: booking.trip.driver.id,
      issuedAt: hydratedTicketIssuedAt,
    }),
  });
}

export async function validateTicketQr(
  payload: string,
  validatorUser?: User | null
): Promise<TicketQrValidationResult> {
  consumeMockFailure('scan');
  const scannedAt = new Date().toISOString();
  const parts = payload.split('|');
  if (parts.length !== 7 || parts[0] !== 'IHTQR') {
    return delay({ valid: false, reason: 'Malformed QR payload', scannedAt });
  }

  const [, ticketId, bookingId, passengerId, driverId, issuedAt, checksum] = parts;
  const seed = `${ticketId}|${bookingId}|${passengerId}|${driverId}|${issuedAt}`;
  if (buildQrChecksum(seed) !== checksum) {
    return delay({ valid: false, reason: 'Invalid QR checksum', scannedAt, bookingId });
  }

  const booking = getBookingsStore().find((item) => item.id === bookingId);
  if (!booking) {
    return delay({ valid: false, reason: 'Booking not found', scannedAt, bookingId });
  }
  if (booking.status === 'cancelled') {
    return delay({ valid: false, reason: 'Ticket cancelled', scannedAt, bookingId });
  }
  if (validatorUser) {
    const tripDriverId = booking.trip.driver.id;
    const canValidate =
      tripDriverId === validatorUser.id ||
      (validatorUser.agencySubRole === 'agency_scanner' && validatorUser.agencyId === tripDriverId);
    if (!canValidate) {
      return delay({ valid: false, reason: 'Ticket belongs to another driver', scannedAt, bookingId });
    }
  }

  const hydratedTicketId = booking.ticketId ?? `tk_${booking.id}`;
  const hydratedIssuedAt = booking.ticketIssuedAt ?? booking.createdAt;
  if (
    hydratedTicketId !== ticketId ||
    booking.passenger.id !== passengerId ||
    booking.trip.driver.id !== driverId ||
    hydratedIssuedAt !== issuedAt
  ) {
    return delay({ valid: false, reason: 'Ticket data mismatch', scannedAt, bookingId });
  }

  const ticket = await getBookingTicket(bookingId);
  trackMockEvent('ticket_scan', {
    valid: true,
    bookingId,
    validatorUserId: validatorUser?.id ?? null,
  });
  return delay({ valid: true, scannedAt, bookingId, ticket });
}

export async function downloadTicketPdf(bookingId: string): Promise<string> {
  const ticket = await getBookingTicket(bookingId);
  const html = renderTicketHtml(ticket);
  const printed = await Print.printToFileAsync({ html });
  const fileUri = printed.uri;

  const bookings = getBookingsStore();
  const updated = bookings.map((booking) =>
    booking.id === bookingId ? { ...booking, ticketFileUri: fileUri } : booking
  );
  setBookingsStore(updated);
  return fileUri;
}

export async function shareTicketPdf(bookingId: string): Promise<void> {
  const ticketUri = await downloadTicketPdf(bookingId);
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is unavailable on this device');
  }
  await Sharing.shareAsync(ticketUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Download ticket',
    UTI: 'com.adobe.pdf',
  });
}

export async function rateDriverFromBooking(params: {
  bookingId: string;
  passengerId: string;
  score: number;
  comment?: string;
}): Promise<DriverRating> {
  consumeMockFailure('rate');
  const booking = getBookingsStore().find((item) => item.id === params.bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  if (booking.passenger.id !== params.passengerId) {
    throw new Error('Only the booking passenger can rate this driver');
  }
  if (booking.status !== 'completed') {
    throw new Error('Driver can only be rated after trip completion');
  }
  if (params.score < 1 || params.score > 5) {
    throw new Error('Rating score must be between 1 and 5');
  }

  const ratings = getRatingsStore();
  const existing = ratings.find((r) => r.bookingId === booking.id);
  const ratingPayload: DriverRating = {
    id: existing?.id ?? `r_${Date.now()}`,
    bookingId: booking.id,
    driverId: booking.trip.driver.id,
    passengerId: params.passengerId,
    score: params.score,
    comment: params.comment?.trim() || undefined,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  const nextRatings = existing
    ? ratings.map((item) => (item.id === existing.id ? ratingPayload : item))
    : [...ratings, ratingPayload];
  setRatingsStore(nextRatings);

  const driverRatings = nextRatings.filter((r) => r.driverId === booking.trip.driver.id);
  const average =
    driverRatings.reduce((sum, item) => sum + item.score, 0) / Math.max(driverRatings.length, 1);
  const roundedAverage = Number(average.toFixed(1));

  const driver = mockUsers.find((u) => u.id === booking.trip.driver.id);
  if (driver) {
    driver.rating = roundedAverage;
  }

  const updatedTrips = getTripsStore().map((trip) =>
    trip.driver.id === booking.trip.driver.id
      ? { ...trip, driver: { ...trip.driver, rating: roundedAverage } }
      : trip
  );
  setTripsStore(updatedTrips);
  trackMockEvent('driver_rate', {
    bookingId: booking.id,
    driverId: booking.trip.driver.id,
    passengerId: params.passengerId,
    score: params.score,
  });

  return delay(ratingPayload);
}

export async function getDriverRatingSummary(driverId: string): Promise<{
  average: number;
  count: number;
}> {
  const ratings = getRatingsStore().filter((item) => item.driverId === driverId);
  if (ratings.length === 0) {
    return delay({ average: 0, count: 0 });
  }

  const average = ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length;
  return delay({ average: Number(average.toFixed(1)), count: ratings.length });
}

export async function getBookingRating(bookingId: string): Promise<DriverRating | null> {
  const rating = getRatingsStore().find((item) => item.bookingId === bookingId) ?? null;
  return delay(rating);
}

export async function login(_email: string, _password: string): Promise<User> {
  consumeMockFailure('login');
  const email = _email.trim().toLowerCase();
  const password = _password.trim();
  trackMockEvent('auth_login_attempt', { email });
  if (!password) {
    throw new Error('Password is required');
  }
  const matched = mockUsers.find((u) => u.email.toLowerCase() === email);
  if (!matched) {
    throw new Error('Invalid email or password.');
  }
  trackMockEvent('auth_login_success', { userId: matched.id, roles: matched.roles });
  return delay(matched);
}

export async function register(_data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'passenger' | 'driver' | 'agency';
}): Promise<User> {
  consumeMockFailure('register');
  if (mockUsers.some((u) => u.email.toLowerCase() === _data.email.trim().toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  const statusBadge =
    _data.role === 'agency' ? 'Agency' : _data.role === 'driver' ? 'New Driver' : 'Traveler';
  const user: User = {
    id: `u_${Date.now()}`,
    name: _data.name,
    email: _data.email,
    phone: _data.phone,
    roles: [_data.role],
    rating: 5,
    statusBadge,
  };
  mockUsers.push(user);
  trackMockEvent('auth_register_success', { userId: user.id, role: _data.role });
  return delay(user);
}

/** Minimal registration: name + phone (or email). No password; user completes profile in-app. */
export async function registerMinimal(data: {
  name: string;
  phone: string;
  email?: string;
  role: 'passenger' | 'driver' | 'agency';
}): Promise<User> {
  consumeMockFailure('register');
  const id = `u_${Date.now()}`;
  const email = (data.email?.trim() || '').toLowerCase();
  const placeholderEmail = `phone-${id}@ihute.local`;
  const finalEmail = email || placeholderEmail;
  if (email && mockUsers.some((u) => u.email.toLowerCase() === email)) {
    throw new Error('An account with this email already exists.');
  }
  const statusBadge =
    data.role === 'agency' ? 'Agency' : data.role === 'driver' ? 'New Driver' : 'Traveler';
  const user: User = {
    id,
    name: data.name.trim(),
    email: finalEmail,
    phone: data.phone.trim(),
    roles: [data.role],
    rating: 5,
    statusBadge,
  };
  mockUsers.push(user);
  trackMockEvent('auth_register_success', { userId: user.id, role: data.role });
  return delay(user);
}

const OTP_TTL_MS = 10 * 60 * 1000;
const DEV_OTP = '123456';

function normalizeOtpKey(phoneOrEmail: string): string {
  const trimmed = phoneOrEmail.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

/** Mock: send OTP to phone or email. Stores code in persistence for verification. */
export async function sendOtp(phoneOrEmail: string): Promise<{ success: boolean }> {
  const key = normalizeOtpKey(phoneOrEmail);
  const code = DEV_OTP;
  await setPendingOtp(key, code, OTP_TTL_MS);
  trackMockEvent('auth_otp_sent', { key: key.includes('@') ? 'email' : 'phone' });
  return delay({ success: true });
}

/** Mock: verify OTP; clears pending OTP on success. */
export async function verifyOtp(phoneOrEmail: string, code: string): Promise<boolean> {
  const key = normalizeOtpKey(phoneOrEmail);
  const pending = await getPendingOtp(key);
  if (!pending) return delay(false);
  if (pending.expiresAt < Date.now()) return delay(false);
  if (pending.code !== code.trim()) return delay(false);
  await clearPendingOtp(key);
  return delay(true);
}

/** Create user after OTP verification. Exactly one of phone or email required. Does not set profile complete. */
export async function createUserAfterOtp(options: {
  phone?: string;
  email?: string;
}): Promise<User> {
  consumeMockFailure('register');
  const hasPhone = !!options.phone?.trim();
  const hasEmail = !!options.email?.trim();
  if (hasPhone === hasEmail) {
    throw new Error('Provide exactly one of phone or email.');
  }
  const id = `u_${Date.now()}`;
  const email = hasEmail
    ? (options.email!.trim().toLowerCase())
    : `phone-${id}@ihute.local`;
  const phone = hasPhone ? options.phone!.trim() : '';
  if (hasEmail && mockUsers.some((u) => u.email.toLowerCase() === email)) {
    throw new Error('An account with this email already exists.');
  }
  const user: User = {
    id,
    name: 'Guest',
    email,
    phone,
    roles: ['passenger'],
    rating: 5,
    statusBadge: 'Traveler',
  };
  mockUsers.push(user);
  trackMockEvent('auth_register_success', { userId: user.id, source: 'otp' });
  return delay(user);
}

/** Update user profile (name, role, email, phone, avatarUri) and set profile complete in persistence. */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    role?: 'passenger' | 'driver' | 'agency';
    email?: string;
    phone?: string;
    password?: string;
    avatarUri?: string;
  }
): Promise<User> {
  consumeMockFailure('register');
  const i = mockUsers.findIndex((u) => u.id === userId);
  if (i < 0) {
    throw new Error('User not found');
  }
  const current = mockUsers[i];
  let next = { ...current };
  if (updates.name?.trim()) {
    next = { ...next, name: updates.name.trim() };
  }
  if (updates.role) {
    next = { ...next, roles: [updates.role] };
    next.statusBadge =
      updates.role === 'agency' ? 'Agency' : updates.role === 'driver' ? 'New Driver' : 'Traveler';
  }
  if (updates.email?.trim()) {
    const newEmail = updates.email.trim().toLowerCase();
    if (mockUsers.some((u) => u.id !== userId && u.email.toLowerCase() === newEmail)) {
      throw new Error('An account with this email already exists.');
    }
    next = { ...next, email: newEmail };
  }
  if (updates.phone !== undefined) {
    next = { ...next, phone: updates.phone.trim() };
  }
  if (updates.avatarUri !== undefined) {
    next = { ...next, avatarUri: updates.avatarUri };
  }
  mockUsers[i] = next;
  const store = await getMockStore();
  await updateMockStore({
    profileCompleteByUserId: {
      ...store.profileCompleteByUserId,
      [userId]: true,
    },
  });
  return delay(mockUsers[i]);
}

/** Scanner report: ticket row for Past / Today / Upcoming. */
export interface ScannerTicketReportItem {
  id: string;
  bookingId: string;
  route: string;
  passengerName: string;
  departureTime: string;
  status: 'scanned' | 'pending' | 'cancelled';
  scannedAt?: string;
}

const MOCK_SCANNER_PAST: ScannerTicketReportItem[] = [
  { id: 'sr-p1', bookingId: 'b1', route: 'Kigali → Rubavu', passengerName: 'Amine', departureTime: '08:00', status: 'scanned', scannedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'sr-p2', bookingId: 'b2', route: 'Kigali → Goma', passengerName: 'Sarah', departureTime: '09:30', status: 'scanned', scannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
];
const MOCK_SCANNER_TODAY: ScannerTicketReportItem[] = [
  { id: 'sr-t1', bookingId: 'b3', route: 'Kigali → Musanze', passengerName: 'Yvan', departureTime: '14:00', status: 'scanned', scannedAt: new Date().toISOString() },
  { id: 'sr-t2', bookingId: 'b4', route: 'Rubavu → Kigali', passengerName: 'Claire', departureTime: '15:30', status: 'pending' },
];
const MOCK_SCANNER_UPCOMING: ScannerTicketReportItem[] = [
  { id: 'sr-u1', bookingId: 'b5', route: 'Kigali → Rusizi', passengerName: 'Jean', departureTime: '18:00', status: 'pending' },
  { id: 'sr-u2', bookingId: 'b6', route: 'Kigali → Kampala', passengerName: 'Marie', departureTime: '06:00', status: 'pending' },
];

export async function getScannerTicketReport(period: 'past' | 'today' | 'upcoming'): Promise<ScannerTicketReportItem[]> {
  await getMockStore();
  if (period === 'past') return [...MOCK_SCANNER_PAST];
  if (period === 'today') return [...MOCK_SCANNER_TODAY];
  return [...MOCK_SCANNER_UPCOMING];
}
