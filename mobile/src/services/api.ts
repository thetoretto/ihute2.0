/**
 * Single API facade: when EXPO_PUBLIC_USE_REAL_API is true, calls the local API server;
 * otherwise delegates to mockApi and mockPersistence.
 */
import type { User, Trip, DriverInstantQueueEntry } from '../types';

const USE_REAL_API = process.env.EXPO_PUBLIC_USE_REAL_API === 'true';
const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
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

// OTP: when real API, server has the code; for dev we don't have getPendingOtp from server, so return dev code for testing display
export async function getPendingOtp(key: string): Promise<{ code: string; expiresAt: number } | null> {
  if (USE_REAL_API) return { code: '123456', expiresAt: Date.now() + 10 * 60 * 1000 };
  return mockPersistence.getPendingOtp(key);
}

// When real API: fetch. Otherwise: delegate to mock.
import * as mockApi from './mockApi';
import * as mockPersistence from './mockPersistence';

export async function getHotpoints() {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getHotpoints>>>('GET', '/api/hotpoints');
  return mockApi.getHotpoints();
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
  if (USE_REAL_API) {
    const q = new URLSearchParams();
    if (params.fromId) q.set('fromId', params.fromId);
    if (params.toId) q.set('toId', params.toId);
    if (params.date) q.set('date', params.date);
    if (params.type) q.set('type', params.type);
    if (params.passengerCount != null) q.set('passengerCount', String(params.passengerCount));
    if (params.sortBy) q.set('sortBy', params.sortBy);
    return request<Trip[]>('GET', `/api/trips?${q.toString()}`);
  }
  return mockApi.searchTrips(params);
}

export async function getUser(userId?: string) {
  if (USE_REAL_API) {
    const id = userId || 'u_passenger_1';
    const u = await request<User | null>('GET', `/api/users/${id}`);
    return u;
  }
  return mockApi.getUser(userId);
}

export async function getUserBookings(userId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getUserBookings>>>('GET', `/api/bookings?userId=${encodeURIComponent(userId)}`);
  return mockApi.getUserBookings(userId);
}

export async function cancelBooking(bookingId: string, passengerId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.cancelBooking>>>('POST', `/api/bookings/${bookingId}/cancel`, { passengerId });
  return mockApi.cancelBooking(bookingId, passengerId);
}

export async function getUserPublishedTrips(userId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getUserPublishedTrips>>>('GET', `/api/trips/driver/${userId}`);
  return mockApi.getUserPublishedTrips(userId);
}

export async function getUserVehicles(userId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getUserVehicles>>>('GET', `/api/vehicles?userId=${encodeURIComponent(userId)}`);
  return mockApi.getUserVehicles(userId);
}

export async function getDriverTripActivities(userId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getDriverTripActivities>>>('GET', `/api/driver/activities?userId=${encodeURIComponent(userId)}`);
  return mockApi.getDriverTripActivities(userId);
}

export async function updateDriverTripStatus(params: { tripId: string; driverId: string; status: 'active' | 'completed' }) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.updateDriverTripStatus>>>('PUT', `/api/trips/${params.tripId}/status`, { status: params.status });
  return mockApi.updateDriverTripStatus(params);
}

export async function getDriverActivitySummary(userId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getDriverActivitySummary>>>('GET', `/api/driver/activity-summary?userId=${encodeURIComponent(userId)}`);
  return mockApi.getDriverActivitySummary(userId);
}

export async function getDriverActivityLog(userId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getDriverActivityLog>>>('GET', `/api/driver/activity-log?userId=${encodeURIComponent(userId)}`);
  return mockApi.getDriverActivityLog(userId);
}

export type DriverDriveModeStatus =
  | { inDriveMode: false }
  | ({ inDriveMode: true } & DriverInstantQueueEntry);

export async function getDriverDriveModeStatus(userId: string): Promise<DriverDriveModeStatus> {
  if (USE_REAL_API) return request<DriverDriveModeStatus>('GET', `/api/driver/drive-mode/status?userId=${encodeURIComponent(userId)}`);
  return { inDriveMode: false };
}

export async function setDriverDriveMode(params: {
  driverId: string;
  fromId: string;
  toId: string;
  seatsAvailable: number;
  pricePerSeat: number;
  vehicleId?: string;
}): Promise<DriverInstantQueueEntry> {
  if (USE_REAL_API) return request<DriverInstantQueueEntry>('PUT', '/api/driver/drive-mode', params);
  throw new Error('Drive mode requires real API');
}

export async function clearDriverDriveMode(driverId: string): Promise<void> {
  if (USE_REAL_API) return request('DELETE', '/api/driver/drive-mode', { driverId });
}

export async function getInstantQueue(params?: { toId?: string; fromId?: string }): Promise<DriverInstantQueueEntry[]> {
  if (USE_REAL_API) {
    const q = new URLSearchParams();
    if (params?.toId) q.set('toId', params.toId);
    if (params?.fromId) q.set('fromId', params.fromId);
    return request('GET', `/api/driver/instant-queue?${q.toString()}`);
  }
  return [];
}

export async function publishTrip(tripData: Parameters<typeof mockApi.publishTrip>[0]) {
  if (USE_REAL_API) {
    const body = {
      ...tripData,
      driverId: tripData.driver?.id,
      vehicleId: tripData.vehicle?.id,
      departureHotpointId: tripData.departureHotpoint?.id,
      destinationHotpointId: tripData.destinationHotpoint?.id,
    };
    return request<Awaited<ReturnType<typeof mockApi.publishTrip>>>('POST', '/api/trips', body);
  }
  return mockApi.publishTrip(tripData);
}

export async function publishTrips(
  baseTripData: Parameters<typeof mockApi.publishTrips>[0],
  options: Parameters<typeof mockApi.publishTrips>[1]
) {
  if (USE_REAL_API) {
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
  return mockApi.publishTrips(baseTripData, options);
}

export async function bookTrip(bookingData: Parameters<typeof mockApi.bookTrip>[0]) {
  if (USE_REAL_API) {
    return request<Awaited<ReturnType<typeof mockApi.bookTrip>>>('POST', '/api/bookings', {
      tripId: bookingData.tripId,
      passenger: bookingData.passenger,
      seats: bookingData.seats,
      paymentMethod: bookingData.paymentMethod,
      isFullCar: bookingData.isFullCar,
    });
  }
  return mockApi.bookTrip(bookingData);
}

export async function getBookingTicket(bookingId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getBookingTicket>>>('GET', `/api/bookings/${bookingId}/ticket`);
  return mockApi.getBookingTicket(bookingId);
}

export async function validateTicketQr(payload: string, validatorUser?: User | null) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.validateTicketQr>>>('POST', '/api/tickets/validate', { payload, validatorUserId: validatorUser?.id });
  return mockApi.validateTicketQr(payload, validatorUser);
}

export async function downloadTicketPdf(bookingId: string) {
  if (USE_REAL_API) throw new Error('Ticket PDF is generated on device; use mock flow or add server PDF endpoint.');
  return mockApi.downloadTicketPdf(bookingId);
}

export async function shareTicketPdf(bookingId: string) {
  if (USE_REAL_API) {
    const ticket = await getBookingTicket(bookingId);
    const Sharing = await import('expo-sharing');
    const Print = await import('expo-print');
    const html = `<html><body><p>Ticket ${ticket.ticketNumber}</p><p>${ticket.from} to ${ticket.to}</p></body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    const available = await Sharing.default.isAvailableAsync();
    if (!available) throw new Error('Sharing is unavailable on this device');
    await Sharing.default.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Download ticket' });
    return;
  }
  return mockApi.shareTicketPdf(bookingId);
}

export async function rateDriverFromBooking(params: Parameters<typeof mockApi.rateDriverFromBooking>[0]) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.rateDriverFromBooking>>>('POST', '/api/ratings', params);
  return mockApi.rateDriverFromBooking(params);
}

export async function getDriverRatingSummary(driverId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getDriverRatingSummary>>>('GET', `/api/ratings/driver/${driverId}/summary`);
  return mockApi.getDriverRatingSummary(driverId);
}

export async function getBookingRating(bookingId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.getBookingRating>>>('GET', `/api/bookings/${bookingId}/rating`);
  return mockApi.getBookingRating(bookingId);
}

export async function login(email: string, password: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.login>>>('POST', '/api/auth/login', { email, password });
  return mockApi.login(email, password);
}

export async function register(data: Parameters<typeof mockApi.register>[0]) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.register>>>('POST', '/api/auth/register', data);
  return mockApi.register(data);
}

export async function registerMinimal(data: Parameters<typeof mockApi.registerMinimal>[0]) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.registerMinimal>>>('POST', '/api/auth/register-minimal', data);
  return mockApi.registerMinimal(data);
}

export async function sendOtp(phoneOrEmail: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.sendOtp>>>('POST', '/api/auth/otp/send', { phoneOrEmail });
  return mockApi.sendOtp(phoneOrEmail);
}

export async function verifyOtp(phoneOrEmail: string, code: string) {
  if (USE_REAL_API) return request<boolean>('POST', '/api/auth/otp/verify', { phoneOrEmail, code });
  return mockApi.verifyOtp(phoneOrEmail, code);
}

export async function createUserAfterOtp(options: Parameters<typeof mockApi.createUserAfterOtp>[0]) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.createUserAfterOtp>>>('POST', '/api/auth/otp/create-user', options);
  return mockApi.createUserAfterOtp(options);
}

export async function updateUserProfile(userId: string, updates: Parameters<typeof mockApi.updateUserProfile>[1]) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockApi.updateUserProfile>>>('PUT', `/api/users/${userId}/profile`, updates);
  return mockApi.updateUserProfile(userId, updates);
}

/** When real API: fetches from GET /api/users/:id/profile-complete. When mock: reads from local store. */
export async function getProfileComplete(userId: string): Promise<boolean> {
  if (USE_REAL_API) return request<boolean>('GET', `/api/users/${userId}/profile-complete`);
  const store = await mockPersistence.getMockStore();
  return !!store.profileCompleteByUserId?.[userId];
}

export async function getScannerTicketReport(period: 'past' | 'today' | 'upcoming') {
  if (USE_REAL_API) {
    const store = await mockPersistence.getMockStore();
    const userId = store.authUserId;
    if (!userId) return [];
    return request<Awaited<ReturnType<typeof mockApi.getScannerTicketReport>>>('GET', `/api/scanner/report?userId=${encodeURIComponent(userId)}&period=${period}`);
  }
  return mockApi.getScannerTicketReport(period);
}

export async function getWithdrawalMethods(userId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockPersistence.getWithdrawalMethods>>>('GET', `/api/users/${userId}/withdrawal-methods`);
  return mockPersistence.getWithdrawalMethods(userId);
}

export async function updateWithdrawalMethods(userId: string, methods: Parameters<typeof mockPersistence.updateWithdrawalMethods>[1]) {
  if (USE_REAL_API) return request('PUT', `/api/users/${userId}/withdrawal-methods`, methods);
  return mockPersistence.updateWithdrawalMethods(userId, methods);
}

export async function getDriverNotifications(driverId: string) {
  if (USE_REAL_API) return request<Awaited<ReturnType<typeof mockPersistence.getDriverNotifications>>>('GET', `/api/notifications/driver/${driverId}`);
  return mockPersistence.getDriverNotifications(driverId);
}

export async function markDriverNotificationsRead(driverId: string) {
  if (USE_REAL_API) return request('POST', `/api/notifications/driver/${driverId}/read`, {});
  return mockPersistence.markDriverNotificationsRead(driverId);
}

export async function getUnreadDriverNotificationCount(driverId: string) {
  if (USE_REAL_API) {
    const list = await request<Awaited<ReturnType<typeof mockPersistence.getDriverNotifications>>>('GET', `/api/notifications/driver/${driverId}`);
    return list.filter((n) => !n.read).length;
  }
  return mockPersistence.getUnreadDriverNotificationCount(driverId);
}

export async function getScannerTicketCount() {
  if (USE_REAL_API) {
    const store = await mockPersistence.getMockStore();
    const userId = store.authUserId;
    if (!userId) return 0;
    return request<number>('GET', `/api/scanner/count?userId=${encodeURIComponent(userId)}`);
  }
  return mockPersistence.getScannerTicketCount();
}

export async function incrementScannerTicketCount() {
  if (USE_REAL_API) {
    const store = await mockPersistence.getMockStore();
    const userId = store.authUserId;
    if (!userId) return 0;
    return request<number>('POST', '/api/scanner/count/increment', { userId });
  }
  return mockPersistence.incrementScannerTicketCount();
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
  if (USE_REAL_API) {
    const list = await request<Array<{ id: string; otherUser: { id: string; name: string }; lastMessage: string | null; unreadCount: number; updatedAt: string; scopeLabel?: string }>>('GET', `/api/conversations?userId=${encodeURIComponent(userId)}`);
    return list;
  }
  return [];
}

export async function getConversationMessages(conversationId: string): Promise<Array<{ id: string; senderId: string; text: string; timestamp: string }>> {
  if (USE_REAL_API) return request('GET', `/api/conversations/${conversationId}/messages`);
  return [];
}

export async function sendConversationMessage(conversationId: string, text: string, senderId: string) {
  if (USE_REAL_API) return request<{ id: string; senderId: string; text: string; timestamp: string }>('POST', `/api/conversations/${conversationId}/messages`, { text, senderId });
  return { id: `msg_${Date.now()}`, senderId, text, timestamp: new Date().toISOString() };
}

// Payment methods (real API only)
export interface PaymentMethodItem {
  id: string;
  type: 'card' | 'mobile_money' | 'cash';
  label?: string;
  detail?: string;
  isDefault?: boolean;
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethodItem[]> {
  if (USE_REAL_API) return request('GET', `/api/users/${userId}/payment-methods`);
  return [];
}

export async function addPaymentMethod(userId: string, method: { type: string; label?: string; detail?: string; isDefault?: boolean }) {
  if (USE_REAL_API) return request<PaymentMethodItem>('POST', `/api/users/${userId}/payment-methods`, method);
  return null;
}

export async function removePaymentMethod(userId: string, methodId: string) {
  if (USE_REAL_API) await request('DELETE', `/api/users/${userId}/payment-methods/${methodId}`);
}

export async function setDefaultPaymentMethod(userId: string, methodId: string) {
  if (USE_REAL_API) await request('PATCH', `/api/users/${userId}/payment-methods/${methodId}/default`, {});
}

// Trip by id (for RideDetailScreen when using real API)
export async function getTrip(tripId: string): Promise<Trip | null> {
  if (USE_REAL_API) {
    try {
      return await request<Trip>('GET', `/api/trips/${tripId}`);
    } catch {
      return null;
    }
  }
  return null;
}

// Re-export mock-only helpers for components that need them when not using real API
export { getTripsStore } from './mockData';
