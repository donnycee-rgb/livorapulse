# Problem statement
LivoraPulse is currently a frontend-only Vite/React/TypeScript app whose UI state and charts are populated from locally-seeded data (`src/data/seed.json`) and in-memory Zustand mutations. The goal is to add a production-ready Node.js/TypeScript/Express backend with PostgreSQL + Prisma, implement JWT auth and all required REST endpoints, and refactor the frontend to remove hardcoded data and use real API calls.
# Current state (important context)
Frontend:
* Vite + React + TS + Tailwind + Zustand (`src/store/useAppStore.ts`).
* Metrics are loaded from `src/data/seed.json` and mutated locally (no persistence).
* Life Pulse Score is computed on the client in `src/store/selectors.ts`.
* Routes are public; there is no auth flow.
# Proposed changes
## 1) Backend project scaffold (new sibling folder)
Create a new folder at `../livorapulse-backend` with:
* Express app entrypoint: `src/server.ts`
* Route modules: `src/routes/*`
* Auth middleware: `src/middleware/auth.ts`
* Zod validation helpers: `src/middleware/validate.ts`
* Central error handler: `src/middleware/error.ts`
* Prisma client singleton: `src/db/prisma.ts`
* Environment config: `.env` (and `.env.example`)
* Security: helmet + CORS (allow Vite dev origin), rate limiting optional
## 2) PostgreSQL + Prisma schema
Implement Prisma models to support:
* User (email unique, password hash, profile fields)
* UserPreferences (theme, units, notificationsEnabled, focusMode)
* PhysicalActivityEntry (steps, distanceKm, caloriesKcal, sleepMinutes, timestamp)
* DigitalUsageEntry (screenTimeMinutes, categoryBreakdown JSON, date)
* ProductivitySession (kind FOCUS|STUDY, label, startedAt, endedAt, durationSec)
* MoodLog (emoji, stressScore, timestamp)
* EcoAction (category enum, type, impactKgCO2, timestamp)
* TransportTrip (mode enum, timestamp)
* DailySummary (date, cached insight text and computed component rollups; score is NOT stored)
Add migrations and a minimal seed that creates one demo user.
## 3) REST API implementation
All endpoints live under `/api` and require JWT auth except register/login.
* Auth:
    * POST `/api/auth/register`
    * POST `/api/auth/login`
    * GET `/api/auth/me`
* User:
    * GET `/api/user/profile`
    * PUT `/api/user/profile`
* Physical:
    * POST `/api/activity/physical`
    * GET `/api/activity/physical` (returns raw entries + weekly aggregates)
* Digital:
    * POST `/api/activity/digital`
    * GET `/api/activity/digital` (raw + weekly aggregates)
* Productivity:
    * POST `/api/productivity/session`
    * GET `/api/productivity/session` (raw + weekly aggregates)
* Mood:
    * POST `/api/mood`
    * GET `/api/mood` (raw + weekly aggregates)
* Eco:
    * POST `/api/eco`
    * GET `/api/eco` (raw + weekly aggregates)
* Score:
    * GET `/api/score/daily` (computes score dynamically for a day; upserts DailySummary cache without storing score)
## 4) Score engine (backend)
Move score computation to the backend:
* Aggregate the requested day’s metrics from the DB
* Compute category subscores (physical/digital/productivity/mood/eco)
* Combine with weights into a 0–100 score
* Generate an “insight” sentence from computed metrics (no hardcoded UI copy)
## 5) Frontend integration
Refactor frontend to use real API data:
* Add an API client wrapper (`src/api/client.ts`) with base URL from `VITE_API_URL` and automatic `Authorization: Bearer <token>`.
* Add auth store (`src/store/useAuthStore.ts`) persisted to localStorage (token + current user) with login/register/logout.
* Add data hooks/store to fetch and cache:
    * profile/preferences
    * weekly aggregates per section
    * daily score
* Replace local seed usage by removing `src/data/seed.json`/`src/data/seed.ts` from state initialization and instead fetch on login.
* Add `/login` and `/register` pages with loading + error handling + dark/light support.
* Add protected routing for app pages (`/dashboard`, `/physical`, etc.) and redirect to `/login` when unauthenticated.
* Update “add activity/session/etc.” flows to POST to the API then refetch affected data.
## 6) Local dev experience
* Backend: `npm run dev` (tsx watch)
* Frontend: `npm run dev`
* Add Vite dev proxy OR configure CORS. Prefer env-driven base URL.
* Provide setup notes: Postgres DB creation, `DATABASE_URL`, `prisma migrate dev`, `prisma db seed`.
# Acceptance criteria
* Frontend has zero references to seeded/locally-hardcoded metric JSON.
* Auth required for all app pages; token stored in localStorage.
* All charts/cards reflect DB-backed API responses.
* Backend uses Express+TS+Prisma+Postgres+JWT+Zod+dotenv+CORS+Helmet and runs cleanly with `npm run dev`.
