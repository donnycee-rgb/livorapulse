import { Bell, Sun, Moon, ChevronDown, Settings, User, LogOut, Laptop } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { selectLifePulseScore } from '../store/selectors'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getScoreColor(score: number) {
  if (score >= 80) return '#4CAF50'
  if (score >= 60) return '#FFA500'
  if (score >= 40) return '#00BCD4'
  return '#FF6B6B'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (name.slice(0, 2)).toUpperCase()
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Animated pulse ECG logo
// ---------------------------------------------------------------------------
function PulseLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="#4CAF50" fillOpacity="0.12" />
      <rect width="36" height="36" rx="10" stroke="#4CAF50" strokeOpacity="0.25" strokeWidth="1" />
      <polyline
        points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18"
        stroke="#4CAF50"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// User avatar — photo or initials
// ---------------------------------------------------------------------------
function UserAvatar({ name, photoUrl, size = 'sm' }: {
  name: string
  photoUrl?: string | null
  size?: 'sm' | 'md'
}) {
  const initials = getInitials(name)
  const cls = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : 'w-9 h-9 text-sm'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={clsx(cls, 'rounded-xl object-cover flex-shrink-0 ring-2 ring-lp-primary/20')}
      />
    )
  }

  return (
    <div className={clsx(
      cls,
      'rounded-xl bg-lp-primary flex items-center justify-center',
      'text-white font-bold flex-shrink-0',
      'shadow-sm shadow-lp-primary/30',
    )}>
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notification dropdown
// ---------------------------------------------------------------------------
function NotificationDropdown() {
  const notifications = useAppStore((s) => s.notifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-black/55 dark:text-white/55 hover:bg-black/[0.08] dark:hover:bg-white/[0.10] hover:text-black/80 dark:hover:text-white/80 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lp-alert text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-11 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-black/80 dark:text-white/85">Notifications</span>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-lp-alert/15 text-lp-alert text-[10px] font-bold">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => { markAllNotificationsRead(); toast.success('All read') }}
                  className="text-xs font-semibold text-lp-accent hover:text-lp-accent/70 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={20} className="mx-auto text-black/20 dark:text-white/20 mb-2" />
                  <p className="text-sm text-black/40 dark:text-white/35">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { markNotificationRead(n.id); setOpen(false) }}
                    className="w-full text-left px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        'w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-colors',
                        n.read ? 'bg-black/15 dark:bg-white/15' : 'bg-lp-accent',
                      )} />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-black/80 dark:text-white/80">{n.title}</div>
                        <div className="text-xs text-black/45 dark:text-white/40 mt-0.5 truncate">{n.message}</div>
                        <div className="text-[10px] text-black/30 dark:text-white/25 mt-1">{formatTime(n.timestamp)}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile dropdown
// ---------------------------------------------------------------------------
function ProfileDropdown() {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.10] transition-all duration-200"
        aria-label="Profile menu"
      >
        <UserAvatar name={user.name} photoUrl={user.avatarUrl} size="sm" />
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={13} className="text-black/40 dark:text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-11 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center gap-3">
              <UserAvatar name={user.name} photoUrl={user.avatarUrl} size="md" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-black/85 dark:text-white/90 truncate">{user.name}</div>
                <div className="text-xs text-black/40 dark:text-white/35 truncate">{user.email}</div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5 space-y-0.5">
              {[
                { icon: <User size={14} />, label: 'Profile', to: '/profile' },
                { icon: <Settings size={14} />, label: 'Settings', to: '/settings' },
              ].map(({ icon, label, to }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => { navigate(to); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-black/65 dark:text-white/60 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] hover:text-black/85 dark:hover:text-white/85 transition-all duration-150"
                >
                  <span className="text-black/35 dark:text-white/35">{icon}</span>
                  {label}
                </button>
              ))}

              <div className="my-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

              <button
                type="button"
                onClick={() => {
                  logout()
                  toast.success('Logged out')
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-lp-alert hover:bg-lp-alert/10 transition-all duration-150"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppHeader root
// ---------------------------------------------------------------------------
export default function AppHeader() {
  const theme = useAppStore((s) => s.preferences.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const score = useAppStore(selectLifePulseScore)
  const scoreColor = getScoreColor(score)
  const navigate = useNavigate()

  const streak = parseInt(localStorage.getItem('lp_streak') || '0', 10)

  return (
    <header className="h-16 flex-shrink-0 flex items-center border-b border-black/[0.06] dark:border-white/[0.06] bg-white/95 dark:bg-[#0a0f1a]/95 backdrop-blur-md z-30">
      <div className="w-full max-w-[1400px] mx-auto px-4 flex items-center justify-between gap-4">

        {/* Left — logo + wordmark */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 group flex-shrink-0"
          aria-label="Go to dashboard"
        >
          <PulseLogo />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[15px] font-black text-black/85 dark:text-white/90 tracking-tight group-hover:text-lp-primary transition-colors duration-200">
              Livora<span className="text-lp-primary">Pulse</span>
            </span>
            <span className="text-[9px] font-semibold text-black/25 dark:text-white/20 uppercase tracking-widest mt-0.5">
              Wellness OS
            </span>
          </div>
        </button>

        {/* Center — score + streak */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Score pill */}
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-colors duration-300"
            style={{ backgroundColor: scoreColor + '10', borderColor: scoreColor + '28' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: scoreColor }}
            />
            <span className="text-xs font-black tabular-nums" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-[10px] text-black/30 dark:text-white/25 font-semibold">
              LifePulse Score
            </span>
          </div>

          {/* Streak pill — only shows if streak > 0 */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lp-primary/10 border border-lp-primary/20">
              <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
                <path
                  d="M5.5 0C4 3.5 2 5.5 2 8c0 1.93 1.57 3.5 3.5 3.5S9 9.93 9 8c0-1-.35-2-1.1-3C7.5 7 6.5 8 5.5 8c-.83 0-1.5-.67-1.5-1.5C4 4.5 5.5 1.5 5.5 0z"
                  fill="#4CAF50"
                />
              </svg>
              <span className="text-[11px] font-black text-lp-primary tabular-nums">{streak}</span>
              <span className="text-[10px] text-black/30 dark:text-white/25 font-semibold">day streak</span>
            </div>
          )}
        </div>

        {/* Right — theme + notifications + profile */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => {
              toggleTheme()
              toast.success(theme === 'dark' ? 'Light mode' : 'Dark mode')
            }}
            className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-black/50 dark:text-white/50 hover:bg-black/[0.08] dark:hover:bg-white/[0.10] hover:text-black/80 dark:hover:text-white/80 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : theme === 'light' ? <Moon size={15} /> : <Laptop size={15} />}
          </button>

          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}