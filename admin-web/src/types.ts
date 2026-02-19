export type UserRole = 'passenger' | 'driver' | 'agency';
export type AdminType = 'system' | 'agency';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: readonly UserRole[];
  rating?: number;
  statusBadge?: string;
  /** Admin portal: system (full access) or agency (scoped to agencyId) */
  adminType?: AdminType;
  /** When adminType is 'agency', the agency userId this admin manages */
  agencyId?: string;
}

export interface Hotpoint {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  country?: string;
}

export type TripType = 'insta' | 'scheduled';
export type TripStatus = 'active' | 'full' | 'cancelled' | 'completed';

export interface Trip {
  id: string;
  type: TripType;
  departureHotpoint: Hotpoint;
  destinationHotpoint: Hotpoint;
  departureTime: string;
  arrivalTime?: string;
  seatsAvailable: number;
  pricePerSeat: number;
  driver: User;
  status: TripStatus;
}

export type BookingStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

export interface Booking {
  id: string;
  trip: Trip;
  passenger: User;
  seats: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
  ticketId?: string;
  ticketNumber?: string;
  ticketIssuedAt?: string;
}

export type VehicleApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  seats: number;
  approvalStatus: VehicleApprovalStatus;
  driverId: string;
}

export type DisputeType = 'payment' | 'cancellation' | 'other';
export type DisputeStatus = 'open' | 'in_review' | 'resolved';

export interface Dispute {
  id: string;
  bookingId: string;
  tripId: string;
  reporterId: string;
  type: DisputeType;
  status: DisputeStatus;
  description: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface AdminSnapshot {
  users: User[];
  hotpoints: Hotpoint[];
  trips: Trip[];
  bookings: Booking[];
  vehicles: Vehicle[];
  disputes: Dispute[];
}
