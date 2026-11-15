import { lazy } from 'react'

// Signed-in pages are split into their own chunks so the public landing page
// doesn't download charts and maps up front (faster Core Web Vitals). Once
// someone is signed in, preloadPages() fetches them all in the background, so
// moving between pages doesn't wait for a download.

const loaders = {
  Dashboard: () => import('./Dashboard'),
  Digital: () => import('./Digital'),
  Environment: () => import('./Environment'),
  Insights: () => import('./Insights'),
  HealthSummary: () => import('./HealthSummary'),
  Mood: () => import('./Mood'),
  Nutrition: () => import('./Nutrition'),
  Physical: () => import('./Physical'),
  Productivity: () => import('./Productivity'),
  Profile: () => import('./Profile'),
  Settings: () => import('./Settings'),
}

export const Dashboard = lazy(loaders.Dashboard)
export const Digital = lazy(loaders.Digital)
export const Environment = lazy(loaders.Environment)
export const Insights = lazy(loaders.Insights)
export const HealthSummary = lazy(loaders.HealthSummary)
export const Mood = lazy(loaders.Mood)
export const Nutrition = lazy(loaders.Nutrition)
export const Physical = lazy(loaders.Physical)
export const Productivity = lazy(loaders.Productivity)
export const Profile = lazy(loaders.Profile)
export const Settings = lazy(loaders.Settings)

let preloaded = false

/** Download every signed-in page in the background (once). Errors are ignored: the page loads normally when opened. */
export function preloadPages(): void {
  if (preloaded) return
  preloaded = true
  for (const load of Object.values(loaders)) load().catch(() => { preloaded = false })
}
