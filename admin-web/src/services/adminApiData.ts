/**
 * Async admin data layer: requires VITE_API_BASE_URL; fetches trips, bookings, vehicles, and users from the backend.
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

function requireApi(): void {
  if (!isApiConfigured()) {
    throw new Error('VITE_API_BASE_URL is not set. Configure .env and restart.');
  }
}

export async function getTripsAsync(scope?: AdminScope): Promise<Trip[]> {
  requireApi();
  return getTripsApi(
    scope?.agencyId ? { driverUserId: scope.agencyId } : undefined
  );
}

function tripDriverId(trip: Booking['trip']): string | undefined {
  const d = trip?.driver;
  return typeof d === 'object' && d && 'id' in d ? (d as { id: string }).id : undefined;
}

export async function getBookingsAsync(scope?: AdminScope): Promise<Booking[]> {
  requireApi();
  const list = await getBookingsApi(undefined);
  if (!scope?.agencyId) return list;
  return list.filter((b) => tripDriverId(b.trip) === scope.agencyId);
}

export async function getVehiclesAsync(scope?: AdminScope): Promise<Vehicle[]> {
  requireApi();
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

export async function getUsersAsync(scope?: AdminScope): Promise<User[]> {
  requireApi();
  return getUsersApi(
    scope?.agencyId ? { agencyId: scope.agencyId } : undefined
  );
}

/** Bookings that have a ticket (for Tickets page); filters from getBookingsApi result. */
export async function getBookingsWithTicketsAsync(
  scope?: AdminScope
): Promise<(Booking & { ticketNumber: string })[]> {
  const bookings = await getBookingsAsync(scope);
  return bookings.filter(
    (b): b is Booking & { ticketNumber: string } =>
      b.status !== 'cancelled' && !!b.ticketNumber
  );
}
