# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repo overview
LivoraPulse is a wellness tracker for Kenya and Africa. This repo is the **frontend**: **React 18 + Vite + TypeScript + Tailwind CSS + Recharts + Zustand**, deployed on Netlify. All data comes from the backend API ([livorapulse_backend](https://github.com/donnycee-rgb/livorapulse_backend), Fastify + Prisma + Postgres + Redis). See `README.md` for features.

## Common commands
- `npm install`
- `npm run dev` — Vite on port 5173; proxies `/api` to the backend on `http://localhost:4000`
- `npm run build` — type-check, then build to `dist/`
- `npm run preview` — serve the production build
- `npm test` — Vitest (setup in `src/test/setup.ts`)
- `npm run typecheck`

Environment: `VITE_API_URL` is the backend address in production. Leave it empty locally to use the Vite proxy.

## High-level architecture

### App entry + routing
- `index.html` loads `src/main.tsx`, which mounts the app inside `BrowserRouter`.
  - `useThemeSync()` applies the Tailwind dark-mode `class` to `<html>`.
  - `AppToaster` (`src/components/ui/Toaster.tsx`) hosts toast notifications.
- `src/App.tsx` defines all routes. Pages are lazy-loaded (`React.lazy`).
  - Public: landing (`/`), `/login`, `/reset-password`, `/shared/summary/:token`.
  - Signed-in pages are wrapped in `ProtectedRoute`, which sends unverified users to `/verify-email` and new users to `/welcome` (setup).
  - In-app pages render inside `Layout` with `RouteTransition` (framer-motion).
- Route titles and metadata: `src/routes/routeMeta.ts`. Per-page SEO tags: `src/components/Seo.tsx`.

### Layout + navigation
- `src/components/Layout.tsx` renders `AppHeader`, `SideNav` (desktop) and `BottomNav` (mobile).
- `useStoreHydration()` waits for the persisted store before rendering content.

### Talking to the backend
- `src/api/client.ts` — `apiGet` / `apiPost` / `apiPut` / … with JSON handling and error mapping.
- `src/api/session.ts` — access/refresh tokens in `localStorage`. Access tokens last 15 minutes; refresh tokens are single-use, so renewals are serialised (also across tabs). Tested in `session.test.ts`.
- Feature clients: `experiments.ts`, `insights.ts`, `summary.ts`.

### State
- `src/store/useAuthStore.ts` — the signed-in user, sign-in/out, registration, verification state.
- `src/store/useAppStore.ts` — persisted Zustand store (`livorapulse-store-v1`) for metrics, goals, preferences and running timers. Loads from the API; real users always start from empty state, not seed data.
  - `src/data/seed.json` / `seed.ts` only supply default `user` / `preferences` shapes.
- `src/store/selectors.ts` — derived values for the UI. The LifePulse Score itself is computed on the server.
- Types: `src/data/types.ts`.

### Offline walks
- `WalkTracker` records GPS walks (`utils/stepDetector.ts`, `utils/walkMetrics.ts`). Walks recorded offline are queued (`utils/pendingWalks.ts`) and synced by `usePendingWalkSync`.

### UI, charts, styling
- UI primitives: `src/components/ui/` (Button, Input, Modal, Skeleton, Toaster).
- Feature components: `src/components/` (check-in modal, cycle tracker, insight and experiment cards, AI coach, health summary view…).
- Recharts charts: `src/components/charts/`. Colours are in `src/theme/useChartTheme.ts` (light/dark aware).
- Tailwind tokens: `tailwind.config.cjs` (`colors.lp.*`). Global styles: `src/styles/globals.css`.
- Pages often define small local components (e.g. `StatCard`, `ScoreRing`) inside the page file rather than in `components/`.

### Deployment (Netlify)
- `public/_redirects` — SPA fallback. `public/_headers` — security headers.
- `public/robots.txt`, `sitemap.xml`, `llms.txt` — SEO and AI crawler descriptions.
