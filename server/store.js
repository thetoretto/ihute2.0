/**
 * In-memory store: clone from seed and mutable arrays/maps.
 */
const {
  hotpoints,
  users,
  vehicles,
  disputes,
  buildTrips,
  buildBookings,
  buildDriverRatings,
  getUser,
  getVehicle,
  getHotpoint,
} = require('./seed-data');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Mutable copies
const hotpointsStore = deepClone(hotpoints);
const usersStore = deepClone(users);
const vehiclesStore = deepClone(vehicles);
const disputesStore = deepClone(disputes);
const tripsStore = deepClone(buildTrips());
const bookingsStore = deepClone(buildBookings(buildTrips()));
const driverRatingsStore = deepClone(buildDriverRatings());

// Extra stores (not in seed)
const driverNotificationsStore = [];
const withdrawalMethodsByUserId = {};
const paymentMethodsByUserId = {};
const pendingOtps = {}; // key -> { code, expiresAt }
const profileCompleteByUserId = {};
const notificationPrefsByUserId = {};
const scannerTicketCountByUserId = {};
const scannedBookingIds = new Set(); // bookingId when ticket validated
const conversationsStore = [];
const messagesByConversationId = {};

// Helpers that resolve from store (by id for mutable lookup)
function findUser(id) {
  return usersStore.find((u) => u.id === id);
}
function findTrip(id) {
  return tripsStore.find((t) => t.id === id);
}
function findBooking(id) {
  return bookingsStore.find((b) => b.id === id);
}
function findHotpoint(id) {
  return hotpointsStore.find((h) => h.id === id);
}
function findVehicle(id) {
  return vehiclesStore.find((v) => v.id === id);
}

// Resolve trip's driver/vehicle/hotpoints from store by id (for responses)
function resolveTrip(trip) {
  if (!trip) return null;
  const driver = findUser(trip.driver?.id || trip.driver);
  const vehicle = findVehicle(trip.vehicle?.id || trip.vehicle) || trip.vehicle;
  const dep = findHotpoint(trip.departureHotpoint?.id || trip.departureHotpoint);
  const dest = findHotpoint(trip.destinationHotpoint?.id || trip.destinationHotpoint);
  return { ...trip, driver, vehicle, departureHotpoint: dep, destinationHotpoint: dest };
}

function resolveBooking(booking) {
  if (!booking) return null;
  const trip = findTrip(booking.trip?.id || booking.trip);
  const passenger = findUser(booking.passenger?.id || booking.passenger);
  return { ...booking, trip: resolveTrip(trip), passenger };
}

module.exports = {
  hotpointsStore,
  usersStore,
  vehiclesStore,
  disputesStore,
  tripsStore,
  bookingsStore,
  driverRatingsStore,
  driverNotificationsStore,
  withdrawalMethodsByUserId,
  paymentMethodsByUserId,
  pendingOtps,
  profileCompleteByUserId,
  notificationPrefsByUserId,
  scannerTicketCountByUserId,
  scannedBookingIds,
  conversationsStore,
  messagesByConversationId,
  findUser,
  findTrip,
  findBooking,
  findHotpoint,
  findVehicle,
  resolveTrip,
  resolveBooking,
  deepClone,
};
