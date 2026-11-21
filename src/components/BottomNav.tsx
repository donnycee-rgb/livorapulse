import { Activity, MonitorSmartphone, Smile, Home, Timer, UtensilsCrossed } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Home',      Icon: Home              },
  { to: '/physical',    label: 'Physical',  Icon: Activity          },
  { to: '/nutrition',   label: 'Nutrition', Icon: UtensilsCrossed   },
  { to: '/digital',     label: 'Digital',   Icon: MonitorSmartphone },
  { to: '/productivity',label: 'Focus',     Icon: Timer             },
  { to: '/mood',        label: 'Mood',      Icon: Smile             },
]

/** Phones: the six main pages along the bottom, the current one in brand green */
export default function BottomNav() {
  return (
    <nav aria-label="Main"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-ui-card/90 backdrop-blur-xl border-t border-ui-line/[0.07] bottom-nav-safe">
      <div className="flex items-stretch justify-around px-1">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className="flex-1 min-w-0">
            {({ isActive }) => (
              <div className="relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-h-[56px]">
                {/* the marker over the current page */}
                <span className={clsx('absolute top-0 h-[3px] w-7 rounded-full transition-all duration-300',
                  isActive ? 'bg-lp-primary lp-glow opacity-100' : 'opacity-0')} aria-hidden />
                <Icon size={21} strokeWidth={isActive ? 2.3 : 1.8}
                  className={clsx('transition-colors', isActive ? 'text-lp-primary' : 'text-ui-muted')} />
                <span className={clsx('text-[10.5px] font-semibold leading-none truncate max-w-full transition-colors',
                  isActive ? 'text-lp-primary' : 'text-ui-muted')}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
