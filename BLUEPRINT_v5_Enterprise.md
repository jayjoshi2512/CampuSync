# MASTER BLUEPRINT: Phygital Memory & Alumni Engagement SaaS
## Version 5.0 — Production-Ready Enterprise

---

## 1. AGENT INSTRUCTIONS: ONE-SHOT GENERATION PROTOCOL

**CRITICAL:** Do NOT generate step-by-step. Do NOT ask for approval between steps. Generate the complete boilerplate, database schema, backend API structure, and core frontend React components in a single, comprehensive output. Use exact file paths (e.g., `backend/server.js`) so the output can be immediately copied and used.

**Agent Personas:**
- **Senior Cloud Architect:** 3-tier RBAC, JWT scope pipeline, Cloudinary streaming, Redis caching layer, Razorpay subscription billing, Cloudflare Turnstile bot protection.
- **Lead UI/UX Engineer:** 3D card viewer, animated dashboards, enterprise design system (Section 4), institution registration flow with email verification UX.
- **Cyber Security Expert:** OTP cryptographic integrity, JWT strict scoping, rate limiting, temp-mail blocking, input sanitization, soft-delete architecture, audit logging.
- **Product Manager:** All flows are self-serve. No manual admin action is required except approvals. Every state transition is explicit, logged, and reversible.

---

## 2. CORE PHILOSOPHY & DESIGN DECISIONS

### Self-Serve First
Institutions register themselves via a public form. Super Admin does not create institutions manually — they only **approve or reject** registrations. This scales the platform without requiring Super Admin involvement in routine onboarding.

### Soft Delete Everywhere
No hard deletes anywhere in the system. Every record has an `is_active` (`TINYINT(1)`) column:
- `is_active = 1` → Record exists and is visible.
- `is_active = 0` → Soft deleted. Hidden from all API responses by default.
- All Sequelize queries append `WHERE is_active = 1` via a global scope on every model.
- A Super Admin "Trash" view can list and restore soft-deleted records.
- Physical Cloudinary assets are NOT deleted on soft delete — only when a Super Admin triggers a "Purge" action (permanent, irreversible, double-confirmed).

### Institution Registration — Fully Self-Serve with Approval Gate
1. Institution fills a public registration form at `/register`.
2. Email domain is validated: no disposable/temp mail services allowed (server-side blocklist + Cloudflare Turnstile on the form).
3. A **6-digit email verification OTP** is sent to the contact email. Must be verified within 15 minutes before the form can be submitted.
4. On submission, organization record is created with `status = 'pending'`.
5. Super Admin receives an email alert: "New institution registration pending approval."
6. Super Admin reviews registration details in their panel and clicks **Approve** or **Reject** (with a reason).
7. On approval: `status → 'active'`, Admin receives a "Your account is approved" email with a link to set their password and log in.
8. On rejection: Admin receives an email with the rejection reason. The registration record remains (soft, `is_active = 1`, `status = 'rejected'`) — they can re-apply with corrections.

---

## 3. PRODUCT OVERVIEW & 3-TIER ARCHITECTURE

A white-labeled SaaS platform for physical NFC/QR **Farewell & Alumni Memory Cards** — connecting graduating cohorts to a lifelong digital memory space.

---

### Tier 1: Super Admin (Platform Owner)

**Access Route:** `/super-admin`

**Authentication Flow:**
1. Super Admin navigates to `/super-admin` — a visually distinct, locked-down portal (not linked from anywhere public).
2. Enters registered email → clicks **"Request Access Code"**.
3. Backend generates a 15-character cryptographically secure OTP (alphanumeric + special symbols), hashes with `bcrypt (rounds: 12)`, stores hash + `otp_expires_at` in DB, sets a Redis key `super_admin_otp:{email}` with 600s TTL (consumed on first use).
4. OTP is emailed. Super Admin enters it → backend verifies hash → issues a scoped JWT (`role: 'super_admin'`, 2-hour expiry, `jti` claim stored in Redis for revocation).
5. All Super Admin routes protected by `verifySuperAdminJWT` middleware.

**Capabilities:**
- **Global Dashboard:** Active organizations, pending registrations count, total users, total cards generated, platform-wide Cloudinary storage (GB used / total), Razorpay MRR (monthly recurring revenue).
- **Registration Queue:** View all `pending` institution registrations with full details — approve (with optional welcome note) or reject (with mandatory reason).
- **Organization Management:** View all organizations, filter by status (`pending / active / suspended / trial`), view per-org stats, suspend/reinstate, adjust card quota and storage limit.
- **Subscription & Billing:** View per-org Razorpay subscription status, payment history, manually override plan (for custom enterprise deals).
- **Audit Log:** Full platform-wide action log — filterable by date, actor, action type. CSV export.
- **Trash / Restore:** View all soft-deleted records across org/user/memory tables. Restore or permanently purge (double-confirmation modal).
- **Template Management:** Add/edit/deprecate card design templates.
- **Platform Notifications:** Broadcast announcement to all active admins.
- **Cloudinary Usage Report:** Per-org storage breakdown, warn at >80%, hard-block uploads at 100%.

---

### Tier 2: Admin (Institution or Student Organizer)

**Access Route:** `/admin/login` (unlocked only after Super Admin approval)

**Authentication Flow:** Email + bcrypt-hashed password (set via onboarding link after approval). Returns scoped JWT (`role: 'admin'`, `organization_id`, `org_role`, 8-hour expiry).

**Capabilities:**
- Upload student CSV → bulk-create user accounts (name, email, roll number, branch, batch year).
- Select and customize card design template for their cohort.
- Set cohort metadata: batch year, department, institution logo, brand color.
- Generate and download QR code batch (print-ready PDF).
- View and moderate cohort memory feed.
- Send bulk announcement emails to cohort.
- View cohort analytics: memories uploaded, storage used, active users, card scan events.
- Export cohort data as CSV.
- Invite co-admins (limited permissions: moderate memories, view analytics — cannot change settings or billing).
- Manage Razorpay subscription (upgrade/downgrade plan, view invoices).

---

### Tier 3: Final User (Student / Alumni)

**Access Route:** `/portal` (via QR/NFC scan, magic link, or direct login)

**Authentication Flow:**
- **QR/NFC Scan:** Encoded URL contains `qr_hash` → backend validates → issues user JWT.
- **Magic Link:** User enters email → receives a one-time login link (15-minute TTL, Redis-backed, consumed on use).
- **Direct Login:** Email + password (set after first login).

**Capabilities:**
- 3D interactive digital twin of their physical card.
- Infinite-scroll cohort Memory Wall (photos + HD videos).
- Drag-and-drop memory uploader.
- Personal profile editor (name, avatar, LinkedIn, Instagram, bio).
- Shareable card link (public page, OG meta for LinkedIn).
- In-app + email notifications.
- Emoji reactions on memories.
- Hi-res card download (PNG / PDF).
- View card scan count ("Your card has been viewed X times").

---

## 4. TECH STACK & INTEGRATIONS

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 (Vite), TypeScript | Core UI |
| Styling | Tailwind CSS v4 + CSS custom properties | Design system |
| Animations | Framer Motion | Transitions, micro-interactions |
| 3D Card | CSS 3D transforms (no Three.js) | Card viewer |
| Backend | Node.js 20, Express.js | API server |
| ORM | Sequelize v6 with migrations | MySQL ORM |
| Database | MySQL 8 (cPanel hosted) | Relational data |
| Cache / TTL | Redis via Upstash (HTTP REST) | OTP TTL, magic links, rate limit, JWT revocation |
| Media | Cloudinary SDK v2 | Direct stream upload, video transcoding, card render |
| Email | Nodemailer + cPanel SMTP | OTPs, magic links, approvals, notifications |
| Auth | jsonwebtoken + bcryptjs | JWT auth, password hashing |
| Payments | **Razorpay** (Subscriptions API) | Indian payment gateway, UPI + cards + netbanking |
| Bot Protection | **Cloudflare Turnstile** | Registration form, login forms — blocks bots without CAPTCHA friction |
| Temp Mail Block | Custom blocklist + `disposable-email-domains` npm package | Blocks 50,000+ known disposable domains |
| File Parsing | Multer (memory storage) + csv-parse | CSV import, media upload |
| Security | helmet, express-rate-limit, express-validator | HTTP hardening |
| Logging | winston + morgan | Structured logs, audit trail |
| Env | dotenv + envalid | Validated environment variables |
| Card PDF Gen | Puppeteer (headless) | Server-side hi-res card render → Cloudinary |

---

## 5. ENTERPRISE DESIGN SYSTEM

### Design Philosophy
**"Obsidian Glass"** — Premium dark-first enterprise aesthetic. Think: Linear.app meets Notion, with the weight of a fintech dashboard. Every surface has depth. Typography is editorial and confident. Motion is intentional — never decoration.

### Color System (CSS Custom Properties + Tailwind v4)

> **Tailwind v4 Note:** v4 removes `tailwind.config.js` color/theme configuration. Instead, all design tokens are defined as CSS custom properties in a base CSS file and referenced directly in class names via the `(--var)` syntax (e.g., `bg-(--sa-accent)`). The `@import "tailwindcss"` directive in `src/index.css` replaces the old PostCSS plugin setup. Use `@theme` block inside CSS to register tokens with Tailwind's engine for autocomplete and JIT generation.

```css
/* ============================================
   GLOBAL SURFACE TOKENS
   ============================================ */
--color-surface-base:      #07090E;   /* Deepest canvas — page background */
--color-surface-raised:    #0D1117;   /* Cards, panels */
--color-surface-overlay:   #161B24;   /* Modals, dropdowns, inputs */
--color-surface-interactive: #1C2333; /* Hover states on raised surfaces */
--color-border-subtle:     rgba(255,255,255,0.05);
--color-border-default:    rgba(255,255,255,0.09);
--color-border-strong:     rgba(255,255,255,0.16);

/* ============================================
   TIER 1: SUPER ADMIN — "EMERALD SOVEREIGN"
   Deep authority. Minimal. Maximum trust signal.
   ============================================ */
--sa-bg:           #070E0B;
--sa-accent:       #00E89B;   /* Electric emerald — CTAs, active states */
--sa-accent-hover: #00C98A;
--sa-accent-muted: rgba(0,232,155,0.12);
--sa-glow:         0 0 40px rgba(0,232,155,0.18);
--sa-text-primary: #E8FFF8;
--sa-text-muted:   #6B9E8A;

/* ============================================
   TIER 2: INSTITUTION ADMIN — "INDIGO COMMAND"
   Professional. Structured. Trustworthy.
   ============================================ */
--ia-bg:           #09090F;
--ia-accent:       #7C7FFA;   /* Soft indigo — CTAs */
--ia-accent-hover: #9698FC;
--ia-accent-muted: rgba(124,127,250,0.12);
--ia-glow:         0 0 40px rgba(124,127,250,0.15);
--ia-text-primary: #EEF0FF;
--ia-text-muted:   #7375A0;

/* ============================================
   TIER 3: STUDENT PORTAL — "AURORA"
   Dynamic — org brand color injected at runtime.
   ============================================ */
/* Set by OrgThemeProvider.tsx from organization.brand_color */
--org-accent:      var(--org-brand-color, #F59E0B);
--org-accent-rgb:  var(--org-brand-color-rgb, 245,158,11);
--org-accent-muted: rgba(var(--org-accent-rgb), 0.12);
--org-glow:        0 0 40px rgba(var(--org-accent-rgb), 0.15);

/* ============================================
   SEMANTIC / STATUS TOKENS
   ============================================ */
--color-success:       #22C55E;
--color-success-muted: rgba(34,197,94,0.12);
--color-warning:       #F59E0B;
--color-warning-muted: rgba(245,158,11,0.12);
--color-error:         #F87171;
--color-error-muted:   rgba(248,113,113,0.12);
--color-info:          #38BDF8;
--color-info-muted:    rgba(56,189,248,0.12);

/* ============================================
   TYPOGRAPHY
   ============================================ */
--font-display: 'Clash Display', 'DM Sans', sans-serif;
--font-body:    'DM Sans', sans-serif;
--font-mono:    'JetBrains Mono', monospace;

/* Load via @import in index.css:
   https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap
   https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap
   https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap */
```

### Elevation System

```css
/* Solid elevated — Admin/Super Admin panels */
.surface-raised {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-default);
  box-shadow: 0 1px 3px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3);
}

/* Glass — Student Portal, public pages */
.surface-glass {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(24px) saturate(160%);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04),
              0 24px 64px rgba(0,0,0,0.6);
}

/* Accent glow — active cards, highlighted states */
.surface-accent-glow {
  box-shadow: var(--tier-glow, var(--sa-glow));
}
```

### Component Specs

**Buttons**
```
Primary:     bg-[--accent] text-black font-semibold rounded-md px-4 py-2 hover:-translate-y-[1px] transition-all duration-150
Secondary:   border border-[--border-default] text-white rounded-md hover:bg-[--surface-interactive]
Ghost:       text-[--text-muted] hover:text-white hover:bg-[--surface-interactive]
Destructive: border border-[--error]/30 text-[--error] hover:bg-[--error-muted]
Loading:     Spinner replaces label, disabled pointer-events
```

**Inputs**
```
Base:    bg-[--surface-overlay] border border-[--border-default] rounded-md px-3 py-2.5 text-sm
Focus:   border-[--accent] ring-2 ring-[--accent]/20 outline-none
Error:   border-[--error] ring-2 ring-[--error]/20
Label:   text-xs font-medium text-[--text-muted] mb-1.5 block (top label, not floating)
Helper:  text-xs text-[--text-muted] mt-1
```

**Stat Cards (Dashboard)**
```
Large mono-font number (--font-mono, text-3xl font-bold)
Label: text-xs uppercase tracking-widest text-[--text-muted]
Left border: 3px solid var(--accent) with matching glow
Optional sparkline (recharts) in bottom-right
Delta badge: ↑ 12% in green or ↓ 3% in red
```

**Status Badges**
```
pending:   bg-[--warning-muted]  text-[--warning]  border border-[--warning]/20
active:    bg-[--success-muted]  text-[--success]  border border-[--success]/20
suspended: bg-[--error-muted]    text-[--error]    border border-[--error]/20
rejected:  bg-[--surface-overlay] text-[--text-muted]
trial:     bg-[--info-muted]     text-[--info]     border border-[--info]/20
```

### Card Design Templates

| ID | Name | Visual Description | Font |
|---|---|---|---|
| `tmpl_midnight` | **Midnight Gloss** | Deep `#0D0821` to `#1A0A3D` gradient, holographic shimmer layer on hover (CSS `conic-gradient` overlay), frosted name plate at bottom | Clash Display + DM Sans |
| `tmpl_varsity` | **Classic Varsity** | Org brand color solid fill, cream/gold accent lines, institutional crest watermark (10% opacity), subtle emboss texture via SVG filter | Playfair Display + Source Sans 3 |
| `tmpl_arc` | **Arc Minimal** | `#F8F8F6` white base, single thin-line geometric border, student name in bold condensed mono, colored stripe top-left using org brand | DM Mono + DM Sans |
| `tmpl_aurora` | **Aurora Gradient** | Animated CSS `@keyframes` aurora background (teal-to-violet mesh gradient), glassmorphism name plate, subtle noise texture overlay | Space Grotesk + DM Sans |

### Motion Language

```
Page transitions:    fade + translateY(10px → 0), 280ms ease-out
Card 3D rotation:    CSS perspective(1200px) rotateY, Framer Motion spring {stiffness:260, damping:28}
Modal enter:         scale(0.97→1) + fade, 180ms ease-out
Stat count-up:       Framer Motion useMotionValue on viewport enter, 1.4s ease-out
Skeleton shimmer:    background-position sweep from left, 1.6s infinite — NO opacity pulse
Toast:               slide-in from top-right, auto-dismiss 4s with progress bar
Table row hover:     background transition 80ms — instant feel
Approval badge:      subtle pulse ring on 'pending' status (attention without alarm)
```

---

## 6. DATABASE SCHEMA (MySQL 8 via Sequelize)

> **Soft Delete Convention:** Every table includes `is_active TINYINT(1) NOT NULL DEFAULT 1`.
> All Sequelize models define a `defaultScope: { where: { is_active: 1 } }`.
> "Deleting" any record sets `is_active = 0`. No `DELETE` statements are ever issued by the application.
> Super Admin can view `is_active = 0` records in the Trash view and either restore (`is_active → 1`) or trigger a permanent Cloudinary + DB purge.

---

### `super_admins`
```sql
id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
email             VARCHAR(255) NOT NULL UNIQUE,
current_otp_hash  VARCHAR(255),
otp_expires_at    DATETIME,
last_login_at     DATETIME,
last_login_ip     VARCHAR(45),
is_active         TINYINT(1) NOT NULL DEFAULT 1,
created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at        DATETIME ON UPDATE CURRENT_TIMESTAMP
```

---

### `organizations`
```sql
id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
name                  VARCHAR(255) NOT NULL,
slug                  VARCHAR(100) NOT NULL UNIQUE,
type                  ENUM('university','school','student_group','corporate') NOT NULL,

/* Registration & Approval */
contact_name          VARCHAR(255) NOT NULL,
contact_email         VARCHAR(255) NOT NULL UNIQUE,
contact_phone         VARCHAR(20),
institution_website   VARCHAR(512),
registration_reason   TEXT,                    -- "Why are you applying?" field
email_verified        TINYINT(1) DEFAULT 0,    -- Set to 1 after OTP verification
email_verified_at     DATETIME,
status                ENUM('pending','active','suspended','rejected','trial') DEFAULT 'pending',
rejection_reason      TEXT,                    -- Filled by Super Admin on rejection
approved_by           INT UNSIGNED,            -- super_admins.id FK
approved_at           DATETIME,
password_set          TINYINT(1) DEFAULT 0,    -- Whether admin has set their password post-approval

/* Branding */
selected_card_template VARCHAR(50) DEFAULT 'tmpl_midnight',
brand_color           VARCHAR(7) DEFAULT '#6366F1',
brand_color_rgb       VARCHAR(20),
logo_url              VARCHAR(512),
logo_public_id        VARCHAR(255),
custom_domain         VARCHAR(255),            -- Future white-label domain

/* Billing (Razorpay) */
razorpay_customer_id        VARCHAR(100),
razorpay_subscription_id    VARCHAR(100),
plan                        ENUM('trial','starter','growth','enterprise') DEFAULT 'trial',
trial_ends_at               DATETIME,
billing_cycle_anchor        DATETIME,

/* Limits & Usage */
card_quota            INT UNSIGNED DEFAULT 100,
storage_limit_gb      DECIMAL(6,2) DEFAULT 2.00,
storage_used_gb       DECIMAL(10,4) DEFAULT 0.0000,

is_active             TINYINT(1) NOT NULL DEFAULT 1,
created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at            DATETIME ON UPDATE CURRENT_TIMESTAMP,

FOREIGN KEY (approved_by) REFERENCES super_admins(id) ON DELETE SET NULL
```

---

### `admins`
```sql
id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
organization_id   INT UNSIGNED NOT NULL,
name              VARCHAR(255) NOT NULL,
email             VARCHAR(255) NOT NULL UNIQUE,
password_hash     VARCHAR(255),               -- NULL until set via onboarding link
role              ENUM('owner','co_admin') DEFAULT 'owner',
onboarding_token  VARCHAR(255),               -- One-time token for password setup link
onboarding_token_expires_at DATETIME,
last_login_at     DATETIME,
last_login_ip     VARCHAR(45),
is_active         TINYINT(1) NOT NULL DEFAULT 1,
created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at        DATETIME ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
```

---

### `users` (Students / Alumni)
```sql
id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
organization_id   INT UNSIGNED NOT NULL,
name              VARCHAR(255) NOT NULL,
email             VARCHAR(255) NOT NULL,
password_hash     VARCHAR(255),
roll_number       VARCHAR(100),
branch            VARCHAR(150),
batch_year        YEAR,
avatar_url        VARCHAR(512),
avatar_public_id  VARCHAR(255),
linkedin_url      VARCHAR(512),
instagram_url     VARCHAR(512),
bio               VARCHAR(300),
role              ENUM('student','alumni') DEFAULT 'student',
last_login_at     DATETIME,
is_active         TINYINT(1) NOT NULL DEFAULT 1,
created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at        DATETIME ON UPDATE CURRENT_TIMESTAMP,
UNIQUE KEY uq_user_org_email (organization_id, email),
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
```

---

### `cards`
```sql
id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id              INT UNSIGNED NOT NULL UNIQUE,
qr_hash              VARCHAR(64) NOT NULL UNIQUE,
qr_signed_token      VARCHAR(512),
template_id          VARCHAR(50) NOT NULL DEFAULT 'tmpl_midnight',
front_data_json      JSON NOT NULL,            -- {name, roll, branch, batch, tagline, org_name, org_logo}
back_image_url       VARCHAR(512),             -- Class group photo (Cloudinary)
back_image_public_id VARCHAR(255),
card_download_url    VARCHAR(512),             -- Cached hi-res PNG (Cloudinary)
card_download_public_id VARCHAR(255),
share_slug           VARCHAR(32) UNIQUE,       -- /card/:share_slug public URL
share_enabled        TINYINT(1) DEFAULT 1,     -- Student can make card private
scan_count           INT UNSIGNED DEFAULT 0,
last_scanned_at      DATETIME,
is_active            TINYINT(1) NOT NULL DEFAULT 1,
created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at           DATETIME ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

---

### `memories`
```sql
id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
organization_id  INT UNSIGNED NOT NULL,
uploaded_by      INT UNSIGNED NOT NULL,
media_type       ENUM('photo','video') NOT NULL,
cloudinary_url   VARCHAR(512) NOT NULL,
public_id        VARCHAR(255) NOT NULL,
thumbnail_url    VARCHAR(512),
width            SMALLINT UNSIGNED,
height           SMALLINT UNSIGNED,
duration_sec     SMALLINT UNSIGNED,
file_size_mb     DECIMAL(8,3),
caption          VARCHAR(500),
is_flagged       TINYINT(1) DEFAULT 0,
is_active        TINYINT(1) NOT NULL DEFAULT 1,
created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at       DATETIME ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (organization_id) REFERENCES organizations(id),
FOREIGN KEY (uploaded_by) REFERENCES users(id)
```

---

### `memory_reactions`
```sql
id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
memory_id  INT UNSIGNED NOT NULL,
user_id    INT UNSIGNED NOT NULL,
emoji      ENUM('❤️','🔥','😂','😮','😢') NOT NULL,
is_active  TINYINT(1) NOT NULL DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
UNIQUE KEY uq_reaction (memory_id, user_id, emoji),
FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

---

### `notifications`
```sql
id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
user_id    INT UNSIGNED NOT NULL,
type       ENUM('new_memory','announcement','magic_link','approval','system') NOT NULL,
title      VARCHAR(255) NOT NULL,
body       TEXT,
action_url VARCHAR(512),
is_read    TINYINT(1) DEFAULT 0,
is_active  TINYINT(1) NOT NULL DEFAULT 1,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

---

### `organization_registrations` (Immutable registration audit record)
```sql
id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
organization_id    INT UNSIGNED,               -- FK set after org record created
contact_email      VARCHAR(255) NOT NULL,
contact_name       VARCHAR(255) NOT NULL,
institution_name   VARCHAR(255) NOT NULL,
submitted_data_json JSON NOT NULL,             -- Full form snapshot at time of submission
email_verified     TINYINT(1) DEFAULT 0,
otp_hash           VARCHAR(255),
otp_expires_at     DATETIME,
status             ENUM('email_pending','pending','approved','rejected') DEFAULT 'email_pending',
super_admin_note   TEXT,
ip_address         VARCHAR(45),
user_agent         TEXT,
is_active          TINYINT(1) NOT NULL DEFAULT 1,
created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at         DATETIME ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
```

---

### `payments` (Razorpay transaction log)
```sql
id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
organization_id          INT UNSIGNED NOT NULL,
razorpay_payment_id      VARCHAR(100) UNIQUE,
razorpay_subscription_id VARCHAR(100),
razorpay_order_id        VARCHAR(100),
amount_paise             INT UNSIGNED NOT NULL,  -- Amount in paise (₹1 = 100 paise)
currency                 VARCHAR(3) DEFAULT 'INR',
status                   ENUM('created','captured','failed','refunded') NOT NULL,
plan                     VARCHAR(50),
payment_method           VARCHAR(50),            -- upi, card, netbanking, wallet
invoice_url              VARCHAR(512),
is_active                TINYINT(1) NOT NULL DEFAULT 1,
created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (organization_id) REFERENCES organizations(id)
```

---

### `audit_logs`
```sql
id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
actor_type   ENUM('super_admin','admin','user','system') NOT NULL,
actor_id     INT UNSIGNED,
action       VARCHAR(100) NOT NULL,
target_type  VARCHAR(50),
target_id    INT UNSIGNED,
ip_address   VARCHAR(45),
user_agent   TEXT,
metadata     JSON,
is_active    TINYINT(1) NOT NULL DEFAULT 1,
created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
INDEX idx_actor (actor_type, actor_id),
INDEX idx_action (action),
INDEX idx_created (created_at)
```

---

### `card_scan_events`
```sql
id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
card_id     INT UNSIGNED NOT NULL,
ip_address  VARCHAR(45),
user_agent  TEXT,
country     VARCHAR(50),
is_active   TINYINT(1) NOT NULL DEFAULT 1,
scanned_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
```

---

## 7. PAYMENT INTEGRATION — RAZORPAY (India Standard)

Razorpay is the correct choice for India: supports UPI, NEFT/IMPS, all major cards, netbanking, Paytm, PhonePe, and provides a clean Subscriptions API. It is the most widely used payment gateway for Indian SaaS.

### Subscription Plans (INR, billed monthly)

| Plan | Price/month | Card Quota | Storage | Co-Admins |
|---|---|---|---|---|
| **Trial** | ₹0 (30 days) | 50 cards | 1 GB | 0 |
| **Starter** | ₹1,999 | 200 cards | 5 GB | 1 |
| **Growth** | ₹4,999 | 750 cards | 20 GB | 3 |
| **Enterprise** | Custom (manual) | Unlimited | Custom | Unlimited |

### Razorpay Integration Flow

```
1. Admin clicks "Upgrade Plan" in dashboard.
2. Frontend calls POST /api/billing/create-subscription { plan_id }.
3. Backend calls Razorpay Subscriptions API → gets subscription_id.
4. Frontend opens Razorpay Checkout (hosted JS SDK) with subscription_id.
5. User pays via UPI/card/netbanking.
6. Razorpay webhook → POST /api/billing/webhook (verified with X-Razorpay-Signature HMAC).
7. Webhook handler: update organization.plan, organization.card_quota, organization.storage_limit_gb.
8. Log to payments table.
9. Send confirmation email to admin.
```

### Webhook Events to Handle
```
subscription.activated   → activate plan, update limits
subscription.charged     → log payment, send receipt
subscription.cancelled   → downgrade to trial
payment.failed           → notify admin, retry instructions
refund.created           → log refund, update payment record
```

### Security
- Verify every webhook with `razorpay.webhooks.verify(body, signature, secret)`.
- Store `razorpay_payment_id` UNIQUE to prevent duplicate processing.
- Webhook endpoint is NOT behind JWT auth — uses Razorpay signature verification instead.

---

## 8. INSTITUTION REGISTRATION FLOW (Detailed)

### Public Registration Form — `/register`

**Fields:**
```
Institution Name*       VARCHAR(255)
Institution Type*       SELECT: university / school / student_group / corporate
Institution Website     URL (optional, used for domain validation hint)
Contact Person Name*    VARCHAR(255)
Contact Email*          VARCHAR(255) — validated + temp mail blocked
Contact Phone*          VARCHAR(20) — Indian format validation (+91 or 10-digit)
Reason for Applying*    TEXTAREA — "Describe your batch/cohort and use case" (min 50 chars)
Cloudflare Turnstile*   Widget — blocks automated submissions
```

**Step 1 — Email Verification (before form submission):**
1. User fills the Contact Email field → clicks **"Send Verification Code"**.
2. Backend: checks email against disposable mail blocklist (`disposable-email-domains` + custom blocklist). If blocked → return `400: "Disposable or temporary email addresses are not allowed."`.
3. If valid: generate 6-digit numeric OTP, store hash + TTL (15 min) in Redis key `reg_otp:{email}`, send OTP email.
4. OTP input appears below email field (6 boxes, auto-focus next on input).
5. On correct OTP: mark email as verified in session, show green checkmark, unlock **Submit** button.
6. Rate limit: 3 OTP requests per email per hour; 5 verify attempts per OTP.

**Step 2 — Form Submission:**
1. All fields validated server-side (express-validator).
2. Cloudflare Turnstile token verified server-side against Cloudflare API.
3. Email verified flag checked in Redis.
4. Create `organization_registrations` record (`status: 'pending'`).
5. Create `organizations` record (`status: 'pending'`, `email_verified: 1`).
6. Emit audit log: `action: 'ORG_REGISTRATION_SUBMITTED'`.
7. Send email to contact: "We've received your application. You'll hear from us within 48 hours."
8. Send email to Super Admin: "New registration pending: [Institution Name] — Review in panel."
9. Show success screen: "Application submitted! Check your email for confirmation."

### Super Admin — Approval Panel

**Pending Registration Card shows:**
- Institution name, type, website
- Contact name, email (verified ✓), phone
- Reason for applying
- Submitted at timestamp, IP address
- **[Approve]** button (green) | **[Reject]** button (red) with required reason text field

**On Approve:**
1. `organizations.status → 'active'`
2. Create `admins` record for the contact person (no password yet).
3. Generate `onboarding_token` (32-char crypto random), set `onboarding_token_expires_at = now + 72 hours`.
4. Send approval email with onboarding link: `https://app.domain.com/admin/setup-password?token={token}`.
5. Audit log: `action: 'ORG_APPROVED', actor: super_admin.id, target: org.id`.

**On Reject:**
1. `organizations.status → 'rejected'`
2. `organization_registrations.super_admin_note = rejection_reason`
3. Send rejection email to contact with the reason and an invitation to re-apply if they address the issue.
4. Audit log: `action: 'ORG_REJECTED'`.

### Temp Mail Blocking

```javascript
// middleware/blockTempMail.js
const disposableDomains = require('disposable-email-domains'); // npm package — 50k+ domains

const CUSTOM_BLOCKLIST = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
  'sharklasers.com', 'spam4.me', 'yopmail.com', 'trashmail.com',
  'maildrop.cc', 'dispostable.com', 'fakeinbox.com', '10minutemail.com',
  // Add more as discovered
];

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return disposableDomains.includes(domain) || CUSTOM_BLOCKLIST.includes(domain);
}

module.exports = { isDisposableEmail };
```

### Cloudflare Turnstile Integration

```javascript
// Server-side Turnstile verification
async function verifyTurnstile(token, ip) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success === true;
}
// If verifyTurnstile returns false → return 400 "Bot verification failed."
// Future: When Cloudflare WAF is added to the domain, Turnstile integrates natively
// and provides an additional layer without any code changes.
```

---

## 9. SECURITY ARCHITECTURE

### OTP Security (Super Admin)
```javascript
// 15-char OTP: alphanumeric + special symbols, cryptographically random
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
function generateSecureOTP(length = 15) {
  const bytes = require('crypto').randomBytes(length * 2);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += CHARSET[bytes[i] % CHARSET.length];
  }
  return otp; // Hash with bcrypt(rounds:12), store hash, discard raw value
}
// Redis key: super_admin_otp:{email} → TTL 600s, deleted on first successful verify
// Max 3 OTP requests per 15 min; max 5 verify attempts per OTP before lock
```

### JWT Scoping
```javascript
// Super Admin JWT
{ sub: sa.id, role: 'super_admin', jti: uuid(), iat, exp: now + 2h }
// jti stored in Redis for revocation on logout

// Admin JWT
{ sub: admin.id, role: 'admin', org: admin.organization_id, org_role: admin.role, iat, exp: now + 8h }

// User JWT
{ sub: user.id, role: 'user', org: user.organization_id, iat, exp: now + 24h }
```

### Rate Limiting (express-rate-limit + Redis store)
```
POST /api/register/send-otp          →  3  req / 60 min / IP
POST /api/register/verify-otp        →  5  req / 15 min / IP
POST /api/register/submit            →  5  req / 60 min / IP
POST /api/super-admin/request-otp    →  3  req / 15 min / IP
POST /api/super-admin/verify-otp     →  5  req / 15 min / IP
POST /api/admin/login                →  10 req / 15 min / IP
POST /api/user/magic-link            →  5  req / 15 min / email
POST /api/memories/upload            →  20 req / 60 min / user
POST /api/billing/webhook            →  No rate limit (Razorpay IPs only, verified by signature)
```

### Additional Hardening
- `helmet()` with strict CSP, HSTS, X-Frame-Options.
- All user input validated via `express-validator` chains — never trusted raw.
- Sequelize parameterized queries only — no raw SQL string interpolation.
- CORS: allowlist of frontend origins only.
- MIME type validated server-side on uploads (magic bytes check, not just extension).
- `is_active = 1` appended to all Sequelize `defaultScope`s — soft-deleted records never leak.
- Razorpay webhook signature verified before processing.
- Cloudflare Turnstile on all public forms.

---

## 10. BACKEND FILE STRUCTURE

```
backend/
├── server.js
├── package.json
├── .env.example
├── config/
│   ├── database.js          # Sequelize pool config
│   ├── cloudinary.js        # Cloudinary SDK v2
│   ├── redis.js             # Upstash Redis REST client
│   ├── mailer.js            # Nodemailer cPanel SMTP
│   └── razorpay.js          # Razorpay SDK init
├── models/
│   ├── index.js
│   ├── SuperAdmin.js        # defaultScope: { where: { is_active: 1 } }
│   ├── Organization.js
│   ├── OrgRegistration.js
│   ├── Admin.js
│   ├── User.js
│   ├── Card.js
│   ├── Memory.js
│   ├── MemoryReaction.js
│   ├── Notification.js
│   ├── Payment.js
│   ├── AuditLog.js
│   └── CardScanEvent.js
├── middleware/
│   ├── auth.js              # verifySuperAdminJWT, verifyAdminJWT, verifyUserJWT
│   ├── rateLimiter.js
│   ├── blockTempMail.js     # Disposable email check
│   ├── turnstile.js         # Cloudflare Turnstile verify
│   ├── auditLogger.js       # Wraps controllers to auto-log
│   └── validate.js          # express-validator chains per route
├── routes/
│   ├── registration.js      # Public: send-otp, verify-otp, submit
│   ├── superAdminAuth.js
│   ├── superAdminDashboard.js
│   ├── adminAuth.js         # login, setup-password (onboarding token)
│   ├── adminDashboard.js
│   ├── userAuth.js          # magic-link, qr-login, login
│   ├── cards.js
│   ├── memories.js
│   ├── reactions.js
│   ├── notifications.js
│   ├── profile.js
│   └── billing.js           # Razorpay: create-subscription, webhook
├── controllers/
│   ├── registration.js      # Full self-serve registration logic
│   ├── superAdminAuth.js
│   ├── superAdminApproval.js # approve/reject org registration
│   ├── adminAuth.js
│   ├── userAuth.js
│   ├── upload.js            # Multer → Cloudinary stream + storage limit enforcement
│   ├── csv.js               # CSV parse, validate, bulkCreate, error report
│   ├── qrBatch.js           # QR generation + PDF batch
│   ├── billing.js           # Razorpay subscription creation + webhook handler
│   ├── cardDownload.js      # Puppeteer card render → Cloudinary
│   └── analytics.js
└── utils/
    ├── otpGenerator.js      # Crypto-secure OTPs (15-char admin, 6-digit reg)
    ├── jwtFactory.js
    ├── emailTemplates.js    # HTML email templates (approval, rejection, magic link, etc.)
    ├── cloudinaryHelpers.js # Stream upload, delete by public_id, usage query
    ├── razorpayHelpers.js   # Signature verify, plan→limits mapper
    ├── disposableDomains.js # blockTempMail logic
    └── pagination.js        # Cursor-based pagination
```

---

## 11. API ROUTE MAP

```
/* === PUBLIC (no auth) === */
POST   /api/register/send-otp           Send email verification OTP (temp mail blocked + Turnstile)
POST   /api/register/verify-otp         Verify email OTP → mark email as verified in Redis
POST   /api/register/submit             Submit institution registration form
GET    /api/cards/share/:slug           Public card share page data (OG tags rendered server-side)

/* === SUPER ADMIN === */
POST   /api/super-admin/request-otp     Generate + email OTP
POST   /api/super-admin/verify-otp      Verify OTP → Super Admin JWT
GET    /api/super-admin/stats           Platform global stats
GET    /api/super-admin/registrations   All pending/all registrations
PATCH  /api/super-admin/registrations/:id/approve   Approve → create admin + send onboarding email
PATCH  /api/super-admin/registrations/:id/reject    Reject → send email with reason
GET    /api/super-admin/organizations   All orgs with filters
PATCH  /api/super-admin/organizations/:id           Update quota / status / plan
GET    /api/super-admin/audit-logs      Filterable audit log
GET    /api/super-admin/trash           All is_active=0 records (by table param)
PATCH  /api/super-admin/trash/restore   Restore soft-deleted record
DELETE /api/super-admin/trash/purge     PERMANENT purge (Cloudinary + DB row delete)
GET    /api/super-admin/storage         Per-org Cloudinary usage

/* === ADMIN === */
POST   /api/admin/setup-password        Set password using onboarding token (first login)
POST   /api/admin/login                 Email + password login
GET    /api/admin/cohort                List cohort users with pagination
POST   /api/admin/cohort/import-csv     Bulk import + validation error report
POST   /api/admin/cohort/send-magic-links  Bulk magic link dispatch
GET    /api/admin/cohort/qr-batch       Download QR batch PDF
PATCH  /api/admin/settings              Update org branding, template, colors
GET    /api/admin/analytics             Cohort analytics
GET    /api/admin/memories              Cohort memory feed (admin view)
PATCH  /api/admin/memories/:id/flag     Flag memory
DELETE /api/admin/memories/:id          Soft-delete memory (is_active → 0)
POST   /api/admin/announce              Bulk announcement email to cohort
POST   /api/admin/co-admins/invite      Invite co-admin by email

/* === USER === */
POST   /api/user/magic-link             Request magic link (rate limited per email)
GET    /api/user/qr-login/:qr_hash      QR/NFC scan login → JWT
POST   /api/user/login                  Direct email + password login
GET    /api/cards/mine                  Own card data + scan count
GET    /api/memories                    Cursor-paginated cohort memory feed
POST   /api/memories/upload             Upload photo/video (storage limit enforced)
DELETE /api/memories/:id                Soft-delete own memory
POST   /api/memories/:id/reactions      Add emoji reaction
DELETE /api/memories/:id/reactions/:emoji  Remove reaction
GET    /api/notifications               Get notifications
PATCH  /api/notifications/read          Mark as read
PATCH  /api/user/profile                Update profile, avatar
GET    /api/user/card/download          Trigger/retrieve hi-res card download URL

/* === BILLING === */
POST   /api/billing/create-subscription  Admin creates Razorpay subscription
POST   /api/billing/webhook              Razorpay webhook (signature-verified, no JWT)
GET    /api/billing/invoices             Admin: list payment history
```

---

## 12. FRONTEND STRUCTURE

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts       # v4: @import "tailwindcss" in CSS, minimal config needed
├── src/
│   ├── main.tsx
│   ├── App.tsx                          # React Router v6, lazy routes
│   ├── design-system/
│   │   ├── tokens.css                   # All CSS custom properties (Section 5)
│   │   └── components/
│   │       ├── Button.tsx
│   │       ├── Input.tsx  (+ OtpInput.tsx — 6-box segmented OTP input)
│   │       ├── Modal.tsx
│   │       ├── Table.tsx  (sortable, filterable)
│   │       ├── StatCard.tsx
│   │       ├── Badge.tsx  (status badges)
│   │       ├── Toast.tsx
│   │       └── Skeleton.tsx
│   ├── pages/
│   │   ├── InstitutionRegister.tsx      # Public self-serve registration form
│   │   ├── SuperAdminLogin.tsx          # OTP auth portal
│   │   ├── SuperAdminDashboard.tsx      # Full platform management
│   │   ├── AdminSetupPassword.tsx       # First-login password setup via token
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx           # Cohort management hub
│   │   ├── StudentPortal.tsx            # Main student experience
│   │   └── PublicCardShare.tsx          # Public /card/:slug page
│   ├── components/
│   │   ├── CardViewer.tsx               # 3D interactive card
│   │   ├── MemoryWall.tsx               # Infinite scroll masonry grid
│   │   ├── MemoryUploader.tsx           # Drag & drop with progress
│   │   ├── MemoryLightbox.tsx           # Full-screen viewer + reactions
│   │   ├── NotificationBell.tsx         # Bell icon + dropdown panel
│   │   ├── CsvImporter.tsx              # Upload + validation error table
│   │   ├── QrBatchDownload.tsx
│   │   ├── OrgThemeProvider.tsx         # Injects --org-brand-color CSS var
│   │   ├── AuditLogTable.tsx
│   │   ├── RegistrationQueue.tsx        # Super Admin: approve/reject cards
│   │   ├── PlanSelector.tsx             # Razorpay plan upgrade modal
│   │   └── TurnstileWidget.tsx          # Cloudflare Turnstile wrapper
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMemories.ts               # Cursor pagination
│   │   ├── useNotifications.ts          # 30s polling + mark read
│   │   └── useUpload.ts                 # Cloudinary upload progress
│   ├── store/
│   │   └── authStore.ts                 # Zustand
│   └── utils/
│       ├── api.ts                       # Axios + JWT interceptor
│       └── formatters.ts
```

---

## 13. KEY COMPONENT IMPLEMENTATION NOTES

### `CardViewer.tsx` — 3D Card

```tsx
// Pure CSS 3D, no Three.js.
// Outer: perspective(1200px), cursor grab
// Inner: transform-style: preserve-3d, Framer Motion rotateY spring
// Front face: card template background + student data overlay
// Back face: rotateY(180deg) + class group photo
// Drag: mousedown captures startX, mousemove computes deltaX → rotation
// Release: snap to nearest 0° or 180° with spring {stiffness:260, damping:28}
// tmpl_midnight: CSS conic-gradient shimmer overlay that follows mouse (mousemove → custom property --mouse-x --mouse-y)
// Mobile: touch events (touchstart, touchmove, touchend)
```

### `OtpInput.tsx` — 6-Box Segmented OTP

```tsx
// 6 individual <input maxLength={1}> boxes in a flex row
// On input: auto-focus next box
// On backspace: focus previous box
// On paste: spread characters across boxes
// Assembled value passed to parent via onChange(fullOtp)
// Styling: monospace font, large text, accent border on focus, success color when all filled
```

### `RegistrationQueue.tsx` — Super Admin Approval

```tsx
// List of pending registrations as expandable cards
// Each card: institution name, type, contact, reason, submitted time, IP
// Pulsing ring on status badge for pending
// [Approve] → confirm modal → API call → card moves to 'approved' list
// [Reject] → modal with required textarea → API call → card moves to 'rejected' list
// Approved/rejected items collapsible into archived section
```

### `PlanSelector.tsx` — Razorpay Upgrade

```tsx
// 3-column plan card layout (Starter / Growth / Enterprise)
// Current plan highlighted with accent border
// On select paid plan: call /api/billing/create-subscription
// On response: open Razorpay Checkout (window.Razorpay from CDN script)
// On payment success callback: poll /api/admin/settings to confirm plan updated
// Enterprise: "Contact Us" CTA (mailto or embedded Calendly link)
```

---

## 14. EXECUTION: CODE GENERATION PHASE

**Agent, generate actual, complete code for EVERY file listed below. No truncation. No `// ... rest of code`. No placeholders. No skipping. Every single file gets a full implementation.**

---

### A. PROJECT SCAFFOLDING

1. `backend/package.json` — All dependencies: express, sequelize, mysql2, jsonwebtoken, bcryptjs, multer, cloudinary, nodemailer, razorpay, @upstash/redis, csv-parse, helmet, express-rate-limit, express-validator, winston, morgan, dotenv, envalid, disposable-email-domains, uuid, qrcode, pdfkit, cors, cookie-parser
2. `frontend/package.json` — All dependencies: react, react-dom, react-router-dom, framer-motion, axios, zustand, @cloudinary/react, @cloudinary/url-gen, recharts, react-intersection-observer, react-dropzone, lucide-react
3. `backend/.env.example` — All required environment variables: DB creds, JWT secrets (separate per tier), Cloudinary, Upstash Redis URL + token, Nodemailer SMTP, Razorpay key + secret + webhook secret, Cloudflare Turnstile secret, App base URL, Node env
4. `frontend/.env.example` — VITE_ prefixed: API base URL, Cloudflare Turnstile site key, Razorpay key ID
5. `vite.config.ts` — Vite config with React plugin, path aliases (`@/` → `src/`), proxy for `/api` in dev
6. `frontend/src/index.css` — Tailwind v4 `@import "tailwindcss"`, `@theme` block registering all CSS custom property tokens from Section 5, Google Font imports, base resets

---

### B. BACKEND CONFIG

7. `backend/config/database.js` — Sequelize instance: MySQL2 dialect, connection pool (max:10, min:2, acquire:30000, idle:10000), timezone UTC, logging via winston in dev only
8. `backend/config/cloudinary.js` — Cloudinary SDK v2 init with `cloud_name`, `api_key`, `api_secret` from env. Export configured instance.
9. `backend/config/redis.js` — Upstash Redis client via `@upstash/redis`. Export `get`, `set`, `del`, `exists` wrappers with error handling.
10. `backend/config/mailer.js` — Nodemailer createTransport with cPanel SMTP (host, port 465/587, secure, auth). Export `sendMail(to, subject, html)` wrapper.
11. `backend/config/razorpay.js` — Razorpay SDK init. Export instance + `PLANS` map: `{ starter: { plan_id, card_quota, storage_limit_gb }, growth: {...}, enterprise: {...} }`.

---

### C. SEQUELIZE MODELS (all with `defaultScope: { where: { is_active: 1 } }` and `paranoid`-style soft delete via `is_active`)

12. `backend/models/index.js` — Load all models, set up associations, export
13. `backend/models/SuperAdmin.js` — Fields per schema. Instance method: `isOtpValid(raw)` using bcrypt compare.
14. `backend/models/Organization.js` — Fields per schema. Hook: `beforeUpdate` → recompute `brand_color_rgb` when `brand_color` changes.
15. `backend/models/OrgRegistration.js` — Fields per schema. Static method: `findPending()`.
16. `backend/models/Admin.js` — Fields per schema. Hook: `beforeCreate` → hash password if provided. Instance method: `validatePassword(raw)`.
17. `backend/models/User.js` — Fields per schema. Hook: `beforeCreate/beforeUpdate` → hash password if changed. Instance method: `validatePassword(raw)`. Association: `belongsTo Organization`, `hasOne Card`, `hasMany Memory`, `hasMany Notification`.
18. `backend/models/Card.js` — Fields per schema. Hook: `beforeCreate` → generate `share_slug` (8-char nanoid). Association: `belongsTo User`.
19. `backend/models/Memory.js` — Fields per schema. Association: `belongsTo Organization`, `belongsTo User (as uploader)`, `hasMany MemoryReaction`.
20. `backend/models/MemoryReaction.js` — Fields per schema. Association: `belongsTo Memory`, `belongsTo User`.
21. `backend/models/Notification.js` — Fields per schema. Association: `belongsTo User`.
22. `backend/models/Payment.js` — Fields per schema. Association: `belongsTo Organization`.
23. `backend/models/AuditLog.js` — Fields per schema. No `defaultScope` filter on `is_active` for this table — audit logs are never soft-deleted by the app, only by Super Admin purge.
24. `backend/models/CardScanEvent.js` — Fields per schema.

---

### D. UTILITIES

25. `backend/utils/otpGenerator.js` — Export `generateAdminOTP()` (15-char, alphanumeric + symbols, crypto.randomBytes) and `generateRegOTP()` (6-digit numeric string, crypto.randomInt).
26. `backend/utils/jwtFactory.js` — Export `signSuperAdminToken(id)`, `signAdminToken(admin)`, `signUserToken(user)`, `signMagicLinkToken(userId, orgId)`. Each uses separate JWT secret from env, correct expiry, correct payload shape.
27. `backend/utils/emailTemplates.js` — Export functions returning full HTML strings (inline CSS, responsive, dark-background email-safe): `superAdminOtpEmail(otp)`, `registrationOtpEmail(name, otp)`, `registrationReceivedEmail(name, orgName)`, `superAdminNewRegistrationAlert(orgName, contactName, contactEmail)`, `approvalEmail(name, orgName, onboardingUrl)`, `rejectionEmail(name, orgName, reason)`, `onboardingEmail(name, orgName, setupUrl)`, `magicLinkEmail(name, link)`, `announcementEmail(name, orgName, subject, body)`, `cohortMagicLinkEmail(name, orgName, link)`.
28. `backend/utils/cloudinaryHelpers.js` — Export `uploadStream(buffer, options)` (returns Cloudinary upload result), `deleteAsset(publicId)`, `getUsageReport()` (calls Cloudinary usage API), `generateCardDownloadUrl(publicId)`.
29. `backend/utils/razorpayHelpers.js` — Export `verifyWebhookSignature(body, signature)`, `getPlanLimits(planKey)` → `{ card_quota, storage_limit_gb }`, `formatAmountDisplay(paise)` → `"₹X,XXX"`.
30. `backend/utils/disposableDomains.js` — Import `disposable-email-domains`. Merge with custom blocklist array. Export `isDisposableEmail(email): boolean`.
31. `backend/utils/pagination.js` — Export `cursorPaginate(Model, where, cursor, limit, order)` — returns `{ items, nextCursor, hasMore }`. Cursor is base64-encoded `id`.
32. `backend/utils/qrGenerator.js` — Export `generateQRDataURL(text)` using `qrcode` package → returns base64 PNG data URL. Export `generateQRBatchPDF(users, cards, orgName)` using `pdfkit` → returns a Buffer of a printable A4 PDF with QR codes grid.
33. `backend/utils/auditLog.js` — Export `log(actorType, actorId, action, targetType, targetId, metadata, req)` — writes to `AuditLog` model. Non-blocking (fire and forget, catch errors silently to not block request).

---

### E. MIDDLEWARE

34. `backend/middleware/auth.js` — Export `verifySuperAdminJWT`, `verifyAdminJWT`, `verifyUserJWT`. Each: extract Bearer token, verify with correct secret, check `is_active = 1` on the actor in DB, attach decoded payload to `req.actor`. Return 401 on any failure.
35. `backend/middleware/rateLimiter.js` — Export named limiters for every rate-limited route defined in Section 9 (using `express-rate-limit` with Redis store via `rate-limit-redis`).
36. `backend/middleware/blockTempMail.js` — Export `blockTempMail` middleware: extract email from `req.body.email`, call `isDisposableEmail`, return 400 with clear message if blocked.
37. `backend/middleware/turnstile.js` — Export `verifyTurnstile` middleware: extract `req.body.turnstile_token`, POST to Cloudflare siteverify API, return 400 if not `success: true`.
38. `backend/middleware/validate.js` — Export named validator chains using `express-validator` for: registration form, admin login, profile update, memory upload, OTP submission, CSV upload.
39. `backend/middleware/checkStorageLimit.js` — Export middleware that reads `req.actor.org` → fetches Organization → compares `storage_used_gb < storage_limit_gb`. Returns 429 with "Storage limit reached" if over limit. Attaches `req.org` for use in controller.
40. `backend/middleware/requireOrgActive.js` — Export middleware that checks `organization.status === 'active'` before allowing admin actions. Returns 403 with "Account suspended or not yet approved" if not active.

---

### F. ROUTES + CONTROLLERS (each file is a matched pair)

41. `backend/routes/registration.js` + `backend/controllers/registration.js`
    - `POST /send-otp` — blockTempMail, turnstile, rateLimiter → generate 6-digit OTP, bcrypt hash, Redis TTL, send `registrationOtpEmail`
    - `POST /verify-otp` — rateLimiter → compare OTP hash from Redis, mark `reg_verified:{email}` in Redis (TTL 30min)
    - `POST /submit` — validate, check Redis email verified flag, create OrgRegistration + Organization (status: pending), send emails to contact + super admin, audit log

42. `backend/routes/superAdminAuth.js` + `backend/controllers/superAdminAuth.js`
    - `POST /request-otp` — rateLimiter → find SuperAdmin by email, generate 15-char OTP, bcrypt hash, Redis TTL, send `superAdminOtpEmail`
    - `POST /verify-otp` — rateLimiter → verify hash, issue JWT with jti stored in Redis, update `last_login_at` + `last_login_ip`, audit log

43. `backend/routes/superAdminDashboard.js` + `backend/controllers/superAdminDashboard.js`
    - `GET /stats` — count active orgs, total users, total cards, total memories, platform storage (sum of storage_used_gb), total MRR (sum of active subscription amounts)
    - `GET /registrations` — list all OrgRegistrations with filters (status, date range), pagination
    - `PATCH /registrations/:id/approve` — set org status active, create Admin record (no password), generate onboarding token (72h), send approval + onboarding emails, audit log
    - `PATCH /registrations/:id/reject` — set org status rejected, save rejection reason, send rejection email, audit log
    - `GET /organizations` — paginated list with filters
    - `PATCH /organizations/:id` — update quota, storage limit, status (suspend/reinstate), plan override
    - `GET /audit-logs` — filterable, paginated, CSV export
    - `GET /trash` — list all `is_active = 0` records by table type
    - `PATCH /trash/restore` — set `is_active = 1`
    - `DELETE /trash/purge` — PERMANENT: delete Cloudinary assets by `public_id`, then hard-delete DB row
    - `GET /storage` — per-org storage breakdown from Cloudinary usage API

44. `backend/routes/adminAuth.js` + `backend/controllers/adminAuth.js`
    - `POST /login` — rateLimiter, validate → find Admin by email, validatePassword, requireOrgActive → issue JWT, update `last_login_at`
    - `POST /setup-password` — find Admin by `onboarding_token`, check not expired, hash new password, clear token, set `password_set = 1`, audit log

45. `backend/routes/adminDashboard.js` + `backend/controllers/adminDashboard.js`
    - `GET /cohort` — paginated user list for org, include card status
    - `POST /cohort/import-csv` — multer memoryStorage, csv-parse, validate rows, bulkCreate Users + Cards (with qr_hash, share_slug), return structured `{ total, imported, failed, errors[] }`
    - `POST /cohort/send-magic-links` — find all users without `last_login_at`, generate magic link tokens (Redis TTL 24h), queue emails (50/min rate), return `{ queued: N }`
    - `GET /cohort/qr-batch` — generate QR for each card, pack into PDF via pdfkit, stream response as `application/pdf`
    - `PATCH /settings` — update org name, branding, template, brand_color (recompute RGB), logo upload → Cloudinary stream
    - `GET /analytics` — memory count, storage used %, active users (logged in last 30d), scan count total, daily scan trend (last 14d), top uploaders
    - `GET /memories` — cursor-paginated, includes uploader name, reaction counts, flagged filter
    - `PATCH /memories/:id/flag` — toggle is_flagged
    - `DELETE /memories/:id` — soft delete (is_active → 0), audit log
    - `POST /announce` — validate subject + body, send `announcementEmail` to all org users, create Notification records for each user
    - `POST /co-admins/invite` — validate email, blockTempMail, create Admin record with role co_admin (no password), generate onboarding token, send onboarding email

46. `backend/routes/userAuth.js` + `backend/controllers/userAuth.js`
    - `POST /magic-link` — rateLimiter per email, find User by email + org, generate signed magic link token (Redis TTL 15min, consumed on use), send `magicLinkEmail`
    - `GET /qr-login/:qr_hash` — find Card by qr_hash where is_active=1, check org is active, issue user JWT, increment scan_count, log CardScanEvent (ip, user agent), update last_scanned_at
    - `POST /login` — find User by email + org, validatePassword, issue JWT, update last_login_at
    - `GET /verify-magic-link/:token` — check Redis, find user, issue JWT, delete Redis key

47. `backend/routes/cards.js` + `backend/controllers/cards.js`
    - `GET /mine` — find Card by user_id, include front_data_json, template, back_image_url, scan_count, share_enabled
    - `PATCH /mine/share-toggle` — toggle share_enabled
    - `GET /share/:slug` — public, no auth, find Card by share_slug where share_enabled=1, return card + user public profile (name, branch, batch, org name, org logo) for OG page
    - `POST /mine/download` — check if card_download_url exists and is fresh, if not: render card HTML server-side, upload to Cloudinary as PNG, store url + public_id, return download URL

48. `backend/routes/memories.js` + `backend/controllers/memories.js`
    - `GET /` — cursor-paginated, org-scoped, is_active=1, is_deleted=0, include uploader name + avatar, reaction counts per emoji, viewer's own reactions
    - `POST /upload` — checkStorageLimit, multer memoryStorage (50MB max), MIME check (image/jpeg,image/png,image/webp,video/mp4,video/quicktime), uploadStream to Cloudinary (folder: `org_{id}/memories`), on success: create Memory record, update org.storage_used_gb, create Notification for org users (new_memory type), return memory object
    - `DELETE /:id` — verify uploader === req.actor.sub OR admin, soft delete (is_active → 0), audit log

49. `backend/routes/reactions.js` + `backend/controllers/reactions.js`
    - `POST /:memoryId/reactions` — validate emoji is one of 5 allowed, upsert MemoryReaction (findOrCreate), return updated reaction counts
    - `DELETE /:memoryId/reactions/:emoji` — find + soft delete reaction (is_active → 0)

50. `backend/routes/notifications.js` + `backend/controllers/notifications.js`
    - `GET /` — paginated, user-scoped, is_active=1, unread count in header
    - `PATCH /read` — accept `{ ids: [] }` or `{ all: true }`, set is_read = 1

51. `backend/routes/profile.js` + `backend/controllers/profile.js`
    - `GET /` — return own user profile
    - `PATCH /` — validate fields, update name/bio/linkedin/instagram, if avatar file: uploadStream to Cloudinary (folder: `org_{id}/avatars`), delete old avatar by public_id, update avatar_url + avatar_public_id

52. `backend/routes/billing.js` + `backend/controllers/billing.js`
    - `POST /create-subscription` — verifyAdminJWT, get plan from body, validate, call Razorpay Subscriptions API with plan_id, save razorpay_subscription_id to org, return `{ subscription_id, razorpay_key }` for frontend Checkout
    - `POST /webhook` — NO JWT auth, verify Razorpay signature (raw body required — use `express.raw` for this route only), handle: `subscription.activated` → update plan + limits; `subscription.charged` → create Payment record, send receipt email; `subscription.cancelled` → downgrade to trial; `payment.failed` → notify admin; `refund.created` → update payment
    - `GET /invoices` — verifyAdminJWT, list Payment records for org, formatted

---

### G. FRONTEND PAGES

53. `frontend/src/pages/InstitutionRegister.tsx`
    - Multi-step form (3 steps): Step 1: institution details + contact info; Step 2: email OTP verification (6-box `OtpInput`, send/resend button with 60s countdown); Step 3: review + Cloudflare Turnstile + submit
    - Progress indicator at top (step dots)
    - Field validation inline (react-hook-form + zod)
    - Success state: animated checkmark + "Application submitted" message
    - Framer Motion: step transitions (slide left/right)
    - Design: dark `--color-surface-base` background, indigo accent, clean centered card layout

54. `frontend/src/pages/SuperAdminLogin.tsx`
    - Two-phase UI: Phase 1 — email input + "Request Access Code" button; Phase 2 — 15-char OTP input (single field, monospace) + verify button
    - Framer Motion entrance animation (fade + Y slide)
    - Emerald accent theme (`--sa-accent`)
    - Security note: "This portal is restricted. All access attempts are logged."
    - Loading spinner on both submit actions
    - Error message display (rate limit, invalid OTP, expired)

55. `frontend/src/pages/AdminSetupPassword.tsx`
    - Token extracted from URL query param
    - Verify token validity on mount (API call)
    - Password + confirm password fields with strength indicator
    - On success: redirect to `/admin/login` with success toast
    - Design: indigo theme, centered card

56. `frontend/src/pages/AdminLogin.tsx`
    - Email + password login form
    - "Forgot password" link (future feature placeholder — shows toast "Contact your platform administrator")
    - Design: indigo theme, centered card with org logo if detected via subdomain

57. `frontend/src/pages/SuperAdminDashboard.tsx`
    - Sidebar navigation: Dashboard / Registrations / Organizations / Audit Log / Trash / Settings
    - Dashboard tab: 6 stat cards (active orgs, pending registrations, total users, total cards, total storage, MRR)
    - Registrations tab: `RegistrationQueue` component
    - Organizations tab: searchable/filterable table with per-org actions
    - Audit Log tab: `AuditLogTable` with date + action + actor filters, CSV export button
    - Trash tab: table of soft-deleted records, restore / purge actions
    - All data fetched via Axios with loading + error states
    - Emerald theme

58. `frontend/src/pages/AdminDashboard.tsx`
    - Sidebar navigation: Overview / Students / Memories / Card Design / Analytics / Billing / Settings
    - Overview tab: 5 stat cards (total students, cards generated, memories uploaded, storage used %, active users)
    - Students tab: searchable table, CSV import button → `CsvImporter` modal, "Send Magic Links" button with confirmation
    - Memories tab: grid view of cohort memories, flag/delete actions
    - Card Design tab: template selector (4 cards with preview), brand color picker, logo upload
    - Analytics tab: recharts line charts (scan trend, upload trend), stat breakdowns
    - Billing tab: current plan badge, `PlanSelector` component, invoice history table
    - Settings tab: org name, contact email, co-admin invite
    - Indigo theme

59. `frontend/src/pages/StudentPortal.tsx`
    - Top nav: logo, notification bell, profile avatar dropdown
    - Hero section: `CardViewer` component (3D card, centered)
    - Below card: "Your card has been viewed X times" stat
    - Memory Wall section: `MemoryWall` component
    - Floating action button (bottom right): opens `MemoryUploader` modal
    - Org brand color theme injected via `OrgThemeProvider`

60. `frontend/src/pages/PublicCardShare.tsx`
    - No auth required
    - Fetches card data by `share_slug`
    - Renders card preview (non-interactive, static)
    - Student name, branch, batch, org name displayed
    - "Connect on LinkedIn" button (links to student's LinkedIn if set)
    - OpenGraph meta tags injected via react-helmet-async
    - If `share_enabled = 0`: show "This card is private" message

---

### H. FRONTEND COMPONENTS

61. `frontend/src/components/CardViewer.tsx`
    - Full implementation: perspective container, draggable inner card, front + back faces
    - All 4 templates (`tmpl_midnight`, `tmpl_varsity`, `tmpl_arc`, `tmpl_aurora`) rendered via switch on `template_id`
    - `tmpl_midnight`: CSS conic-gradient shimmer overlay that follows mouse (`--mouse-x`, `--mouse-y` CSS vars updated on mousemove)
    - `tmpl_aurora`: CSS `@keyframes` aurora gradient animation on the card background
    - Touch support (touchstart, touchmove, touchend)
    - Framer Motion spring snap to 0° or 180° on release
    - "Flip" button for mobile users who don't know to drag
    - Front face: org logo (top), student name (large, Clash Display), roll number, branch, batch year
    - Back face: class group photo (back_image_url) with subtle vignette overlay

62. `frontend/src/components/MemoryWall.tsx`
    - CSS columns masonry layout (2 cols mobile, 3 cols tablet, 4 cols desktop)
    - Cursor-based infinite scroll using `react-intersection-observer` sentinel div
    - Skeleton cards during loading (shimmer effect)
    - Each card: thumbnail (photo or video with play icon overlay), uploader name + avatar, caption, emoji reaction bar
    - Click → opens `MemoryLightbox`
    - Empty state: illustrated placeholder with "Be the first to share a memory" CTA

63. `frontend/src/components/MemoryLightbox.tsx`
    - Full-screen overlay (Framer Motion scale + fade)
    - Photo: full-res image centered, pan/pinch zoom on mobile
    - Video: HTML5 `<video>` player with controls, autoplay on open
    - Left/right navigation arrows (keyboard + click)
    - Bottom panel: uploader name + avatar, caption, timestamp, reaction bar
    - Reaction bar: 5 emoji buttons showing counts, click to toggle own reaction (optimistic update)
    - Close: ESC key or X button

64. `frontend/src/components/MemoryUploader.tsx`
    - `react-dropzone` drag zone
    - Accepts: image/jpeg, image/png, image/webp, video/mp4, video/quicktime
    - Max 50MB file size (client-side check before upload)
    - Preview thumbnail after file selection
    - Caption textarea (max 500 chars, counter)
    - Upload progress bar (Axios onUploadProgress)
    - On success: close modal, add new memory to top of wall (optimistic update)
    - Error states: file too large, wrong type, storage limit reached

65. `frontend/src/components/NotificationBell.tsx`
    - Bell icon with unread count badge (red dot if >0)
    - Click: dropdown panel with last 20 notifications
    - Each notification: icon (type-based), title, body snippet, timestamp (relative: "2 min ago")
    - "Mark all as read" button
    - Poll every 30s via `useNotifications` hook
    - Notification row click: navigate to `action_url` if present

66. `frontend/src/components/CsvImporter.tsx`
    - Modal with drag-drop zone for CSV file
    - Shows expected CSV format with downloadable template link
    - On upload: POST to `/api/admin/cohort/import-csv`, show progress
    - Result state: `{ total, imported, failed }` summary card
    - Error table: row number, email, failure reason — scrollable
    - "Close" or "Import Another" actions

67. `frontend/src/components/RegistrationQueue.tsx`
    - List of registration cards with expandable details
    - Pending: pulsing emerald ring on status badge
    - Each card: institution name + type, contact name + email (verified ✓), phone, website, reason, submitted timestamp, IP
    - Approve button → confirmation modal with optional welcome note textarea → API call → toast success → card status updates in-place
    - Reject button → modal with required reason textarea (min 20 chars) → API call → toast → card moves to rejected section
    - Tabs: Pending / Approved / Rejected with counts

68. `frontend/src/components/PlanSelector.tsx`
    - 3-column layout: Starter / Growth / Enterprise
    - Current plan card has accent border + "Current Plan" badge
    - Each plan: price (INR), feature list, card quota, storage, co-admin seats
    - Click on higher plan → confirm modal showing price difference → POST to create-subscription → open Razorpay Checkout JS
    - Razorpay Checkout loaded from CDN script tag in index.html
    - On payment success: show success state, refresh admin settings to confirm plan update
    - Enterprise: "Contact Us" button

69. `frontend/src/components/OrgThemeProvider.tsx`
    - Fetches `organization.brand_color` and `brand_color_rgb` from auth store (embedded in JWT or from `/api/admin/settings`)
    - Injects `--org-brand-color: #HEXVAL` and `--org-brand-color-rgb: R,G,B` into `document.documentElement.style`
    - Wraps `{children}` — used at root of StudentPortal layout

70. `frontend/src/components/AuditLogTable.tsx`
    - Filterable table: date range picker, actor type select, action search input
    - Columns: timestamp, actor (type + id), action, target, IP address
    - Row expansion: shows full `metadata` JSON formatted
    - "Export CSV" button: calls API with current filters, downloads file

71. `frontend/src/design-system/components/OtpInput.tsx`
    - 6 individual `<input>` boxes (or configurable N boxes)
    - Auto-focus next on input, focus prev on backspace
    - Paste support: spread characters across boxes
    - Full keyboard navigation
    - Props: `length`, `onChange(value)`, `disabled`, `hasError`

---

### I. FRONTEND HOOKS & STORE

72. `frontend/src/hooks/useAuth.ts` — JWT decode, role guard (`requireRole`), auto-logout on 401, token refresh check
73. `frontend/src/hooks/useMemories.ts` — cursor-based infinite fetch, add memory (optimistic), delete memory (optimistic), toggle reaction (optimistic with rollback)
74. `frontend/src/hooks/useNotifications.ts` — fetch on mount, 30s polling interval, markRead, unread count
75. `frontend/src/hooks/useUpload.ts` — Axios upload with `onUploadProgress`, progress %, cancel token
76. `frontend/src/store/authStore.ts` — Zustand: `token`, `actor` (decoded JWT payload), `setAuth(token)`, `clearAuth()`, `isAuthenticated`, `role`, `orgId`

---

### J. FRONTEND UTILS

77. `frontend/src/utils/api.ts` — Axios instance: `baseURL` from env, JWT `Authorization` header interceptor (from authStore), 401 response interceptor → clearAuth + redirect to login
78. `frontend/src/utils/formatters.ts` — `formatRelativeTime(date)`, `formatFileSize(bytes)`, `formatINR(paise)`, `formatNumber(n)` (compact: 1.2k), `formatDate(date, format)`

---

### K. DATABASE

79. `database/schema.sql` — **Standalone, runnable SQL file.** CREATE DATABASE, USE, then CREATE TABLE for every table in Section 6 in dependency order (no FK reference before table exists). Include all indexes. Include a seed INSERT for the `super_admins` table with a placeholder email. Ends with a comment block listing all table names created.

---

## 15. DEPLOYMENT NOTES (cPanel)

- **Node.js:** cPanel Node.js Selector, entry: `backend/server.js`. PM2 process manager for stability.
- **MySQL:** cPanel MySQL Databases → run `npx sequelize-cli db:migrate`.
- **Env Vars:** Set in cPanel Node.js environment manager. Never commit `.env` to git.
- **Redis:** Upstash free tier — HTTP REST API, no server install needed on shared hosting.
- **Cloudinary:** Zero disk writes. All media streamed directly. Store only URLs + `public_id`.
- **Razorpay Webhook:** Ensure the webhook endpoint URL is registered in Razorpay Dashboard. Must be publicly accessible (not localhost).
- **Cloudflare Turnstile:** Register domain in Cloudflare Dashboard → get Site Key (frontend) + Secret Key (backend).
- **Frontend:** `npm run build` → `dist/` → upload to `public_html/` or serve via Express `static`.
- **SSL:** AutoSSL in cPanel. Add `app.set('trust proxy', 1)` in Express for correct IP detection behind SSL.
- **Puppeteer (card download):** Puppeteer may not run on shared hosting. Alternative: use `html-to-image` client-side → upload blob to `/api/cards/save-download-image`, store in Cloudinary. Recommended for shared cPanel.

---

## 16. FUTURE ROADMAP

| Feature | Priority | Notes |
|---|---|---|
| WebSocket real-time memory feed | High | Socket.io replacing 30s polling |
| White-label custom domain routing | High | Cloudflare CNAME → middleware org resolver |
| Cloudflare WAF integration | High | Enable after moving to Cloudflare-proxied domain — Turnstile integrates natively |
| AI-generated card tagline | Medium | OpenAI GPT-4o call on card creation with student's name + branch + batch |
| Physical NFC card fulfillment webhook | Medium | Webhook to print-on-demand partner API |
| Mobile app (React Native) | Medium | Shared API + same JWT auth |
| Cloudinary video ready webhook | Medium | Cloudinary notifies backend → push notification to student |
| Advanced analytics (recharts) | Low | Memory upload trends, scan heatmap by date |
| GDPR / data erasure | Low | Export all user data as ZIP; permanent purge request flow |
| Multi-language i18n | Low | i18next — English + Hindi + regional languages |
| Affiliate / referral tracking | Low | Referral code on registration form → track which institution referred |

---

*Blueprint v4.0 — Production-Ready Enterprise. All sections are implementation-ready. Begin code generation immediately.*
