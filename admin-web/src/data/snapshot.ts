import type { AdminSnapshot, Hotpoint, Vehicle, Dispute } from '../types';
import {
  mockUsers,
  mockHotpoints,
  mockTrips,
  mockBookings,
  mockVehicles,
  mockDisputes,
} from '@shared/mocks';

export const hotpoints: Hotpoint[] = [...mockHotpoints];
export const vehicles: Vehicle[]   = mockVehicles as unknown as Vehicle[];
export const disputes: Dispute[]   = [...mockDisputes];

export const adminSnapshot: AdminSnapshot = {
  users:     [...mockUsers],
  hotpoints,
  trips:     mockTrips     as unknown as AdminSnapshot['trips'],
  bookings:  mockBookings  as unknown as AdminSnapshot['bookings'],
  vehicles,
  disputes,
};
