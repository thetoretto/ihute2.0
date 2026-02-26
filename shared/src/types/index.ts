export type UserRole = 'passenger' | 'driver' | 'agency';
export type AgencySubRole = 'agency_manager' | 'agency_scanner';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUri?: string;
  rating?: number;
  statusBadge?: string;
  roles: UserRole[];
  /** When roles includes 'agency', indicates manager (full control) or scanner (scan + view only) */
  agencySubRole?: AgencySubRole;
  /** When agencySubRole is 'scanner', the agency userId this employee belongs to */
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

export type PaymentMethod = 'cash' | 'mobile_money' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'cash_on_pickup';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  seats: number;
  photoUris?: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  driverId?: string;
  ownerId?: string;
}

/** Entry for a driver in "drive mode" on the instant queue (one per driver). */
export interface DriverInstantQueueEntry {
  driver: User;
  vehicle?: Vehicle;
  from: Hotpoint;
  to: Hotpoint;
  seatsAvailable: number;
  pricePerSeat: number;
  updatedAt: string;
}

export type TripType = 'insta' | 'scheduled';
export type TripStatus = 'active' | 'full' | 'cancelled' | 'completed';

export interface Trip {
  id: string;
  type: TripType;
  departureHotpoint: Hotpoint;
  destinationHotpoint: Hotpoint;
  departureTime: string;
  departureDate?: string;
  arrivalTime?: string;
  durationMinutes?: number;
  seatsAvailable: number;
  pricePerSeat: number;
  allowFullCar: boolean;
  paymentMethods: PaymentMethod[];
  maxRearPassengers?: number;
  driver: User;
  vehicle: Vehicle;
  status: TripStatus;
}

export type BookingStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  trip: Trip;
  passenger: User;
  seats: number;
  paymentMethod: PaymentMethod;
  isFullCar: boolean;
  status: BookingStatus;
  createdAt: string;
  ticketId?: string;
  ticketNumber?: string;
  ticketFileUri?: string;
  ticketIssuedAt?: string;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
}

export interface DriverTripActivity {
  trip: Trip;
  bookingsCount: number;
  bookedSeats: number;
  remainingSeats: number;
  collectedAmount: number;
}

export interface BookingTicket {
  bookingId: string;
  ticketId: string;
  ticketNumber: string;
  issuedAt: string;
  fileUri?: string;
  passengerName: string;
  driverName: string;
  from: string;
  to: string;
  departureTime: string;
  seats: number;
  isFullCar: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountTotal: number;
  qrPayload: string;
}

export interface TicketQrValidationResult {
  valid: boolean;
  reason?: string;
  scannedAt: string;
  bookingId?: string;
  ticket?: BookingTicket;
}

export interface DriverRating {
  id: string;
  bookingId: string;
  driverId: string;
  passengerId: string;
  score: number;
  comment?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  trip?: Trip;
  otherUser: User;
  lastMessage?: Message;
  messages: Message[];
}

export type VehicleApprovalStatus = 'pending' | 'approved' | 'rejected';
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
