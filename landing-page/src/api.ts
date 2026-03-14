/**
 * Landing-page API: all data from the backend. Set VITE_API_BASE_URL in .env (e.g. http://localhost:3000).
 */
import type { Trip, Booking, DriverInstantQueueEntry } from '@shared/types';
import type { Hotpoint } from '@shared/types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** Whether the real API is configured (required for real testing). */
export function isApiConfigured(): boolean {
  return API_BASE.length > 0;
}

/** Fetch hotpoints (locations) from the API. */
export async function fetchHotpointsFromApi(): Promise<Hotpoint[]> {
  if (!API_BASE) return [];
  const res = await fetch(`${API_BASE}/api/hotpoints`, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch locations');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Hotpoint[];
}

const BOOKING_PASSENGER_ID = import.meta.env.VITE_BOOKING_PASSENGER_ID ?? 'u_passenger_1';

/** Logged-in user on landing (for "I have an account" booking). */
export interface LandingUser {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: LandingUser }> {
  const url = `${API_BASE}/api/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = res.statusText || 'Login failed';
    try {
      const j = text ? JSON.parse(text) : {};
      if (j?.error) msg = j.error;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  if (!text) throw new Error('Empty response');
  const data = JSON.parse(text) as { token: string; user: { id: string; email: string; name?: string | null; phone?: string | null } };
  return { token: data.token, user: data.user };
}

/** Create booking as registered user (sends passengerId and Authorization). */
export async function createRegisteredBooking(
  params: CreateBookingParams,
  passengerId: string,
  token: string
): Promise<Booking> {
  const url = `${API_BASE}/api/bookings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tripId: params.tripId,
      passengerId,
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

export type SearchTripsSortBy = 'earliest' | 'price' | 'rating';

export interface SearchTripsParams {
  fromId?: string;
  toId?: string;
  date?: string;
  type?: 'insta' | 'scheduled';
  passengerCount?: number;
  sortBy?: SearchTripsSortBy;
}

export async function fetchTripsFromApi(params: SearchTripsParams = {}): Promise<Trip[]> {
  const q = new URLSearchParams();
  if (params.fromId) q.set('fromId', params.fromId);
  if (params.toId) q.set('toId', params.toId);
  if (params.date) q.set('date', params.date);
  if (params.type) q.set('type', params.type);
  if (params.passengerCount != null) q.set('passengerCount', String(params.passengerCount));
  if (params.sortBy) q.set('sortBy', params.sortBy);
  const url = `${API_BASE}/api/trips?${q.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch trips');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Trip[];
}

/** Fetch a single trip by id (e.g. when opening trip detail from deep link). */
export async function fetchTripById(tripId: string): Promise<Trip | null> {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/api/trips/${tripId}`, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as Trip;
}

export async function fetchInstantQueue(params: { toId?: string; fromId?: string } = {}): Promise<DriverInstantQueueEntry[]> {
  const q = new URLSearchParams();
  if (params.toId) q.set('toId', params.toId);
  if (params.fromId) q.set('fromId', params.fromId);
  const url = `${API_BASE}/api/driver/instant-queue?${q.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch instant queue');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as DriverInstantQueueEntry[];
}

export interface CreateBookingParams {
  tripId: string;
  seats: number;
  paymentMethod: string;
  isFullCar?: boolean;
}

/** Guest details for 2.0 guest-only web booking */
export interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  deliveryMethod?: 'whatsapp' | 'sms' | 'email' | 'download';
}

/** Create a booking as guest (2.0: no account). Use this for landing-page. */
export async function createGuestBooking(params: CreateBookingParams & { guest: GuestDetails }): Promise<Booking> {
  const url = `${API_BASE}/api/bookings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      tripId: params.tripId,
      guest: params.guest,
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

/** Create a booking on the server (legacy: uses fixed passenger id). Prefer createGuestBooking for web. */
export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const url = `${API_BASE}/api/bookings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      tripId: params.tripId,
      passengerId: BOOKING_PASSENGER_ID,
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

/** Get booking by id (for confirmation / ticket page after payment callback) */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const url = `${API_BASE}/api/bookings/${bookingId}/ticket`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as Booking;
}

/** Payment status for callback page (poll until succeeded/failed) */
export interface PaymentStatusResult {
  status: 'pending' | 'succeeded' | 'failed';
  bookingId?: string;
}

export async function getPaymentStatus(params: { depositId?: string; bookingId?: string }): Promise<PaymentStatusResult> {
  const q = new URLSearchParams();
  if (params.depositId) q.set('depositId', params.depositId);
  if (params.bookingId) q.set('bookingId', params.bookingId);
  const url = `${API_BASE}/api/payments/status?${q.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to check payment status');
  return (await res.json()) as PaymentStatusResult;
}

/** Create Stripe payment intent for a booking. Returns clientSecret for Stripe Elements. */
export async function createPaymentIntent(bookingId: string): Promise<{ clientSecret: string }> {
  const url = `${API_BASE}/api/payments/create-intent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ bookingId }),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = res.statusText || 'Failed to create payment';
    try {
      const j = text ? JSON.parse(text) : {};
      if (j?.error) msg = j.error;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  if (!text) throw new Error('Empty response');
  const data = JSON.parse(text) as { clientSecret?: string };
  if (!data.clientSecret) throw new Error('Invalid payment response');
  return { clientSecret: data.clientSecret };
}

/** Create PawaPay deposit for a booking. Returns depositId and optional redirectUrl. */
export async function createDeposit(bookingId: string, phone?: string): Promise<{ depositId: string; redirectUrl?: string }> {
  const url = `${API_BASE}/api/payments/create-deposit`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ bookingId, phone: phone || '' }),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = res.statusText || 'Failed to create deposit';
    try {
      const j = text ? JSON.parse(text) : {};
      if (j?.error) msg = j.error;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  if (!text) throw new Error('Empty response');
  const data = JSON.parse(text) as { depositId?: string; redirectUrl?: string };
  if (!data.depositId) throw new Error('Invalid deposit response');
  return { depositId: data.depositId, redirectUrl: data.redirectUrl };
}

