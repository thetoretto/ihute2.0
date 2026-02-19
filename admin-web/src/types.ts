export type {
  UserRole,
  Hotpoint,
  TripType,
  TripStatus,
  PaymentMethod,
  BookingStatus,
  VehicleApprovalStatus,
  User,
  Trip,
  Booking,
  Vehicle,
  DisputeType,
  DisputeStatus,
  Dispute,
  AdminSnapshot,
} from '@shared/types';

/** Admin portal: system (full access) or agency (scoped to agencyId). */
export type AdminType = 'system' | 'agency';

/** User in admin context; extends shared User with admin-only fields. */
export type AdminUser = import('@shared/types').User & {
  adminType?: AdminType;
  /** When adminType is 'agency', the agency userId this admin manages. */
  agencyId?: string;
};
