# Ihute 2.0

One backend, three apps: guest-only web booking, admin portal (super + agency), and mobile (passenger, driver, scanner).

## Architecture

| App | Purpose | Auth |
|-----|---------|------|
| **landing-page** | Guest booking: search → trip → seats → guest details → pay → callback → ticket. No login. | None |
| **admin-web** | Super admin (full platform) and agency admin (one agency + scanners). Role-based UI. | JWT (sessionStorage) |
| **mobile** | Passenger, driver, and scanner dashboards; check-in, trips, bookings. | JWT (AsyncStorage) |

**Backend**: `backend` — Express 5, TypeScript, Prisma, PostgreSQL, JWT. Serves all three apps.

## Roles

- **Guest**: Web only; book with name/phone/email/delivery. No account.
- **Passenger** / **Driver** / **Scanner**: Mobile; JWT auth.
- **Super admin**: Admin-web; full platform (agencies, users, hot points, routes, vehicles, disputes, income).
- **Agency admin**: Admin-web; one agency + its scanners and operations.
- **Scanner**: Validates tickets for agency trips; visible to agency admin.

See `docs/roles.md` and `IHUTE_2.0_FULL_UPDATE_PLAN.md` for full details.

## Repos / apps

- `backend/` — Backend API (auth, bookings, trips, hotpoints, payments, driver, scanner, etc.)
- `landing-page/` — Guest booking (Vite + React)
- `admin-web/` — Admin portal (Vite + React)
- `mobile/` — Expo React Native (passenger, driver, scanner)
- `shared/` — Shared types and mocks
- `docs/` — `current-api.md`, `roles.md`, `guest-booking.md`

## Env and running

Point all three apps to the same backend URL (e.g. `http://localhost:3000`) so they share data.

### Backend (backend)

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for JWT signing
- `STRIPE_SECRET_KEY` — Stripe payments (create-intent + webhook)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signature verification
- `RESEND_API_KEY` — Ticket delivery by email (optional)
- `PAWAPAY_API_KEY` / `PAWAPAY_WEBHOOK_SECRET` — Mobile money / PawaPay (optional)
- `CORS_ORIGINS` — Comma-separated origins (optional)

See `backend/.env.example` if present, or copy from below.

```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### Landing

- `VITE_API_BASE_URL` — Backend URL (e.g. `http://localhost:3000`)

### Admin-web

- `VITE_API_BASE_URL` — Backend URL. When set, login uses real JWT; otherwise mock login.

### Mobile

- `EXPO_PUBLIC_USE_REAL_API` — Set to `true` (or omit) to use backend; `false` for mocks.
- `EXPO_PUBLIC_API_BASE_URL` — Backend URL (e.g. `http://10.0.2.2:3000` on Android emulator). In production, use the same backend URL as landing and admin.

## Deployment

- **Backend**: Set `DATABASE_URL`, `JWT_SECRET`, and payment/ticket keys in production. Use `CORS_ORIGINS` with your front-end origins (e.g. `https://book.ihute.com,https://admin.ihute.com`).
- **Landing**: Build with production `VITE_API_BASE_URL` (e.g. `https://api.ihute.com`). For card payments, set `VITE_STRIPE_PUBLISHABLE_KEY`. Deploy the `dist/` output (e.g. static host or `serve -s dist`).
- **Admin-web**: Build with production `VITE_API_BASE_URL` pointing to the same backend. Deploy `dist/` (static host).
- **Mobile**: Set production `EXPO_PUBLIC_API_BASE_URL` to the same backend. Build with EAS or Expo for store release.

## Payments and tickets

- **Stripe**: `POST /api/payments/create-intent` with `bookingId` → client secret for Elements; webhook `POST /api/payments/webhook/stripe` confirms and triggers ticket delivery.
- **PawaPay**: `POST /api/payments/create-deposit` (stub or real); poll `GET /api/payments/status?depositId=...` or webhook.
- **Ticket delivery**: After payment success, email via Resend (if `RESEND_API_KEY`); SMS/WhatsApp stubbed until configured.
- **Driver withdrawal**: `POST /api/driver/withdraw` (auth); PawaPay payout webhook updates status.

## Docs

- `IHUTE_2.0_FULL_UPDATE_PLAN.md` — Full plan and phases
- `docs/current-api.md` — API routes and which app uses them
- `docs/guest-booking.md` — Guest booking flow and API
- `docs/roles.md` — Role definitions and scope
