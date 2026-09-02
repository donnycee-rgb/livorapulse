import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Activity, MonitorSmartphone, BarChart3,
  Leaf, Heart, User, Settings, ChevronRight, UtensilsCrossed,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../store/useAppStore'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', Icon: Home },
    ],
  },
  {
    label: 'Track',
    items: [
      { to: '/physical',     label: 'Physical',     Icon: Activity          },
      { to: '/nutrition',    label: 'Nutrition',    Icon: UtensilsCrossed   },
      { to: '/digital',      label: 'Digital',      Icon: MonitorSmartphone },
      { to: '/productivity', label: 'Productivity', Icon: BarChart3         },
      { to: '/environment',  label: 'Environment',  Icon: Leaf              },
      { to: '/mood',         label: 'Mood',         Icon: Heart             },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile',  label: 'Profile',  Icon: User     },
      { to: '/settings', label: 'Settings', Icon: Settings },
    ],
  },
]

const STORAGE_KEY = 'lp_nav_expanded'

export default function SideNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false' } catch { return true }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(expanded)) } catch { /* noop */ }
  }, [expanded])

  const w = expanded ? 240 : 72

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 overflow-hidden"
      style={{
        width: w,
        minWidth: w,
        transition: 'width 0.25s ease-in-out, min-width 0.25s ease-in-out',
      }}
    >
      <div
        className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] shadow-card overflow-hidden h-[calc(100vh-64px-40px)]"
        style={{ width: w, minWidth: w, transition: 'width 0.25s ease-in-out' }}
      >
        {/* Toggle button */}
        <div className={clsx('flex pt-3 pb-1 px-3', expanded ? 'justify-end' : 'justify-center')}>
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/70 dark:hover:text-white/70 transition-all duration-200"
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            <ChevronRight
              size={16}
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease-in-out',
              }}
            />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 flex flex-col overflow-hidden px-3 pb-2">
          <div className="space-y-0.5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                {/* Section label — only when expanded */}
                <div
                  className="px-2 pb-0.5 overflow-hidden"
                  style={{
                    maxHeight: expanded ? '32px' : '0px',
                    opacity: expanded ? 1 : 0,
                    marginTop: expanded ? '12px' : '8px',
                    transition: 'max-height 0.2s ease, opacity 0.2s ease, margin-top 0.2s ease',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/25">
                    {section.label}
                  </span>
                </div>

                {section.items.map(({ to, label, Icon }) => {
                  const active = location.pathname === to
                  return (
                    <button
                      key={to}
                      type="button"
                      onClick={() => navigate(to)}
                      title={!expanded ? label : undefined}
                      className={clsx(
                        'w-full flex items-center rounded-xl transition-all duration-200 group',
                        expanded ? 'gap-3 px-3 py-2' : 'gap-0 px-0 py-2 justify-center',
                        active
                          ? 'bg-lp-primary/10 dark:bg-lp-primary/15 text-lp-primary'
                          : 'text-black/55 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/[0.07] hover:text-black/80 dark:hover:text-white/80',
                      )}
                    >
                      {/* Icon */}
                      <div className={clsx(
                        'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                        active
                          ? 'bg-lp-primary/15 dark:bg-lp-primary/20'
                          : 'group-hover:bg-black/5 dark:group-hover:bg-white/[0.07]',
                      )}>
                        <Icon size={15} className={active ? 'text-lp-primary' : ''} />
                      </div>

                      {/* Label — CSS transition, no Framer Motion */}
                      <span
                        className="text-sm font-medium whitespace-nowrap overflow-hidden leading-none"
                        style={{
                          maxWidth: expanded ? '160px' : '0px',
                          opacity: expanded ? 1 : 0,
                          transition: 'max-width 0.2s ease, opacity 0.15s ease',
                        }}
                      >
                        {label}
                      </span>

                      {/* Active dot */}
                      {active && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-lp-primary flex-shrink-0"
                          style={{
                            opacity: expanded ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className={clsx(
          'flex-shrink-0 border-t border-black/[0.06] dark:border-white/[0.06] p-3 flex items-center',
          expanded ? 'gap-3' : 'justify-center',
        )}>
          <div className="w-8 h-8 rounded-xl bg-lp-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
          </div>
          <div
            className="overflow-hidden"
            style={{
              maxWidth: expanded ? '160px' : '0px',
              opacity: expanded ? 1 : 0,
              transition: 'max-width 0.2s ease, opacity 0.15s ease',
            }}
          >
            <div className="text-xs font-semibold text-black/80 dark:text-white/80 truncate whitespace-nowrap">{user.name}</div>
            <div className="text-[10px] text-black/40 dark:text-white/35 truncate whitespace-nowrap">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}