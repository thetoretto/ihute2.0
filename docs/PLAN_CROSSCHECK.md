# Ihute 2.0 – Plan cross-check

This document cross-checks `IHUTE_2.0_FULL_UPDATE_PLAN.md` against the current codebase (as of the last check). **✅ = implemented and aligned** | **⚠ = partial or minor gap** | **❌ = missing**.

---

## 1. Vision and principles ✅

- One product, three apps (landing, admin-web, mobile); one backend. **✅**
- Web guest-only; admin super + agency admin + scanner; mobile dashboards + auth. **✅**
- Backend: Express 5, TypeScript, Prisma, PostgreSQL, JWT. **✅**

---

## 2. Roles and hierarchy ✅

- Guest, Passenger, Driver, Super admin, Agency admin, Scanner as in plan. **✅**
- Enforced via `UserType` and `agencyId` in backend (auth middleware + route scope). **✅**

---

## 3. App responsibilities ✅

- Landing: search → trip → seats → guest details → pay → callback → ticket. **✅**
- Admin: JWT; super admin full nav; agency admin scoped; scanner report only. **✅**
- Mobile: JWT; passenger/driver/scanner flows; 401 → login. **✅**
- Backend: one API for all three. **✅**

---

## 4. Phase 0 – Prep and alignment ✅

| Item | Status | Notes |
|------|--------|-------|
| 0.1 Document current API | ✅ | `docs/current-api.md` lists backend routes and apps. |
| 0.2 Env and config | ✅ | Landing/admin/mobile `.env.example`; root README. |
| 0.3 Guest booking | ✅ | `POST /api/bookings` accepts `guest: { name, phone, email, deliveryMethod }`; no passengerId. |
| 0.4 Roles in backend | ✅ | `UserType` enum; `agencyId` nullable; scope in agencies, bookings, disputes, scanner, trips, users, vehicles. |

---

## 5. Phase 1 – Backend ✅

| Item | Status | Notes |
|------|--------|-------|
| 5.1 Stack | ✅ | Express 5, TypeScript, Prisma, PostgreSQL, JWT, CORS. |
| 5.2 Schema | ✅ | User, Agency, Hotpoint, Vehicle, Trip, Booking, Payment, Dispute, DriverDriveMode, DriverWithdrawal, indexes. **⚠** Plan says Agency `createdBy`; schema has no `createdBy`. Vehicle uses `plateNumber` (plan says "plates"). |
| 5.3 Auth | ✅ | `POST /api/auth/login` → JWT + user; `GET /api/auth/me`; register, OTP stubs; `requireAuth`, `requireSuperAdmin`, `requireAgencyAdmin`; public: hotpoints, trips, POST bookings, GET ticket. |
| 5.4 Scope | ✅ | Super admin unrestricted; agency admin/scanner filtered by `agencyId` (agencies, bookings, disputes, scanner, trips, users, vehicles, tickets). |
| 5.5 API parity | ✅ | Hotpoints, users, auth, vehicles, trips, bookings, disputes, tickets/validate, driver (drive-mode, instant-queue, activities, withdraw), ratings, notifications, scanner. **⚠** Conversations optional – not implemented (doc marks optional). |
| 5.6 Crons | ✅ | `backend/src/cron.ts`: unpaid expiry + trip completion every 5 min; configurable `UNPAID_BOOKING_EXPIRY_MINUTES`. |
| 5.7 Seed | ⚠ | Super admin, agency, agency admin, driver, hotpoints, vehicle, trip present. **Gap:** Plan says "one scanner"; seed does not create a scanner user. |

---

## 6. Phase 2 – Landing-page ✅

| Item | Status | Notes |
|------|--------|-------|
| 6.1 Flow | ✅ | Search → trip list (API) → trip detail → seats → guest details (name, phone, email, delivery) → payment (cash/card/MTN) → callback → confirmation/ticket. |
| 6.2 API client | ✅ | `createGuestBooking`, `createPaymentIntent`, `createDeposit`, `getPaymentStatus`; `VITE_API_BASE_URL`. |
| 6.3 Payment callback | ✅ | `payment-callback` page state; URL `?depositId=` / `?bookingId=`; polls `GET /api/payments/status`; on success → booking confirm. |
| 6.4 Confirmation | ✅ | Booking reference, trip, seats, price, ticket (QR); `GET /api/bookings/:id/ticket/pdf` for printable ticket; Resend email after payment. |

---

## 7. Phase 3 – Admin-web ✅

| Item | Status | Notes |
|------|--------|-------|
| 7.1 Role-based UI | ✅ | Super admin: full nav (Agencies, Users, Hot points, Routes, Activities, Tickets, Vehicles, Scanner operators, Disputes, Income, Settings). Agency admin: My agency, Scanner operators, scoped data; no Agencies list, Settings only for system. Scanner: Scanner report only (`visibleFor: 'scanner'`). |
| 7.2 Auth | ✅ | Login → JWT + user (userType, agencyId); token in sessionStorage; `Authorization: Bearer`; 403 when agency admin accesses other agency (backend scope). |
| 7.3 Who controls what | ✅ | Backend scope + admin nav by `adminType` (system/agency/scanner). |

---

## 8. Phase 4 – Mobile ✅

| Item | Status | Notes |
|------|--------|-------|
| 8.1 Auth | ✅ | JWT in AsyncStorage; Bearer on API; 401 → `setOnUnauthorized` → logout and show login. |
| 8.2 API client | ✅ | Single `api.ts`; `EXPO_PUBLIC_USE_REAL_API` / `EXPO_PUBLIC_API_BASE_URL`; auth header. |
| 8.3 Flows | ✅ | Passenger: bookings, trip details, settings. Driver: trips, drive mode, instant queue, validate, withdraw. Scanner: check-in, report/count (agency-scoped API). |

---

## 9. Phase 5 – Payments and ticket delivery ✅

| Item | Status | Notes |
|------|--------|-------|
| 9.1 Payments | ✅ | Stripe: create-intent, client secret, webhook confirms booking. PawaPay: create-deposit, redirect, webhook/poll; idempotent create-intent for same booking; Payment per booking. |
| 9.2 Ticket delivery | ✅ | After payment: Resend email; SMS/WhatsApp stubbed; `deliveryMethod`; ticket PDF (HTML print). |
| 9.3 Driver withdrawals | ✅ | `POST /api/driver/withdraw`; DriverWithdrawal model; PawaPay payout webhook. |

---

## 10. Phase 6 – Polish and ops ✅

| Item | Status | Notes |
|------|--------|-------|
| 10.1 Env and deployment | ✅ | README: backend env (DATABASE_URL, JWT_SECRET, Stripe/PawaPay/Resend, CORS); landing/admin build with prod `VITE_API_BASE_URL`; mobile prod `EXPO_PUBLIC_API_BASE_URL`. |
| 10.2 Docs | ✅ | Root README 2.0 overview; `docs/current-api.md`; `docs/guest-booking.md`; `docs/roles.md`. |

---

## Summary

- **Fully aligned:** Vision, roles, Phase 0, Phase 1 (except minor schema/seed notes), Phase 2, Phase 3, Phase 4, Phase 5, Phase 6.
- **Optional / minor:**
  - **Agency.createdBy**: Plan 5.2 mentions it; schema omits it (optional for audit).
  - **Vehicle "plates"**: Schema uses `plateNumber`; no functional gap.
  - **Seed scanner**: Plan 5.7 "one scanner"; add a scanner user in `backend/prisma/seed.ts` if you want seed data for scanner role.
  - **Conversations**: Marked optional in plan; not in backend; doc reflects optional.

No blocking gaps; the codebase matches the plan. Address the seed scanner and optional `createdBy` if you want full parity with the written plan.
