# Ihute API and app linking

When the backend is configured, **mobile**, **admin-web**, and **landing-page** should point to the **same** server URL so all three use the same data (single source of truth).

## Environment variables

| App          | Env var                         | Purpose                                      |
| ------------ | ------------------------------- | -------------------------------------------- |
| **server**   | `PORT` (default 3000)           | API server port                               |
| **mobile**   | `EXPO_PUBLIC_USE_REAL_API=true` | Enable real API instead of in-app mocks       |
| **mobile**   | `EXPO_PUBLIC_API_BASE_URL`      | Base URL (e.g. `http://localhost:3000`)      |
| **admin-web** | `VITE_API_BASE_URL`           | Base URL for hotpoints, trips, bookings, etc. |
| **landing-page** | `VITE_API_BASE_URL`        | Base URL for trips, instant queue, bookings   |

Example for local development (same server for all):

- Server: `node server/index.js` → `http://localhost:3000`
- Mobile: `EXPO_PUBLIC_USE_REAL_API=true` and `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`
- Admin-web: `VITE_API_BASE_URL=http://localhost:3000`
- Landing-page: `VITE_API_BASE_URL=http://localhost:3000`

## Who uses which endpoints

| Endpoint / area      | Mobile | Admin-web | Landing-page |
| -------------------- | ------ | --------- | ------------ |
| GET /api/hotpoints   | ✓      | ✓         | —            |
| POST/PUT/DELETE hotpoints | —  | ✓         | —            |
| GET /api/users       | —      | ✓         | —            |
| GET /api/users/:id   | ✓      | —         | —            |
| Auth (login, register, OTP) | ✓ | —      | —            |
| GET /api/trips       | ✓      | ✓         | ✓            |
| GET /api/driver/instant-queue | ✓ | —   | ✓            |
| POST /api/bookings   | ✓      | —         | ✓            |
| GET /api/bookings    | ✓      | ✓         | —            |
| GET /api/vehicles    | ✓      | ✓         | —            |
| GET/PATCH /api/disputes | —   | ✓         | —            |
| Tickets, ratings, notifications, scanner | ✓ | — | —            |

Route constants and method names are defined in `shared/src/api/endpoints.ts` for consistency across apps.
