# Alumni Professional Information Update Management System (APIUMS)

A production-ready web application for college alumni professional details management, enabling efficient record updates through role-based team workflows.

## Tech Stack

- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript (ES6+)
- **Charts:** Chart.js
- **Icons:** Font Awesome
- **Backend (planned):** Node.js, Express.js, MSSQL, JWT

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system control: user/team management, Excel import, batch assignment, reports, audit logs, settings |
| **Team Leader** | View assigned alumni, auto-distribute via Round Robin, lock distribution, track team progress, export reports |
| **Team Member** | View assigned records, update alumni info, save drafts, submit records, view personal progress |

## Dummy Credentials

| Username | Password | Role | Redirect |
|----------|----------|------|----------|
| admin | admin123 | Admin | admin.html |
| leader | leader123 | Team Leader | teamleader.html |
| member | member123 | Team Member | teammember.html |

## Pages

| Page | File | Description |
|------|------|-------------|
| Login | `index.html` | Glass-card login with role selector, remember me, password toggle |
| Admin Dashboard | `admin.html` | Overview stats, charts, assignments table, user/team modals, Excel import, audit logs, settings |
| Team Leader | `teamleader.html` | Team progress, member table, Round Robin distribution, lock distribution, export |
| Team Member | `teammember.html` | Records table with search/filter/pagination, update modal with Save Draft/Submit |
| Profile | `profile.html` | User details, change password with strength meter, activity log |
| Settings | `settings.html` | General, notification, security, database configuration tabs |
| Progress | `progress.html` | Charts: overall completion, department-wise, batch-wise, leader rankings, weekly trend |
| Reports | `reports.html` | Generate reports, recent reports table, scheduled reports |
| 404 | `404.html` | Custom error page |

## Project Structure

```
public/
├── index.html              # Login / Homepage
├── admin.html              # Admin dashboard
├── teamleader.html         # Team Leader dashboard
├── teammember.html         # Team Member dashboard
├── profile.html            # User profile
├── settings.html           # System settings
├── progress.html           # Analytics & charts
├── reports.html            # Reports generation
├── 404.html                # Error page
├── css/
│   └── styles.css          # Comprehensive stylesheet (2,400+ lines)
├── js/
│   ├── app.js              # Shared utilities (toast, modal, sidebar, etc.)
│   ├── charts.js           # Chart.js chart generators
│   ├── login.js            # Login logic
│   ├── admin.js            # Admin functionality
│   ├── leader.js           # Team Leader logic
│   ├── member.js           # Team Member logic
│   ├── profile.js          # Profile page
│   ├── settings.js         # Settings page
│   ├── progress.js         # Progress page
│   └── reports.js          # Reports page
└── assets/
    ├── images/
    └── icons/
```

## Production Documentation

Refer to `/production/` folder for:

| Document | File |
|----------|------|
| Product Requirements | `PRD - ALUMNIMS.md` |
| Software Design | `SSD - ALUMNIMS.md` |
| Tech Stack & Standards | `TECH- ALUMNIMS.md` |
| Security Architecture | `SECURITY- ALUMNIMS.md` |

## Design System

- **Primary:** Blue #2563EB
- **Background:** White #FFFFFF
- **Secondary:** Light Blue #DBEAFE
- **Dark:** #0F172A (sidebar)
- **Font:** Poppins
- **Radius:** 12px (cards), 8px (inputs/buttons)
- **Shadows:** Subtle elevations with hover effects

## Features Implemented

- Role-based dashboards with distinct navigation
- Responsive sidebar (collapsible desktop, off-canvas mobile)
- Glass-effect login card with validation
- Dashboard overview cards with hover elevation
- Data tables with search, filter, pagination
- Charts: doughnut, bar, line, horizontal bar
- Update modals with floating labels and validation
- Save Draft / Submit Record workflow (Team Member)
- Round Robin auto-distribution (Team Leader)
- Lock Distribution mechanism (Team Leader)
- Excel Import UI with file upload zone (Admin)
- Audit Logs with filters (Admin)
- Toast notifications and session timeout popup
- Profile page with password strength meter
- Complete settings panel (4 tabs)
- Reports page with scheduled reports
- Progress analytics with 5 chart types
- 404 error page
- Ripple effects, skeleton loading, smooth transitions
- CSV export and search functionality

## Backend Integration Points

The frontend is designed for future integration with:
- `POST /api/v1/auth/login` - Authentication
- `GET/POST/PUT /api/v1/users` - User management
- `GET/POST /api/v1/teams` - Team management
- `GET/PUT /api/v1/alumni` - Alumni records
- `POST /api/v1/alumni/import` - Excel import
- `GET /api/v1/dashboard` - Dashboard stats
- `GET /api/v1/reports` - Report generation
- `GET /api/v1/audit-logs` - Audit trail

## Running the Project

Open `public/index.html` in a modern browser (Chrome, Edge, Firefox, Brave, Opera).

No build step required - uses CDN-loaded Tailwind CSS.

Ready for deployment behind IIS with Node.js backend on Windows Server.
