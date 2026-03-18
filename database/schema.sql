-- =============================================================
--  Phygital Memory & Alumni Engagement SaaS
--  Database Schema — v5.0
--  Engine: MySQL 8.0+
--  Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
--  Run: mysql -u root -p < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS phygital_saas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE phygital_saas;

-- =============================================================
-- 1. SUPER ADMINS
--    Platform owner accounts. Very few rows (1–5 max).
-- =============================================================
CREATE TABLE IF NOT EXISTS super_admins (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  email             VARCHAR(255)     NOT NULL,
  current_otp_hash  VARCHAR(255)     NULL      DEFAULT NULL,
  otp_expires_at    DATETIME         NULL      DEFAULT NULL,
  last_login_at     DATETIME         NULL      DEFAULT NULL,
  last_login_ip     VARCHAR(45)      NULL      DEFAULT NULL,
  is_active         TINYINT(1)       NOT NULL  DEFAULT 1,
  created_at        DATETIME         NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME         NULL      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_super_admins_email (email),
  INDEX idx_super_admins_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: insert the platform owner email (no password — OTP only)
INSERT INTO super_admins (email) VALUES ('joshijayc075@gmail.com');


-- =============================================================
-- 2. ORGANIZATIONS
--    Institution or student group accounts.
--    Starts in 'pending' status after self-serve registration.
-- =============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name                        VARCHAR(255)    NOT NULL,
  slug                        VARCHAR(100)    NOT NULL,
  type                        ENUM('university','school','student_group','corporate') NOT NULL,

  -- Registration & Approval
  contact_name                VARCHAR(255)    NOT NULL,
  contact_email               VARCHAR(255)    NOT NULL,
  contact_phone               VARCHAR(20)     NULL      DEFAULT NULL,
  institution_website         VARCHAR(512)    NULL      DEFAULT NULL,
  registration_reason         TEXT            NULL      DEFAULT NULL,
  email_verified              TINYINT(1)      NOT NULL  DEFAULT 0,
  email_verified_at           DATETIME        NULL      DEFAULT NULL,
  status                      ENUM('pending','active','suspended','rejected','trial') NOT NULL DEFAULT 'pending',
  rejection_reason            TEXT            NULL      DEFAULT NULL,
  approved_by                 INT UNSIGNED    NULL      DEFAULT NULL,
  approved_at                 DATETIME        NULL      DEFAULT NULL,
  password_set                TINYINT(1)      NOT NULL  DEFAULT 0,

  -- Branding
  selected_card_template      VARCHAR(50)     NOT NULL  DEFAULT 'tmpl_midnight',
  brand_color                 VARCHAR(7)      NOT NULL  DEFAULT '#6366F1',
  brand_color_rgb             VARCHAR(20)     NULL      DEFAULT NULL,
  logo_url                    VARCHAR(512)    NULL      DEFAULT NULL,
  logo_public_id              VARCHAR(255)    NULL      DEFAULT NULL,
  custom_domain               VARCHAR(255)    NULL      DEFAULT NULL,

  -- Billing (Razorpay)
  razorpay_customer_id        VARCHAR(100)    NULL      DEFAULT NULL,
  razorpay_subscription_id    VARCHAR(100)    NULL      DEFAULT NULL,
  plan                        ENUM('trial','starter','growth','enterprise') NOT NULL DEFAULT 'trial',
  trial_ends_at               DATETIME        NULL      DEFAULT NULL,
  billing_cycle_anchor        DATETIME        NULL      DEFAULT NULL,

  -- Limits & Usage
  card_quota                  INT UNSIGNED    NOT NULL  DEFAULT 100,
  storage_limit_gb            DECIMAL(6,2)    NOT NULL  DEFAULT 2.00,
  storage_used_gb             DECIMAL(10,4)   NOT NULL  DEFAULT 0.0000,

  is_active                   TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at                  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME        NULL      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_organizations_slug (slug),
  UNIQUE KEY uq_organizations_contact_email (contact_email),
  UNIQUE KEY uq_organizations_custom_domain (custom_domain),
  INDEX idx_organizations_status (status),
  INDEX idx_organizations_is_active (is_active),
  INDEX idx_organizations_plan (plan),
  CONSTRAINT fk_organizations_approved_by
    FOREIGN KEY (approved_by) REFERENCES super_admins(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 3. ORGANIZATION REGISTRATIONS
--    Immutable audit record of every registration submission.
--    Separate from organizations to preserve history even
--    after approval/rejection.
-- =============================================================
CREATE TABLE IF NOT EXISTS organization_registrations (
  id                   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  organization_id      INT UNSIGNED    NULL      DEFAULT NULL,
  contact_email        VARCHAR(255)    NOT NULL,
  contact_name         VARCHAR(255)    NOT NULL,
  institution_name     VARCHAR(255)    NOT NULL,
  submitted_data_json  JSON            NOT NULL,
  email_verified       TINYINT(1)      NOT NULL  DEFAULT 0,
  otp_hash             VARCHAR(255)    NULL      DEFAULT NULL,
  otp_expires_at       DATETIME        NULL      DEFAULT NULL,
  status               ENUM('email_pending','pending','approved','rejected') NOT NULL DEFAULT 'email_pending',
  super_admin_note     TEXT            NULL      DEFAULT NULL,
  ip_address           VARCHAR(45)     NULL      DEFAULT NULL,
  user_agent           TEXT            NULL      DEFAULT NULL,
  is_active            TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at           DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME        NULL      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_org_reg_status (status),
  INDEX idx_org_reg_contact_email (contact_email),
  INDEX idx_org_reg_is_active (is_active),
  CONSTRAINT fk_org_reg_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 4. ADMINS
--    Institution admin and co-admin accounts.
--    password_hash is NULL until set via onboarding link.
-- =============================================================
CREATE TABLE IF NOT EXISTS admins (
  id                              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  organization_id                 INT UNSIGNED    NOT NULL,
  name                            VARCHAR(255)    NOT NULL,
  email                           VARCHAR(255)    NOT NULL,
  password_hash                   VARCHAR(255)    NULL      DEFAULT NULL,
  role                            ENUM('owner','co_admin') NOT NULL DEFAULT 'owner',
  onboarding_token                VARCHAR(255)    NULL      DEFAULT NULL,
  onboarding_token_expires_at     DATETIME        NULL      DEFAULT NULL,
  last_login_at                   DATETIME        NULL      DEFAULT NULL,
  last_login_ip                   VARCHAR(45)     NULL      DEFAULT NULL,
  is_active                       TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at                      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at                      DATETIME        NULL      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email),
  INDEX idx_admins_organization_id (organization_id),
  INDEX idx_admins_is_active (is_active),
  CONSTRAINT fk_admins_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 5. USERS (Students / Alumni)
--    password_hash NULL until student sets password post-login.
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  organization_id  INT UNSIGNED    NOT NULL,
  name             VARCHAR(255)    NOT NULL,
  email            VARCHAR(255)    NOT NULL,
  password_hash    VARCHAR(255)    NULL      DEFAULT NULL,
  roll_number      VARCHAR(100)    NULL      DEFAULT NULL,
  branch           VARCHAR(150)    NULL      DEFAULT NULL,
  batch_year       YEAR            NULL      DEFAULT NULL,
  avatar_url       VARCHAR(512)    NULL      DEFAULT NULL,
  avatar_public_id VARCHAR(255)    NULL      DEFAULT NULL,
  linkedin_url     VARCHAR(512)    NULL      DEFAULT NULL,
  instagram_url    VARCHAR(512)    NULL      DEFAULT NULL,
  bio              VARCHAR(300)    NULL      DEFAULT NULL,
  role             ENUM('student','alumni') NOT NULL DEFAULT 'student',
  last_login_at    DATETIME        NULL      DEFAULT NULL,
  is_active        TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at       DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NULL      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_org_email (organization_id, email),
  INDEX idx_users_organization_id (organization_id),
  INDEX idx_users_batch_year (batch_year),
  INDEX idx_users_is_active (is_active),
  CONSTRAINT fk_users_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 6. CARDS
--    One card per user. Created during CSV import.
--    qr_hash is the unique token encoded in the physical QR/NFC.
-- =============================================================
CREATE TABLE IF NOT EXISTS cards (
  id                       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id                  INT UNSIGNED    NOT NULL,
  qr_hash                  VARCHAR(64)     NOT NULL,
  qr_signed_token          VARCHAR(512)    NULL      DEFAULT NULL,
  template_id              VARCHAR(50)     NOT NULL  DEFAULT 'tmpl_midnight',
  front_data_json          JSON            NOT NULL,
  back_image_url           VARCHAR(512)    NULL      DEFAULT NULL,
  back_image_public_id     VARCHAR(255)    NULL      DEFAULT NULL,
  card_download_url        VARCHAR(512)    NULL      DEFAULT NULL,
  card_download_public_id  VARCHAR(255)    NULL      DEFAULT NULL,
  share_slug               VARCHAR(32)     NULL      DEFAULT NULL,
  share_enabled            TINYINT(1)      NOT NULL  DEFAULT 1,
  scan_count               INT UNSIGNED    NOT NULL  DEFAULT 0,
  last_scanned_at          DATETIME        NULL      DEFAULT NULL,
  is_active                TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at               DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME        NULL      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cards_user_id (user_id),
  UNIQUE KEY uq_cards_qr_hash (qr_hash),
  UNIQUE KEY uq_cards_share_slug (share_slug),
  INDEX idx_cards_is_active (is_active),
  CONSTRAINT fk_cards_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 7. MEMORIES
--    Photos and videos uploaded by students.
--    Scoped to an organization for fast cohort feed queries.
-- =============================================================
CREATE TABLE IF NOT EXISTS memories (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  organization_id  INT UNSIGNED    NOT NULL,
  uploaded_by      INT UNSIGNED    NOT NULL,
  media_type       ENUM('photo','video') NOT NULL,
  cloudinary_url   VARCHAR(512)    NOT NULL,
  public_id        VARCHAR(255)    NOT NULL,
  thumbnail_url    VARCHAR(512)    NULL      DEFAULT NULL,
  width            SMALLINT UNSIGNED NULL   DEFAULT NULL,
  height           SMALLINT UNSIGNED NULL   DEFAULT NULL,
  duration_sec     SMALLINT UNSIGNED NULL   DEFAULT NULL,
  file_size_mb     DECIMAL(8,3)    NULL      DEFAULT NULL,
  caption          VARCHAR(500)    NULL      DEFAULT NULL,
  is_flagged       TINYINT(1)      NOT NULL  DEFAULT 0,
  is_active        TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at       DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NULL      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_memories_organization_id (organization_id),
  INDEX idx_memories_uploaded_by (uploaded_by),
  INDEX idx_memories_media_type (media_type),
  INDEX idx_memories_is_active (is_active),
  INDEX idx_memories_created_at (created_at),
  INDEX idx_memories_org_active_created (organization_id, is_active, created_at DESC),
  CONSTRAINT fk_memories_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_memories_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 8. MEMORY REACTIONS
--    Emoji reactions on memories. One reaction per emoji per
--    user per memory (enforced by UNIQUE KEY).
-- =============================================================
CREATE TABLE IF NOT EXISTS memory_reactions (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  memory_id   INT UNSIGNED    NOT NULL,
  user_id     INT UNSIGNED    NOT NULL,
  emoji       ENUM('❤️','🔥','😂','😮','😢') NOT NULL,
  is_active   TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_reactions_memory_user_emoji (memory_id, user_id, emoji),
  INDEX idx_reactions_memory_id (memory_id),
  INDEX idx_reactions_user_id (user_id),
  INDEX idx_reactions_is_active (is_active),
  CONSTRAINT fk_reactions_memory_id
    FOREIGN KEY (memory_id) REFERENCES memories(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reactions_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 9. NOTIFICATIONS
--    In-app notifications for students.
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  type        ENUM('new_memory','announcement','magic_link','approval','system') NOT NULL,
  title       VARCHAR(255)    NOT NULL,
  body        TEXT            NULL      DEFAULT NULL,
  action_url  VARCHAR(512)    NULL      DEFAULT NULL,
  is_read     TINYINT(1)      NOT NULL  DEFAULT 0,
  is_active   TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_is_active (is_active),
  INDEX idx_notifications_user_unread (user_id, is_read, is_active),
  CONSTRAINT fk_notifications_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 10A. ALUMNI REQUESTS
--     Public or existing-user requests to gain alumni access.
-- =============================================================
CREATE TABLE IF NOT EXISTS alumni_requests (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  organization_id INT UNSIGNED    NOT NULL,
  user_id         INT UNSIGNED    NULL      DEFAULT NULL,
  name            VARCHAR(255)    NOT NULL,
  email           VARCHAR(255)    NOT NULL,
  branch          VARCHAR(150)    NULL      DEFAULT NULL,
  batch_year      INT             NULL      DEFAULT NULL,
  linkedin_url    VARCHAR(512)    NULL      DEFAULT NULL,
  reason          TEXT            NULL      DEFAULT NULL,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500)   NULL      DEFAULT NULL,
  reviewed_by     INT UNSIGNED    NULL      DEFAULT NULL,
  reviewed_at     DATETIME        NULL      DEFAULT NULL,
  is_active       TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_alumni_req_org (organization_id),
  INDEX idx_alumni_req_user (user_id),
  INDEX idx_alumni_req_email (email),
  INDEX idx_alumni_req_status (status),
  INDEX idx_alumni_req_active (is_active),
  CONSTRAINT fk_alumni_req_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_alumni_req_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_alumni_req_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES admins(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 11. PAYMENTS
--     Razorpay transaction log. One row per captured/failed event.
--     amounts stored in paise (₹1 = 100 paise).
-- =============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  organization_id             INT UNSIGNED    NOT NULL,
  razorpay_payment_id         VARCHAR(100)    NULL      DEFAULT NULL,
  razorpay_subscription_id    VARCHAR(100)    NULL      DEFAULT NULL,
  razorpay_order_id           VARCHAR(100)    NULL      DEFAULT NULL,
  amount_paise                INT UNSIGNED    NOT NULL,
  currency                    VARCHAR(3)      NOT NULL  DEFAULT 'INR',
  status                      ENUM('created','captured','failed','refunded') NOT NULL,
  plan                        VARCHAR(50)     NULL      DEFAULT NULL,
  payment_method              VARCHAR(50)     NULL      DEFAULT NULL,
  invoice_url                 VARCHAR(512)    NULL      DEFAULT NULL,
  is_active                   TINYINT(1)      NOT NULL  DEFAULT 1,
  created_at                  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_razorpay_payment_id (razorpay_payment_id),
  INDEX idx_payments_organization_id (organization_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_is_active (is_active),
  CONSTRAINT fk_payments_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 12. AUDIT LOGS
--     Append-only log of all significant system actions.
--     No defaultScope is_active filter — never soft-deleted
--     by the application. Only Super Admin purge can hard-delete.
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  actor_type   ENUM('super_admin','admin','user','system') NOT NULL,
  actor_id     INT UNSIGNED     NULL      DEFAULT NULL,
  action       VARCHAR(100)     NOT NULL,
  target_type  VARCHAR(50)      NULL      DEFAULT NULL,
  target_id    INT UNSIGNED     NULL      DEFAULT NULL,
  ip_address   VARCHAR(45)      NULL      DEFAULT NULL,
  user_agent   TEXT             NULL      DEFAULT NULL,
  metadata     JSON             NULL      DEFAULT NULL,
  is_active    TINYINT(1)       NOT NULL  DEFAULT 1,
  created_at   DATETIME         NOT NULL  DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_audit_actor (actor_type, actor_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_created_at (created_at),
  INDEX idx_audit_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- 12. CARD SCAN EVENTS
--     One row per QR/NFC scan. High-volume append-only table.
--     Partitioning recommended if scan volume exceeds 10M rows.
-- =============================================================
CREATE TABLE IF NOT EXISTS card_scan_events (
  id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  card_id     INT UNSIGNED     NOT NULL,
  ip_address  VARCHAR(45)      NULL      DEFAULT NULL,
  user_agent  TEXT             NULL      DEFAULT NULL,
  country     VARCHAR(50)      NULL      DEFAULT NULL,
  is_active   TINYINT(1)       NOT NULL  DEFAULT 1,
  scanned_at  DATETIME         NOT NULL  DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_scan_card_id (card_id),
  INDEX idx_scan_scanned_at (scanned_at),
  INDEX idx_scan_is_active (is_active),
  CONSTRAINT fk_scan_card_id
    FOREIGN KEY (card_id) REFERENCES cards(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- SUMMARY: Tables created (in dependency order)
-- =============================================================
--   1.  super_admins
--   2.  organizations
--   3.  organization_registrations
--   4.  admins
--   5.  users
--   6.  cards
--   7.  memories
--   8.  memory_reactions
--   9.  notifications
--  10.  payments
--  11.  audit_logs
--  12.  card_scan_events
-- =============================================================
-- Total: 12 tables
-- Soft delete: is_active = 1 (active) | is_active = 0 (soft deleted)
-- Hard deletes: NEVER issued by the application.
--               Only via Super Admin "Purge" action.
-- =============================================================
