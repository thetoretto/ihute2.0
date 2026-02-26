/**
 * API contract: backend route paths and methods.
 * Used by mobile, admin-web, and landing-page to stay in sync with the server.
 * No runtime fetch logic here—only path/method constants.
 *
 * Env to enable real API:
 * - mobile: EXPO_PUBLIC_USE_REAL_API=true, EXPO_PUBLIC_API_BASE_URL
 * - admin-web, landing-page: VITE_API_BASE_URL
 *
 * Point all apps to the same server URL (e.g. http://localhost:3000) for shared data.
 */

export const API_ROUTES = {
  // Hotpoints
  hotpoints: {
    list: 'GET /api/hotpoints',
    create: 'POST /api/hotpoints',
    update: 'PUT /api/hotpoints/:id',
    delete: 'DELETE /api/hotpoints/:id',
  },
  // Users
  users: {
    list: 'GET /api/users',
    byId: 'GET /api/users/:id',
    profile: 'PUT /api/users/:id/profile',
    profileComplete: 'GET /api/users/:id/profile-complete',
    paymentMethods: 'GET /api/users/:id/payment-methods',
    withdrawalMethods: 'GET /api/users/:id/withdrawal-methods',
  },
  // Auth
  auth: {
    login: 'POST /api/auth/login',
    register: 'POST /api/auth/register',
    registerMinimal: 'POST /api/auth/register-minimal',
    otpSend: 'POST /api/auth/otp/send',
    otpVerify: 'POST /api/auth/otp/verify',
    otpCreateUser: 'POST /api/auth/otp/create-user',
  },
  // Trips
  trips: {
    list: 'GET /api/trips',
    byId: 'GET /api/trips/:id',
    byDriver: 'GET /api/trips/driver/:userId',
    create: 'POST /api/trips',
    bulk: 'POST /api/trips/bulk',
    status: 'PUT /api/trips/:id/status',
  },
  // Bookings
  bookings: {
    list: 'GET /api/bookings',
    create: 'POST /api/bookings',
    cancel: 'POST /api/bookings/:id/cancel',
    ticket: 'GET /api/bookings/:id/ticket',
    rating: 'GET /api/bookings/:bookingId/rating',
  },
  // Driver
  driver: {
    driveMode: 'PUT /api/driver/drive-mode',
    driveModeDelete: 'DELETE /api/driver/drive-mode',
    driveModeStatus: 'GET /api/driver/drive-mode/status',
    instantQueue: 'GET /api/driver/instant-queue',
    activities: 'GET /api/driver/activities',
    activitySummary: 'GET /api/driver/activity-summary',
    activityLog: 'GET /api/driver/activity-log',
  },
  // Vehicles
  vehicles: {
    list: 'GET /api/vehicles',
  },
  // Disputes
  disputes: {
    list: 'GET /api/disputes',
    byId: 'GET /api/disputes/:id',
    patch: 'PATCH /api/disputes/:id',
  },
  // Tickets
  tickets: {
    validate: 'POST /api/tickets/validate',
  },
  // Ratings
  ratings: {
    create: 'POST /api/ratings',
    driverSummary: 'GET /api/ratings/driver/:driverId/summary',
  },
  // Notifications
  notifications: {
    driver: 'GET /api/notifications/driver/:driverId',
    driverRead: 'POST /api/notifications/driver/:driverId/read',
  },
  // Scanner
  scanner: {
    count: 'GET /api/scanner/count',
    countIncrement: 'POST /api/scanner/count/increment',
    report: 'GET /api/scanner/report',
  },
  // Health
  health: 'GET /api/health',
} as const;
