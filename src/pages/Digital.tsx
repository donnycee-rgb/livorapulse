import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import Card from '../components/Card'
import PageHero from '../components/PageHero'
import ChartCard from '../components/charts/ChartCard'
import AppUsagePieChart from '../components/charts/AppUsagePieChart'
import ScreenTimeLineChart from '../components/charts/ScreenTimeLineChart'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Toggle from '../components/ui/Toggle'

import type { AppCategory } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { formatMinutesToHM } from '../utils/format'
import { getDayKey } from '../utils/date'

export default function Digital() {
  const digital = useAppStore((s) => s.digital)
  const addScreenSession = useAppStore((s) => s.addScreenSession)
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode)

  const day = getDayKey()
  const todayScreen = useAppStore((s) => s.digital.weeklyScreenTimeMin.find((x) => x.day === day)?.minutes ?? 0)

  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<AppCategory>('Social')
  const [minutes, setMinutes] = useState('15')

  const recentSessions = useMemo(() => digital.screenSessions.slice(0, 8), [digital.screenSessions])

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHero
        title="Digital Usage"
        subtitle="Screen time, categories, and focus controls."
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Add screen session
            </Button>
          </div>
        }
      />

      <Card className="p-4 md:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">Today</div>
          <div className="mt-1 text-3xl font-extrabold text-black/85 dark:text-white/90 tracking-tight">
            {formatMinutesToHM(todayScreen)}
          </div>
          <div className="text-xs text-black/45 dark:text-white/55 mt-1">Total screen time</div>
        </div>

          <div className="w-full md:max-w-sm">
            <Toggle
              checked={digital.focusMode}
              onChange={() => {
                toggleFocusMode()
                toast.success(digital.focusMode ? 'Focus Mode disabled' : 'Focus Mode enabled')
              }}
              label="Focus Mode"
              description="Reduces distractions and boosts focus scoring"
            />
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">Recent sessions</div>
          <div className="mt-2 grid md:grid-cols-2 gap-2">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className={
                  'rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3 ' +
                  'transition-transform duration-200 ease-out hover:-translate-y-px hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]'
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-black/85 dark:text-white/90">{s.category}</div>
                    <div className="text-[11px] text-black/45 dark:text-white/55 mt-0.5">
                      {new Date(s.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-base font-extrabold text-black/80 dark:text-white/85">{s.minutes}m</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="App Usage Categories" subtitle="Distribution by category">
          <AppUsagePieChart data={digital.appUsageCategoriesMin} />
        </ChartCard>

        <ChartCard title="Screen Time Trend" subtitle="Minutes per day">
          <ScreenTimeLineChart data={digital.weeklyScreenTimeMin} />
        </ChartCard>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add screen session">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2">Category</div>
            <div className="flex flex-wrap gap-2">
              {(['Social', 'Productive', 'Entertainment'] as AppCategory[]).map((c) => (
                <Button
                  key={c}
                  variant={category === c ? 'secondary' : 'ghost'}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          <Input label="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="numeric" />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const m = Math.max(1, Math.round(Number(minutes) || 0))
              addScreenSession({ category, minutes: m })
              setOpen(false)
              toast.success('Session added')
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}
