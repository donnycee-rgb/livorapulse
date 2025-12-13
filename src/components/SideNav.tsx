import { Activity, BarChart3, Leaf, MonitorSmartphone, Smile, Home } from 'lucide-react'
import NavItem from './NavItem'

export default function SideNav() {
  return (
    <aside className="hidden md:block md:w-64">
      <div className="sticky top-[64px] p-3">
        <div className="rounded-2xl bg-white shadow-card border border-black/5 p-2">
          <div className="px-2 py-2 text-xs font-semibold tracking-wide text-black/50">
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
        </div>

        <div className="mt-3 rounded-2xl bg-lp-secondary text-white shadow-card p-4">
          <div className="text-sm font-semibold">Prototype Mode</div>
          <div className="text-xs text-white/80 mt-1">
            All metrics are dummy data.
          </div>
        </div>
      </div>
    </aside>
  )
}
