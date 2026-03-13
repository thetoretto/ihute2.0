# Ihute 2.0 Roles and Hierarchy

This document defines the user roles, their scope, and what they can control in the Ihute 2.0 system. The backend enforces these scopes using `userType` and `agencyId`. See `IHUTE_2.0_FULL_UPDATE_PLAN.md` for the full phase plan.

## 1. Hierarchy Overview

| Role | Platform | Scope | Primary Function |
|------|----------|-------|-------------------|
| **Super Admin** | Admin-web | Global | Platform owner; controls all agencies, admins, and system settings. |
| **Agency Admin** | Admin-web | Agency | "Big boss" of one agency; controls that agency, its scanners, and its operations. |
| **Scanner** | Admin/Mobile | Agency | Validates tickets for the agency's trips. |
| **Driver** | Mobile | Self | Drives trips; manages own bookings and earnings. |
| **Passenger** | Mobile | Self | Books trips; manages own profile. |
| **Guest** | Web | None | Single booking flow only; no account. |

---

## 2. Role Details

### Super Admin (System Admin)
- **User Type**: `SUPER_ADMIN`
- **Agency ID**: `null`
- **Capabilities**:
  - **Agencies**: Create, edit, delete agencies; assign agency admins.
  - **Scanners**: Create/manage scanners for any agency.
  - **Data**: View and edit ALL trips, bookings, users, vehicles, hotpoints, disputes.
  - **Finance**: View platform-wide income and commission.
  - **Settings**: Configure platform fees, commission rates, and global settings.

### Agency Admin (Admin)
- **User Type**: `AGENCY_ADMIN`
- **Agency ID**: `<assigned_agency_id>`
- **Capabilities**:
  - **My Agency**: View/edit own agency details (name, contact).
  - **Scanners**: Create/edit/delete scanners **only for their agency**.
  - **Operations**: Manage users, routes, trips, vehicles, tickets, and disputes **scoped to their agency**.
  - **Finance**: View income/earnings for their agency only.
  - **Restrictions**: Cannot see other agencies; cannot change platform settings; cannot create new agencies.

### Scanner (Scanner Operator)
- **User Type**: `SCANNER`
- **Agency ID**: `<assigned_agency_id>`
- **Capabilities**:
  - **Validation**: Scan and validate tickets (`POST /api/tickets/validate`).
  - **Reporting**: View daily scan count and report (`GET /api/scanner/report`) **scoped to their agency**.
  - **Restrictions**: Read-only access to most data; cannot manage users or trips.

### Driver
- **User Type**: `DRIVER`
- **Agency ID**: `<optional_agency_id>` (if employed by agency)
- **Capabilities**:
  - **Trips**: Create/manage own trips (or view assigned agency trips).
  - **Bookings**: View bookings for their trips.
  - **Earnings**: View own earnings and request withdrawals.
  - **Check-in**: Validate tickets for their own trips.

### Passenger
- **User Type**: `USER`
- **Agency ID**: `null`
- **Capabilities**:
  - **Bookings**: Create and view own bookings.
  - **Profile**: Manage personal info and payment methods.
  - **Ratings**: Rate drivers after completed trips.

### Guest
- **User Type**: N/A (No user record)
- **Capabilities**:
  - **Booking**: Create a booking with `guest` details (name, phone, email).
  - **Ticket**: View ticket by ID/reference.
  - **Restrictions**: No dashboard, no history, no profile.

---

## 3. Backend Enforcement

- **Middleware**: `requireAuth` extracts `userType` and `agencyId` from JWT.
- **Super Admin Access**: Grants bypass to all scope filters.
- **Agency Scope**: 
  - If `userType` is `AGENCY_ADMIN` or `SCANNER`, inject `agencyId` into database queries (e.g. `WHERE trip.driver.agencyId = ?`).
  - Block access if resource `agencyId` does not match user `agencyId`.
- **Guest Access**: Public endpoints (`POST /api/bookings`, `GET /api/hotpoints`) do not require auth.
