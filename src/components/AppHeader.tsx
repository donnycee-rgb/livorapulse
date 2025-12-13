import { Bell, Moon, Sun, ChevronDown, Settings, User, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import Avatar from './Avatar'
import Dropdown, { DropdownItem } from './ui/Dropdown'
import Modal from './ui/Modal'
import Button from './ui/Button'

import { useAppStore } from '../store/useAppStore'
import { getTitleForPath } from '../routes/routeMeta'

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()

  const user = useAppStore((s) => s.user)
  const theme = useAppStore((s) => s.preferences.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  const notifications = useAppStore((s) => s.notifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)
  const resetAll = useAppStore((s) => s.resetAll)

  const [resetOpen, setResetOpen] = useState(false)

  const title = useMemo(() => getTitleForPath(location.pathname), [location.pathname])
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/70 backdrop-blur border-b border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex items-center gap-3"
          onClick={() => navigate('/')}
          aria-label="Go to dashboard"
        >
          <div className="h-9 w-9 rounded-xl bg-lp-primary/15 flex items-center justify-center border border-lp-primary/30">
            <div className="h-4 w-4 rounded-full bg-lp-primary" />
          </div>
          <div className="text-left">
            <div className="text-lg font-bold leading-5 text-black/90 dark:text-white">LivoraPulse</div>
            <div className="text-xs text-black/50 dark:text-white/50 -mt-0.5">{title}</div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Dropdown
            widthClassName="w-[340px]"
            button={
              <button
                type="button"
                className="relative h-9 w-9 rounded-xl bg-white dark:bg-slate-950 shadow-card border border-black/10 dark:border-white/10 hover:scale-[1.02] active:scale-[0.98] transition"
                aria-label="Notifications"
              >
                <Bell className="mx-auto text-black/80 dark:text-white/85" size={18} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-lp-alert text-white text-[11px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            }
          >
            <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Notifications</div>
              <button
                type="button"
                className="text-xs font-semibold text-lp-accent hover:underline"
                onClick={() => {
                  markAllNotificationsRead()
                  toast.success('All notifications marked as read')
                }}
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-black/60 dark:text-white/60">No notifications.</div>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id)
                      toast(n.title)
                    }}
                    className={
                      'w-full text-left px-4 py-3 border-b border-black/10 dark:border-white/10 ' +
                      'hover:bg-black/5 dark:hover:bg-white/10 transition'
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-black/85 dark:text-white/90">
                          {n.title}
                        </div>
                        <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">{n.message}</div>
                        <div className="text-[11px] text-black/45 dark:text-white/45 mt-1">{formatTime(n.timestamp)}</div>
                      </div>
                      {!n.read && <div className="mt-1 h-2 w-2 rounded-full bg-lp-accent" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Dropdown>

          {/* Theme */}
          <button
            type="button"
            onClick={() => {
              toggleTheme()
              toast.success(theme === 'dark' ? 'Light mode enabled' : 'Dark mode enabled')
            }}
            className="h-9 w-9 rounded-xl bg-white dark:bg-slate-950 shadow-card border border-black/10 dark:border-white/10 hover:scale-[1.02] active:scale-[0.98] transition"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="mx-auto text-white/85" size={18} />
            ) : (
              <Moon className="mx-auto text-black/80" size={18} />
            )}
          </button>

          {/* Profile menu */}
          <Dropdown
            widthClassName="w-56"
            button={
              <button
                type="button"
                className="h-9 rounded-xl bg-white dark:bg-slate-950 shadow-card border border-black/10 dark:border-white/10 px-2 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition"
                aria-label="Profile menu"
              >
                <Avatar initials={user.avatarInitials} />
                <ChevronDown size={16} className="text-black/60 dark:text-white/60" />
              </button>
            }
          >
            <div className="px-4 py-3 border-b border-black/10 dark:border-white/10">
              <div className="text-sm font-semibold text-black/85 dark:text-white/90">{user.name}</div>
              <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">{user.email}</div>
            </div>
            <DropdownItem onClick={() => navigate('/profile')}>
              <div className="flex items-center gap-2">
                <User size={16} />
                Profile
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/settings')}>
              <div className="flex items-center gap-2">
                <Settings size={16} />
                Settings
              </div>
            </DropdownItem>
            <DropdownItem onClick={() => setResetOpen(true)}>
              <div className="flex items-center gap-2 text-lp-alert">
                <RotateCcw size={16} />
                Reset data
              </div>
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset local data?">
        <div className="text-sm text-black/70 dark:text-white/70">
          This will restore the initial dataset and clear your local changes.
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetAll()
              setResetOpen(false)
              toast.success('Reset complete')
              // keep the user on a valid page
              if (location.pathname !== '/') navigate('/')
            }}
          >
            Reset
          </Button>
        </div>
      </Modal>
    </header>
  )
}
