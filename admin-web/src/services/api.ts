/**
 * Admin API client. When VITE_API_BASE_URL is set, disputes, hotpoints, trips, bookings, vehicles, and users use the server; otherwise use local adminData.
 * Changes (create/update/delete) go to the server so the whole app (mobile, web) sees them.
 */
import type { Dispute, Hotpoint, Trip, Booking, Vehicle, User } from '../types';
import type { AdminScope } from './adminMetrics';
import { getAuthToken, clearStoredAuth } from './auth';

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

/** Fetch with base URL, JSON, and Authorization when token exists. On 401 clears auth and throws. */
async function fetchWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined && typeof init.body === 'string' && !headers['Content-Type'])
    headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearStoredAuth();
    const text = await res.text();
    let msg = 'Session expired';
    try {
      const j = text ? JSON.parse(text) : {};
      if (j?.error) msg = j.error;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  return res;
}

// ---------- Hotpoints (admin CRUD → server store = whole app) ----------
export async function getHotpointsApi(): Promise<Hotpoint[]> {
  const base = getApiBase();
  if (!base) return [];
  const res = await fetchWithAuth('/api/hotpoints', { method: 'GET' });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch hotpoints');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Hotpoint[];
}

export async function createHotpointApi(data: Omit<Hotpoint, 'id'>): Promise<Hotpoint> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetchWithAuth('/api/hotpoints', {
    method: 'POST',
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
  const res = await fetchWithAuth(`/api/hotpoints/${encodeURIComponent(id)}`, {
    method: 'PUT',
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
  const res = await fetchWithAuth(`/api/hotpoints/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
    const res = await fetchWithAuth(`/api/trips/driver/${encodeURIComponent(params.driverUserId)}`, { method: 'GET' });
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
  const url = `/api/trips${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetchWithAuth(url, { method: 'GET' });
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
  const url = `/api/bookings${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetchWithAuth(url, { method: 'GET' });
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
    ? `/api/vehicles?userId=${encodeURIComponent(userId)}`
    : `/api/vehicles`;
  const res = await fetchWithAuth(url, { method: 'GET' });
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
  const url = `/api/users${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetchWithAuth(url, { method: 'GET' });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch users');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as User[];
}

// ---------- Agencies (super admin CRUD + assign admin/scanner) ----------
export interface Agency {
  id: string;
  name: string;
  contactInfo?: string | null;
  users?: Array<{ id: string; name: string | null; email: string; userType: string }>;
  _count?: { vehicles: number };
}

export async function getAgenciesApi(): Promise<Agency[]> {
  const base = getApiBase();
  if (!base) return [];
  const res = await fetchWithAuth('/api/agencies', { method: 'GET' });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch agencies');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Agency[];
}

export async function getAgencyByIdApi(id: string): Promise<Agency | null> {
  const base = getApiBase();
  if (!base) return null;
  const res = await fetchWithAuth(`/api/agencies/${encodeURIComponent(id)}`, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch agency');
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as Agency;
}

export async function createAgencyApi(data: { name: string; contactInfo?: string }): Promise<Agency> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetchWithAuth('/api/agencies', { method: 'POST', body: JSON.stringify(data) });
  const text = await res.text();
  if (!res.ok) throw new Error(parseError(text, 'Failed to create agency'));
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as Agency;
}

export async function updateAgencyApi(id: string, data: { name?: string; contactInfo?: string | null }): Promise<Agency> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetchWithAuth(`/api/agencies/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  const text = await res.text();
  if (!res.ok) throw new Error(parseError(text, 'Failed to update agency'));
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as Agency;
}

export async function deleteAgencyApi(id: string): Promise<void> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetchWithAuth(`/api/agencies/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (res.status === 204) return;
  const text = await res.text();
  throw new Error(parseError(text, 'Failed to delete agency'));
}

export async function assignAgencyAdminApi(agencyId: string, userId: string): Promise<User> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetchWithAuth(`/api/agencies/${encodeURIComponent(agencyId)}/assign-admin`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(parseError(text, 'Failed to assign agency admin'));
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as User;
}

export async function assignAgencyScannerApi(agencyId: string, userId: string): Promise<User> {
  const base = getApiBase();
  if (!base) throw new Error('API not configured');
  const res = await fetchWithAuth(`/api/agencies/${encodeURIComponent(agencyId)}/assign-scanner`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(parseError(text, 'Failed to assign scanner'));
  if (!text) throw new Error('Empty response');
  return JSON.parse(text) as User;
}

/** GET /api/scanner/report – scanner's validated tickets (or agency admin's agency validations) */
export async function getScannerReportApi(): Promise<Array<{ id: string; bookingId: string; route: string; passengerName: string | null; status: string; scannedAt: string | null }>> {
  const base = getApiBase();
  if (!base) return [];
  const res = await fetchWithAuth('/api/scanner/report', { method: 'GET' });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch scanner report');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text);
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
  const url = `/api/disputes${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetchWithAuth(url, { method: 'GET' });
  if (!res.ok) throw new Error(res.statusText || 'Failed to fetch disputes');
  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text) as Dispute[];
}

export async function getDisputeById(id: string): Promise<Dispute | null> {
  const base = getApiBase();
  if (!base) return null;
  const res = await fetchWithAuth(`/api/disputes/${encodeURIComponent(id)}`, { method: 'GET' });
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
  const res = await fetchWithAuth(`/api/disputes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
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
