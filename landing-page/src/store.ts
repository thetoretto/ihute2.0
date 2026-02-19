import { mockTrips, mockBookings } from '@shared/mocks';
import type { Trip, Booking } from '@shared/types';

const STORAGE_KEY = 'ihute_landing_data';

function isValidTrip(t: unknown): t is Trip {
  if (typeof t !== 'object' || t === null) return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.departureHotpoint === 'object' &&
    o.departureHotpoint !== null &&
    typeof o.destinationHotpoint === 'object' &&
    o.destinationHotpoint !== null &&
    typeof o.seatsAvailable === 'number' &&
    typeof o.pricePerSeat === 'number'
  );
}

function isValidBooking(b: unknown): b is Booking {
  if (typeof b !== 'object' || b === null) return false;
  const o = b as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.trip === 'object' &&
    o.trip !== null &&
    typeof o.passenger === 'object' &&
    o.passenger !== null &&
    typeof o.seats === 'number' &&
    typeof o.status === 'string'
  );
}

function loadFromStorage(): { trips: Trip[]; bookings: Booking[] } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { trips: [...mockTrips], bookings: [...mockBookings] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { trips: [...mockTrips], bookings: [...mockBookings] };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { trips: [...mockTrips], bookings: [...mockBookings] };
    }
    const { trips, bookings } = parsed as { trips?: unknown[]; bookings?: unknown[] };
    const validTrips = Array.isArray(trips) && trips.every(isValidTrip) ? trips : [...mockTrips];
    const validBookings = Array.isArray(bookings) && bookings.every(isValidBooking) ? bookings : [...mockBookings];
    return { trips: validTrips, bookings: validBookings };
  } catch {
    return { trips: [...mockTrips], bookings: [...mockBookings] };
  }
}

function persist(trips: Trip[], bookings: Booking[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, bookings }));
  } catch {
    // Best-effort; in-memory state still updated
  }
}

const initial = loadFromStorage();
let tripsStore: Trip[] = initial.trips;
let bookingsStore: Booking[] = initial.bookings;

export function getTripsStore(): Trip[] {
  return tripsStore;
}

export function setTripsStore(trips: Trip[]) {
  tripsStore = trips;
  persist(tripsStore, bookingsStore);
}

export function getBookingsStore(): Booking[] {
  return bookingsStore;
}

export function setBookingsStore(bookings: Booking[]) {
  bookingsStore = bookings;
  persist(tripsStore, bookingsStore);
}
