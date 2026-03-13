/**
 * Admin auth: JWT + user stored in sessionStorage for 2.0 backend.
 * When VITE_API_BASE_URL is set, login calls POST /api/auth/login and stores token + user.
 */
import type { AdminUser } from '../types';

const STORAGE_KEY = 'ihute_admin_auth';

export interface AuthPayload {
  token: string;
  user: AdminUser;
}

/** Backend user shape (server-v2) */
interface BackendUser {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  userType: string;
  agencyId?: string | null;
  agencySubRole?: string | null;
  status?: string;
  rating?: number;
  statusBadge?: string | null;
}

function mapBackendUserToAdminUser(backend: BackendUser): AdminUser {
  const adminType =
    backend.userType === 'SUPER_ADMIN' ? 'system'
    : backend.userType === 'SCANNER' ? 'scanner'
    : 'agency';
  return {
    id: backend.id,
    name: backend.name ?? backend.email ?? 'Admin',
    email: backend.email,
    phone: backend.phone ?? '',
    roles: ['agency'],
    adminType,
    agencyId: backend.agencyId ?? undefined,
    agencySubRole: backend.agencySubRole ?? undefined,
    rating: backend.rating,
    statusBadge: backend.statusBadge ?? undefined,
  };
}

export function getStoredAuth(): AuthPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; user?: BackendUser };
    if (!parsed.token || !parsed.user) return null;
    return {
      token: parsed.token,
      user: mapBackendUserToAdminUser(parsed.user),
    };
  } catch {
    return null;
  }
}

export function setStoredAuth(payload: { token: string; user: BackendUser }): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredAuth(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getAuthToken(): string | null {
  const auth = getStoredAuth();
  return auth?.token ?? null;
}

/** Call POST /api/auth/login; returns { token, user }. Throws on failure. */
export async function loginApi(email: string, password: string): Promise<AuthPayload> {
  const base = (import.meta.env.VITE_API_BASE_URL as string)?.trim()?.replace(/\/$/, '');
  if (!base) throw new Error('API not configured');
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText || 'Login failed';
    try {
      const json = text ? JSON.parse(text) : {};
      if (json?.error) message = json.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (!text) throw new Error('Empty response');
  const data = JSON.parse(text) as { token?: string; user?: BackendUser };
  if (!data.token || !data.user) throw new Error('Invalid login response');
  setStoredAuth({ token: data.token, user: data.user });
  return {
    token: data.token,
    user: mapBackendUserToAdminUser(data.user),
  };
}
