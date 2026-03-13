# Ihute API and app linking

When the backend is configured, **mobile**, **admin-web**, and **landing-page** should point to the **same** server URL so all three use the same data (single source of truth).

## Environment variables

| App          | Env var                         | Purpose                                      |
| ------------ | ------------------------------- | -------------------------------------------- |
| **backend**  | `PORT` (default 3000)           | API server port                               |
| **mobile**   | `EXPO_PUBLIC_USE_REAL_API=true` | Enable real API instead of in-app mocks       |
| **mobile**   | `EXPO_PUBLIC_API_BASE_URL`      | Base URL (e.g. `http://localhost:3000`)      |
| **admin-web** | `VITE_API_BASE_URL`           | Base URL for hotpoints, trips, bookings, etc. |
| **landing-page** | `VITE_API_BASE_URL`        | Base URL for trips, instant queue, bookings   |

Example for local development (same server for all):

- Backend: `cd backend && npm run dev` → `http://localhost:3000`
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

## Deploying on Railway

The repo is set up for deployment on [Railway](https://railway.app). Use one API service and optionally separate services for admin-web and landing-page.

1. **Connect the repo**: In Railway, create a new project and deploy from the ihute2.0 GitHub repo.

2. **API service (required)**  
   - Set **Root Directory** to `backend`.  
   - Railway runs `npm install` and `npm start`; the API listens on `PORT` (set by Railway).  
   - After deploy, copy the service’s **public URL** (e.g. `https://ihute-api-production-xxxx.up.railway.app`). This is your **API base URL**.

3. **Admin and Landing services (optional)**  
   For each of `admin-web` and `landing-page`:  
   - Set **Root Directory** to `admin-web` or `landing-page`.  
   - Set env var **`VITE_API_BASE_URL`** to the API base URL from step 2 (no trailing slash).  
   - Build runs `npm install && npm run build`; start runs `npm start` (serves the `dist` folder).

4. **Mobile**  
   For production builds (e.g. EAS), set **`EXPO_PUBLIC_API_BASE_URL`** to the same API base URL and **`EXPO_PUBLIC_USE_REAL_API=true`**.

Admin, landing, and mobile must all use the **same** API base URL so they share one backend.
