import { getCommissionRate } from '../config';
import { adminSnapshot } from '../data/snapshot';
import type { Trip, Booking, User } from '../types';

export interface AdminScope {
  agencyId?: string;
}

/** Optional override data (e.g. from API); when provided, used instead of adminSnapshot. */
export interface AdminMetricsData {
  trips?: Trip[];
  bookings?: Booking[];
  users?: User[];
}

function getDriverId(t: Trip): string | undefined {
  const d = t.driver;
  return typeof d === 'object' && d && 'id' in d ? (d as User).id : undefined;
}
function getPassengerId(b: Booking): string | undefined {
  const p = b.passenger;
  return typeof p === 'object' && p && 'id' in p ? (p as User).id : undefined;
}
function getScopedBookings(agencyId?: string, bookings = adminSnapshot.bookings) {
  const list = bookings.filter((b) => b.status !== 'cancelled');
  if (!agencyId) return list;
  return list.filter((b) => getDriverId(b.trip) === agencyId);
}

export function getDashboardMetrics(scope?: AdminScope, data?: AdminMetricsData) {
  const agencyId = scope?.agencyId;
  const rate = getCommissionRate();
  const trips = data?.trips ?? adminSnapshot.trips;
  const bookings = data?.bookings ?? adminSnapshot.bookings;
  const users = data?.users ?? adminSnapshot.users;

  const scopeTrips = agencyId
    ? trips.filter((t) => getDriverId(t) === agencyId)
    : trips;
  const scopeBookings = getScopedBookings(agencyId, bookings);

  const totalUsers = agencyId
    ? users.filter(
        (u) =>
          u.id === agencyId ||
          (u as User & { agencyId?: string }).agencyId === agencyId ||
          scopeTrips.some((t) => getDriverId(t) === u.id) ||
          scopeBookings.some((b) => getPassengerId(b) === u.id)
      ).length
    : users.length;
  const driverUsers = agencyId
    ? scopeTrips.filter((t) => (t.driver?.roles || []).includes('driver') || (t.driver?.roles || []).includes('agency')).length
    : users.filter((user) => (user.roles || []).includes('driver') || (user.roles || []).includes('agency')).length;
  const passengerUsers = Math.max(0, totalUsers - driverUsers);

  const totalTrips = scopeTrips.length;
  const activeTrips = scopeTrips.filter((trip) => trip.status === 'active').length;
  const completedTrips = scopeTrips.filter((trip) => trip.status === 'completed').length;

  const totalBookings = scopeBookings.length;
  const completedBookings = scopeBookings.filter((booking) => booking.status === 'completed').length;

  const grossEarnings = scopeBookings.reduce(
    (sum, booking) => sum + booking.seats * (booking.trip?.pricePerSeat ?? 0),
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

export function getEarningsByRoute(scope?: AdminScope, data?: AdminMetricsData) {
  const rate = getCommissionRate();
  const bookings = getScopedBookings(scope?.agencyId, data?.bookings ?? adminSnapshot.bookings);
  const map = new Map<string, { gross: number; commission: number; net: number }>();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const key = `${b.trip.departureHotpoint.name} → ${b.trip.destinationHotpoint.name}`;
    const amount = b.seats * (b.trip?.pricePerSeat ?? 0);
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
  return Array.from(map.entries()).map(([route, d]) => ({ route, ...d })).sort((a, b) => b.gross - a.gross);
}

export function getEarningsByDriver(scope?: AdminScope, data?: AdminMetricsData) {
  const rate = getCommissionRate();
  const bookings = getScopedBookings(scope?.agencyId, data?.bookings ?? adminSnapshot.bookings);
  const map = new Map<string, { driverName: string; gross: number; commission: number; net: number }>();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const driver = b.trip?.driver;
    const id = typeof driver === 'object' && driver && 'id' in driver ? (driver as User).id : '';
    const name = typeof driver === 'object' && driver && 'name' in driver ? (driver as User).name : id;
    const amount = b.seats * (b.trip?.pricePerSeat ?? 0);
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
  return Array.from(map.entries()).map(([driverId, d]) => ({ driverId, ...d })).sort((a, b) => b.gross - a.gross);
}

export function getEarningsByPeriod(groupBy: 'day' | 'week', scope?: AdminScope, data?: AdminMetricsData) {
  const rate = getCommissionRate();
  const bookings = getScopedBookings(scope?.agencyId, data?.bookings ?? adminSnapshot.bookings);
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
    const amount = b.seats * (b.trip?.pricePerSeat ?? 0);
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
  return Array.from(map.entries()).map(([period, d]) => ({ period, ...d })).sort((a, b) => a.period.localeCompare(b.period));
}
