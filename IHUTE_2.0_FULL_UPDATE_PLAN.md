## Ihute 2.0 – Full Update Plan (Combined)

### 1. Vision and principles

- **One product, three apps (unchanged structure)**: `landing-page`, `admin-web`, `mobile`. No merge into a single SPA; we combine the current apps with the previous gigi-move architecture by adding one backend and aligning flows/roles.
- **Web (landing)**: Guest-only booking. No login, no passenger dashboard. Flow: search → trip → seats → guest details → pay → callback → ticket.
- **Admin-web**: Super admin + agency admin + scanner. Super admin has all power; agency admin is the big boss of one agency and controls that agency and its scanners.
- **Mobile**: Only place with dashboards and auth: passenger and driver (and scanner check-in). No passenger dashboard on web.
- **One backend** serves all three: Express 5 + TypeScript + Prisma + PostgreSQL + JWT; guest booking, auth, admin/agency/scanner, driver, payments, crons.

### 2. Roles and hierarchy

| **Role**              | **Where**         | **Scope**       | **What they control** |
|-----------------------|-------------------|-----------------|------------------------|
| **Guest**             | Web only          | —               | Book only (name, phone, email, delivery). No account. |
| **Passenger**         | Mobile            | Own data        | Dashboard, my bookings, trip details, settings. |
| **Driver**            | Mobile            | Own trips       | Dashboard, trips, bookings, earnings, vehicle, check-in. |
| **Super admin**       | Admin-web         | Whole platform  | **All power.** Agencies, agency admins, scanners, drivers, passengers, routes, hot points, vehicles, trips, bookings, disputes, income, platform settings. Creates/edits/deletes agencies and assigns agency admins and scanners. |
| **Agency admin (admin)** | Admin-web      | One agency      | **Big boss of that agency.** Controls agency account (view/edit that agency). Controls scanners’ activities (create/manage scanners for that agency, view scanner report/count). Operations for that agency: users, routes, activities, vehicles, trips, tickets, disputes, income. Cannot see other agencies or platform settings. |
| **Scanner**           | Admin-web / Mobile| Under one agency| Validates tickets for that agency’s trips. Activity is controlled and visible to agency admin (and super admin). No control over agency or other users. |

**Summary**: Agency on `admin-web` is the unit the admin (agency admin) controls. The agency admin is the big boss of that agency and of its scanners. The super admin has all power over the platform (including all agencies and their admins/scanners).

### 3. App responsibilities (no structural change)

- **Landing-page**: Entry (e.g. language) → home → Book (search, trip, seats, guest info, payment, callback, ticket). Guest only; no login. Stays separate.
- **Admin-web**: Login (JWT).  
  - Super admin: full nav and all data; Agencies, Users, Hot points, Routes, Activities, Tickets, Vehicles, Scanner operators, Disputes, Income, Settings.  
  - Agency admin: My agency, Scanner operators (that agency only), Users/Routes/Activities/Vehicles/Tickets/Disputes/Income scoped to that agency.  
  Stays separate.
- **Mobile**: Login (JWT). Passenger dashboard, driver dashboard, scanner check-in (and scanner report if applicable). Only app with dashboards. Stays separate.
- **Backend**: One API for landing (guest booking, trips, hotpoints), `admin-web` (auth, CRUD, scoped by role/agency), `mobile` (auth, driver, passenger, scanner).

### 4. Phase 0 – Prep and alignment

- **0.1 Document current API**
  - List every route in the backend (method, path, request/response).
  - Note which app uses each (landing / admin-web / mobile).
  - Save as e.g. `docs/current-api.md`.
- **0.2 Env and config**
  - **Landing**: `VITE_API_BASE_URL`, optional `VITE_BOOKING_PASSENGER_ID` (only if keeping a shared guest user id).
  - **Admin**: `VITE_API_BASE_URL`.
  - **Mobile**: `EXPO_PUBLIC_USE_REAL_API`, `EXPO_PUBLIC_API_BASE_URL`.
  - Root or per-app `.env.example` with short comments.
- **0.3 Guest booking**
  - Web sends guest only, e.g. `guest: { name, phone, email, deliveryMethod }`; no passenger login.
  - Backend accepts either `passengerId` (mobile) or `guest` (web); for web, create booking with guest fields and no user account.
- **0.4 Roles in backend**
  - User types: `SUPER_ADMIN` \| `AGENCY_ADMIN` \| `SCANNER` \| `DRIVER` \| `USER` (passenger).
  - `agencyId` null for super admin and non-agency users; set for agency admin and scanner.
  - Super admin: no scope filter. Agency admin and scanner: filter by `agencyId`.

### 5. Phase 1 – Backend (one API for 2.0)

- **5.1 Stack**
  - Express 5 + TypeScript, Prisma + PostgreSQL, JWT auth, CORS for landing, admin, mobile.
- **5.2 Schema (Prisma)**
  - **User**: id, email, phone, passwordHash, name, userType (`SUPER_ADMIN` \| `AGENCY_ADMIN` \| `SCANNER` \| `DRIVER` \| `USER`), agencyId (nullable), agencySubRole (optional), status, createdAt, updatedAt.
  - **Agency**: id, name, contact info, createdBy (super admin), createdAt, updatedAt.
  - **Hotpoint**: id, name, address, latitude, longitude, country, createdAt, updatedAt.
  - **Vehicle**: id, brand, model, capacity, plates, status, driverId, agencyId (optional), createdAt, updatedAt.
  - **Trip**: id, driverId, vehicleId, departureHotpointId, destinationHotpointId, departureDate, departureTime, arrivalTime, durationMinutes, seatsAvailable, pricePerSeat, type, status, allowFullCar, paymentMethods (JSON), createdAt, updatedAt.
  - **Booking**: id, tripId, passengerId (nullable), guestName, guestPhone, guestEmail, deliveryMethod, seats, isFullCar, paymentMethod, paymentStatus, status (e.g. `pending_payment`, `confirmed`, `cancelled`), ticketId, ticketNumber, ticketIssuedAt, validatedAt, validatedBy, createdAt, updatedAt.
  - **Payment**: id, bookingId, provider, externalId, amount, status, createdAt.
  - **Dispute**: id, bookingId, reporterId, status, resolution, createdAt, updatedAt.
  - **Driver availability / instant queue** (e.g. drive mode): table or structure for driverId, vehicleId, fromHotpointId, toHotpointId, seatsAvailable, pricePerSeat, updatedAt.
  - **Indexes**: trips (driverId, departureDate, status), bookings (tripId, passengerId, status), users (email, userType, agencyId).
- **5.3 Auth**
  - Login: `POST /api/auth/login` – email/phone + password → JWT (userId, userType, agencyId) + user object.
  - Register: `POST /api/auth/register` – create user (hash password); drivers/agencies can start PENDING if needed.
  - Optional: OTP send/verify/create-user (same behaviour as current server).
  - Middleware: `requireAuth`, `requireSuperAdmin`, `requireAgencyAdmin` (and optionally scope by `agencyId`).
  - Public (no auth): `GET /api/hotpoints`, `GET /api/trips`, `POST /api/bookings` (guest), `GET /api/bookings/:id/ticket` (by id/reference for guest ticket).
- **5.4 Scope enforcement**
  - Super admin: all list/read/write; can CRUD agencies, users (any type), hotpoints, vehicles, trips, bookings, disputes, settings.
  - Agency admin: all queries filtered by `agencyId`; can manage scanners for that agency, that agency’s users, trips, bookings, vehicles, disputes, income. Cannot create agencies or change platform settings.
  - Scanner: only validation and own report/count; scoped by `agencyId`.
- **5.5 API parity with current server**
  - Implement every current route so landing, admin, and mobile keep working: hotpoints (GET public, CRUD for admin), users (list/get/profile/prefs/withdrawal/payment-methods, filter by role/agencyId for admin), auth (login/register/OTP), vehicles, trips (search, `driver/:userId`, `:id`, status, post, bulk), bookings (list, create with guest or passengerId, cancel, ticket), disputes (list, get, patch), `POST /api/tickets/validate` (QR + `validatorUserId`; driver or scanner for that agency), driver (drive-mode, instant-queue, activities, activity-summary, activity-log), ratings, notifications, scanner (count, increment, report scoped by agency), conversations/messages (optional), health.
  - Guest booking: `POST /api/bookings` accepts `guest: { name, phone, email, deliveryMethod }` when no `passengerId`; create booking with guest fields and set `paymentStatus` / `status`.
- **5.6 Crons**
  - Unpaid expiry: every 5 min; cancel bookings with status `pending_payment` and `createdAt` older than configured window; release seats.
  - Trip completion: every 5 min; trips with all tickets scanned and past estimated arrival → status `completed`.
- **5.7 Seed**
  - Migrations + seed: hotpoints, one super admin, one agency + agency admin, one scanner, drivers, vehicles, sample trips/bookings (aligned with current ids if needed).

### 6. Phase 2 – Landing-page (guest-only web)

- **6.1 Flow**
  - Landing → search (origin, destination, date) → trip list (from API) → trip detail → seat selection → guest details only (name, phone, email, delivery method). No "Create account" on web.
  - Payment: MTN (PawaPay) or Card (Stripe). Redirect → callback → poll payment status → on success show ticket/confirmation.
- **6.2 API client**
  - `createGuestBooking({ tripId, seats, guest: { name, phone, email, deliveryMethod }, paymentMethod })`.
  - Get booking by id/reference; get payment status (for callback page).
  - Point `VITE_API_BASE_URL` to new backend.
- **6.3 Payment callback**
  - Route/state for return from payment (e.g. `/payment/callback?depositId=...`). Poll backend until payment success/failed → redirect to confirmation or error.
- **6.4 Confirmation**
  - Show reference, trip, seats, price, ticket (QR + download). Backend generates QR and optional PDF; ticket delivery (WhatsApp/SMS/Email) triggered after payment success.

### 7. Phase 3 – Admin-web (super admin + agency admin + scanner)

- **7.1 Same app, role-based UI**
  - Super admin: Dashboard, Agencies (create/edit/delete, assign agency admins), Users (all), Hot points, Routes, Activities, Tickets, Vehicles, Scanner operators (all or by agency), Disputes, Income, Settings (e.g. commission). Full data.
  - Agency admin: Dashboard, My agency (view/edit own agency), Scanner operators (only that agency’s scanners), Users (agency-scoped), Routes, Activities, Tickets, Vehicles, Disputes, Income. No Agencies list, no Settings, no other agencies’ data.
  - Scanner: If in admin-web: limited (e.g. scanner report only); primary use = mobile check-in.
- **7.2 Auth**
  - Login → JWT + user (userType, agencyId). Store token; send `Authorization: Bearer <token>` on all requests.
  - Backend returns 403 when agency admin tries to access another agency or platform settings; super admin has no scope limit.
- **7.3 Who controls what**
  - Super admin: All power; agencies, agency admins, scanners, drivers, passengers, routes, hot points, vehicles, trips, bookings, disputes, income, settings.
  - Agency admin: Agency account (that agency), scanners’ activities (create/manage scanners, view report/count), operations for that agency.
  - Scanner: Validation only; activity visible to agency admin and super admin.

### 8. Phase 4 – Mobile (dashboards and auth)

- **8.1 Auth**
  - Login/register → JWT + user. Store token (e.g. AsyncStorage); send Bearer on all API calls. Handle 401 (clear token, go to login).
  - Role from userType + agencyId/agencySubRole: passenger, driver, scanner.
- **8.2 API client**
  - Single `api.ts`; when `EXPO_PUBLIC_USE_REAL_API=true`, base URL = new backend; add auth header; same paths and response shapes as current server (parity from Phase 1).
- **8.3 Flows**
  - Passenger: My bookings, trip details, settings (all by userId).
  - Driver: Trips, bookings, earnings, vehicle, drive mode, instant queue, check-in (`POST /api/tickets/validate` with JWT).
  - Scanner: Check-in for agency’s trips; report/count from backend (agency-scoped).

### 9. Phase 5 – Payments and ticket delivery

- **9.1 Payments**
  - Stripe: Backend creates payment intent; landing uses client secret; on success backend confirms booking.
  - PawaPay (MTN): Backend creates deposit; redirect; webhook or poll; on success confirm booking and trigger delivery.
  - Idempotency for payouts (e.g. driver withdrawals); store `Payment` per booking.
- **9.2 Ticket delivery**
  - After payment success: generate ticket (QR, optional PDF). Send via WhatsApp/SMS/Email/Download per `deliveryMethod` (Resend, Twilio, etc.).
- **9.3 Driver withdrawals**
  - PawaPay payout to driver’s registered phone; stable `transaction_id`; webhook COMPLETED/FAILED; update driver activity/earnings.

### 10. Phase 6 – Polish and ops

- **10.1 Env and deployment**
  - Backend: `DATABASE_URL`, `JWT_SECRET`, Stripe/PawaPay/Resend keys.
  - Landing and admin: build with prod `VITE_API_BASE_URL`.
  - Mobile: prod `EXPO_PUBLIC_API_BASE_URL` = same backend.
- **10.2 Docs**
  - Root README: 2.0 overview (guest-only web, dashboards on mobile, super admin / agency admin / scanner).
  - `docs/current-api.md` (endpoints and which app uses them).
  - `docs/guest-booking.md` (guest payload, payment, callback).
  - `docs/roles.md` (super admin, agency admin, scanner, driver, passenger, guest).

### 11. Execution order

1. **Phase 0** – Document API, env, guest payload, roles (including super admin / agency admin / scanner).
2. **Phase 1** – Backend: schema, auth, scope, full API parity, guest booking, crons; keep old server until parity.
3. **Phase 2** – Landing: guest-only flow, payment + callback, ticket confirmation.
4. **Phase 3** – Admin-web: JWT, super admin vs agency admin UI and backend scope, scanner management.
5. **Phase 4** – Mobile: JWT, auth header, 401, smoke-test passenger/driver/scanner.
6. **Phase 5** – Stripe + PawaPay, ticket delivery, driver withdrawals.
7. **Phase 6** – Env, deployment, docs; switch all clients to new backend; retire old server.

### 12. One-page summary

- **2.0**: One backend (Express 5 + Prisma + PostgreSQL + JWT); three apps unchanged: landing (guest-only), admin-web (super admin + agency admin + scanner), mobile (dashboards only).
- **Roles**: Guest (web); Passenger, Driver (mobile); Super admin (all power); Agency admin (big boss of one agency, controls agency + scanners); Scanner (under agency, validation only).
- **Backend**: Full API parity with current server; guest booking payload; scope by `agencyId` for agency admin and scanner; two crons (unpaid expiry, trip completion); payments and ticket delivery.
- **Landing**: Guest-only book → pay → callback → ticket.
- **Admin-web**: Super admin controls everything including agencies and scanners; agency admin controls one agency and its scanners.
- **Mobile**: Only app with dashboards and auth; passenger, driver, scanner.

