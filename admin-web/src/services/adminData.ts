import type { Hotpoint, Dispute, Vehicle, Booking } from '../types';
import type { AdminScope } from './adminMetrics';
import { adminSnapshot } from '../data/snapshot';

export function getHotpoints(): Hotpoint[] {
  return adminSnapshot.hotpoints;
}

export function getHotpointById(id: string): Hotpoint | undefined {
  return adminSnapshot.hotpoints.find((h) => h.id === id);
}

export function createHotpoint(data: Omit<Hotpoint, 'id'>): Hotpoint {
  const id = `hp${Date.now()}`;
  const hotpoint: Hotpoint = { ...data, id };
  adminSnapshot.hotpoints.push(hotpoint);
  return hotpoint;
}

export function updateHotpoint(id: string, data: Partial<Omit<Hotpoint, 'id'>>): Hotpoint | undefined {
  const index = adminSnapshot.hotpoints.findIndex((h) => h.id === id);
  if (index === -1) return undefined;
  const updated = { ...adminSnapshot.hotpoints[index], ...data };
  adminSnapshot.hotpoints[index] = updated;
  for (const trip of adminSnapshot.trips) {
    if (trip.departureHotpoint.id === id) trip.departureHotpoint = updated;
    if (trip.destinationHotpoint.id === id) trip.destinationHotpoint = updated;
  }
  return updated;
}

export function deleteHotpoint(id: string): boolean {
  const inUse = adminSnapshot.trips.some(
    (t) => t.departureHotpoint.id === id || t.destinationHotpoint.id === id
  );
  if (inUse) return false;
  const index = adminSnapshot.hotpoints.findIndex((h) => h.id === id);
  if (index === -1) return false;
  adminSnapshot.hotpoints.splice(index, 1);
  return true;
}

export function getDisputes(scope?: AdminScope): Dispute[] {
  let list = adminSnapshot.disputes;
  if (scope?.agencyId) {
    const agencyBookingIds = new Set(
      adminSnapshot.bookings.filter((b) => b.trip.driver.id === scope.agencyId).map((b) => b.id)
    );
    list = list.filter((d) => agencyBookingIds.has(d.bookingId));
  }
  return list;
}

export function getTrips(scope?: AdminScope) {
  const list = adminSnapshot.trips;
  if (!scope?.agencyId) return list;
  return list.filter((t) => t.driver.id === scope.agencyId);
}

export function getBookings(scope?: AdminScope) {
  const list = adminSnapshot.bookings;
  if (!scope?.agencyId) return list;
  return list.filter((b) => b.trip.driver.id === scope.agencyId);
}

export function getDisputeById(id: string, scope?: AdminScope): Dispute | undefined {
  return getDisputes(scope).find((d) => d.id === id);
}

export function resolveDispute(
  id: string,
  resolution: string,
  resolvedBy: string
): Dispute | undefined {
  const index = adminSnapshot.disputes.findIndex((d) => d.id === id);
  if (index === -1) return undefined;
  const updated: Dispute = {
    ...adminSnapshot.disputes[index],
    status: 'resolved',
    resolution,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
  };
  adminSnapshot.disputes[index] = updated;
  return updated;
}

export function setDisputeStatus(id: string, status: Dispute['status']): Dispute | undefined {
  const index = adminSnapshot.disputes.findIndex((d) => d.id === id);
  if (index === -1) return undefined;
  const updated = { ...adminSnapshot.disputes[index], status };
  adminSnapshot.disputes[index] = updated;
  return updated;
}

export function getVehicles(scope?: AdminScope): Vehicle[] {
  const list = adminSnapshot.vehicles;
  if (!scope?.agencyId) return list;
  const v = list as (Vehicle & { ownerId?: string })[];
  return v.filter((x) => x.driverId === scope.agencyId || x.ownerId === scope.agencyId);
}

export function setVehicleApproval(
  vehicleId: string,
  approvalStatus: Vehicle['approvalStatus']
): Vehicle | undefined {
  const index = adminSnapshot.vehicles.findIndex((v) => v.id === vehicleId);
  if (index === -1) return undefined;
  const updated = { ...adminSnapshot.vehicles[index], approvalStatus };
  adminSnapshot.vehicles[index] = updated;
  return updated;
}

export interface BookingWithTicket extends Booking {
  ticketNumber: string;
}

export function getBookingsWithTickets(scope?: AdminScope): BookingWithTicket[] {
  let list = adminSnapshot.bookings;
  if (scope?.agencyId) {
    list = list.filter((b) => b.trip.driver.id === scope.agencyId);
  }
  return list.filter(
    (b): b is BookingWithTicket => b.status !== 'cancelled' && !!b.ticketNumber
  );
}
