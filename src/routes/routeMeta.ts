import { Activity, BarChart3, Home, Leaf, MonitorSmartphone, Settings, Smile, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type RouteMeta = {
  path: string
  title: string
  navLabel?: string
  Icon?: LucideIcon
}

export const routes: RouteMeta[] = [
  { path: '/', title: 'Dashboard', navLabel: 'Home', Icon: Home },
  { path: '/physical', title: 'Physical Activity', navLabel: 'Physical', Icon: Activity },
  { path: '/digital', title: 'Digital Usage', navLabel: 'Digital', Icon: MonitorSmartphone },
  { path: '/productivity', title: 'Productivity', navLabel: 'Productivity', Icon: BarChart3 },
  { path: '/environment', title: 'Environment', navLabel: 'Environment', Icon: Leaf },
  { path: '/mood', title: 'Mood & Mindset', navLabel: 'Mood', Icon: Smile },
  { path: '/profile', title: 'Profile', navLabel: 'Profile', Icon: User },
  { path: '/settings', title: 'Settings', navLabel: 'Settings', Icon: Settings },
]

export function getTitleForPath(pathname: string) {
  const exact = routes.find((r) => r.path === pathname)
  if (exact) return exact.title
  if (pathname.startsWith('/physical')) return 'Physical Activity'
  if (pathname.startsWith('/digital')) return 'Digital Usage'
  if (pathname.startsWith('/productivity')) return 'Productivity'
  if (pathname.startsWith('/environment')) return 'Environment'
  if (pathname.startsWith('/mood')) return 'Mood & Mindset'
  if (pathname.startsWith('/profile')) return 'Profile'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'LivoraPulse'
}
