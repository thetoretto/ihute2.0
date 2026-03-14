# Local / development credentials

These accounts are created by the backend seed (`backend/prisma/seed.ts`). Run `npx prisma db seed` from the `backend` directory (with database and env configured) to ensure they exist.

## Super Admin (full platform access)

- **Email:** `admin@ihute.com`
- **Password:** `admin123`

Use this account to sign in to the Admin Portal when running locally. The super admin can create agencies, create any user (including other super admins), assign agency admins and scanners, and manage all platform data.

## Other seed accounts (optional)

- **Agency admin:** `agency@ihute.com` / `agency123`
- **Driver:** `driver@ihute.com` / `driver123`

These are scoped to the seeded agency "Kigali Express".
