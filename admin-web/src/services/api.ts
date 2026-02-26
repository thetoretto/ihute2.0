/**
 * Admin API client. When VITE_API_BASE_URL is set, disputes, hotpoints, trips, bookings, vehicles, and users use the server; otherwise use local adminData.
 * Changes (create/update/delete) go to the server so the whole app (mobile, web) sees them.
 */
import type { Dispute, Hotpoint, Trip, Booking, Vehicle, User } from '../types';
import type { AdminScope } from './adminMetrics';

export interface GetTripsApiParams {
  fromId?: string;
  toId?: string;
  date?: string;
  type?: 'insta' | 'scheduled';
  driverUserId?: string;
}

function getApiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  return typeof base === 'string' && base.trim() ? base.trim().replace(/\/$/, '') : '';
}

export function isApiConfigured(): boolean {
  return getApiBase().length > 0;
}

// ---------- Hotpoints (admin CRUD → server store = whole app) ----------
export async function getHotpointsApi(): Promise<Hotpoint[]> {
  const base = getApiBase();
  if (!base) return [];
  const res = await fetch(`${base}/api/hotpoints`, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch hotpoints');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Hotpoint[];
}

export async function createHotpointApi(data: Omit<Hotpoint, 'id'>): Promise<Hotpoint> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetch(`${base}/api/hotpoints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  if (!res.ok) {
    const message = parseError(text, 'Failed to create hotpoint');
    throw new Error(message);
  }
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as Hotpoint;
}

export async function updateHotpointApi(id: string, data: Partial<Omit<Hotpoint, 'id'>>): Promise<Hotpoint> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetch(`${base}/api/hotpoints/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  if (!res.ok) {
    const message = parseError(text, 'Failed to update hotpoint');
    throw new Error(message);
  }
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as Hotpoint;
}

export async function deleteHotpointApi(id: string): Promise<void> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetch(`${base}/api/hotpoints/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (res.status === 204) return;
  const text = await res.text();
  const message = parseError(text, 'Failed to delete hotpoint');
  throw new Error(message);
}

// ---------- Trips (read from server for admin) ----------
export async function getTripsApi(params?: GetTripsApiParams): Promise<Trip[]> {
  const base = getApiBase();
  if (!base) return [];
  if (params?.driverUserId) {
    const res = await fetch(`${base}/api/trips/driver/${encodeURIComponent(params.driverUserId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(res.statusText || 'Failed to fetch trips');
    const text = await res.text();
    if (!text) return [];
    return JSON.parse(text) as Trip[];
  }
  const q = new URLSearchParams();
  if (params?.fromId) q.set('fromId', params.fromId);
  if (params?.toId) q.set('toId', params.toId);
  if (params?.date) q.set('date', params.date);
  if (params?.type) q.set('type', params.type);
  const url = `${base}/api/trips${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch trips');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Trip[];
}

// ---------- Bookings (read from server for admin) ----------
export async function getBookingsApi(params?: { userId?: string }): Promise<Booking[]> {
  const base = getApiBase();
  if (!base) return [];
  const q = new URLSearchParams();
  if (params?.userId) q.set('userId', params.userId);
  const url = `${base}/api/bookings${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch bookings');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Booking[];
}

// ---------- Vehicles (read from server for admin; server requires userId) ----------
export async function getVehiclesApi(userId?: string): Promise<Vehicle[]> {
  const base = getApiBase();
  if (!base) return [];
  const url = userId
    ? `${base}/api/vehicles?userId=${encodeURIComponent(userId)}`
    : `${base}/api/vehicles`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch vehicles');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Vehicle[];
}

// ---------- Users (read from server for admin) ----------
export async function getUsersApi(params?: { role?: string; agencyId?: string }): Promise<User[]> {
  const base = getApiBase();
  if (!base) return [];
  const q = new URLSearchParams();
  if (params?.role) q.set('role', params.role);
  if (params?.agencyId) q.set('agencyId', params.agencyId);
  const url = `${base}/api/users${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch users');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as User[];
}

function parseError(text: string, fallback: string): string {
  try {
    const json = text ? JSON.parse(text) : {};
    if (json?.error && typeof json.error === 'string') return json.error;
  } catch {
    if (text) return text;
  }
  return fallback;
}

export async function getDisputes(scope?: AdminScope): Promise<Dispute[]> {
  const base = getApiBase();
  if (!base) return [];
  const params = new URLSearchParams();
  if (scope?.agencyId) params.set('agencyId', scope.agencyId);
  const url = `${base}/api/disputes${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch disputes');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Dispute[];
}

export async function getDisputeById(id: string): Promise<Dispute | null> {
  const base = getApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/disputes/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch dispute');
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as Dispute;
}

export async function patchDispute(
  id: string,
  body: { status?: Dispute['status']; resolution?: string; resolvedBy?: string }
): Promise<Dispute> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetch(`${base}/api/disputes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText || 'Failed to update dispute';
    try {
      const json = text ? JSON.parse(text) : {};
      if (json?.error) message = json.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as Dispute;
}
