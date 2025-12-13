import { Pause, Play, Square, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import Card from '../components/Card'
import ChartCard from '../components/charts/ChartCard'
import FocusMinutesBarChart from '../components/charts/FocusMinutesBarChart'
import FocusSessionHistoryChart from '../components/charts/FocusSessionHistoryChart'
import StudySessionsBarChart from '../components/charts/StudySessionsBarChart'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

import { useInterval } from '../hooks/useInterval'
import { useAppStore } from '../store/useAppStore'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function Productivity() {
  const productivity = useAppStore((s) => s.productivity)
  const focusMode = useAppStore((s) => s.digital.focusMode)

  const startFocusTimer = useAppStore((s) => s.startFocusTimer)
  const pauseFocusTimer = useAppStore((s) => s.pauseFocusTimer)
  const resumeFocusTimer = useAppStore((s) => s.resumeFocusTimer)
  const tickFocusTimer = useAppStore((s) => s.tickFocusTimer)
  const endFocusTimer = useAppStore((s) => s.endFocusTimer)
  const addStudySession = useAppStore((s) => s.addStudySession)

  const [durationMin, setDurationMin] = useState(25)
  const [label, setLabel] = useState('Deep work')

  useInterval(() => tickFocusTimer(), productivity.focusTimer.status === 'running' ? 1000 : null)

  const progress = useMemo(() => {
    const total = productivity.focusTimer.durationSec
    const remaining = productivity.focusTimer.remainingSec
    if (total <= 0) return 0
    return Math.round(((total - remaining) / total) * 100)
  }, [productivity.focusTimer.durationSec, productivity.focusTimer.remainingSec])

  const recentSessions = useMemo(() => {
    return productivity.focusSessions.slice(0, 6).map((s) => ({
      label: new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      minutes: Math.max(1, Math.round(s.durationSec / 60)),
    }))
  }, [productivity.focusSessions])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-lp-secondary dark:text-white">Productivity</div>
          <div className="text-sm text-black/60 dark:text-white/60">
            Focus timer, study sessions, and weekly trends.
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            addStudySession()
            toast.success('Study session added')
          }}
        >
          <Plus size={18} />
          Add study session
        </Button>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-black/80 dark:text-white/85">Focus timer</div>
                <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">
                  {focusMode ? 'Focus Mode is on — distraction resistance is boosted.' : 'Start a session to log focused time.'}
                </div>
              </div>
              <div className="text-2xl font-bold text-lp-secondary dark:text-white">
                {fmt(productivity.focusTimer.remainingSec)}
              </div>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-lp-accent"
                  style={{ width: `${progress}%`, transition: 'width 250ms ease' }}
                />
              </div>
              <div className="mt-2 text-xs text-black/55 dark:text-white/55">Progress: {progress}%</div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <Input
                label="Session label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={productivity.focusTimer.status !== 'idle'}
              />

              <div>
                <div className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1">Duration</div>
                <div className="flex flex-wrap gap-2">
                  {[25, 45, 60].map((m) => (
                    <Button
                      key={m}
                      variant={durationMin === m ? 'secondary' : 'ghost'}
                      onClick={() => setDurationMin(m)}
                      disabled={productivity.focusTimer.status !== 'idle'}
                    >
                      {m}m
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {productivity.focusTimer.status === 'idle' && (
                <Button
                  onClick={() => {
                    startFocusTimer(durationMin, label)
                    toast.success('Focus started')
                  }}
                >
                  <Play size={18} />
                  Start
                </Button>
              )}

              {productivity.focusTimer.status === 'running' && (
                <Button variant="ghost" onClick={() => pauseFocusTimer()}>
                  <Pause size={18} />
                  Pause
                </Button>
              )}

              {productivity.focusTimer.status === 'paused' && (
                <Button variant="ghost" onClick={() => resumeFocusTimer()}>
                  <Play size={18} />
                  Resume
                </Button>
              )}

              {productivity.focusTimer.status !== 'idle' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    endFocusTimer('manual')
                    toast.success('Focus session saved')
                  }}
                >
                  <Square size={18} />
                  End
                </Button>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[420px]">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Session history</div>
              <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">Most recent focus sessions</div>

              <div className="mt-3 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-black/50 dark:text-white/50">
                      <th className="text-left font-semibold py-2">Start</th>
                      <th className="text-left font-semibold py-2">Label</th>
                      <th className="text-right font-semibold py-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productivity.focusSessions.slice(0, 6).map((s) => (
                      <tr key={s.id} className="border-t border-black/10 dark:border-white/10">
                        <td className="py-2 text-black/70 dark:text-white/70">
                          {new Date(s.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td className="py-2 text-black/85 dark:text-white/85">{s.label}</td>
                        <td className="py-2 text-right text-black/70 dark:text-white/70">
                          {Math.max(1, Math.round(s.durationSec / 60))}m
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Focus minutes" subtitle="Weekly total">
          <FocusMinutesBarChart data={productivity.focusMinutesByDay} />
        </ChartCard>

        <ChartCard title="Study sessions" subtitle="Sessions per day">
          <StudySessionsBarChart data={productivity.studySessionsByDay} />
        </ChartCard>

        <div className="md:col-span-2">
          <ChartCard title="Recent focus sessions" subtitle="Duration per session">
            <FocusSessionHistoryChart data={recentSessions} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
