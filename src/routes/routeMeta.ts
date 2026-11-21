import { Activity, FileText, Home, Leaf, Lightbulb, MonitorSmartphone, Settings, Smile, Timer, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type RouteMeta = {
  path: string
  title: string
  navLabel?: string
  Icon?: LucideIcon
}

// NOTE: `src/App.tsx` uses `/` for the marketing/landing page and `/dashboard` for the main app dashboard.
export const routes: RouteMeta[] = [
  { path: '/dashboard', title: 'Dashboard', navLabel: 'Dashboard', Icon: Home },
  { path: '/insights', title: 'Insights', navLabel: 'Insights', Icon: Lightbulb },
  { path: '/summary', title: 'Health summary', navLabel: 'Health summary', Icon: FileText },
  { path: '/physical', title: 'Physical Activity', navLabel: 'Physical', Icon: Activity },
  { path: '/digital', title: 'Digital Usage', navLabel: 'Digital', Icon: MonitorSmartphone },
  { path: '/productivity', title: 'Focus', navLabel: 'Focus', Icon: Timer },
  { path: '/environment', title: 'Green habits', navLabel: 'Green habits', Icon: Leaf },
  { path: '/mood', title: 'Mood & Mindset', navLabel: 'Mood', Icon: Smile },
  { path: '/profile', title: 'Profile', navLabel: 'Profile', Icon: User },
  { path: '/settings', title: 'Settings', navLabel: 'Settings', Icon: Settings },
]

export function getTitleForPath(pathname: string) {
  const exact = routes.find((r) => r.path === pathname)
  if (exact) return exact.title

  // Auth pages
  if (pathname === '/login') return 'Sign in · LivoraPulse'
  if (pathname === '/register') return 'Create an account · LivoraPulse'
  if (pathname === '/forgot-password') return 'Reset your password · LivoraPulse'
  if (pathname === '/reset-password') return 'Set a new password'
  if (pathname === '/verify-email') return 'Confirm your email'

  // Aliases / fallbacks
  if (pathname === '/') return 'LivoraPulse'
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/physical')) return 'Physical Activity'
  if (pathname.startsWith('/nutrition')) return 'Nutrition'
  if (pathname.startsWith('/welcome')) return 'Set up your profile'
  if (pathname.startsWith('/digital')) return 'Digital Usage'
  if (pathname.startsWith('/productivity')) return 'Focus'
  if (pathname.startsWith('/environment')) return 'Green habits'
  if (pathname.startsWith('/mood')) return 'Mood & Mindset'
  if (pathname.startsWith('/insights')) return 'Insights'
  if (pathname.startsWith('/summary')) return 'Health summary'
  if (pathname.startsWith('/profile')) return 'Profile'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'LivoraPulse'
}
