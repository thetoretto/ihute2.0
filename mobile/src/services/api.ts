/**
 * Single API facade: when EXPO_PUBLIC_API_BASE_URL is set, the app uses only the real backend (no mocks).
 * When not set, API calls throw so the app can show a "Configure API" message.
 * JWT is stored in AsyncStorage and sent as Authorization header; 401 clears token.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Trip, DriverInstantQueueEntry } from '../types';

const AUTH_TOKEN_KEY = 'ihute_auth_token';
const rawBaseFromEnv = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');
// Android Emulator: localhost is the emulator; use 10.0.2.2 to reach the host. iOS Simulator / web: localhost is correct.
const API_BASE =
  rawBaseFromEnv.length > 0 && Platform.OS === 'android' && (rawBaseFromEnv.includes('localhost') || rawBaseFromEnv.includes('127.0.0.1'))
    ? rawBaseFromEnv.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2')
    : rawBaseFromEnv;

const USE_REAL_API = API_BASE.length > 0;

export function isApiConfigured(): boolean {
  return USE_REAL_API;
}

const CONFIG_MSG = 'Set EXPO_PUBLIC_API_BASE_URL in mobile/.env (e.g. http://localhost:3000 or your PC IP for device).';

function requireApi(): void {
  if (!USE_REAL_API) throw new Error(CONFIG_MSG);
}

export async function getStoredAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setStoredAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearStoredAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

/** When real API returns 401, this is called after clearing token. Set from AuthProvider to logout and show login. */
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

/** Map backend user (userType) to shared User (roles). */
function mapBackendUserToUser(backend: { id: string; name?: string | null; email: string; phone?: string | null; userType?: string; agencyId?: string | null; statusBadge?: string | null; rating?: number | null }): User {
  const roles: Array<'passenger' | 'driver' | 'agency'> = [];
  if (backend.userType === 'DRIVER') roles.push('driver');
  else if (backend.userType === 'AGENCY_ADMIN' || backend.userType === 'SCANNER' || backend.userType === 'SUPER_ADMIN') roles.push('agency');
  else roles.push('passenger');
  const agencySubRole = backend.userType === 'SCANNER' ? 'agency_scanner' : backend.userType === 'AGENCY_ADMIN' ? 'agency_manager' : undefined;
  return {
    id: backend.id,
    name: backend.name ?? backend.email ?? '',
    email: backend.email,
    phone: backend.phone ?? '',
    roles,
    agencySubRole,
    agencyId: backend.agencyId ?? undefined,
    rating: backend.rating ?? undefined,
    statusBadge: backend.statusBadge ?? undefined,
  };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  requireApi();
  const url = `${API_BASE}${path}`;
  const authHeaders: Record<string, string> = {};
  const token = await getStoredAuthToken();
  if (token) authHeaders.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (res.status === 401) {
    await clearStoredAuthToken();
    onUnauthorized?.();
    let message = 'Session expired';
    try {
      const json = text ? JSON.parse(text) : {};
      if (json?.error) message = json.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const json = JSON.parse(text);
      if (json?.error) message = json.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (text === '' || res.status === 204) return undefined as T;
  return JSON.parse(text) as T;
}

// Re-export types from mockApi and mockPersistence so callers can keep importing from api
export type { ScannerTicketReportItem } from './mockApi';
export type { DriverNotification } from './mockPersistence';

// Persistence: always use local (AsyncStorage) so authUserId stays on device
export {
  getMockStore,
  updateMockStore,
} from './mockPersistence';

// OTP: backend does not expose pending code; return dev code for testing display
export async function getPendingOtp(key: string): Promise<{ code: string; expiresAt: number } | null> {
  requireApi();
  return { code: '123456', expiresAt: Date.now() + 10 * 60 * 1000 };
}

// When real API: fetch. Otherwise: delegate to mock.
import * as mockApi from './mockApi';
import * as mockPersistence from './mockPersistence';

export async function getHotpoints() {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getHotpoints>>>('GET', '/api/hotpoints');
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

export async function searchTrips(params: SearchTripsParams = {}): Promise<Trip[]> {
  requireApi();
  const q = new URLSearchParams();
  if (params.fromId) q.set('fromId', params.fromId);
  if (params.toId) q.set('toId', params.toId);
  if (params.date) q.set('date', params.date);
  if (params.type) q.set('type', params.type);
  if (params.passengerCount != null) q.set('passengerCount', String(params.passengerCount));
  if (params.sortBy) q.set('sortBy', params.sortBy);
  return request<Trip[]>('GET', `/api/trips?${q.toString()}`);
}

export async function getUser(userId?: string) {
  requireApi();
  const id = userId || 'u_passenger_1';
  return request<User | null>('GET', `/api/users/${id}`);
}

export async function getUserBookings(userId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getUserBookings>>>('GET', `/api/bookings?userId=${encodeURIComponent(userId)}`);
}

export async function cancelBooking(bookingId: string, passengerId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.cancelBooking>>>('POST', `/api/bookings/${bookingId}/cancel`, { passengerId });
}

export async function getUserPublishedTrips(userId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getUserPublishedTrips>>>('GET', `/api/trips/driver/${userId}`);
}

export async function getUserVehicles(userId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getUserVehicles>>>('GET', `/api/vehicles?userId=${encodeURIComponent(userId)}`);
}

export async function getDriverTripActivities(userId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getDriverTripActivities>>>('GET', `/api/driver/activities?userId=${encodeURIComponent(userId)}`);
}

export async function updateDriverTripStatus(params: { tripId: string; driverId: string; status: 'active' | 'completed' }) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.updateDriverTripStatus>>>('PUT', `/api/trips/${params.tripId}/status`, { status: params.status });
}

export async function cancelDriverTrip(tripId: string, driverId: string) {
  requireApi();
  return request<Trip>('PUT', `/api/trips/${tripId}/status`, { status: 'cancelled' });
}

export async function getDriverActivitySummary(userId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getDriverActivitySummary>>>('GET', `/api/driver/activity-summary?userId=${encodeURIComponent(userId)}`);
}

export async function getDriverActivityLog(userId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getDriverActivityLog>>>('GET', `/api/driver/activity-log?userId=${encodeURIComponent(userId)}`);
}

export type DriverDriveModeStatus =
  | { inDriveMode: false }
  | ({ inDriveMode: true } & DriverInstantQueueEntry);

export async function getDriverDriveModeStatus(userId: string): Promise<DriverDriveModeStatus> {
  requireApi();
  return request<DriverDriveModeStatus>('GET', `/api/driver/drive-mode/status?userId=${encodeURIComponent(userId)}`);
}

export async function setDriverDriveMode(params: {
  driverId: string;
  fromId: string;
  toId: string;
  seatsAvailable: number;
  pricePerSeat: number;
  vehicleId?: string;
}): Promise<DriverInstantQueueEntry> {
  requireApi();
  return request<DriverInstantQueueEntry>('PUT', '/api/driver/drive-mode', params);
}

export async function clearDriverDriveMode(driverId: string): Promise<void> {
  requireApi();
  return request('DELETE', '/api/driver/drive-mode', { driverId });
}

export async function getInstantQueue(params?: { toId?: string; fromId?: string }): Promise<DriverInstantQueueEntry[]> {
  requireApi();
  const q = new URLSearchParams();
  if (params?.toId) q.set('toId', params.toId);
  if (params?.fromId) q.set('fromId', params.fromId);
  return request('GET', `/api/driver/instant-queue?${q.toString()}`);
}

export async function publishTrip(tripData: Parameters<typeof mockApi.publishTrip>[0]) {
  requireApi();
  const body = {
    ...tripData,
    driverId: tripData.driver?.id,
    vehicleId: tripData.vehicle?.id,
    departureHotpointId: tripData.departureHotpoint?.id,
    destinationHotpointId: tripData.destinationHotpoint?.id,
  };
  return request<Awaited<ReturnType<typeof mockApi.publishTrip>>>('POST', '/api/trips', body);
}

export async function publishTrips(
  baseTripData: Parameters<typeof mockApi.publishTrips>[0],
  options: Parameters<typeof mockApi.publishTrips>[1]
) {
  requireApi();
  const body = {
    baseTripData: {
      ...baseTripData,
      driverId: baseTripData.driver?.id,
      vehicleId: baseTripData.vehicle?.id,
      departureHotpointId: baseTripData.departureHotpoint?.id,
      destinationHotpointId: baseTripData.destinationHotpoint?.id,
    },
    ...options,
  };
  return request<Awaited<ReturnType<typeof mockApi.publishTrips>>>('POST', '/api/trips/bulk', body);
}

export async function bookTrip(bookingData: Parameters<typeof mockApi.bookTrip>[0]) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.bookTrip>>>('POST', '/api/bookings', {
    tripId: bookingData.tripId,
    passenger: bookingData.passenger,
    seats: bookingData.seats,
    paymentMethod: bookingData.paymentMethod,
    isFullCar: bookingData.isFullCar,
  });
}

export async function getBookingTicket(bookingId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getBookingTicket>>>('GET', `/api/bookings/${bookingId}/ticket`);
}

export async function validateTicketQr(payload: string, validatorUser?: User | null) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.validateTicketQr>>>('POST', '/api/tickets/validate', { payload, validatorUserId: validatorUser?.id });
}

export async function downloadTicketPdf(bookingId: string) {
  requireApi();
  throw new Error('Ticket PDF is generated on device; add server PDF endpoint or use shareTicketPdf.');
}

export async function shareTicketPdf(bookingId: string) {
  requireApi();
  const ticket = await getBookingTicket(bookingId);
  const Sharing = await import('expo-sharing');
  const Print = await import('expo-print');
  const html = `<html><body><p>Ticket ${ticket.ticketNumber}</p><p>${ticket.from} to ${ticket.to}</p></body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  const available = await Sharing.default.isAvailableAsync();
  if (!available) throw new Error('Sharing is unavailable on this device');
  await Sharing.default.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Download ticket' });
}

export async function rateDriverFromBooking(params: Parameters<typeof mockApi.rateDriverFromBooking>[0]) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.rateDriverFromBooking>>>('POST', '/api/ratings', params);
}

export async function getDriverRatingSummary(driverId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getDriverRatingSummary>>>('GET', `/api/ratings/driver/${driverId}/summary`);
}

export async function getBookingRating(bookingId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.getBookingRating>>>('GET', `/api/bookings/${bookingId}/rating`);
}

/** GET /api/auth/me - current user from JWT. Use for session restore when token exists. */
export async function getMe(): Promise<User> {
  const raw = await request<Record<string, unknown>>('GET', '/api/auth/me');
  return mapBackendUserToUser(raw as Parameters<typeof mapBackendUserToUser>[0]);
}

/** Returns { token, user } from backend. */
export async function login(email: string, password: string): Promise<User | { token: string; user: User }> {
  requireApi();
  const raw = await request<{ token: string; user: Record<string, unknown> }>('POST', '/api/auth/login', { email, password });
  return { token: raw.token, user: mapBackendUserToUser(raw.user as Parameters<typeof mapBackendUserToUser>[0]) };
}

/** Returns { token, user } from backend. */
export async function register(data: Parameters<typeof mockApi.register>[0]): Promise<User | { token: string; user: User }> {
  requireApi();
  const raw = await request<{ token: string; user: Record<string, unknown> }>('POST', '/api/auth/register', data);
  return { token: raw.token, user: mapBackendUserToUser(raw.user as Parameters<typeof mapBackendUserToUser>[0]) };
}

/** Returns { token, user } from backend. */
export async function registerMinimal(data: Parameters<typeof mockApi.registerMinimal>[0]): Promise<User | { token: string; user: User }> {
  requireApi();
  const raw = await request<{ token: string; user: Record<string, unknown> }>('POST', '/api/auth/register-minimal', data);
  return { token: raw.token, user: mapBackendUserToUser(raw.user as Parameters<typeof mapBackendUserToUser>[0]) };
}

export async function sendOtp(phoneOrEmail: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.sendOtp>>>('POST', '/api/auth/otp/send', { phoneOrEmail });
}

export async function verifyOtp(phoneOrEmail: string, code: string) {
  requireApi();
  return request<boolean>('POST', '/api/auth/otp/verify', { phoneOrEmail, code });
}

/** Returns { token, user } from backend. */
export async function createUserAfterOtp(options: Parameters<typeof mockApi.createUserAfterOtp>[0]): Promise<User | { token: string; user: User }> {
  requireApi();
  const raw = await request<{ token: string; user: Record<string, unknown> }>('POST', '/api/auth/otp/create-user', options);
  return { token: raw.token, user: mapBackendUserToUser(raw.user as Parameters<typeof mapBackendUserToUser>[0]) };
}

export async function updateUserProfile(userId: string, updates: Parameters<typeof mockApi.updateUserProfile>[1]) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.updateUserProfile>>>('PUT', `/api/users/${userId}/profile`, updates);
}

/** Fetches from GET /api/users/:id/profile-complete. */
export async function getProfileComplete(userId: string): Promise<boolean> {
  requireApi();
  return request<boolean>('GET', `/api/users/${userId}/profile-complete`);
}

export async function getScannerTicketReport(period: 'past' | 'today' | 'upcoming') {
  requireApi();
  const list = await request<Array<{ id: string; bookingId: string; route: string; passengerName: string | null; status: string; scannedAt: string | null }>>('GET', '/api/scanner/report');
  return list as Awaited<ReturnType<typeof mockApi.getScannerTicketReport>>;
}

export async function getWithdrawalMethods(userId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockPersistence.getWithdrawalMethods>>>('GET', `/api/users/${userId}/withdrawal-methods`);
}

export async function updateWithdrawalMethods(userId: string, methods: Parameters<typeof mockPersistence.updateWithdrawalMethods>[1]) {
  requireApi();
  return request('PUT', `/api/users/${userId}/withdrawal-methods`, methods);
}

export async function getDriverNotifications(driverId: string) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockPersistence.getDriverNotifications>>>('GET', `/api/notifications/driver/${driverId}`);
}

export async function markDriverNotificationsRead(driverId: string) {
  requireApi();
  return request('POST', `/api/notifications/driver/${driverId}/read`, {});
}

export async function getUnreadDriverNotificationCount(driverId: string) {
  requireApi();
  const list = await request<Awaited<ReturnType<typeof mockPersistence.getDriverNotifications>>>('GET', `/api/notifications/driver/${driverId}`);
  return list.filter((n) => !n.read).length;
}

export async function getScannerTicketCount() {
  requireApi();
  return request<number>('GET', '/api/scanner/count');
}

export async function incrementScannerTicketCount() {
  requireApi();
  return request<number>('POST', '/api/scanner/count/increment', {});
}

// Conversations (real API only; mock path returns mock data via getConversations)
export interface ConversationListItem {
  id: string;
  otherUser: { id: string; name: string };
  lastMessage: string | null;
  unreadCount: number;
  updatedAt: string;
  scopeLabel?: string;
}

export async function getConversations(userId: string): Promise<ConversationListItem[]> {
  requireApi();
  return request<ConversationListItem[]>('GET', `/api/conversations?userId=${encodeURIComponent(userId)}`);
}

export async function getConversationMessages(conversationId: string): Promise<Array<{ id: string; senderId: string; text: string; timestamp: string }>> {
  requireApi();
  return request('GET', `/api/conversations/${conversationId}/messages`);
}

export async function sendConversationMessage(conversationId: string, text: string, senderId: string) {
  requireApi();
  return request<{ id: string; senderId: string; text: string; timestamp: string }>('POST', `/api/conversations/${conversationId}/messages`, { text, senderId });
}

// Payment methods
export interface PaymentMethodItem {
  id: string;
  type: 'card' | 'mobile_money' | 'cash';
  label?: string;
  detail?: string;
  isDefault?: boolean;
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethodItem[]> {
  requireApi();
  return request('GET', `/api/users/${userId}/payment-methods`);
}

export async function addPaymentMethod(userId: string, method: { type: string; label?: string; detail?: string; isDefault?: boolean }): Promise<PaymentMethodItem | null> {
  requireApi();
  return request<PaymentMethodItem>('POST', `/api/users/${userId}/payment-methods`, method);
}

export async function removePaymentMethod(userId: string, methodId: string) {
  requireApi();
  await request('DELETE', `/api/users/${userId}/payment-methods/${methodId}`);
}

export async function setDefaultPaymentMethod(userId: string, methodId: string) {
  requireApi();
  await request('PATCH', `/api/users/${userId}/payment-methods/${methodId}/default`, {});
}

export async function getWalletBalance(userId: string): Promise<number> {
  requireApi();
  return request<number>('GET', `/api/users/${userId}/wallet/balance`);
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  label: string;
  date: string;
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  requireApi();
  return request('GET', `/api/users/${userId}/wallet/transactions`);
}

export async function requestPasswordReset(email: string): Promise<void> {
  requireApi();
  await request('POST', '/api/auth/forgot-password', { email });
}

export async function resetPassword(tokenOrEmail: string, newPassword: string): Promise<void> {
  requireApi();
  await request('POST', '/api/auth/reset-password', { token: tokenOrEmail, newPassword });
}

export async function createVehicle(userId: string, data: { make: string; model: string; color: string; licensePlate: string; seats: number }) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.createVehicle>>>('POST', '/api/vehicles', { ...data, userId });
}

export async function updateVehicle(vehicleId: string, data: Partial<{ make: string; model: string; color: string; licensePlate: string; seats: number }>) {
  requireApi();
  return request<Awaited<ReturnType<typeof mockApi.updateVehicle>>>('PUT', `/api/vehicles/${vehicleId}`, data);
}

export async function getVehicle(vehicleId: string) {
  requireApi();
  try {
    return await request<Awaited<ReturnType<typeof mockApi.getVehicle>>>('GET', `/api/vehicles/${vehicleId}`);
  } catch {
    return null;
  }
}

// Driver earnings history
export interface DriverEarningsEntry {
  id: string;
  tripId?: string;
  label: string;
  amount: number;
  date: string;
  type: 'trip' | 'payout';
}

export async function getDriverEarningsHistory(userId: string): Promise<DriverEarningsEntry[]> {
  requireApi();
  return request('GET', `/api/driver/earnings?userId=${encodeURIComponent(userId)}`);
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  requireApi();
  try {
    return await request<Trip>('GET', `/api/trips/${tripId}`);
  } catch {
    return null;
  }
}

// Re-export mock-only helpers for components that need them when not using real API
export { getTripsStore } from './mockData';
