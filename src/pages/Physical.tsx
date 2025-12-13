import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import Card from '../components/Card'
import ChartCard from '../components/charts/ChartCard'
import CaloriesLineChart from '../components/charts/CaloriesLineChart'
import DistanceLineChart from '../components/charts/DistanceLineChart'
import SleepAreaChart from '../components/charts/SleepAreaChart'
import StepsBarChart from '../components/charts/StepsBarChart'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'

import { useAppStore } from '../store/useAppStore'
import { getDayKey } from '../utils/date'
import { formatDistance, formatNumber } from '../utils/format'

export default function Physical() {
  const units = useAppStore((s) => s.preferences.units)

  const physical = useAppStore((s) => s.physical)
  const addActivity = useAppStore((s) => s.addActivity)
  const updateSleepForToday = useAppStore((s) => s.updateSleepForToday)

  const day = getDayKey()
  const todaySteps = physical.weeklySteps.find((x) => x.day === day)?.steps ?? 0
  const todayDistance = physical.weeklyDistanceKm.find((x) => x.day === day)?.km ?? 0
  const todayCalories = physical.weeklyCaloriesKcal.find((x) => x.day === day)?.kcal ?? 0
  const todaySleep = physical.sleepHours.find((x) => x.day === day)?.hours ?? 7

  const [open, setOpen] = useState(false)
  const [steps, setSteps] = useState('1200')
  const [distanceKm, setDistanceKm] = useState('0.8')
  const [caloriesKcal, setCaloriesKcal] = useState('45')
  const [note, setNote] = useState('')

  const recent = useMemo(() => physical.activityLog.slice(0, 6), [physical.activityLog])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-lp-secondary dark:text-white">Physical Activity</div>
          <div className="text-sm text-black/60 dark:text-white/60">
            Steps, distance, calories, and sleep.
          </div>
        </div>

        <Button variant="secondary" onClick={() => setOpen(true)}>
          Add activity
        </Button>
      </div>

      <Card className="p-4 md:p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
            <div className="text-xs text-black/55 dark:text-white/55">Today’s steps</div>
            <div className="mt-1 text-lg font-bold text-black/85 dark:text-white/90">{formatNumber(todaySteps)}</div>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
            <div className="text-xs text-black/55 dark:text-white/55">Distance</div>
            <div className="mt-1 text-lg font-bold text-black/85 dark:text-white/90">{formatDistance(todayDistance, units)}</div>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
            <div className="text-xs text-black/55 dark:text-white/55">Calories</div>
            <div className="mt-1 text-lg font-bold text-black/85 dark:text-white/90">{todayCalories} kcal</div>
          </div>
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
            <div className="text-xs text-black/55 dark:text-white/55">Sleep (hours)</div>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min={4}
                max={10}
                step={0.1}
                value={todaySleep}
                onChange={(e) => updateSleepForToday(Number(e.target.value))}
                className="w-full"
                aria-label="Sleep hours"
              />
              <div className="h-9 w-14 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center font-bold">
                {todaySleep.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">Recent activity</div>
          <div className="mt-2 grid md:grid-cols-2 gap-2">
            {recent.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-black/85 dark:text-white/90">
                      {a.note?.trim() ? a.note : 'Activity'}
                    </div>
                    <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">
                      {new Date(a.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/60">
                    {formatNumber(a.steps)} steps
                  </div>
                </div>
                <div className="mt-2 text-xs text-black/60 dark:text-white/60">
                  {formatDistance(a.distanceKm, units)} • {a.caloriesKcal} kcal
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Steps" subtitle="Weekly trend">
          <StepsBarChart data={physical.weeklySteps} />
        </ChartCard>

        <ChartCard title="Distance" subtitle="Weekly trend">
          <DistanceLineChart data={physical.weeklyDistanceKm} />
        </ChartCard>

        <ChartCard title="Calories" subtitle="Weekly trend">
          <CaloriesLineChart data={physical.weeklyCaloriesKcal} />
        </ChartCard>

        <ChartCard title="Sleep" subtitle="Hours per night">
          <SleepAreaChart data={physical.sleepHours} />
        </ChartCard>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add activity">
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Steps" value={steps} onChange={(e) => setSteps(e.target.value)} inputMode="numeric" />
          <Input
            label={units === 'imperial' ? 'Distance (km, stored internally)' : 'Distance (km)'}
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            inputMode="decimal"
          />
          <Input label="Calories (kcal)" value={caloriesKcal} onChange={(e) => setCaloriesKcal(e.target.value)} inputMode="numeric" />
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const s = Math.max(0, Math.round(Number(steps) || 0))
              const d = Math.max(0, Number(distanceKm) || 0)
              const c = Math.max(0, Math.round(Number(caloriesKcal) || 0))
              addActivity({ steps: s, distanceKm: d, caloriesKcal: c, note: note.trim() || undefined })
              setOpen(false)
              toast.success('Activity added')
              setNote('')
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}
