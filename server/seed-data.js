/**
 * Seed data matching shared/src/mocks - plain JS for server.
 * All objects are JSON-serializable; store will deep-clone for mutability.
 */

const hotpoints = [
  { id: 'hp1', name: 'Kigali', address: 'Kigali City Center', latitude: -1.9441, longitude: 30.0619, country: 'Rwanda' },
  { id: 'hp2', name: 'Rubavu', address: 'Rubavu Main Station', latitude: -1.679, longitude: 29.2594, country: 'Rwanda' },
  { id: 'hp3', name: 'Rusizi', address: 'Rusizi Bus Park', latitude: -2.4846, longitude: 28.9075, country: 'Rwanda' },
  { id: 'hp4', name: 'Goma', address: 'Goma Downtown', latitude: -1.6835, longitude: 29.2389, country: 'DR Congo' },
  { id: 'hp5', name: 'Kampala', address: 'Kampala Central', latitude: 0.3476, longitude: 32.5825, country: 'Uganda' },
  { id: 'hp6', name: 'Musanze', address: 'Musanze Bus Terminal', latitude: -1.4998, longitude: 29.6347, country: 'Rwanda' },
  { id: 'hp7', name: 'Huye', address: 'Huye Main Roundabout', latitude: -2.5967, longitude: 29.7394, country: 'Rwanda' },
  { id: 'hp8', name: 'Muhanga', address: 'Muhanga Transit Point', latitude: -2.0845, longitude: 29.7569, country: 'Rwanda' },
  { id: 'hp9', name: 'Bujumbura', address: 'Bujumbura Centre', latitude: -3.3614, longitude: 29.3599, country: 'Burundi' },
  { id: 'hp10', name: 'Kabale', address: 'Kabale Main Stage', latitude: -1.2486, longitude: 29.9899, country: 'Uganda' },
  { id: 'hp11', name: 'Ruhengeri', address: 'Ruhengeri Market', latitude: -1.4998, longitude: 29.6366, country: 'Rwanda' },
  { id: 'hp12', name: 'Nyamagabe', address: 'Nyamagabe Junction', latitude: -2.478, longitude: 29.566, country: 'Rwanda' },
  { id: 'hp13', name: 'SP Nyarutarama', address: 'SP Petrol Station Nyarutarama, Kigali', latitude: -1.9368, longitude: 30.1046, country: 'Rwanda' },
  { id: 'hp14', name: 'Simba Gisenyi', address: 'Simba Supermarket Gisenyi, Rubavu', latitude: -1.7028, longitude: 29.2583, country: 'Rwanda' },
  { id: 'hp15', name: 'Rusizi Border', address: 'Rusizi One Stop Border Post', latitude: -2.4908, longitude: 28.8956, country: 'Rwanda' },
  { id: 'hp16', name: 'Nyabugogo Taxi Park', address: 'Nyabugogo Bus & Taxi Terminal, Kigali', latitude: -1.9294, longitude: 30.0439, country: 'Rwanda' },
  { id: 'hp17', name: 'Remera Bus Stop', address: 'Remera Bus Stop, KG 11 Ave, Kigali', latitude: -1.9498, longitude: 30.1072, country: 'Rwanda' },
  { id: 'hp18', name: 'Goma Border Petite Barriere', address: 'Petite Barriere Border Crossing, Goma', latitude: -1.6774, longitude: 29.2466, country: 'DR Congo' },
];

const users = [
  { id: 'u_passenger_1', name: 'Yvan', email: 'passenger@ihute.com', phone: '+123456789', roles: ['passenger'], rating: 4.7, statusBadge: 'Traveler' },
  { id: 'u_driver_1', name: 'Camille', email: 'driver@ihute.com', phone: '+123456790', roles: ['driver'], rating: 4.9, statusBadge: 'Verified', avatarUri: 'https://ui-avatars.com/api/?name=Camille&size=100&background=random' },
  { id: 'u_driver_2', name: 'Claire', email: 'claire@example.com', phone: '+123456791', roles: ['driver'], rating: 4.9, statusBadge: 'Verified', avatarUri: 'https://ui-avatars.com/api/?name=Claire&size=100&background=random' },
  { id: 'u_driver_3', name: 'Jean-Pierre', email: 'jeanpierre@example.com', phone: '+123456792', roles: ['driver'], rating: 4.0, statusBadge: 'Verified' },
  { id: 'u_passenger_2', name: 'Amine', email: 'amine@example.com', phone: '+123456793', roles: ['passenger'], rating: 4.6, statusBadge: 'Explorer' },
  { id: 'u_passenger_3', name: 'Sarah', email: 'sarah@example.com', phone: '+123456794', roles: ['passenger'], rating: 4.8, statusBadge: 'Explorer' },
  { id: 'u_agency_1', name: 'Kigali Express', email: 'agency@ihute.com', phone: '+123456795', roles: ['agency'], rating: 4.8, statusBadge: 'Agency', avatarUri: 'https://ui-avatars.com/api/?name=Kigali+Express&size=100&background=random', agencySubRole: 'agency_manager' },
  { id: 'u_scanner_1', name: 'Scanner Op', email: 'scanner@ihute.com', phone: '+123456796', roles: ['agency'], rating: 4.5, statusBadge: 'Scanner', agencySubRole: 'agency_scanner', agencyId: 'u_agency_1' },
];

const vehicles = [
  { id: 'v1', make: 'Toyota', model: 'Corolla', color: 'Silver', licensePlate: 'RAB-123-A', seats: 4, approvalStatus: 'approved', driverId: 'u_driver_1' },
  { id: 'v2', make: 'Honda', model: 'Civic', color: 'Black', licensePlate: 'RAC-456-B', seats: 4, approvalStatus: 'pending', driverId: 'u_driver_2' },
  { id: 'v3', make: 'Mazda', model: 'CX-5', color: 'White', licensePlate: 'RAD-789-C', seats: 5, approvalStatus: 'approved', driverId: 'u_driver_3' },
  { id: 'v4', make: 'Coaster', model: 'Bus', color: 'Blue', licensePlate: 'RAB-111-X', seats: 18, approvalStatus: 'approved', driverId: 'u_agency_1', ownerId: 'u_agency_1' },
  { id: 'v5', make: 'Coaster', model: 'Bus', color: 'Green', licensePlate: 'RAB-222-Y', seats: 18, approvalStatus: 'approved', driverId: 'u_agency_1', ownerId: 'u_agency_1' },
];

const disputes = [
  { id: 'd1', bookingId: 'b1', tripId: 't1', reporterId: 'u_passenger_1', type: 'payment', status: 'open', description: 'Driver requested cash but I had already paid by card.', createdAt: '2026-02-17T10:00:00.000Z' },
  { id: 'd2', bookingId: 'b3', tripId: 't5', reporterId: 'u_passenger_1', type: 'cancellation', status: 'in_review', description: 'Trip was cancelled without notice 30 minutes before departure.', createdAt: '2026-02-16T14:00:00.000Z' },
  { id: 'd3', bookingId: 'b6', tripId: 't3', reporterId: 'u_passenger_3', type: 'other', status: 'resolved', description: 'Wrong pickup location shown in app.', resolution: 'Updated hotpoint and issued partial refund.', resolvedAt: '2026-02-18T09:00:00.000Z', resolvedBy: 'admin', createdAt: '2026-02-18T08:45:00.000Z' },
];

function getHotpoint(id) {
  return hotpoints.find((h) => h.id === id) || hotpoints[0];
}
function getUser(id) {
  return users.find((u) => u.id === id) || users[0];
}
function getVehicle(id) {
  return vehicles.find((v) => v.id === id) || vehicles[0];
}

function buildTrips() {
  const agencyUser = getUser('u_agency_1');
  const agencyV4 = getVehicle('v4');
  const agencyV5 = getVehicle('v5');
  return [
    { id: 't1', type: 'insta', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp2'), departureTime: '09:00', arrivalTime: '12:50', durationMinutes: 230, seatsAvailable: 2, pricePerSeat: 25500, allowFullCar: false, paymentMethods: ['cash', 'mobile_money', 'card'], driver: getUser('u_driver_1'), vehicle: getVehicle('v1'), status: 'active' },
    { id: 't2', type: 'insta', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp5'), departureTime: '11:10', arrivalTime: '15:30', durationMinutes: 260, seatsAvailable: 0, pricePerSeat: 25900, allowFullCar: false, paymentMethods: ['cash', 'card'], driver: getUser('u_driver_2'), vehicle: getVehicle('v2'), status: 'full' },
    { id: 't3', type: 'insta', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp10'), departureTime: '13:10', arrivalTime: '16:50', durationMinutes: 220, seatsAvailable: 2, pricePerSeat: 30800, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: getUser('u_driver_3'), vehicle: getVehicle('v3'), status: 'active' },
    { id: 't4', type: 'scheduled', departureHotpoint: getHotpoint('hp4'), destinationHotpoint: getHotpoint('hp2'), departureTime: '11:00', arrivalTime: '14:50', durationMinutes: 230, seatsAvailable: 3, pricePerSeat: 31500, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: getUser('u_driver_1'), vehicle: getVehicle('v1'), status: 'active' },
    { id: 't5', type: 'scheduled', departureHotpoint: getHotpoint('hp3'), destinationHotpoint: getHotpoint('hp2'), departureTime: '10:40', arrivalTime: '12:24', durationMinutes: 104, seatsAvailable: 2, pricePerSeat: 68600, allowFullCar: false, paymentMethods: ['card'], driver: getUser('u_driver_2'), vehicle: getVehicle('v2'), status: 'completed' },
    { id: 't_ke1', type: 'scheduled', departureDate: '2026-02-20', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp2'), departureTime: '06:00', arrivalTime: '09:50', durationMinutes: 230, seatsAvailable: 18, pricePerSeat: 28000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV4, status: 'active' },
    { id: 't_ke2', type: 'scheduled', departureDate: '2026-02-20', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp6'), departureTime: '07:30', arrivalTime: '09:44', durationMinutes: 134, seatsAvailable: 15, pricePerSeat: 35000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV4, status: 'active' },
    { id: 't_ke3', type: 'scheduled', departureDate: '2026-02-20', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp4'), departureTime: '08:00', arrivalTime: '11:50', durationMinutes: 230, seatsAvailable: 18, pricePerSeat: 45000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV5, status: 'active' },
    { id: 't_ke4', type: 'scheduled', departureDate: '2026-02-20', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp3'), departureTime: '09:00', arrivalTime: '13:20', durationMinutes: 260, seatsAvailable: 18, pricePerSeat: 52000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV4, status: 'active' },
    { id: 't_ke5', type: 'scheduled', departureDate: '2026-02-20', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp7'), departureTime: '12:00', arrivalTime: '14:30', durationMinutes: 150, seatsAvailable: 12, pricePerSeat: 32000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV5, status: 'active' },
    { id: 't_ke6', type: 'scheduled', departureDate: '2026-02-21', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp2'), departureTime: '06:30', arrivalTime: '10:20', durationMinutes: 230, seatsAvailable: 18, pricePerSeat: 28000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV4, status: 'active' },
    { id: 't_ke7', type: 'scheduled', departureDate: '2026-02-21', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp5'), departureTime: '08:00', arrivalTime: '12:20', durationMinutes: 260, seatsAvailable: 0, pricePerSeat: 55000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV5, status: 'full' },
    { id: 't_ke8', type: 'scheduled', departureDate: '2026-02-21', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp8'), departureTime: '14:00', arrivalTime: '15:45', durationMinutes: 105, seatsAvailable: 18, pricePerSeat: 25000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV4, status: 'active' },
    { id: 't_ke9', type: 'scheduled', departureDate: '2026-02-22', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp2'), departureTime: '07:00', arrivalTime: '10:50', durationMinutes: 230, seatsAvailable: 18, pricePerSeat: 28000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV5, status: 'active' },
    { id: 't_ke10', type: 'scheduled', departureDate: '2026-02-22', departureHotpoint: getHotpoint('hp1'), destinationHotpoint: getHotpoint('hp6'), departureTime: '18:00', arrivalTime: '20:14', durationMinutes: 134, seatsAvailable: 16, pricePerSeat: 35000, allowFullCar: true, paymentMethods: ['cash', 'mobile_money', 'card'], driver: agencyUser, vehicle: agencyV4, status: 'active' },
  ];
}

function buildBookings(trips) {
  const t1 = trips.find((t) => t.id === 't1');
  const t2 = trips.find((t) => t.id === 't2');
  const t3 = trips.find((t) => t.id === 't3');
  const t4 = trips.find((t) => t.id === 't4');
  const t5 = trips.find((t) => t.id === 't5');
  const p0 = getUser('u_passenger_1');
  const p4 = getUser('u_passenger_2');
  const p5 = getUser('u_passenger_3');
  return [
    { id: 'b1', trip: t1, passenger: p0, seats: 1, paymentMethod: 'card', isFullCar: false, status: 'upcoming', createdAt: '2026-02-17T08:00:00.000Z', ticketId: 'tk_b1', ticketNumber: 'IHT-B1-2026', ticketIssuedAt: '2026-02-17T08:00:00.000Z', paymentStatus: 'paid' },
    { id: 'b2', trip: t4, passenger: p0, seats: 2, paymentMethod: 'cash', isFullCar: false, status: 'ongoing', createdAt: '2026-02-17T09:00:00.000Z', ticketId: 'tk_b2', ticketNumber: 'IHT-B2-2026', ticketIssuedAt: '2026-02-17T09:00:00.000Z', paymentStatus: 'cash_on_pickup' },
    { id: 'b3', trip: t5, passenger: p0, seats: 1, paymentMethod: 'card', isFullCar: false, status: 'completed', createdAt: '2026-02-16T08:00:00.000Z', ticketId: 'tk_b3', ticketNumber: 'IHT-B3-2026', ticketIssuedAt: '2026-02-16T08:00:00.000Z', paymentStatus: 'paid' },
    { id: 'b4', trip: t1, passenger: p4, seats: 1, paymentMethod: 'mobile_money', isFullCar: false, status: 'completed', createdAt: '2026-02-16T11:00:00.000Z', ticketId: 'tk_b4', ticketNumber: 'IHT-B4-2026', ticketIssuedAt: '2026-02-16T11:00:00.000Z', paymentStatus: 'paid' },
    { id: 'b5', trip: t4, passenger: p5, seats: 1, paymentMethod: 'cash', isFullCar: false, status: 'upcoming', createdAt: '2026-02-18T07:10:00.000Z', ticketId: 'tk_b5', ticketNumber: 'IHT-B5-2026', ticketIssuedAt: '2026-02-18T07:10:00.000Z', paymentStatus: 'cash_on_pickup' },
    { id: 'b6', trip: t3, passenger: p5, seats: 2, paymentMethod: 'card', isFullCar: true, status: 'ongoing', createdAt: '2026-02-18T08:30:00.000Z', ticketId: 'tk_b6', ticketNumber: 'IHT-B6-2026', ticketIssuedAt: '2026-02-18T08:30:00.000Z', paymentStatus: 'paid' },
  ];
}

// Pre-seed a few driver ratings for completed bookings (b3, b4)
function buildDriverRatings() {
  return [
    { id: 'r_b3', bookingId: 'b3', driverId: 'u_driver_2', passengerId: 'u_passenger_1', score: 5, comment: 'Smooth ride.', createdAt: '2026-02-16T14:00:00.000Z' },
    { id: 'r_b4', bookingId: 'b4', driverId: 'u_driver_1', passengerId: 'u_passenger_2', score: 4, createdAt: '2026-02-16T12:00:00.000Z' },
  ];
}

module.exports = {
  hotpoints,
  users,
  vehicles,
  disputes,
  buildTrips,
  buildBookings,
  buildDriverRatings,
  getHotpoint,
  getUser,
  getVehicle,
};
