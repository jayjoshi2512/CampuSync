# CampuSync — Web Platform

> **Phygital Alumni Engagement & Memory SaaS**  
> A multi-tenant platform for colleges to manage digital identity cards, a shared memory wall, alumni transitions, mentorship, and more — all with real-time Socket.IO sync.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Roles & Portals](#roles--portals)
- [Features](#features)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)

---

## Overview

CampuSync is a full-stack, production-grade SaaS platform built as a solo project. It allows educational institutions to:

- Onboard graduating batches via a secure multi-step registration flow
- Issue digital identity cards with QR codes and PDF download
- Run a shared memory wall (photos/videos) with emoji reactions
- Handle alumni upgrade requests with an approval workflow
- Provide a mentorship directory connecting students to alumni
- Manage billing and subscription plans via Razorpay
- Deliver real-time updates across all tabs and sessions via Socket.IO

There is no "mock" backend — this is running live in production on a VPS with Nginx as a reverse proxy.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VPS (Ubuntu)                       │
│  ┌───────────────┐        ┌──────────────────────────┐  │
│  │  Nginx (443)  │        │  Node.js API (port 5001) │  │
│  │  SSL via      │◄──────►│  Express + Socket.IO     │  │
│  │  Let's Encrypt│        │  /api/*  /api/socket.io  │  │
│  └───────────────┘        └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ▲                           ▲
         │                           │
┌────────┴──────────┐    ┌───────────┴───────────┐
│  Vercel (Web SPA) │    │  MongoDB Atlas         │
│  React + Vite     │    │  + Cloudinary Storage  │
└───────────────────┘    └───────────────────────┘
```

- **Frontend** → deployed on Vercel, environment variable `VITE_SOCKET_URL` points to the VPS API
- **Backend** → Node.js running via PM2 on VPS, Nginx proxies `/api/` and `/api/socket.io/`
- **Database** → MongoDB Atlas (cloud hosted)
- **Storage** → Cloudinary (profile avatars, memory photos/videos, card assets)
- **Cache / Rate Limiting** → Upstash Redis
- **Payments** → Razorpay subscriptions

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express | HTTP framework |
| Socket.IO 4 | Real-time bidirectional events |
| Mongoose 9 | MongoDB ODM |
| JWT | Auth (separate secrets per role) |
| Multer + Cloudinary | File upload & cloud storage |
| Nodemailer + SendGrid | Transactional email |
| Razorpay | Subscription billing |
| Upstash Redis | Session cache & rate limiting |
| PDFKit + QRCode | Card PDF generation |
| Helmet, express-rate-limit | Security hardening |
| Winston | Structured logging |

### Frontend
| Package | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite 5 | Build tool |
| React Router v6 | Client-side routing |
| Zustand | Global auth state |
| Framer Motion | Animations & modals |
| Socket.IO Client | Real-time connection |
| Recharts | Analytics charts |
| jsPDF + html2canvas | Client-side PDF export |
| Lucide React | Icon system |
| Vanilla CSS (custom design system) | No Tailwind — full custom tokens |

---

## Roles & Portals

| Role | Entry Point | Description |
|---|---|---|
| **Super Admin** | `/super-admin/login` | Platform owner — approves institution registrations, manages all orgs, billing overview, audit log, trash recovery |
| **Admin (Org Owner)** | `/admin/login` | Institution admin — manages cohort, memories, card design, alumni requests, billing, announcements |
| **Student / User** | `/login` (Magic Link) | Graduating student — views digital card, memory wall, reacts to memories, mentorship directory, profile |
| **Alumni** | Same login, elevated role | Upgraded student — extra badge, visible in mentorship directory as mentor |

---

## Features

### Super Admin
- Dashboard with platform-wide stats (orgs, users, cards, storage, MRR)
- Registration queue — approve or reject institution sign-up requests with email notifications
- Organizations table with live status toggle (active/suspended) + edit plan/quota modal
- Audit log with CSV export
- Trash bin with soft-delete restore / permanent purge

### Admin (Per Org)
- Cohort management — add/edit/remove students, CSV bulk import, magic link sender
- Memory wall management — upload photos/videos, moderate content, react
- Dynamic card designer — choose layout, colors, logo, QR code style; preview live
- Alumni request review — approve/reject upgrade requests with socket-pushed notifications
- Billing & plan management via Razorpay subscriptions
- Announcement system — push org-wide notifications

### Student / Alumni Portal
- **Digital Identity Card** — rendered in-browser, QR-coded, PDF downloadable
- **Memory Wall** — masonry grid, emoji reactions (live via socket), caption, uploader avatar
- **Profile** — avatar upload/change/remove, personal details
- **Mentorship Directory** — search alumni by branch/year
- **Notifications bell** — real-time new memory, reaction, announcement alerts
- **Alumni Upgrade** — request transition, tracked with status

### Real-Time (Socket.IO)
- Client joins rooms: `user:{id}`, `role:{role}`, `org:{orgId}`
- Events emitted server-side after every mutation:
  - `cohort:student-added/updated/removed`
  - `reaction:updated`
  - `memory:updated`
  - `alumni:request-updated`
  - `session:sync-required`
  - `org:updated`
  - `notification:new`
  - `payment:success`

---

## Project Structure

```
WEB/
├── backend/
│   ├── server.js                # Express + Socket.IO bootstrap
│   ├── middleware/              # Auth JWT, rate limit, multer
│   ├── config/                  # Database, mailer, cloudinary
│   ├── utils/                   # Audit log, email templates, cloudinary helpers
│   └── src/modules/
│       ├── auth/                # Magic link, setup password, QR login
│       ├── admin/               # Cohort, memories, announcements, alumni requests
│       ├── users/               # Profile, avatar
│       ├── memories/            # Memory feed, reactions
│       ├── cards/               # Card generation, PDF
│       ├── billing/             # Razorpay plans, webhooks
│       ├── notifications/       # Per-user notification store
│       ├── mentorship/          # Directory API
│       ├── alumni/              # Alumni request flow
│       ├── organizations/       # Org settings
│       └── superadmin/          # Platform management
│
└── frontend/
    ├── src/
    │   ├── pages/               # Route-level page components
    │   │   ├── LandingPage.tsx
    │   │   ├── Login.tsx        # Magic link login
    │   │   ├── UserPortal.tsx   # Student portal shell
    │   │   ├── AdminDashboard.tsx
    │   │   └── SuperAdminDashboard.tsx
    │   ├── components/
    │   │   ├── SessionSyncProvider.tsx  # Socket.IO connection + event bridge
    │   │   ├── student/         # User portal tabs
    │   │   ├── admin/           # Admin dashboard components
    │   │   ├── superadmin/      # Super admin components
    │   │   ├── memories/        # Memory wall, filters
    │   │   ├── layout/          # Sidebar, theme toggle, notification bell
    │   │   └── billing/         # Plan selector, billing UI
    │   ├── store/
    │   │   └── authStore.ts     # Zustand global auth state
    │   └── utils/
    │       └── api.ts           # Axios instance with auth header injection
    └── index.css                # Full custom design system (CSS variables)
```

---

## Environment Variables

### Backend (`.env`)

```env
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET_USER=...
JWT_SECRET_ADMIN=...
JWT_SECRET_SUPER_ADMIN=...
JWT_SECRET_MAGIC_LINK=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=...
SMTP_FROM_EMAIL=...
SMTP_FROM_NAME=CampuSync
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_PLAN_ID_STARTER=...
RAZORPAY_PLAN_ID_GROWTH=...
RAZORPAY_WEBHOOK_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
API_BASE_URL=https://campusync-api.unicodetechnolab.site/api
APP_BASE_URL=https://campusync-six.vercel.app
CORS_ORIGINS=https://campusync-six.vercel.app
SUPER_ADMIN_EMAIL=...
```

### Frontend (`.env`)

```env
VITE_API_URL=https://campusync-api.unicodetechnolab.site/api
VITE_SOCKET_URL=https://campusync-api.unicodetechnolab.site
```

> **Note:** `VITE_SOCKET_URL` must NOT have a trailing slash and must NOT have `www.` — the Nginx proxy routes `/api/socket.io/` to port 5001.

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas URI
- Cloudinary account
- SendGrid API key

### Backend

```bash
cd WEB/backend
cp .env.example .env        # fill in all values
npm install
npm run dev                 # nodemon — hot reload
```

### Frontend

```bash
cd WEB/frontend
cp .env.example .env        # set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev                 # Vite dev server on :5173
```

---

## Deployment

### VPS (Backend)

```bash
# Install PM2 globally
npm install -g pm2

# Start the API
cd /var/www/campusync-api.unicodetechnolab.site
pm2 start server.js --name campusync-api
pm2 save
pm2 startup
```

### Nginx config (key sections)

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}

location /api/socket.io/ {
    proxy_pass http://127.0.0.1:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Frontend (Vercel)

Push to GitHub → Vercel auto-deploys. Set the two env vars in Vercel project settings.

---

## Known Limitations

- **Cloudinary free tier** — storage limit is ~25 GB. Memory photos/videos consume quota. High-volume orgs should consider a paid tier.
- **Render cold starts** — if backend is hosted on Render free tier, expect ~30s spin-up. The VPS deployment eliminates this.
- **Socket.IO fallback** — transport order is `polling → websocket`. The polling handshake is required because the Nginx `Upgrade` header must be negotiated first.
- **Rate limiting** — API routes are rate-limited via Upstash Redis. Aggressive scraping or testing bursts may result in 429 responses.
