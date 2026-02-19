import {
  mockHotpoints,
  mockUsers,
  mockVehicles,
  mockTrips as _mockTrips,
  mockBookings as _mockBookings,
} from '../../../shared/src/mocks';
import type { Trip, Booking, DriverRating } from '../types';

export { mockHotpoints, mockUsers, mockVehicles };

export const mockDriverRatings: DriverRating[] = [];

let tripsStore: Trip[]   = _mockTrips as unknown as Trip[];
let bookingsStore: Booking[] = [..._mockBookings];
let ratingsStore: DriverRating[] = [...mockDriverRatings];

export const mockTrips: Trip[]    = tripsStore;
export const mockBookings: Booking[] = bookingsStore;

export function getTripsStore(): Trip[]       { return tripsStore; }
export function setTripsStore(trips: Trip[])  { tripsStore = trips; }

export function getBookingsStore(): Booking[]          { return bookingsStore; }
export function setBookingsStore(bookings: Booking[])  { bookingsStore = bookings; }

export function getRatingsStore(): DriverRating[]            { return ratingsStore; }
export function setRatingsStore(ratings: DriverRating[])     { ratingsStore = ratings; }
