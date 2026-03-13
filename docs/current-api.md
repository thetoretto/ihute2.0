# Current API Inventory (2.0 – backend)

This document lists endpoints in **backend** (Express 5 + TypeScript + Prisma) and maps them to the apps that use them.

## Legend
- **Landing**: `landing-page` (guest-only web)
- **Admin**: `admin-web` (super admin, agency admin, scanner)
- **Mobile**: `mobile` (passenger, driver, scanner)

---

## 1. Hotpoints

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/hotpoints` | Landing, Admin, Mobile | Public list of locations. |
| `POST` | `/api/hotpoints` | Admin | Create hotpoint. |
| `PUT` | `/api/hotpoints/:id` | Admin | Update hotpoint. |
| `DELETE` | `/api/hotpoints/:id` | Admin | Delete hotpoint. |

## 2. Users

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/users` | Admin | List users. Filter by `role` or `agencyId`. |
| `GET` | `/api/users/:id` | Admin, Mobile | Get user profile. |
| `PUT` | `/api/users/:id/profile` | Mobile, Admin | Update profile (name, phone, email). |
| `GET` | `/api/users/:id/profile-complete` | Mobile | Check profile completeness. |
| `PUT` | `/api/users/:id/profile-complete` | Mobile | Mark profile complete. |
| `GET` | `/api/users/:id/notification-prefs` | Mobile | Get notification preferences. |
| `PUT` | `/api/users/:id/notification-prefs` | Mobile | Update preferences. |
| `GET` | `/api/users/:id/withdrawal-methods` | Mobile | Driver withdrawal info (PawaPay). |
| `PUT` | `/api/users/:id/withdrawal-methods` | Mobile | Update withdrawal info. |
| `GET` | `/api/users/:id/payment-methods` | Mobile | List saved payment methods. |
| `POST` | `/api/users/:id/payment-methods` | Mobile | Add payment method. |
| `DELETE` | `/api/users/:id/payment-methods/:methodId` | Mobile | Remove payment method. |
| `PATCH` | `/api/users/:id/payment-methods/:methodId/default` | Mobile | Set default method. |

## 3. Auth

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/auth/me` | Mobile, Admin | Returns current user (JWT required). |
| `POST` | `/api/auth/login` | Mobile, Admin | Email/phone + password. Returns JWT + user. |
| `POST` | `/api/auth/register` | Mobile | Full registration. |
| `POST` | `/api/auth/register-minimal` | Mobile | Quick register (name, phone/email). |
| `POST` | `/api/auth/otp/send` | Mobile | Send OTP (dev: fixed code). |
| `POST` | `/api/auth/otp/verify` | Mobile | Verify OTP. |
| `POST` | `/api/auth/otp/create-user` | Mobile | Create user from OTP flow. |

## 4. Vehicles

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/vehicles` | Admin, Mobile | List vehicles. Filter by `userId` (driver/agency). |

## 5. Driver / Instant Queue

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `PUT` | `/api/driver/drive-mode` | Mobile | Enable instant drive mode. |
| `DELETE` | `/api/driver/drive-mode` | Mobile | Disable drive mode. |
| `GET` | `/api/driver/drive-mode/status` | Mobile | Check status. |
| `GET` | `/api/driver/instant-queue` | Landing, Mobile | Search instant trips (from/to). |

## 6. Trips

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/trips` | Landing, Admin, Mobile | Search trips (`fromId`, `toId`, `date`, `type`). |
| `GET` | `/api/trips/driver/:userId` | Mobile, Admin | List trips for a driver/agency. |
| `GET` | `/api/trips/:id` | Landing, Admin, Mobile | Get trip details. |
| `PUT` | `/api/trips/:id/status` | Admin, Mobile | Update status (e.g. cancelled). |
| `POST` | `/api/trips` | Admin, Mobile | Create trip. |
| `POST` | `/api/trips/bulk` | Admin | Bulk create trips (schedule). |

## 7. Agencies (2.0)

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/agencies` | Admin | List agencies (super admin: all; agency admin: own). |
| `GET` | `/api/agencies/:id` | Admin | Get agency. |
| `POST` | `/api/agencies` | Admin | Create agency (super admin only). |
| `PUT` | `/api/agencies/:id` | Admin | Update agency (super admin only). |
| `DELETE` | `/api/agencies/:id` | Admin | Delete agency (super admin only). |
| `POST` | `/api/agencies/:id/assign-admin` | Admin | Assign agency admin (super admin only). |
| `POST` | `/api/agencies/:id/assign-scanner` | Admin | Assign scanner (super admin or agency admin for own agency). |

## 8. Bookings

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/bookings` | Admin, Mobile | List bookings (auth; scoped by role/agency). |
| `POST` | `/api/bookings` | Landing, Mobile | Create booking. Accepts `guest: { name, phone, email, deliveryMethod }` when no `passengerId`. |
| `POST` | `/api/bookings/:id/cancel` | Mobile, Admin | Cancel booking. |
| `GET` | `/api/bookings/:id/rating` | Mobile | Get rating for this booking. |
| `GET` | `/api/bookings/:id/ticket` | Landing, Mobile | Get ticket details (QR payload). Public. |
| `GET` | `/api/bookings/:id/ticket/pdf` | Landing, Mobile | Printable ticket (HTML; “Print to PDF”). Public. |

## 9. Payments (2.0)

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/payments/status` | Landing | Query: `depositId` or `bookingId`. Returns `{ status, bookingId }` for callback polling. |
| `POST` | `/api/payments/create-intent` | Landing | Body: `{ bookingId }`. Returns `{ clientSecret }` for Stripe Elements. Idempotent for same booking. |
| `POST` | `/api/payments/create-deposit` | Landing | Body: `{ bookingId, phone? }`. PawaPay deposit; returns `{ depositId, redirectUrl? }`. |
| `POST` | `/api/payments/webhook/stripe` | — | Stripe webhook; raw body. Confirms payment, marks booking paid, triggers ticket delivery. |
| `POST` | `/api/payments/webhook/pawapay` | — | PawaPay deposit webhook. |
| `POST` | `/api/payments/webhook/pawapay-payout` | — | PawaPay payout webhook (driver withdrawal). |
| `POST` | `/api/driver/withdraw` | Mobile | Driver withdrawal (auth). Body: amount; PawaPay payout. |

## 10. Disputes

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/disputes` | Admin | List disputes. Filter by `userId`, `status`, `agencyId`. |
| `GET` | `/api/disputes/:id` | Admin | Get dispute details. |
| `PATCH` | `/api/disputes/:id` | Admin | Resolve dispute. |

## 11. Tickets & Validation

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `POST` | `/api/tickets/validate` | Mobile (Driver, Scanner) | Validate QR code. Body: `payload`, `validatorUserId`. |

## 12. Driver Activity

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/driver/activities` | Mobile | detailed trip stats. |
| `GET` | `/api/driver/activity-summary` | Mobile | Summary stats (income, count). |
| `GET` | `/api/driver/activity-log` | Mobile | Event feed (trip completed, booking, scanned). |

## 13. Ratings

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/ratings/driver/:driverId/summary` | Mobile | Avg score and count. |
| `GET` | `/api/bookings/:bookingId/rating` | Mobile | Get existing rating. |
| `POST` | `/api/ratings` | Mobile | Rate a completed trip. |

## 14. Notifications

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/notifications/driver/:driverId` | Mobile | List notifications. |
| `POST` | `/api/notifications/driver/:driverId/read` | Mobile | Mark all read. |

## 15. Scanner

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/scanner/count` | Mobile, Admin | Get total scans by user. |
| `POST` | `/api/scanner/count/increment` | Mobile | Increment scan count. |
| `GET` | `/api/scanner/report` | Mobile, Admin | List of scanned tickets/bookings. |

## 16. Conversations (optional)

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/conversations` | Mobile | List chats. |
| `GET` | `/api/conversations/:id/messages` | Mobile | Get messages. |
| `POST` | `/api/conversations/:id/messages` | Mobile | Send message. |

## 17. System

| Method | Path | Apps | Notes |
|--------|------|------|-------|
| `GET` | `/api/mock-store` | Mobile | Sync mock data (can retire in 2.0). |
| `PATCH` | `/api/mock-store` | Mobile | Update mock data (can retire). |
| `GET` | `/api/health` | Railway/Host | Health check. |
