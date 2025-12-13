import { Activity, BarChart3, Leaf, MonitorSmartphone, Smile, Home } from 'lucide-react'
import NavItem from './NavItem'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-slate-950 border-t border-black/10 dark:border-white/10">
      <div className="px-2 py-2 grid grid-cols-6 gap-1">
        <NavItem to="/" label="Home" Icon={Home} compact />
        <NavItem to="/physical" label="Physical" Icon={Activity} compact />
        <NavItem to="/digital" label="Digital" Icon={MonitorSmartphone} compact />
        <NavItem to="/productivity" label="Work" Icon={BarChart3} compact />
        <NavItem to="/environment" label="Eco" Icon={Leaf} compact />
        <NavItem to="/mood" label="Mood" Icon={Smile} compact />
      </div>
    </nav>
  )
}
