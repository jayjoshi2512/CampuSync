# CampuSync

**A full-stack SaaS platform for alumni engagement, digital farewell cards, and mentorship management.**

CampuSync helps educational institutions create premium digital farewell cards for graduating students, build alumni networks, and facilitate mentorship between alumni and current students — all through a modern, dark-themed web interface.

---

## ✨ Features

### 🎓 Student Portal
- **Digital Farewell Card** — Personalized, template-driven cards with QR codes
- **Memory Wall** — Upload photos/videos; real-time reactions from peers
- **Mentorship** — Request help from approved alumni mentors
- **Events & Jobs** — Browse institution-published events and job listings
- **Profile Editor** — Update avatar, bio, LinkedIn, and academic details

### 🏛️ Alumni Portal
- **Alumni Network** — Directory of all alumni from the institution
- **Become a Mentor** — Request mentor status and guide students
- **Mentor Dashboard** — View incoming student requests with badge counters, approve/reject with optional notes
- **Card & Memories** — Access your own farewell card and shared memory wall

### 🔧 Admin Dashboard
- **Cohort Management** — Bulk CSV import or manual student creation with magic-link invitations
- **Card Design** — Select from starter and premium card templates
- **Alumni Requests** — Approve/reject alumni access requests with real-time sidebar badges
- **Mentor Management** — Approve mentor requests from alumni, remove mentors
- **Analytics** — Dashboard metrics, audit logs, and usage stats
- **Announcements** — Broadcast emails to all members
- **Settings** — Organization name, branding, card back images

### 🛡️ Super Admin
- **Institution Registration** — Review, approve, or reject new institutions
- **OTP Authentication** — Secure email-based OTP login

### 🔔 Notifications
- **Real-time** — Server-Sent Events (SSE) push notifications
- **Bell Icon** — Dropdown with unread count, mark-all-read
- **Sidebar Badges** — Live badge counters for pending mentorship/alumni requests
- **Types** — Memories, announcements, mentorship, reactions, system events

### 📧 Email System
- **Responsive Templates** — Dark-themed, mobile-friendly HTML emails
- **Copy-Friendly** — Selectable text with clipboard icon for links/codes
- **Templates** — OTP verification, magic links, approval/rejection, password reset, announcements

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4 |
| **UI** | Framer Motion, Lucide React icons, Zustand state management |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Cache/Session** | Upstash Redis (HTTP REST) with in-memory fallback |
| **Auth** | JWT (role-based: Super Admin, Admin, User/Alumni), Magic Links, OTP |
| **Email** | Nodemailer (SMTP), responsive HTML templates |
| **File Storage** | Cloudinary (avatars, memories, card assets) |
| **Payments** | Razorpay (subscription billing) |
| **Security** | Helmet, CORS, rate limiting, Cloudflare Turnstile, bcrypt |
| **Real-time** | Server-Sent Events (SSE) for notifications |

---

## 📁 Project Structure

```
CampuSync/
├── backend/
│   ├── config/               # Database, Redis, env validation
│   ├── middleware/            # Auth middleware (JWT verification)
│   ├── scripts/              # Seed scripts
│   ├── src/
│   │   └── modules/
│   │       ├── admin/        # Admin dashboard controllers & routes
│   │       ├── alumni/       # Alumni-specific controllers
│   │       ├── auth/         # User auth (login, magic link, password)
│   │       ├── billing/      # Razorpay subscription management
│   │       ├── cards/        # Card generation & QR codes
│   │       ├── features/     # Mentorship, directory, events, jobs
│   │       ├── memories/     # Memory wall (upload, reactions)
│   │       ├── notifications/  # SSE stream & CRUD
│   │       ├── organizations/  # Org management
│   │       ├── superadmin/   # Super admin controllers
│   │       └── users/        # User model & profile
│   ├── utils/                # Email templates, JWT, QR, helpers
│   └── server.js             # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/        # Admin tab components
│   │   │   ├── auth/         # Auth UI (brand panel, back button)
│   │   │   ├── billing/      # Plan selector
│   │   │   ├── common/       # Button, Card, Modal
│   │   │   ├── layout/       # SidebarShell, NotificationBell, PortalHeader
│   │   │   ├── memories/     # Memory wall, uploader, lightbox
│   │   │   ├── registration/ # OTP input, Turnstile
│   │   │   └── student/      # Student/Alumni shared components
│   │   ├── hooks/            # Custom hooks (useMemories, useMediaQuery)
│   │   ├── pages/            # Route pages (portals, auth, landing)
│   │   ├── store/            # Zustand stores (auth, modal)
│   │   └── utils/            # API client (axios)
│   └── index.html
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **MongoDB** (local or Atlas)
- **Redis** (optional — uses in-memory fallback for local dev)

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/CampuSync.git
cd CampuSync

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env — set VITE_API_BASE_URL=http://localhost:5000/api
```

**Key environment variables:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET_*` | Separate secrets for super admin, admin, user, magic link |
| `CLOUDINARY_*` | Cloud name, API key, and secret |
| `SMTP_*` | SMTP host, port, user, pass for email |
| `RAZORPAY_*` | Payment gateway keys |
| `CLOUDFLARE_TURNSTILE_SECRET` | Bot protection |
| `SUPER_ADMIN_EMAIL` | Seed email for super admin |

### 3. Seed Super Admin

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Visit **http://localhost:5173** to access the application.

---

## 🔐 Authentication Flow

```
  Institution Registration
         │
    ┌────▼────┐
    │ Super   │──── OTP Login (email)
    │ Admin   │──── Approve/Reject Institutions
    └────┬────┘
         │ Approval → Magic Link Email
    ┌────▼────┐
    │  Admin  │──── Password Login
    │         │──── Manage Cohorts, Cards, Features
    └────┬────┘
         │ CSV/Manual Import → Magic Link Email
    ┌────▼────┐
    │ Student │──── Password Login / Magic Link
    │ /Alumni │──── Access Portal Features
    └─────────┘
```

---

## 🔑 API Structure

All API routes are prefixed with `/api`.

| Prefix | Auth | Description |
|--------|------|-------------|
| `/api/super-admin/*` | Super Admin JWT | Institution management |
| `/api/admin/*` | Admin JWT | Dashboard, cohort, settings |
| `/api/user/*` | User JWT | Auth, profile, become-alumni |
| `/api/features/*` | Any JWT | Directory, mentors, events, jobs |
| `/api/memories/*` | Any JWT | Memory wall CRUD |
| `/api/notifications/*` | Any JWT | Bell notifications + SSE stream |
| `/api/billing/*` | Admin JWT | Razorpay subscriptions |

---

## 📊 Plans & Pricing

| Feature | Trial | Starter | Growth |
|---------|-------|---------|--------|
| Digital Cards | ✅ | ✅ | ✅ |
| Memory Wall | ✅ | ✅ | ✅ |
| Basic Templates | ✅ | ✅ | ✅ |
| Premium Templates | ❌ | ❌ | ✅ |
| Alumni Portal | ❌ | ❌ | ✅ |
| Mentorship | ❌ | ❌ | ✅ |
| Events & Jobs | ❌ | ❌ | ✅ |
| Bulk Export | ❌ | ✅ | ✅ |

---

## 🧪 Development Notes

- **Hot Reload**: Backend uses `nodemon`, frontend uses Vite HMR
- **Email in Dev**: Emails are logged to console if SMTP is not configured. Use MailHog/MailTrap for local testing
- **Redis Fallback**: If `UPSTASH_REDIS_REST_URL` is empty, an in-memory Map is used
- **Cloudflare Turnstile**: Use test keys (`1x00000000000000000000AA`) for local dev

---

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ by the CampuSync team.**
