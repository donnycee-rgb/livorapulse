import { Activity, BarChart3, Leaf, MonitorSmartphone, Smile, Home, UtensilsCrossed } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Home',      Icon: Home              },
  { to: '/physical',    label: 'Physical',  Icon: Activity          },
  { to: '/nutrition',   label: 'Nutrition', Icon: UtensilsCrossed   },
  { to: '/digital',     label: 'Digital',   Icon: MonitorSmartphone },
  { to: '/productivity',label: 'Work',      Icon: BarChart3         },
  { to: '/mood',        label: 'Mood',      Icon: Smile             },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-slate-900 border-t border-black/10 dark:border-white/10">
      <div className="flex items-center justify-around px-1 py-1">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center gap-0.5 py-1.5">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={isActive ? 'text-lp-primary' : 'text-black/40 dark:text-white/40'}
                />
                <span className={`text-[10px] font-semibold leading-none transition-colors duration-200 ${isActive ? 'text-lp-primary' : 'text-black/40 dark:text-white/40'}`}>
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