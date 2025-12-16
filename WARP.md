# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repo overview
LivoraPulse is a **frontend-only MVP** built with **React + Vite + TypeScript + TailwindCSS + Recharts** (no backend). Data is currently seeded and stored locally in browser state.

## Common commands
Install dependencies:
- `npm install`

Run the dev server (Vite):
- `npm run dev`

Production build (outputs to `dist/`):
- `npm run build`

Preview the production build locally:
- `npm run preview`

Type-check (no dedicated script in `package.json`):
- `npx tsc -p tsconfig.json --noEmit`

Notes:
- There are currently **no** `lint` / `test` scripts in `package.json` (no ESLint/Vitest/Jest configuration in this repo as-is).

## High-level architecture

### App entry + routing
- HTML entry: `index.html` loads `src/main.tsx`.
- `src/main.tsx` mounts `Root` inside `BrowserRouter`.
  - `useThemeSync()` applies the Tailwind dark-mode `class` to `<html>`.
  - `AppToaster` (`src/components/ui/Toaster.tsx`) hosts toast notifications.
- `src/App.tsx` defines all routes with React Router.
  - Uses `framer-motion` (`AnimatePresence`) and `src/components/RouteTransition.tsx` for page transitions.
  - Most routes render a page inside `src/components/Layout.tsx`.

### Layout + navigation
- `src/components/Layout.tsx` is the shell for “in-app” pages.
  - Renders `AppHeader`, `SideNav` (desktop), and `BottomNav` (mobile).
  - Uses `useStoreHydration()` to avoid rendering real content until the persisted store has hydrated.
- Route titles / metadata live in `src/routes/routeMeta.ts` (used by the header).

### State management (primary)
- Global app state is managed by a persisted **Zustand** store in `src/store/useAppStore.ts`.
  - Seed data comes from `src/data/seed.json` via `src/data/seed.ts`.
  - The store is persisted (see `persist(...)` configuration) and includes most user-facing state (preferences, notifications, metrics, etc.).
- Derived values live in `src/store/selectors.ts` (e.g., “Life Pulse Score” and the daily insight).

### UI, charts, styling
- Reusable UI primitives are in `src/components/ui/` (Button, Modal, Dropdown, etc.).
- Feature/dashboard components are in `src/components/`.
- Recharts visualizations are in `src/components/charts/`.
  - Chart color tokens are centralized in `src/theme/useChartTheme.ts` (light/dark aware).
- Tailwind setup:
  - Tokens: `tailwind.config.cjs` defines `colors.lp.*` (primary/secondary/accent/alert, etc.).
  - Global styles: `src/styles/globals.css`.

### Data model
- Core domain and store typing lives in `src/data/types.ts`.

### Note: legacy/alternate data path
- `src/context/AppDataContext.tsx` + `src/data/dummyData.ts` implement an alternate “dummy data” context.
  - As of the current codebase, this context is **not wired into** `src/main.tsx` / `src/App.tsx`; the app primarily uses the Zustand store + `seed.json`.