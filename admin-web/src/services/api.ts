/**
 * Admin API client. When VITE_API_BASE_URL is set, disputes use the server; otherwise use local adminData.
 */
import type { Dispute } from '../types';
import type { AdminScope } from './adminMetrics';

function getApiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  return typeof base === 'string' && base.trim() ? base.trim().replace(/\/$/, '') : '';
}

export function isApiConfigured(): boolean {
  return getApiBase().length > 0;
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
