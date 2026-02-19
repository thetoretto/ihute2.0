# Shared

Shared TypeScript types, constants, mocks, and utilities for the ihute monorepo (landing-page, admin-web, mobile).

## Trips and bookings state

Trips and bookings state is **app-specific**; there is no single shared implementation:

- **landing-page**: `src/store.ts` — `getTripsStore` / `setTripsStore`, `getBookingsStore` / `setBookingsStore`; state is persisted in **localStorage**.
- **mobile**: `src/services/mockData.ts` — same get/set API; state is **in-memory**. Mutations go through `src/services/mockApi.ts`.
- **admin-web**: `src/data/snapshot.ts` and `src/services/adminData.ts` — in-memory snapshot and mutations; no get/set store API.

The get/set naming is intentionally aligned across landing and mobile for clarity. Do not merge into one implementation: persistence and app needs differ.
