# GENERATION PROMPT — Phygital SaaS Codebase
## For: Claude Opus 4.6 | Mode: Extended Thinking ON | Max Tokens: MAX

---

## HOW TO USE THIS PROMPT

1. Open Claude Opus 4.6 with **Extended Thinking enabled**.
2. Paste the **SYSTEM PROMPT** block into the System Prompt field.
3. Paste the **USER TURN** block as your first message.
4. The blueprint (BLUEPRINT_v5_Enterprise.md) must be **attached as a file** or its full contents pasted immediately after the USER TURN marker.
5. Do NOT send everything in one message if you are using the API. Use the **BATCHING STRATEGY** in Section 3 to get complete, untruncated files.

---

## SECTION 1 — SYSTEM PROMPT

```
You are a senior full-stack software engineer with 12+ years of production experience. You specialize in Node.js/Express backends, React/TypeScript frontends, MySQL database design, and enterprise SaaS architecture.

Your output standard is production-grade code — the kind that gets merged into a main branch, deployed to a live server, and maintained by a team. You do not write tutorial code. You do not write demo code. You write real, working, maintainable software.

ABSOLUTE OUTPUT RULES — violating any of these is a critical failure:

1. NEVER truncate any file. Every file must be 100% complete, from the first line to the last closing bracket.
2. NEVER write placeholder comments like "// ... add your logic here", "// TODO", "// rest of implementation", or any variation. If you cannot complete a function, that is a failure. Complete it.
3. NEVER skip a file from the requested list. If the user asks for 10 files, you output 10 complete files. If context forces a split, output as many complete files as fit, then stop cleanly at a file boundary and wait for the user to say "continue".
4. NEVER mix concerns. Each file does exactly what its specification says — no more, no less.
5. ALWAYS use the exact file path specified. Do not rename, restructure, or reinterpret paths.
6. ALWAYS wrap each file in a code block with the language identifier and a comment on line 1 containing the exact file path. Format:

   ```javascript
   // backend/config/database.js
   ... full file contents ...
   ```

7. ALWAYS output files in the order they are listed in the request. Do not reorder.
8. When a specification says "per schema" for a model, that means implement EVERY column defined in the database schema section of the blueprint — not a subset. Include all data types, constraints, defaults, associations, hooks, and instance/static methods described.
9. Security implementations are NOT optional. Every security measure described in the blueprint (rate limiting, JWT verification, bcrypt, Redis TTL, temp mail blocking, Turnstile verification, soft delete enforcement) must be present in the code.
10. Tailwind CSS v4 is being used. This means: no tailwind.config.js color definitions. All design tokens are CSS custom properties defined in index.css inside an @theme block. Class names use the (--var) syntax (e.g., bg-(--sa-accent), text-(--ia-accent)). Do not write v3-style config-based theme references.

Your internal process before writing any file:
- Read the full specification for that file.
- Identify all dependencies it imports (are they listed in package.json?).
- Identify all environment variables it uses (are they in .env.example?).
- Identify all other files it calls (routes → controllers → models → utils).
- Then write the complete file.

You are building a production SaaS application. Treat it as such.
```

---

## SECTION 2 — USER TURN (send this as your first message, with the blueprint attached)

```
I have attached the full product blueprint: BLUEPRINT_v5_Enterprise.md

Read the entire blueprint carefully before writing a single line of code. Pay special attention to:
- Section 2: Core philosophy (soft delete convention, self-serve registration flow)
- Section 5: Design system (Tailwind v4 tokens, color system, component specs)
- Section 6: Full database schema (every column, every table)
- Section 8: Security architecture (OTP flow, JWT scoping, rate limits)
- Section 9: Payment integration (Razorpay — INR, paise, webhook events)
- Section 14: Execution phase (79 files across 11 groups, A through K)

Now generate the files in the following batch. Output every file completely. Stop at the end of this batch and wait for me to say "next batch".

--- BATCH 1: PROJECT SCAFFOLDING + BACKEND CONFIG (Files 1–11) ---

Generate these files in order:
1.  backend/package.json
2.  frontend/package.json
3.  backend/.env.example
4.  frontend/.env.example
5.  vite.config.ts
6.  frontend/src/index.css
7.  backend/config/database.js
8.  backend/config/cloudinary.js
9.  backend/config/redis.js
10. backend/config/mailer.js
11. backend/config/razorpay.js

After completing file 11, write exactly this line and nothing else:
"BATCH 1 COMPLETE — 11/79 files. Send 'next batch' to continue."
```

---

## SECTION 3 — BATCHING STRATEGY

Send these user messages in sequence. Each time Opus finishes a batch, reply with **"next batch"** to trigger the next one. This prevents context overflow and guarantees no file gets truncated.

---

**BATCH 1 — Scaffolding + Backend Config** (Files 1–11)
> Already defined in Section 2 above. Send that as your first message.

---

**BATCH 2 — Sequelize Models** (Files 12–24)

```
Next batch. Generate files 12–24 in order:

12. backend/models/index.js
13. backend/models/SuperAdmin.js
14. backend/models/Organization.js
15. backend/models/OrgRegistration.js
16. backend/models/Admin.js
17. backend/models/User.js
18. backend/models/Card.js
19. backend/models/Memory.js
20. backend/models/MemoryReaction.js
21. backend/models/Notification.js
22. backend/models/Payment.js
23. backend/models/AuditLog.js
24. backend/models/CardScanEvent.js

Reminder: every model must implement defaultScope: { where: { is_active: 1 } } EXCEPT AuditLog. Every model must map every column from the schema in Section 6 of the blueprint.

After file 24: "BATCH 2 COMPLETE — 24/79 files. Send 'next batch' to continue."
```

---

**BATCH 3 — Utilities** (Files 25–33)

```
Next batch. Generate files 25–33 in order:

25. backend/utils/otpGenerator.js
26. backend/utils/jwtFactory.js
27. backend/utils/emailTemplates.js
28. backend/utils/cloudinaryHelpers.js
29. backend/utils/razorpayHelpers.js
30. backend/utils/disposableDomains.js
31. backend/utils/pagination.js
32. backend/utils/qrGenerator.js
33. backend/utils/auditLog.js

Note on file 27: emailTemplates.js must export ALL 10 template functions. Every template must be a complete, self-contained HTML string with inline CSS — no external stylesheets, no template engines. Dark background, email-client safe.

After file 33: "BATCH 3 COMPLETE — 33/79 files. Send 'next batch' to continue."
```

---

**BATCH 4 — Middleware** (Files 34–40)

```
Next batch. Generate files 34–40 in order:

34. backend/middleware/auth.js
35. backend/middleware/rateLimiter.js
36. backend/middleware/blockTempMail.js
37. backend/middleware/turnstile.js
38. backend/middleware/validate.js
39. backend/middleware/checkStorageLimit.js
40. backend/middleware/requireOrgActive.js

Note on file 34: Three separate exported middleware functions — verifySuperAdminJWT, verifyAdminJWT, verifyUserJWT. Each must query the DB to confirm is_active = 1 on the actor, not just trust the JWT payload.

Note on file 35: Use the exact rate limits defined in Section 9 of the blueprint. Use rate-limit-redis for the Redis store, not memory store.

After file 40: "BATCH 4 COMPLETE — 40/79 files. Send 'next batch' to continue."
```

---

**BATCH 5 — Routes + Controllers: Registration, Super Admin Auth, Super Admin Dashboard** (Files 41–43)

```
Next batch. Generate files 41–43. Each item is a matched route + controller pair — output both files for each number.

41. backend/routes/registration.js  +  backend/controllers/registration.js
42. backend/routes/superAdminAuth.js  +  backend/controllers/superAdminAuth.js
43. backend/routes/superAdminDashboard.js  +  backend/controllers/superAdminDashboard.js

That is 6 files total (route + controller for each).

For item 43, the controller must implement ALL endpoints listed in the blueprint Section 14 item 43 — including the trash/restore, trash/purge, and storage endpoints. The purge endpoint must call cloudinaryHelpers.deleteAsset() for every public_id before hard-deleting the DB row.

After the 6th file: "BATCH 5 COMPLETE — 46/79 files. Send 'next batch' to continue."
```

---

**BATCH 6 — Routes + Controllers: Admin Auth, Admin Dashboard, User Auth** (Files 44–46)

```
Next batch. Generate files 44–46 as matched route + controller pairs (6 files total).

44. backend/routes/adminAuth.js  +  backend/controllers/adminAuth.js
45. backend/routes/adminDashboard.js  +  backend/controllers/adminDashboard.js
46. backend/routes/userAuth.js  +  backend/controllers/userAuth.js

For item 45, the CSV import controller must return the structured error report: { total, imported, failed, errors: [{ row, email, reason }] }. It must use bulkCreate with individualHooks: false for performance, but validate each row before inserting.

For item 46, the magic link verify endpoint must consume the Redis key on first use — it must not be reusable.

After the 6th file: "BATCH 6 COMPLETE — 52/79 files. Send 'next batch' to continue."
```

---

**BATCH 7 — Routes + Controllers: Cards, Memories, Reactions, Notifications, Profile, Billing + server.js** (Files 47–52 + server.js)

```
Next batch. Generate files 47–52 as matched route + controller pairs, then generate server.js.

47. backend/routes/cards.js  +  backend/controllers/cards.js
48. backend/routes/memories.js  +  backend/controllers/memories.js
49. backend/routes/reactions.js  +  backend/controllers/reactions.js
50. backend/routes/notifications.js  +  backend/controllers/notifications.js
51. backend/routes/profile.js  +  backend/controllers/profile.js
52. backend/routes/billing.js  +  backend/controllers/billing.js

Then generate:
    backend/server.js — Express setup, full middleware stack (helmet, cors, morgan, express.json, express.urlencoded), all route mounts with their correct base paths, global error handler, 404 handler. IMPORTANT: the billing webhook route must use express.raw({ type: 'application/json' }) as its body parser, not express.json(), because Razorpay signature verification requires the raw body.

That is 13 files total.

After the 13th file: "BATCH 7 COMPLETE — 65/79 files. Send 'next batch' to continue."
```

---

**BATCH 8 — Frontend Pages** (Files 53–60)

```
Next batch. Generate frontend pages 53–60:

53. frontend/src/pages/InstitutionRegister.tsx
54. frontend/src/pages/SuperAdminLogin.tsx
55. frontend/src/pages/AdminSetupPassword.tsx
56. frontend/src/pages/AdminLogin.tsx
57. frontend/src/pages/SuperAdminDashboard.tsx
58. frontend/src/pages/AdminDashboard.tsx
59. frontend/src/pages/StudentPortal.tsx
60. frontend/src/pages/PublicCardShare.tsx

Design system reminder:
- Super Admin pages use --sa-accent (#00E89B) and --sa-bg (#070E0B)
- Admin pages use --ia-accent (#7C7FFA) and --ia-bg (#09090F)
- Student portal uses --org-accent (injected by OrgThemeProvider)
- All class names reference CSS custom properties via Tailwind v4 (--var) syntax
- Framer Motion must be used for page entrance animations (fade + Y slide, 280ms)
- No inline style={{ }} for design tokens — use CSS custom property class names

After file 60: "BATCH 8 COMPLETE — 73/79 files. Send 'next batch' to continue."
```

---

**BATCH 9 — Frontend Components, Hooks, Store, Utils** (Files 61–78)

```
Next batch. Generate files 61–78:

61. frontend/src/components/CardViewer.tsx
62. frontend/src/components/MemoryWall.tsx
63. frontend/src/components/MemoryLightbox.tsx
64. frontend/src/components/MemoryUploader.tsx
65. frontend/src/components/NotificationBell.tsx
66. frontend/src/components/CsvImporter.tsx
67. frontend/src/components/RegistrationQueue.tsx
68. frontend/src/components/PlanSelector.tsx
69. frontend/src/components/OrgThemeProvider.tsx
70. frontend/src/components/AuditLogTable.tsx
71. frontend/src/design-system/components/OtpInput.tsx
72. frontend/src/hooks/useAuth.ts
73. frontend/src/hooks/useMemories.ts
74. frontend/src/hooks/useNotifications.ts
75. frontend/src/hooks/useUpload.ts
76. frontend/src/store/authStore.ts
77. frontend/src/utils/api.ts
78. frontend/src/utils/formatters.ts

Critical for file 61 (CardViewer): implement ALL 4 templates (tmpl_midnight, tmpl_varsity, tmpl_arc, tmpl_aurora). tmpl_midnight requires the holographic conic-gradient shimmer overlay driven by --mouse-x and --mouse-y CSS variables updated on mousemove. tmpl_aurora requires a CSS @keyframes aurora gradient animation. Touch events (touchstart, touchmove, touchend) must be implemented alongside mouse events.

After file 78: "BATCH 9 COMPLETE — 78/79 files. Send 'next batch' to continue."
```

---

**BATCH 10 — Frontend App Shell + Router** (File 79 + bonus files)

```
Final batch. Generate:

79. frontend/src/App.tsx — React Router v6 with lazy-loaded routes for all 8 pages. Route guards: SuperAdminRoute (requires role: super_admin), AdminRoute (requires role: admin + org active), UserRoute (requires role: user). Each guard reads from authStore and redirects to the correct login page on failure. Include the Razorpay CDN script tag injected via useEffect on app mount.

Also generate these small but required files that complete the project:
- frontend/src/main.tsx — ReactDOM.createRoot, StrictMode, import App and index.css
- frontend/index.html — Vite HTML shell, correct title, meta charset and viewport

After all files: "GENERATION COMPLETE — 79/79 files + 2 bonus. Full codebase ready."
```

---

## SECTION 4 — QUALITY ENFORCEMENT PROMPTS

Use these as follow-up messages if Opus truncates, skips, or produces incomplete output.

**If a file is truncated mid-way:**
```
You truncated [filename] at [last line you saw]. Continue from exactly where you stopped. 
Do not restart the file. Do not summarize what came before. Continue the code from the cut-off point.
```

**If a file is missing from a batch:**
```
You did not generate [filename]. Generate it now, complete, before we continue to the next batch.
```

**If a placeholder comment appears:**
```
You wrote "[placeholder text]" in [filename]. That is not acceptable. Replace that entire section with the complete, working implementation. Show only the corrected file.
```

**If a model is missing columns:**
```
Your [ModelName].js is missing these columns from the schema: [list them]. Regenerate the complete model with all columns included.
```

**If Tailwind v3 syntax appears (e.g., className="bg-emerald-400"):**
```
You used Tailwind v3 config-based class names. This project uses Tailwind v4 with CSS custom properties. Replace all hardcoded color classes with CSS custom property references using the (--var) syntax. Example: bg-(--sa-accent) not bg-emerald-400. Regenerate the file.
```

---

## SECTION 5 — CONTEXT WINDOW MANAGEMENT

Opus 4.6 has a 200k token context window. The full codebase is approximately 15,000–20,000 lines. Use these rules:

- **Never paste the entire blueprint again** after the first message. Opus retains it in context.
- **Reference sections by number** when clarifying ("see Section 6 schema", "see Section 14 item 45").
- **If context gets long** (you are on batch 8–10), prepend each batch message with: "Continuing from BATCH [N]. The blueprint is still in context. Do not re-read it — proceed directly to generating the files."
- **Extended Thinking** should be left ON for the entire session. It significantly improves code quality for complex architectural decisions (middleware chains, model associations, Razorpay webhook signature verification).

---

## SECTION 6 — POST-GENERATION CHECKLIST

After all 79 files are generated, verify the following before running the project:

**Backend**
- [ ] All 11 env vars in `.env.example` have real values in your local `.env`
- [ ] Razorpay plan IDs in `config/razorpay.js` are replaced with your actual Razorpay Dashboard plan IDs
- [ ] `super_admins` seed email in `schema.sql` is updated to your real email
- [ ] Cloudflare Turnstile secret key is from a registered domain (not a test key for production)
- [ ] cPanel MySQL DB name, user, and password match what's in your `.env`
- [ ] Upstash Redis REST URL and token are from your Upstash console

**Frontend**
- [ ] `VITE_RAZORPAY_KEY_ID` in `.env` is your Razorpay live/test key (not secret)
- [ ] `VITE_TURNSTILE_SITE_KEY` matches the domain you registered in Cloudflare
- [ ] `VITE_API_BASE_URL` points to your cPanel Node.js app URL in production

**Database**
- [ ] Run `mysql -u root -p < database/schema.sql` on a clean DB first
- [ ] Confirm all 12 tables created with `SHOW TABLES;`
- [ ] Run `DESCRIBE organizations;` and spot-check a few columns

**Security**
- [ ] Rotate all JWT secrets to 64-char random strings (not the placeholder values)
- [ ] Razorpay webhook secret is set in both Razorpay Dashboard and your `.env`
- [ ] CORS origin in `server.js` is your actual frontend domain, not `*`

---

*Prompt engineered for Claude Opus 4.6 | Blueprint v5.0 | 79 files | 10 batches*
