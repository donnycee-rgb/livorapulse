import { Bell, Settings } from 'lucide-react'
import Avatar from './Avatar'
import { useAppData } from '../context/AppDataContext'

export default function AppHeader() {
  const { data } = useAppData()

  return (
    <header className="sticky top-0 z-30 bg-lp-neutral/80 backdrop-blur border-b border-black/5">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-lp-primary/15 flex items-center justify-center border border-lp-primary/25">
            <div className="h-4 w-4 rounded-full bg-lp-primary" />
          </div>
          <div>
            <div className="text-lg font-bold leading-5">LivoraPulse</div>
            <div className="text-xs text-black/55 -mt-0.5">Life analytics prototype</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Placeholders for notifications/settings */}
          <button
            type="button"
            className="h-9 w-9 rounded-xl bg-white shadow-card border border-black/5 hover:scale-[1.02] active:scale-[0.98] transition"
            aria-label="Notifications"
            title="Notifications (placeholder)"
          >
            <Bell className="mx-auto" size={18} />
          </button>

          <button
            type="button"
            className="h-9 w-9 rounded-xl bg-white shadow-card border border-black/5 hover:scale-[1.02] active:scale-[0.98] transition"
            aria-label="Settings"
            title="Settings (placeholder)"
          >
            <Settings className="mx-auto" size={18} />
          </button>

          <div className="ml-1" title={`Profile (placeholder): ${data.user.name}`}>
            <Avatar initials={data.user.avatarInitials} />
          </div>
        </div>
      </div>
    </header>
  )
}
