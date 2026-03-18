# Project Guidelines

## Code Style

- Preserve current stack and patterns: backend is CommonJS Node/Express with Sequelize; frontend is React + TypeScript + Vite.
- Keep naming consistent with existing code: models/components in PascalCase, functions/hooks in camelCase, database columns in snake_case.
- Follow the soft-delete convention used across models: `is_active = 1` by default scope, and explicit `withInactive`-style scopes when needed.
- Reuse shared client/server utilities instead of duplicating logic:
  - Backend auth and token helpers in `backend/middleware/auth.js` and `backend/utils/jwtFactory.js`
  - Frontend API/auth state in `frontend/src/utils/api.ts` and `frontend/src/store/authStore.ts`

## Architecture

- Respect the route-controller-model layering in backend:
  - `backend/routes/*` for route definitions and middleware wiring
  - `backend/controllers/*` for request orchestration
  - `backend/models/*` for persistence and scopes
- Keep role boundaries explicit across Super Admin, Admin, and User flows; do not mix route responsibilities across tiers.
- Frontend architecture uses route-level pages with shared components/hooks/store under `frontend/src/{pages,components,hooks,store}`.

## Build and Test

- Backend:
  - Install: `cd backend && npm install`
  - Dev server: `npm run dev`
  - Production start: `npm start`
  - Seed (if needed): `npm run seed`
- Frontend:
  - Install: `cd frontend && npm install`
  - Dev server: `npm run dev`
  - Build: `npm run build`
  - Preview build: `npm run preview`
- Database and environment setup are required before running the app. Follow `SETUP_AND_RUN_GUIDE.md` and import `database/schema.sql`.
- This repository currently has no standard lint/test scripts in package.json. If adding tests or linting, add scripts explicitly and keep scope limited to changed areas.

## Conventions

- Keep API responses and error shapes consistent with existing controllers (`message` for success context, `error` for failures, optional `details` for validation).
- For authenticated frontend API calls, rely on the shared axios instance in `frontend/src/utils/api.ts` so token injection and 401 handling stay centralized.
- Preserve middleware ordering in `backend/server.js`, especially Razorpay webhook raw-body parsing before JSON body parsers.
- Respect security integrations already present: rate limiting, Turnstile checks where applicable, and JWT verification middleware.

## Environment and Pitfalls

- Local development depends on MySQL and configured env files in both `backend/.env` and `frontend/.env`.
- On Windows PowerShell, avoid using `>` redirection for source files because it can create UTF-16 LE files. Use UTF-8-safe editing/writes.
- Vite dev server proxies `/api` to backend at `http://localhost:5000`; run backend before frontend to avoid proxy failures.
- Treat external integrations (Redis/Upstash, SMTP, Cloudinary, Razorpay, Turnstile) as required configuration for full-flow features.
