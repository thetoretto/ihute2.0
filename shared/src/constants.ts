/**
 * Shared constants for IDs, statuses, and payment methods.
 * Backend should use the same booking ID prefix and status values when integrated.
 */

import type { BookingStatus, PaymentMethod, TripStatus } from './types';

/** Prefix for booking IDs. Backend should use the same when generating IDs. */
export const BOOKING_ID_PREFIX = 'b_';

/** All booking statuses (single source of truth for backend alignment). */
export const BOOKING_STATUSES: readonly BookingStatus[] = [
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
] as const;

/** All trip statuses (single source of truth for backend alignment). */
export const TRIP_STATUSES: readonly TripStatus[] = [
  'active',
  'full',
  'cancelled',
  'completed',
] as const;

/** All payment methods (single source of truth for backend alignment). */
export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'cash',
  'mobile_money',
  'card',
] as const;
