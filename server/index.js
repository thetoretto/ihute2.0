const express = require('express');
const cors = require('cors');
const store = require('./store');
const utils = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// ---------- Hotpoints ----------
app.get('/api/hotpoints', (req, res) => {
  res.json(store.hotpointsStore);
});

// ---------- Users ----------
app.get('/api/users/:id', (req, res) => {
  const user = store.findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/users/:id/profile', (req, res) => {
  const i = store.usersStore.findIndex((u) => u.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'User not found' });
  const { name, role, email, phone } = req.body || {};
  const current = store.usersStore[i];
  let next = { ...current };
  if (name?.trim()) next.name = name.trim();
  if (role) {
    next.roles = [role];
    next.statusBadge = role === 'agency' ? 'Agency' : role === 'driver' ? 'New Driver' : 'Traveler';
  }
  if (email?.trim()) {
    const newEmail = email.trim().toLowerCase();
    if (store.usersStore.some((u) => u.id !== req.params.id && (u.email || '').toLowerCase() === newEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    next.email = newEmail;
  }
  if (phone !== undefined) next.phone = (phone || '').trim();
  store.usersStore[i] = next;
  store.profileCompleteByUserId[req.params.id] = true;
  res.json(next);
});

app.get('/api/users/:id/profile-complete', (req, res) => {
  res.json(!!store.profileCompleteByUserId[req.params.id]);
});

app.put('/api/users/:id/profile-complete', (req, res) => {
  store.profileCompleteByUserId[req.params.id] = !!req.body?.complete;
  res.json({ complete: !!store.profileCompleteByUserId[req.params.id] });
});

app.get('/api/users/:id/notification-prefs', (req, res) => {
  const prefs = store.notificationPrefsByUserId[req.params.id] || {
    tripUpdates: true,
    messageAlerts: true,
    promotions: true,
  };
  res.json(prefs);
});

app.put('/api/users/:id/notification-prefs', (req, res) => {
  store.notificationPrefsByUserId[req.params.id] = { ...req.body };
  res.json(store.notificationPrefsByUserId[req.params.id]);
});

app.get('/api/users/:id/withdrawal-methods', (req, res) => {
  res.json(store.withdrawalMethodsByUserId[req.params.id] || {});
});

app.put('/api/users/:id/withdrawal-methods', (req, res) => {
  store.withdrawalMethodsByUserId[req.params.id] = { ...req.body };
  res.json(store.withdrawalMethodsByUserId[req.params.id]);
});

app.get('/api/users/:id/payment-methods', (req, res) => {
  const list = store.paymentMethodsByUserId[req.params.id] || [];
  res.json(list);
});

app.post('/api/users/:id/payment-methods', (req, res) => {
  const list = store.paymentMethodsByUserId[req.params.id] || [];
  const { type, label, detail, isDefault } = req.body || {};
  const id = `pm_${Date.now()}`;
  const method = { id, type: type || 'card', label, detail, isDefault: !!isDefault };
  if (isDefault) list.forEach((m) => (m.isDefault = false));
  list.push(method);
  store.paymentMethodsByUserId[req.params.id] = list;
  res.status(201).json(method);
});

app.delete('/api/users/:id/payment-methods/:methodId', (req, res) => {
  const list = store.paymentMethodsByUserId[req.params.id] || [];
  const next = list.filter((m) => m.id !== req.params.methodId);
  store.paymentMethodsByUserId[req.params.id] = next;
  res.status(204).end();
});

app.patch('/api/users/:id/payment-methods/:methodId/default', (req, res) => {
  const list = store.paymentMethodsByUserId[req.params.id] || [];
  list.forEach((m) => (m.isDefault = m.id === req.params.methodId));
  res.json(list.find((m) => m.id === req.params.methodId) || {});
});

// ---------- Auth ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = (email || '').trim().toLowerCase();
  if (!(password || '').trim()) return res.status(400).json({ error: 'Password is required' });
  const user = store.usersStore.find((u) => (u.email || '').toLowerCase() === emailNorm);
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
  res.json(user);
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, role } = req.body || {};
  const emailNorm = (email || '').trim().toLowerCase();
  if (store.usersStore.some((u) => (u.email || '').toLowerCase() === emailNorm)) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }
  const statusBadge = role === 'agency' ? 'Agency' : role === 'driver' ? 'New Driver' : 'Traveler';
  const user = {
    id: `u_${Date.now()}`,
    name: name || '',
    email: email || '',
    phone: phone || '',
    roles: [role || 'passenger'],
    rating: 5,
    statusBadge,
  };
  store.usersStore.push(user);
  res.status(201).json(user);
});

app.post('/api/auth/register-minimal', (req, res) => {
  const { name, phone, email, role } = req.body || {};
  const id = `u_${Date.now()}`;
  const emailVal = (email || '').trim().toLowerCase();
  const finalEmail = emailVal || `phone-${id}@ihute.local`;
  if (emailVal && store.usersStore.some((u) => (u.email || '').toLowerCase() === emailVal)) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }
  const statusBadge = role === 'agency' ? 'Agency' : role === 'driver' ? 'New Driver' : 'Traveler';
  const user = {
    id,
    name: (name || '').trim(),
    email: finalEmail,
    phone: (phone || '').trim(),
    roles: [role || 'passenger'],
    rating: 5,
    statusBadge,
  };
  store.usersStore.push(user);
  res.status(201).json(user);
});

const OTP_TTL_MS = 10 * 60 * 1000;
const DEV_OTP = '123456';

app.post('/api/auth/otp/send', (req, res) => {
  const key = utils.normalizeOtpKey(req.body?.phoneOrEmail || req.body?.key || '');
  store.pendingOtps[key] = { code: DEV_OTP, expiresAt: Date.now() + OTP_TTL_MS };
  res.json({ success: true });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const key = utils.normalizeOtpKey(req.body?.phoneOrEmail || req.body?.key || '');
  const code = (req.body?.code || '').trim();
  const pending = store.pendingOtps[key];
  if (!pending || pending.expiresAt < Date.now() || pending.code !== code) {
    return res.json(false);
  }
  delete store.pendingOtps[key];
  res.json(true);
});

app.post('/api/auth/otp/create-user', (req, res) => {
  const { phone, email } = req.body || {};
  const hasPhone = !!phone?.trim();
  const hasEmail = !!email?.trim();
  if (hasPhone === hasEmail) return res.status(400).json({ error: 'Provide exactly one of phone or email.' });
  const id = `u_${Date.now()}`;
  const finalEmail = hasEmail ? email.trim().toLowerCase() : `phone-${id}@ihute.local`;
  if (hasEmail && store.usersStore.some((u) => (u.email || '').toLowerCase() === finalEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }
  const user = {
    id,
    name: 'Guest',
    email: finalEmail,
    phone: hasPhone ? phone.trim() : '',
    roles: ['passenger'],
    rating: 5,
    statusBadge: 'Traveler',
  };
  store.usersStore.push(user);
  res.status(201).json(user);
});

// ---------- Vehicles ----------
app.get('/api/vehicles', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.json([]);
  const user = store.findUser(userId);
  if (!user || (!(user.roles || []).includes('driver') && !(user.roles || []).includes('agency'))) {
    return res.json([]);
  }
  const ownerId = user.agencySubRole === 'agency_scanner' && user.agencyId ? user.agencyId : userId;
  const list = store.vehiclesStore.filter((v) => v.driverId === ownerId || v.ownerId === ownerId);
  res.json(list);
});

// ---------- Trips ----------
function filterTripsForSearch(trips, fromId, toId, date, type) {
  let list = trips.filter((t) => t.status === 'active');
  if (fromId) list = list.filter((t) => (t.departureHotpoint?.id || t.departureHotpoint) === fromId);
  if (toId) list = list.filter((t) => (t.destinationHotpoint?.id || t.destinationHotpoint) === toId);
  if (type) list = list.filter((t) => t.type === type);
  if (date) list = list.filter((t) => t.departureDate === date);
  return list;
}

app.get('/api/trips', (req, res) => {
  const { fromId, toId, date, type } = req.query;
  const list = filterTripsForSearch(store.tripsStore, fromId, toId, date, type);
  res.json(list.map(store.resolveTrip));
});

app.get('/api/trips/driver/:userId', (req, res) => {
  const user = store.findUser(req.params.userId);
  const driverId = user?.agencySubRole === 'agency_scanner' && user?.agencyId ? user.agencyId : req.params.userId;
  const list = store.tripsStore.filter((t) => (t.driver?.id || t.driver) === driverId);
  res.json(list.map(store.resolveTrip));
});

app.get('/api/trips/:id', (req, res) => {
  const trip = store.findTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(store.resolveTrip(trip));
});

app.put('/api/trips/:id/status', (req, res) => {
  const { status } = req.body || {};
  const trip = store.findTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  trip.status = status;
  res.json(store.resolveTrip(trip));
});

app.post('/api/trips', (req, res) => {
  const body = req.body || {};
  const id = `t${Date.now()}`;
  const driver = store.findUser(body.driverId || body.driver?.id);
  const vehicle = store.findVehicle(body.vehicleId || body.vehicle?.id);
  const dep = store.findHotpoint(body.departureHotpointId || body.departureHotpoint?.id);
  const dest = store.findHotpoint(body.destinationHotpointId || body.destinationHotpoint?.id);
  if (!driver || !vehicle || !dep || !dest) return res.status(400).json({ error: 'Missing driver, vehicle, or hotpoints' });
  const trip = {
    id,
    type: body.type || 'insta',
    departureHotpoint: dep,
    destinationHotpoint: dest,
    departureTime: body.departureTime || '09:00',
    arrivalTime: body.arrivalTime,
    durationMinutes: body.durationMinutes,
    departureDate: body.departureDate,
    seatsAvailable: body.seatsAvailable ?? 4,
    pricePerSeat: body.pricePerSeat ?? 0,
    allowFullCar: !!body.allowFullCar,
    paymentMethods: body.paymentMethods || ['cash', 'mobile_money', 'card'],
    driver,
    vehicle,
    status: 'active',
  };
  store.tripsStore.unshift(trip);
  res.status(201).json(store.resolveTrip(trip));
});

app.post('/api/trips/bulk', (req, res) => {
  const { baseTripData, departureDate, startTime, intervalMinutes, endTime } = req.body || {};
  const driver = store.findUser(baseTripData?.driverId || baseTripData?.driver?.id);
  const vehicle = store.findVehicle(baseTripData?.vehicleId || baseTripData?.vehicle?.id);
  const dep = store.findHotpoint(baseTripData?.departureHotpointId || baseTripData?.departureHotpoint?.id);
  const dest = store.findHotpoint(baseTripData?.destinationHotpointId || baseTripData?.destinationHotpoint?.id);
  if (!driver || !vehicle || !dep || !dest) return res.status(400).json({ error: 'Missing driver, vehicle, or hotpoints' });
  const durationMins = baseTripData?.durationMinutes ?? 180;
  const slots = [];
  let [sh, sm] = (startTime || '06:00').split(':').map(Number);
  let totalMins = sh * 60 + sm;
  const interval = intervalMinutes || 60;
  const endMins = endTime ? (() => { const [eh, em] = endTime.split(':').map(Number); return eh * 60 + em; })() : totalMins + interval * 48;
  while (slots.length < 48 && totalMins <= endMins) {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    totalMins += interval;
  }
  const created = [];
  for (let i = 0; i < slots.length; i++) {
    const depTime = slots[i];
    const [dh, dm] = depTime.split(':').map(Number);
    const arrMins = (dh * 60 + dm + durationMins) % (24 * 60);
    const arrTime = `${String(Math.floor(arrMins / 60)).padStart(2, '0')}:${String(arrMins % 60).padStart(2, '0')}`;
    const trip = {
      id: `t${Date.now()}_${i}`,
      type: baseTripData?.type || 'scheduled',
      departureDate: departureDate,
      departureHotpoint: dep,
      destinationHotpoint: dest,
      departureTime: depTime,
      arrivalTime: arrTime,
      durationMinutes: durationMins,
      seatsAvailable: baseTripData?.seatsAvailable ?? 4,
      pricePerSeat: baseTripData?.pricePerSeat ?? 0,
      allowFullCar: !!baseTripData?.allowFullCar,
      paymentMethods: baseTripData?.paymentMethods || ['cash', 'mobile_money', 'card'],
      driver,
      vehicle,
      status: 'active',
    };
    store.tripsStore.unshift(trip);
    created.push(store.resolveTrip(trip));
  }
  res.status(201).json(created);
});

// ---------- Bookings ----------
app.get('/api/bookings', (req, res) => {
  const userId = req.query.userId;
  const list = userId ? store.bookingsStore.filter((b) => (b.passenger?.id || b.passenger) === userId) : store.bookingsStore;
  res.json(list.map(store.resolveBooking));
});

app.post('/api/bookings', (req, res) => {
  const { tripId, passenger, seats, paymentMethod, isFullCar } = req.body || {};
  const trip = store.findTrip(tripId);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'active') return res.status(400).json({ error: 'Trip is not available' });
  if (!seats || seats <= 0) return res.status(400).json({ error: 'Seats must be greater than zero' });
  if (!(trip.paymentMethods || []).includes(paymentMethod)) return res.status(400).json({ error: 'Selected payment method is not accepted for this trip' });
  if (isFullCar && !trip.allowFullCar) return res.status(400).json({ error: 'Full car booking is not allowed for this trip' });
  const passengerUser = store.findUser(passenger?.id || passenger) || passenger;
  if (!passengerUser) return res.status(400).json({ error: 'Passenger required' });
  const requestedSeats = isFullCar ? trip.seatsAvailable : seats;
  if (requestedSeats > trip.seatsAvailable) return res.status(400).json({ error: 'Not enough seats available' });
  const nextSeats = Math.max(0, trip.seatsAvailable - requestedSeats);
  const updatedTrip = { ...trip, seatsAvailable: nextSeats, status: nextSeats === 0 ? 'full' : trip.status };
  const bookingId = `${utils.BOOKING_ID_PREFIX}${Date.now()}`;
  const ticketIssuedAt = new Date().toISOString();
  const booking = {
    id: bookingId,
    trip: updatedTrip,
    passenger: passengerUser,
    seats: requestedSeats,
    paymentMethod,
    isFullCar: isFullCar || requestedSeats === trip.seatsAvailable,
    status: 'upcoming',
    createdAt: ticketIssuedAt,
    ticketId: `tk_${bookingId}`,
    ticketNumber: utils.buildTicketNumber(bookingId),
    ticketIssuedAt,
    paymentStatus: utils.normalizePaymentStatus(paymentMethod),
    paymentReference: utils.buildPaymentReference(paymentMethod),
  };
  const tripIndex = store.tripsStore.findIndex((t) => t.id === trip.id);
  if (tripIndex >= 0) store.tripsStore[tripIndex] = updatedTrip;
  store.bookingsStore.push(booking);
  store.driverNotificationsStore.push({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'booking',
    bookingId: booking.id,
    tripId: trip.id,
    driverId: trip.driver?.id || trip.driver,
    passengerName: passengerUser.name,
    seats: requestedSeats,
    createdAt: ticketIssuedAt,
    read: false,
  });
  res.status(201).json(store.resolveBooking(booking));
});

app.post('/api/bookings/:id/cancel', (req, res) => {
  const { passengerId } = req.body || {};
  const booking = store.findBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if ((booking.passenger?.id || booking.passenger) !== passengerId) return res.status(403).json({ error: 'Only the booking passenger can cancel this booking' });
  if (booking.status !== 'upcoming') return res.status(400).json({ error: 'Only upcoming bookings can be cancelled' });
  booking.status = 'cancelled';
  const trip = store.findTrip(booking.trip?.id || booking.trip);
  if (trip) {
    trip.seatsAvailable += booking.seats;
    trip.status = 'active';
  }
  res.json(store.resolveBooking(booking));
});

app.get('/api/bookings/:id/ticket', (req, res) => {
  const booking = store.findBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Ticket not found' });
  const trip = booking.trip;
  const ticketId = booking.ticketId || `tk_${booking.id}`;
  const ticketNumber = booking.ticketNumber || utils.buildTicketNumber(booking.id);
  const issuedAt = booking.ticketIssuedAt || booking.createdAt;
  const paymentStatus = booking.paymentStatus || utils.normalizePaymentStatus(booking.paymentMethod);
  res.json({
    bookingId: booking.id,
    ticketId,
    ticketNumber,
    issuedAt,
    fileUri: booking.ticketFileUri,
    passengerName: (booking.passenger || {}).name,
    driverName: (trip?.driver || {}).name,
    from: (trip?.departureHotpoint || {}).name,
    to: (trip?.destinationHotpoint || {}).name,
    departureTime: trip?.departureTime,
    seats: booking.seats,
    isFullCar: booking.isFullCar,
    paymentMethod: booking.paymentMethod,
    paymentStatus,
    amountTotal: (booking.seats || 0) * (trip?.pricePerSeat || 0),
    qrPayload: utils.buildTicketQrPayload({
      ticketId,
      bookingId: booking.id,
      passengerId: (booking.passenger || {}).id,
      driverId: (trip?.driver || {}).id,
      issuedAt,
    }),
  });
});

// ---------- Tickets validate ----------
app.post('/api/tickets/validate', (req, res) => {
  const { payload, validatorUserId } = req.body || {};
  const scannedAt = new Date().toISOString();
  const parts = (payload || '').split('|');
  if (parts.length !== 7 || parts[0] !== 'IHTQR') {
    return res.json({ valid: false, reason: 'Malformed QR payload', scannedAt });
  }
  const [, ticketId, bookingId, passengerId, driverId, issuedAt, checksum] = parts;
  const seed = `${ticketId}|${bookingId}|${passengerId}|${driverId}|${issuedAt}`;
  if (utils.buildQrChecksum(seed) !== checksum) {
    return res.json({ valid: false, reason: 'Invalid QR checksum', scannedAt, bookingId });
  }
  const booking = store.findBooking(bookingId);
  if (!booking) return res.json({ valid: false, reason: 'Booking not found', scannedAt, bookingId });
  if (booking.status === 'cancelled') return res.json({ valid: false, reason: 'Ticket cancelled', scannedAt, bookingId });
  if (validatorUserId) {
    const tripDriverId = booking.trip?.driver?.id || booking.trip?.driver;
    const validator = store.findUser(validatorUserId);
    const canValidate = tripDriverId === validatorUserId || (validator?.agencySubRole === 'agency_scanner' && validator?.agencyId === tripDriverId);
    if (!canValidate) return res.json({ valid: false, reason: 'Ticket belongs to another driver', scannedAt, bookingId });
  }
  const hydratedTicketId = booking.ticketId || `tk_${booking.id}`;
  const hydratedIssuedAt = booking.ticketIssuedAt || booking.createdAt;
  if (hydratedTicketId !== ticketId || (booking.passenger?.id || booking.passenger) !== passengerId || (booking.trip?.driver?.id || booking.trip?.driver) !== driverId || hydratedIssuedAt !== issuedAt) {
    return res.json({ valid: false, reason: 'Ticket data mismatch', scannedAt, bookingId });
  }
  store.scannedBookingIds.add(bookingId);
  const ticketRes = {
    bookingId: booking.id,
    ticketId: hydratedTicketId,
    ticketNumber: booking.ticketNumber || utils.buildTicketNumber(booking.id),
    issuedAt: hydratedIssuedAt,
    passengerName: (booking.passenger || {}).name,
    driverName: (booking.trip?.driver || {}).name,
    from: (booking.trip?.departureHotpoint || {}).name,
    to: (booking.trip?.destinationHotpoint || {}).name,
    departureTime: booking.trip?.departureTime,
    seats: booking.seats,
    isFullCar: booking.isFullCar,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus || utils.normalizePaymentStatus(booking.paymentMethod),
    amountTotal: (booking.seats || 0) * (booking.trip?.pricePerSeat || 0),
    qrPayload: utils.buildTicketQrPayload({ ticketId: hydratedTicketId, bookingId: booking.id, passengerId: (booking.passenger || {}).id, driverId: (booking.trip?.driver || {}).id, issuedAt: hydratedIssuedAt }),
  };
  res.json({ valid: true, scannedAt, bookingId, ticket: ticketRes });
});

// ---------- Driver activity ----------
app.get('/api/driver/activities', (req, res) => {
  const userId = req.query.userId;
  const user = store.findUser(userId);
  const driverId = user?.agencySubRole === 'agency_scanner' && user?.agencyId ? user.agencyId : userId;
  const trips = store.tripsStore.filter((t) => (t.driver?.id || t.driver) === driverId);
  const activities = trips.map((trip) => {
    const tripBookings = store.bookingsStore.filter((b) => (b.trip?.id || b.trip) === trip.id && b.status !== 'cancelled');
    const bookedSeats = tripBookings.reduce((s, b) => s + b.seats, 0);
    const collectedAmount = tripBookings.reduce((s, b) => s + b.seats * (trip.pricePerSeat || 0), 0);
    return {
      trip: store.resolveTrip(trip),
      bookingsCount: tripBookings.length,
      bookedSeats,
      remainingSeats: Math.max(0, trip.seatsAvailable),
      collectedAmount,
    };
  });
  res.json(activities);
});

app.get('/api/driver/activity-summary', (req, res) => {
  const userId = req.query.userId;
  const user = store.findUser(userId);
  const driverId = user?.agencySubRole === 'agency_scanner' && user?.agencyId ? user.agencyId : userId;
  const trips = store.tripsStore.filter((t) => (t.driver?.id || t.driver) === driverId);
  const bookings = store.bookingsStore.filter((b) => b.status !== 'cancelled');
  let doneCount = 0, activeCount = 0, bookingsCount = 0, remainingSeats = 0, income = 0;
  trips.forEach((trip) => {
    const tripBookings = bookings.filter((b) => (b.trip?.id || b.trip) === trip.id);
    if (trip.status === 'completed') doneCount++;
    else if (trip.status === 'active' || trip.status === 'full') activeCount++;
    bookingsCount += tripBookings.length;
    remainingSeats += Math.max(0, trip.seatsAvailable);
    income += tripBookings.reduce((s, b) => s + b.seats * (trip.pricePerSeat || 0), 0);
  });
  res.json({ doneCount, activeCount, bookingsCount, remainingSeats, income });
});

// ---------- Ratings ----------
app.get('/api/ratings/driver/:driverId/summary', (req, res) => {
  const list = store.driverRatingsStore.filter((r) => r.driverId === req.params.driverId);
  if (list.length === 0) return res.json({ average: 0, count: 0 });
  const average = list.reduce((s, r) => s + r.score, 0) / list.length;
  res.json({ average: Number(average.toFixed(1)), count: list.length });
});

app.get('/api/bookings/:bookingId/rating', (req, res) => {
  const r = store.driverRatingsStore.find((x) => x.bookingId === req.params.bookingId);
  res.json(r || null);
});

app.post('/api/ratings', (req, res) => {
  const { bookingId, passengerId, score, comment } = req.body || {};
  const booking = store.findBooking(bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if ((booking.passenger?.id || booking.passenger) !== passengerId) return res.status(403).json({ error: 'Only the booking passenger can rate this driver' });
  if (booking.status !== 'completed') return res.status(400).json({ error: 'Driver can only be rated after trip completion' });
  if (score < 1 || score > 5) return res.status(400).json({ error: 'Rating score must be between 1 and 5' });
  const driverId = booking.trip?.driver?.id || booking.trip?.driver;
  const existing = store.driverRatingsStore.find((r) => r.bookingId === bookingId);
  const rating = {
    id: existing?.id || `r_${Date.now()}`,
    bookingId,
    driverId,
    passengerId,
    score,
    comment: (comment || '').trim() || undefined,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  if (existing) {
    const idx = store.driverRatingsStore.indexOf(existing);
    store.driverRatingsStore[idx] = rating;
  } else {
    store.driverRatingsStore.push(rating);
  }
  const driverRatings = store.driverRatingsStore.filter((r) => r.driverId === driverId);
  const avg = driverRatings.reduce((s, r) => s + r.score, 0) / driverRatings.length;
  const rounded = Number(avg.toFixed(1));
  const driver = store.findUser(driverId);
  if (driver) driver.rating = rounded;
  res.status(existing ? 200 : 201).json(rating);
});

// ---------- Notifications ----------
app.get('/api/notifications/driver/:driverId', (req, res) => {
  const list = store.driverNotificationsStore
    .filter((n) => n.driverId === req.params.driverId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.post('/api/notifications/driver/:driverId/read', (req, res) => {
  store.driverNotificationsStore.forEach((n) => {
    if (n.driverId === req.params.driverId) n.read = true;
  });
  res.json({ ok: true });
});

// ---------- Scanner count ----------
app.get('/api/scanner/count', (req, res) => {
  const userId = req.query.userId;
  res.json(store.scannerTicketCountByUserId[userId] ?? 0);
});

app.post('/api/scanner/count/increment', (req, res) => {
  const userId = req.body?.userId || req.query.userId;
  if (userId) {
    store.scannerTicketCountByUserId[userId] = (store.scannerTicketCountByUserId[userId] || 0) + 1;
  }
  res.json(store.scannerTicketCountByUserId[userId] ?? 0);
});

// ---------- Scanner report (derived) ----------
app.get('/api/scanner/report', (req, res) => {
  const userId = req.query.userId;
  const period = req.query.period || 'today';
  const user = store.findUser(userId);
  const driverId = user?.agencySubRole === 'agency_scanner' && user?.agencyId ? user.agencyId : userId;
  const driverTrips = store.tripsStore.filter((t) => (t.driver?.id || t.driver) === driverId);
  const tripIds = new Set(driverTrips.map((t) => t.id));
  const driverBookings = store.bookingsStore.filter((b) => tripIds.has(b.trip?.id || b.trip) && b.status !== 'cancelled');
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const items = driverBookings.map((b) => {
    const trip = store.findTrip(b.trip?.id || b.trip);
    const depDate = trip?.departureDate || todayStr;
    const route = `${(trip?.departureHotpoint || {}).name || ''} → ${(trip?.destinationHotpoint || {}).name || ''}`;
    const status = store.scannedBookingIds.has(b.id) ? 'scanned' : b.status === 'cancelled' ? 'cancelled' : 'pending';
    return {
      id: `sr_${b.id}`,
      bookingId: b.id,
      route,
      passengerName: (b.passenger || {}).name || '',
      departureTime: trip?.departureTime || '',
      status,
      scannedAt: store.scannedBookingIds.has(b.id) ? new Date().toISOString() : undefined,
    };
  });
  let filtered = items;
  if (period === 'past') filtered = items.filter((i) => {
    const b = store.findBooking(i.bookingId);
    const t = b?.trip;
    const d = t?.departureDate;
    if (!d) return false;
    return d < todayStr;
  });
  else if (period === 'today') filtered = items.filter((i) => {
    const b = store.findBooking(i.bookingId);
    const t = b?.trip;
    return (t?.departureDate || '') === todayStr;
  });
  else if (period === 'upcoming') filtered = items.filter((i) => {
    const b = store.findBooking(i.bookingId);
    const t = b?.trip;
    const d = t?.departureDate;
    if (!d) return true;
    return d > todayStr;
  });
  res.json(filtered);
});

// ---------- Conversations & messages ----------
function ensureConversation(userId1, userId2, scopeLabel) {
  const id1 = [userId1, userId2].sort().join('_');
  let conv = store.conversationsStore.find((c) => c.id === id1);
  if (!conv) {
    const other = store.findUser(userId2);
    conv = { id: id1, participantIds: [userId1, userId2], otherUser: other || { id: userId2, name: 'Unknown' }, lastMessage: null, unreadCount: 0, updatedAt: new Date().toISOString(), scopeLabel: scopeLabel || 'Ticket & claim' };
    store.conversationsStore.push(conv);
  }
  return conv;
}

// Seed a few conversations
(function seedConversations() {
  const u1 = store.findUser('u_passenger_1');
  const u2 = store.findUser('u_driver_1');
  const u3 = store.findUser('u_agency_1');
  if (u1 && u2) {
    const c1 = ensureConversation(u1.id, u2.id);
    store.messagesByConversationId[c1.id] = [
      { id: 'msg1', senderId: u2.id, text: 'See you at the pickup!', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 'msg2', senderId: u1.id, text: 'Thanks!', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
    ];
    c1.lastMessage = 'Thanks!';
    c1.updatedAt = new Date(Date.now() - 4 * 60000).toISOString();
  }
  if (u1 && u3) {
    const c2 = ensureConversation(u1.id, u3.id);
    store.messagesByConversationId[c2.id] = [
      { id: 'msg3', senderId: u3.id, text: "We'll look into your claim and get back within 24h.", timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
    ];
    c2.lastMessage = "We'll look into your claim and get back within 24h.";
    c2.updatedAt = new Date(Date.now() - 60 * 60000).toISOString();
  }
})();

// Seed payment methods for a test user
(function seedPaymentMethods() {
  store.paymentMethodsByUserId['u_passenger_1'] = [
    { id: 'pm-1', type: 'mobile_money', label: 'Mobile Money', detail: 'Connected', isDefault: true },
    { id: 'pm-2', type: 'card', label: 'Visa Card', detail: '**** 8842', isDefault: false },
    { id: 'pm-3', type: 'cash', label: 'Cash', detail: 'Pay at pickup', isDefault: false },
  ];
})();

app.get('/api/conversations', (req, res) => {
  const userId = req.query.userId;
  const list = store.conversationsStore.filter((c) => (c.participantIds || []).includes(userId));
  const withOther = list.map((c) => {
    const otherId = (c.participantIds || []).find((id) => id !== userId);
    const otherUser = store.findUser(otherId) || c.otherUser || { id: otherId, name: 'Unknown' };
    return { ...c, otherUser };
  });
  withOther.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(withOther);
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const list = store.messagesByConversationId[req.params.id] || [];
  res.json(list);
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const { text, senderId } = req.body || {};
  const convId = req.params.id;
  let conv = store.conversationsStore.find((c) => c.id === convId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  const msg = {
    id: `msg_${Date.now()}`,
    senderId,
    text: (text || '').trim(),
    timestamp: new Date().toISOString(),
  };
  if (!store.messagesByConversationId[convId]) store.messagesByConversationId[convId] = [];
  store.messagesByConversationId[convId].push(msg);
  conv.lastMessage = msg.text;
  conv.updatedAt = msg.timestamp;
  res.status(201).json(msg);
});

// ---------- Mock store (for app compatibility) ----------
app.get('/api/mock-store', (req, res) => {
  const userId = req.query.userId;
  const out = {
    profileCompleteByUserId: { ...store.profileCompleteByUserId },
    notificationPrefs: store.notificationPrefsByUserId[userId] || { tripUpdates: true, messageAlerts: true, promotions: true },
  };
  res.json(out);
});

app.patch('/api/mock-store', (req, res) => {
  const patch = req.body || {};
  if (patch.profileCompleteByUserId) Object.assign(store.profileCompleteByUserId, patch.profileCompleteByUserId);
  res.json({ ok: true });
});

// ---------- Health ----------
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ihute API server running at http://0.0.0.0:${PORT}`);
});
