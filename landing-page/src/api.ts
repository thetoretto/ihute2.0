/**
 * Fetch trips from the same API server the mobile app uses.
 * Set VITE_API_BASE_URL in .env (e.g. http://localhost:3000) to enable; otherwise no requests are sent.
 */
import type { Trip } from '@shared/types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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

