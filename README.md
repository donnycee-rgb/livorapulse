# LivoraPulse — Frontend

**LivoraPulse** is a free web-based wellness tracker built for Kenya and
Africa. It brings six areas of wellbeing — physical activity, nutrition,
digital usage, productivity, mood and eco habits — into one daily
**LifePulse Score**, and shows people patterns in their own data that they can
act on.

Live: <https://livorapulse.netlify.app> ·
Backend: [livorapulse_backend](https://github.com/donnycee-rgb/livorapulse_backend)

**Stack:** React 18 · Vite · TypeScript · Tailwind CSS · Recharts ·
Zustand · React Router · Framer Motion. Deployed on Netlify.

---

## Features

| Page | What people can do |
| --- | --- |
| **Dashboard** | See today's LifePulse Score, streak, and each area at a glance; quick daily check-in |
| **Physical** | Steps, distance, calories and sleep; GPS walk tracking with route replay (walks recorded offline sync later) |
| **Nutrition** | Log meals from a Kenyan / East African food list (ugali, sukuma wiki, chapati…), with Open Food Facts as a fallback; water intake |
| **Digital** | Screen time and app usage by category |
| **Productivity** | Focus and study timers, daily goals |
| **Mood** | Mood and stress over time; cycle tracking (period logging, calendar, and predictions from a smart average of recent cycles) |
| **Environment** | Eco actions, transport choices and carbon impact |
| **Insights** | Patterns found in the person's data, and 14-day experiments to test them |
| **Health summary** | A summary of recent weeks, as PDF or a share link that expires |
| **AI coach** | Ask questions; answers use the person's own data |
| **Account** | Email or Google sign-in, email confirmation code, password reset, profile, settings, light/dark theme |

All data comes from the backend; nothing is stored only in the browser except
the session and pending offline walks.

---

## Running it locally

**Needs:** Node.js 20+ and the [backend](https://github.com/donnycee-rgb/livorapulse_backend)
running on port 4000.

```bash
npm install
npm run dev        # http://localhost:5173
```

In development, Vite forwards `/api` to `http://localhost:4000`, so no settings
are needed. Without the backend, the landing page loads but signing in won't
work.

### Environment variables

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | The backend's address in production (e.g. `https://api.example.com`). Leave empty locally to use the Vite proxy |

## Scripts

| Script | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | Type-check only |

---

## Project layout

```
src/
  App.tsx          routes (public, signed-in, and shared-summary pages)
  pages/           one file per page
  components/      layout, navigation, charts, modals, UI pieces
  api/             backend client: tokens, refresh, offline handling
  store/           Zustand stores (auth and app data)
  hooks/           theme sync, offline walk sync, timers
  data/, utils/    static data and helpers
  theme/, styles/  Tailwind theme and global styles
public/
  _redirects       SPA fallback for Netlify
  _headers         security headers (HSTS etc.)
  robots.txt, sitemap.xml, llms.txt
```

## Deploying (Netlify)

- Build command: `npm run build` · Publish directory: `dist`
- Set `VITE_API_URL` to the backend's address.
- On the backend, set `FRONTEND_URL` to the Netlify address so CORS and
  emailed links work.
