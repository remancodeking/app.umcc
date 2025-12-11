# Task: Implement Attendance Management System

## Status
- [x] Backend Implementation
    - [x] Create Attendance Mongoose Model.
    - [x] Refactor NextAuth to export `authOptions` for API usage.
    - [x] Create API Route (`GET`, `POST`, `PUT`) for handling clock-in/out.
    - [x] Implement logic for "Late" status (after 08:15 AM).
- [x] Frontend Implementation
    - [x] Build Premium Dashboard UI (`src/app/dashboard/attendance/page.js`).
    - [x] Add Real-time Clock visualization.
    - [x] internal logic for "Start Shift" / "End Shift".
    - [x] Add Summary Stats cards (Present, Late, Hours).
    - [x] Add History Table.
- [x] Admin View Implementation
    - [x] Create `GET /api/attendance/admin` to fetch all users status.
    - [x] Create `POST /api/attendance/admin` for manual status override (P, L, A).
    - [x] Implement Tabs in frontend (All, P, L, A, Pending).
    - [x] Add Search filter.
    - [x] Add Quick Actions (P, L, A buttons) for each user.

## Next Steps
- [ ] Reporting: Export to CSV/PDF.
