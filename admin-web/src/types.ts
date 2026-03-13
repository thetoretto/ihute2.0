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

/** Admin portal: system (full access), agency (scoped to agencyId), or scanner (report only). */
export type AdminType = 'system' | 'agency' | 'scanner';

/** User in admin context; extends shared User with admin-only fields. */
export type AdminUser = import('@shared/types').User & {
  adminType?: AdminType;
  /** When adminType is 'agency', the agency userId this admin manages. */
  agencyId?: string;
};
