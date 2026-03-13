# Guest booking (2.0)

Web booking is **guest-only**: no login, no passenger account.

## Flow

1. **Search** → User picks origin, destination, date on landing.
2. **Trip selection** → API `GET /api/trips?fromId=&toId=&date=` returns available trips.
3. **Seat selection** → User chooses seats (and optional full car).
4. **Guest details** → Name, phone, email, delivery method (WhatsApp / SMS / Email / Download). No “Create account” on web.
5. **Payment** → Cash (confirm immediately), **Card (Stripe)**, or **MTN (PawaPay)**.
   - **Card**: Backend returns a Stripe PaymentIntent `clientSecret` via `POST /api/payments/create-intent`. Landing uses Stripe Elements and `confirmPayment`; then polls `GET /api/payments/status?bookingId=` until `succeeded` and navigates to confirmation.
   - **MTN**: Backend creates deposit via `POST /api/payments/create-deposit`; user is redirected to provider. On return, URL has `?depositId=...` or `?bookingId=...`.
6. **Callback** → User returns to `?depositId=...` or `?bookingId=...`. Landing page shows **Payment callback** view and polls `GET /api/payments/status?depositId=` or `?bookingId=` until status is `succeeded` or `failed`.
7. **Confirmation** → On success, user is sent to the ticket/confirmation view (booking reference, QR, download). Optional: open `GET /api/bookings/:id/ticket/pdf` to print or save as PDF.

## API

- **Create booking (guest)**  
  `POST /api/bookings`  
  Body: `{ tripId, guest: { name, phone, email, deliveryMethod }, seats, paymentMethod, isFullCar? }`  
  No `passengerId`. Backend creates booking with `guestName`, `guestPhone`, `guestEmail`, `deliveryMethod` and status `PENDING_PAYMENT`.

- **Get ticket**  
  `GET /api/bookings/:id/ticket`  
  Public. Returns ticket details and QR payload for the confirmation page.

- **Payment status (for callback page)**  
  `GET /api/payments/status?depositId=` or `?bookingId=`  
  Returns `{ status: 'pending' | 'succeeded' | 'failed', bookingId? }`. Used to poll until payment is done, then redirect to confirmation with `bookingId`.

- **Card payment (Stripe)**  
  `POST /api/payments/create-intent` with body `{ bookingId }`  
  Returns `{ clientSecret }`. Landing uses Stripe Elements and confirms on the client; backend confirms via webhook and then polling by `bookingId` returns `succeeded`.

- **Printable ticket**  
  `GET /api/bookings/:id/ticket/pdf`  
  Returns HTML ticket; user can print or “Save as PDF” in the browser.

## Landing page

- **Guest booking API**: `createGuestBooking({ tripId, seats, paymentMethod, guest: { name, phone, email, deliveryMethod } })` in `landing-page/src/api.ts`.
- **Payment callback**: URL params `depositId` or `bookingId` switch to the payment-callback view, which polls `getPaymentStatus()` and on success navigates to booking confirmation with the returned `bookingId`.
- **Legacy**: `createBooking()` still exists (uses fixed passenger id) for compatibility; prefer `createGuestBooking()` for web.
