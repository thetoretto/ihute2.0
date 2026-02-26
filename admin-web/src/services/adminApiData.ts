/**
 * Async admin data layer: when VITE_API_BASE_URL is set, fetches trips, bookings, vehicles, and users from the server; otherwise uses local adminData (adminSnapshot).
 */
import type { Trip, Booking, Vehicle, User } from '../types';
import type { AdminScope } from './adminMetrics';
import {
  isApiConfigured,
  getTripsApi,
  getBookingsApi,
  getVehiclesApi,
  getUsersApi,
} from './api';
import {
  getTrips,
  getBookings,
  getVehicles,
  getBookingsWithTickets,
} from './adminData';

export async function getTripsAsync(scope?: AdminScope): Promise<Trip[]> {
  if (isApiConfigured()) {
    return getTripsApi(
      scope?.agencyId ? { driverUserId: scope.agencyId } : undefined
    );
  }
  return Promise.resolve(getTrips(scope));
}

function tripDriverId(trip: Booking['trip']): string | undefined {
  const d = trip?.driver;
  return typeof d === 'object' && d && 'id' in d ? (d as { id: string }).id : undefined;
}

export async function getBookingsAsync(scope?: AdminScope): Promise<Booking[]> {
  if (isApiConfigured()) {
    const list = await getBookingsApi(undefined);
    if (!scope?.agencyId) return list;
    return list.filter((b) => tripDriverId(b.trip) === scope.agencyId);
  }
  return Promise.resolve(getBookings(scope));
}

export async function getVehiclesAsync(scope?: AdminScope): Promise<Vehicle[]> {
  if (isApiConfigured()) {
    const users = await getUsersApi(
      scope?.agencyId ? { agencyId: scope.agencyId } : undefined
    );
    const driverOrAgency = users.filter(
      (u) =>
        (u.roles || []).includes('driver') || (u.roles || []).includes('agency')
    );
    const allIds = new Set<string>(driverOrAgency.map((u) => u.id));
    if (scope?.agencyId) allIds.add(scope.agencyId);
    const arrays = await Promise.all(
      [...allIds].map((userId) => getVehiclesApi(userId))
    );
    return arrays.flat();
  }
  return Promise.resolve(getVehicles(scope));
}

export async function getUsersAsync(scope?: AdminScope): Promise<User[]> {
  if (isApiConfigured()) {
    return getUsersApi(
      scope?.agencyId ? { agencyId: scope.agencyId } : undefined
    );
  }
  const { adminSnapshot } = await import('../data/snapshot');
  let list = adminSnapshot.users;
  if (scope?.agencyId) {
    list = list.filter(
      (u) =>
        u.id === scope.agencyId ||
        (u as User & { agencyId?: string }).agencyId === scope.agencyId
    );
  }
  return Promise.resolve(list);
}

/** Bookings that have a ticket (for Tickets page); when API configured, filters from getBookingsApi result. */
export async function getBookingsWithTicketsAsync(
  scope?: AdminScope
): Promise<(Booking & { ticketNumber: string })[]> {
  if (isApiConfigured()) {
    const bookings = await getBookingsAsync(scope);
    return bookings.filter(
      (b): b is Booking & { ticketNumber: string } =>
        b.status !== 'cancelled' && !!b.ticketNumber
    );
  }
  return Promise.resolve(getBookingsWithTickets(scope));
}
