/**
 * Fetch trips from the same API server the mobile app uses.
 * Set VITE_API_BASE_URL in .env (e.g. http://localhost:3000) to enable; otherwise no requests are sent.
 */
import type { Trip, Booking } from '@shared/types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const BOOKING_PASSENGER_ID = import.meta.env.VITE_BOOKING_PASSENGER_ID ?? 'u_passenger_1';

export interface SearchTripsParams {
  fromId?: string;
  toId?: string;
  date?: string;
  type?: 'insta' | 'scheduled';
}

export async function fetchTripsFromApi(params: SearchTripsParams = {}): Promise<Trip[]> {
  const q = new URLSearchParams();
  if (params.fromId) q.set('fromId', params.fromId);
  if (params.toId) q.set('toId', params.toId);
  if (params.date) q.set('date', params.date);
  if (params.type) q.set('type', params.type);
  const url = `${API_BASE}/api/trips?${q.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch trips');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Trip[];
}

export interface CreateBookingParams {
  tripId: string;
  seats: number;
  paymentMethod: string;
  isFullCar?: boolean;
}

/** Create a booking on the server. Uses VITE_BOOKING_PASSENGER_ID (default u_passenger_1) as passenger. */
export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const url = `${API_BASE}/api/bookings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      tripId: params.tripId,
      passenger: { id: BOOKING_PASSENGER_ID },
      seats: params.seats,
      paymentMethod: params.paymentMethod,
      isFullCar: params.isFullCar ?? false,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText || 'Booking failed';
    try {
      const json = text ? JSON.parse(text) : {};
      if (json?.error) message = json.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as Booking;
}

