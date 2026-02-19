import { getCommissionRate } from '../config';
import { adminSnapshot } from '../data/snapshot';

export interface AdminScope {
  agencyId?: string;
}

function getScopedBookings(agencyId?: string) {
  const bookings = adminSnapshot.bookings.filter((b) => b.status !== 'cancelled');
  if (!agencyId) return bookings;
  return bookings.filter((b) => b.trip.driver.id === agencyId);
}

export function getDashboardMetrics(scope?: AdminScope) {
  const agencyId = scope?.agencyId;
  const rate = getCommissionRate();

  const scopeTrips = agencyId
    ? adminSnapshot.trips.filter((t) => t.driver.id === agencyId)
    : adminSnapshot.trips;
  const scopeBookings = getScopedBookings(agencyId);

  const totalUsers = agencyId
    ? adminSnapshot.users.filter(
        (u) =>
          u.id === agencyId ||
          u.agencyId === agencyId ||
          scopeTrips.some((t) => t.driver.id === u.id) ||
          scopeBookings.some((b) => b.passenger.id === u.id)
      ).length
    : adminSnapshot.users.length;
  const driverUsers = agencyId
    ? scopeTrips.filter((t) => t.driver.roles?.includes('driver') || t.driver.roles?.includes('agency')).length
    : adminSnapshot.users.filter((user) => user.roles.includes('driver') || user.roles.includes('agency')).length;
  const passengerUsers = Math.max(0, totalUsers - driverUsers);

  const totalTrips = scopeTrips.length;
  const activeTrips = scopeTrips.filter((trip) => trip.status === 'active').length;
  const completedTrips = scopeTrips.filter((trip) => trip.status === 'completed').length;

  const totalBookings = scopeBookings.length;
  const completedBookings = scopeBookings.filter((booking) => booking.status === 'completed').length;

  const grossEarnings = scopeBookings.reduce(
    (sum, booking) => sum + booking.seats * booking.trip.pricePerSeat,
    0
  );

  const appCommission = grossEarnings * rate;
  const netPlatformEarnings = grossEarnings - appCommission;

  return {
    totalUsers,
    driverUsers,
    passengerUsers,
    totalTrips,
    activeTrips,
    completedTrips,
    totalBookings,
    completedBookings,
    grossEarnings,
    appCommission,
    netPlatformEarnings,
    commissionRate: rate,
  };
}

export function getEarningsByRoute(scope?: AdminScope) {
  const rate = getCommissionRate();
  const bookings = getScopedBookings(scope?.agencyId);
  const map = new Map<string, { gross: number; commission: number; net: number }>();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const key = `${b.trip.departureHotpoint.name} → ${b.trip.destinationHotpoint.name}`;
    const amount = b.seats * b.trip.pricePerSeat;
    const commission = amount * rate;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { gross: amount, commission, net: amount - commission });
    } else {
      existing.gross += amount;
      existing.commission += commission;
      existing.net += amount - commission;
    }
  }
  return Array.from(map.entries()).map(([route, data]) => ({ route, ...data })).sort((a, b) => b.gross - a.gross);
}

export function getEarningsByDriver(scope?: AdminScope) {
  const rate = getCommissionRate();
  const bookings = getScopedBookings(scope?.agencyId);
  const map = new Map<string, { driverName: string; gross: number; commission: number; net: number }>();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const id = b.trip.driver.id;
    const name = b.trip.driver.name;
    const amount = b.seats * b.trip.pricePerSeat;
    const commission = amount * rate;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, { driverName: name, gross: amount, commission, net: amount - commission });
    } else {
      existing.gross += amount;
      existing.commission += commission;
      existing.net += amount - commission;
    }
  }
  return Array.from(map.entries()).map(([driverId, data]) => ({ driverId, ...data })).sort((a, b) => b.gross - a.gross);
}

export function getEarningsByPeriod(groupBy: 'day' | 'week', scope?: AdminScope) {
  const rate = getCommissionRate();
  const bookings = getScopedBookings(scope?.agencyId);
  const map = new Map<string, { gross: number; commission: number; net: number }>();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const d = new Date(b.createdAt);
    const key = groupBy === 'day'
      ? d.toISOString().slice(0, 10)
      : (() => {
          const onejan = new Date(d.getFullYear(), 0, 1);
          const weekNum = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
          return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        })();
    const amount = b.seats * b.trip.pricePerSeat;
    const commission = amount * rate;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { gross: amount, commission, net: amount - commission });
    } else {
      existing.gross += amount;
      existing.commission += commission;
      existing.net += amount - commission;
    }
  }
  return Array.from(map.entries()).map(([period, data]) => ({ period, ...data })).sort((a, b) => a.period.localeCompare(b.period));
}
