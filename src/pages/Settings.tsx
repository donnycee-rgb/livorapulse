import { useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../components/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Toggle from '../components/ui/Toggle'
import { useAppStore } from '../store/useAppStore'

export default function Settings() {
  const prefs = useAppStore((s) => s.preferences)
  const setUnits = useAppStore((s) => s.setUnits)
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const resetAll = useAppStore((s) => s.resetAll)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)

  const [resetOpen, setResetOpen] = useState(false)

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="text-lg font-bold text-lp-secondary dark:text-white">Settings</div>
        <div className="text-sm text-black/60 dark:text-white/60">
          Preferences, notifications, and local data controls.
        </div>
      </div>

      <Card className="p-4 md:p-6 space-y-5">
        <Toggle
          checked={prefs.theme === 'dark'}
          onChange={() => {
            toggleTheme()
            toast.success(prefs.theme === 'dark' ? 'Light mode enabled' : 'Dark mode enabled')
          }}
          label="Theme"
          description="Switch between light and dark mode"
        />

        <div className="border-t border-black/10 dark:border-white/10 pt-5">
          <div className="text-sm font-semibold">Units</div>
          <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">Choose metric or imperial units</div>
          <div className="mt-3 flex gap-2">
            <Button
              variant={prefs.units === 'metric' ? 'secondary' : 'ghost'}
              onClick={() => {
                setUnits('metric')
                toast.success('Units set to metric')
              }}
            >
              Metric (km)
            </Button>
            <Button
              variant={prefs.units === 'imperial' ? 'secondary' : 'ghost'}
              onClick={() => {
                setUnits('imperial')
                toast.success('Units set to imperial')
              }}
            >
              Imperial (miles)
            </Button>
          </div>
        </div>

        <div className="border-t border-black/10 dark:border-white/10 pt-5">
          <Toggle
            checked={prefs.notificationsEnabled}
            onChange={(next) => {
              setNotificationsEnabled(next)
              toast.success(next ? 'Notifications enabled' : 'Notifications muted')
            }}
            label="Notifications"
            description="Enable in-app notifications"
          />

          <div className="mt-3">
            <Button
              variant="ghost"
              onClick={() => {
                markAllNotificationsRead()
                toast.success('All notifications marked as read')
              }}
            >
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="border-t border-black/10 dark:border-white/10 pt-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Reset local data</div>
            <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">
              Clears your locally stored metrics and restores the initial state.
            </div>
          </div>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            Reset
          </Button>
        </div>
      </Card>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset local data?">
        <div className="text-sm text-black/70 dark:text-white/70">
          This will remove your current changes and restore the initial dataset. This action cannot be undone.
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
              toast.success('Data reset complete')
            }}
          >
            Reset
          </Button>
        </div>
      </Modal>
    </div>
  )
}
