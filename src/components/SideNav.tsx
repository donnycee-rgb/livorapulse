import { Activity, BarChart3, Home, Leaf, MonitorSmartphone, Plus, Settings, Smile, User } from 'lucide-react'
import NavItem from './NavItem'

export default function SideNav() {
  return (
    <aside className="hidden md:block w-[72px]">
      <div className="sticky top-[72px] pt-2">
        <div className="rounded-3xl bg-white/90 dark:bg-slate-950/70 backdrop-blur shadow-card border border-black/10 dark:border-white/10 p-2">
          <div className="h-12 flex items-center justify-center">
            <div className="h-10 w-10 rounded-2xl bg-lp-primary/15 border border-lp-primary/30 flex items-center justify-center">
              <Plus className="text-lp-primary" size={18} />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <NavItem to="/dashboard" label="Dashboard" Icon={Home} compact />
            <NavItem to="/physical" label="Physical" Icon={Activity} compact />
            <NavItem to="/digital" label="Digital" Icon={MonitorSmartphone} compact />
            <NavItem to="/productivity" label="Productivity" Icon={BarChart3} compact />
            <NavItem to="/environment" label="Environment" Icon={Leaf} compact />
            <NavItem to="/mood" label="Mood" Icon={Smile} compact />
          </div>

          <div className="my-2 border-t border-black/10 dark:border-white/10" />

          <div className="flex flex-col gap-1">
            <NavItem to="/profile" label="Profile" Icon={User} compact />
            <NavItem to="/settings" label="Settings" Icon={Settings} compact />
          </div>
        </div>
      </div>
    </aside>
  )
}
