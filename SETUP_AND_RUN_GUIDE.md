# Phygital SaaS — Setup & Run Guide

> Last updated: March 2026. Covers local development (XAMPP), third-party integrations, and cPanel deployment.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Running Locally (XAMPP)](#running-locally-xampp)
4. [Environment Variables](#environment-variables)
5. [Third-Party Service Setup](#third-party-service-setup)
   - Cloudflare Turnstile
   - Cloudinary
   - Redis (via Upstash)
   - Nodemailer / SMTP
   - Razorpay
6. [Demo Login Credentials](#demo-login-credentials)
7. [cPanel Deployment](#cpanel-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 18.x | Use nvm to switch versions |
| XAMPP | ≥ 8.x | MySQL + Apache for local DB |
| npm | ≥ 9.x | Comes with Node |
| Git | any | For cloning |

---

## Project Structure

```
____________/
├── backend/         # Express.js API
│   ├── .env         # Backend environment variables
│   ├── server.js    # Entry point
│   └── ...
├── frontend/        # React + Vite
│   ├── .env         # Frontend environment variables
│   └── ...
├── database/
│   └── schema.sql   # Full MySQL schema + seed data
└── SETUP_AND_RUN_GUIDE.md
```

---

## Running Locally (XAMPP)

### 1. Start XAMPP
- Open XAMPP Control Panel
- Start **Apache** and **MySQL**

### 2. Create the Database
Open phpMyAdmin (`http://localhost/phpmyadmin`) and:
```sql
CREATE DATABASE phygital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Then import `database/schema.sql` via phpMyAdmin's Import tab.

### 3. Configure Backend
Create `backend/.env` (copy from `.env.example`):
```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=phygital_db
DB_USER=root
DB_PASS=

# JWT
JWT_SECRET=your_64_char_random_secret_here
JWT_EXPIRES_IN=7d

# Super Admin
SUPER_ADMIN_EMAIL=your-real-email@domain.com

# Redis (local dev — use Upstash free tier URL)
REDIS_URL=redis://127.0.0.1:6379

# Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourapp@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=Phygital <noreply@phygital.app>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_secret

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_secret_key

# App
MAX_UPLOAD_MB=50
```

### 4. Install & Start Backend
```powershell
cd backend
npm install
node server.js
# Runs on http://localhost:5000
```

### 5. Configure Frontend
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_TURNSTILE_SITE_KEY=test_key   # use "test_key" for local dev
```

### 6. Install & Start Frontend
```powershell
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Environment Variables

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for API calls |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (use `test_key` for dev) |

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Random 64-char string — run `openssl rand -hex 32` |
| `SUPER_ADMIN_EMAIL` | Email where SA login OTPs are sent |
| `REDIS_URL` | Redis connection URL |
| `SMTP_*` | SMTP credentials for Nodemailer |
| `CLOUDINARY_*` | Cloudinary media storage credentials |
| `RAZORPAY_*` | Payment gateway credentials |

---

## Third-Party Service Setup

### 🔒 Cloudflare Turnstile (Bot Protection)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → Add site
2. Select "Managed" widget type
3. Add `localhost` to allowed hostnames during dev
4. Copy **Site Key** → `VITE_TURNSTILE_SITE_KEY` in frontend `.env`
5. Copy **Secret Key** → `TURNSTILE_SECRET_KEY` in backend `.env`

> For local testing, set `VITE_TURNSTILE_SITE_KEY=test_key` — the widget auto-verifies.

---

### ☁️ Cloudinary (Media Storage)
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25GB)
2. Dashboard → Settings → copy **Cloud Name, API Key, API Secret**
3. Create an upload preset named `phygital_memories` (unsigned, for client uploads)
4. Set in backend `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   ```

---

### 🔴 Redis (Caching & Rate Limiting)
**Option A — Local (Windows):**
- Download Redis for Windows from [github.com/microsoftarchive/redis](https://github.com/microsoftarchive/redis/releases)
- Run `redis-server.exe`
- Set `REDIS_URL=redis://127.0.0.1:6379`

**Option B — Upstash (Free Cloud Redis):**
1. Go to [console.upstash.com](https://console.upstash.com) → Create database
2. Copy the **REST URL** (starts with `rediss://`) → `REDIS_URL`

---

### 📧 Nodemailer / SMTP (Email OTPs)
**Using Gmail:**
1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password for "Mail"
4. Set in backend `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=yourapp@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx   # the 16-char app password
   ```

**Using SendGrid (production):**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
```

---

### 💳 Razorpay (Payments)
1. Sign up at [razorpay.com](https://razorpay.com) (free for testing)
2. Dashboard → Settings → API Keys → Generate Test Key
3. Set in backend `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=your_secret
   ```
4. In frontend, Razorpay checkout opens via `window.Razorpay` (loaded from CDN in `index.html`)

---

## Demo Login Credentials

Use these to preview the UI **without a real database**. Click "🎮 Demo Login" on any login page.

| Role | Access Flow |
|------|------------|
| **Super Admin** | Go to `/super-admin` → click "🎮 Demo Login (Preview UI)" |
| **Admin** | Go to `/login` → toggle "🏛️ Admin" → click "🎮 Demo Login (Preview Admin Panel)" |
| **Student** | Go to `/login` → toggle "🎓 Student" → click "🎮 Demo Login (Preview Student Portal)" |

---

## cPanel Deployment

### Backend (Node.js App)
1. In cPanel → **Setup Node.js App** → Create Application
   - Node.js version: 18.x
   - App root: `backend/`
   - App URL: your domain/subdomain
   - Startup file: `server.js`
2. Upload backend files via File Manager or Git
3. In cPanel terminal, run: `npm install`
4. Set all environment variables in cPanel's "App Environment Variables" section

### Frontend (Static Build)
1. Locally, build the frontend:
   ```powershell
   cd frontend
   # Set VITE_API_URL to your production backend URL first
   npm run build
   ```
2. Upload the `frontend/dist/` folder contents to `public_html/` (or subdirectory)
3. Create `.htaccess` in `public_html/` for React Router:
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```

### Database
1. cPanel → MySQL Databases → Create `phygital_db`
2. Import `database/schema.sql` via phpMyAdmin
3. Update backend `.env` with cPanel MySQL credentials

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot connect to DB` | Check XAMPP MySQL is running, verify `DB_USER`/`DB_PASS` |
| `Redis connection refused` | Start redis-server or switch to Upstash URL |
| `SMTP auth failed` | Use Gmail App Password, not your regular password |
| `Turnstile invalid` | Use `test_key` in dev, or add `localhost` to Turnstile site allowlist |
| `Vite proxy error` | Ensure backend is running on port 5000 before starting frontend |
| `Cannot find module` | Run `npm install` in both `backend/` and `frontend/` |
| `CSS all black` | Clear localStorage → theme preference may be corrupt |
| `Card 3D not rotating` | Requires Framer Motion — run `npm install framer-motion` in frontend |
