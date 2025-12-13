import { Activity, BarChart3, Leaf, MonitorSmartphone, Smile, Home, Settings, User } from 'lucide-react'
import NavItem from './NavItem'

export default function SideNav() {
  return (
    <aside className="hidden md:block md:w-64">
      <div className="sticky top-[64px] p-3">
        <div className="rounded-2xl bg-white dark:bg-slate-950 shadow-card border border-black/10 dark:border-white/10 p-2">
          <div className="px-2 py-2 text-xs font-semibold tracking-wide text-black/50 dark:text-white/50">
            NAVIGATION
          </div>
          <div className="flex flex-col gap-1">
            <NavItem to="/" label="Dashboard" Icon={Home} />
            <NavItem to="/physical" label="Physical" Icon={Activity} />
            <NavItem to="/digital" label="Digital" Icon={MonitorSmartphone} />
            <NavItem to="/productivity" label="Productivity" Icon={BarChart3} />
            <NavItem to="/environment" label="Environment" Icon={Leaf} />
            <NavItem to="/mood" label="Mood" Icon={Smile} />
          </div>

          <div className="my-2 border-t border-black/10 dark:border-white/10" />

          <div className="flex flex-col gap-1">
            <NavItem to="/profile" label="Profile" Icon={User} />
            <NavItem to="/settings" label="Settings" Icon={Settings} />
          </div>
        </div>
      </div>
    </aside>
  )
}
