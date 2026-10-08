import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Calendar, Droplets, Heart, Info, Plus, Settings2, Trash2 } from 'lucide-react'

import { apiDel, apiGet, apiPost, apiPut } from '../api/client'
import { scheduleScoreSync } from '../store/useAppStore'

// Restored from the original Mood page "Cycle Tracker" tab (shown to female users only).

interface CycleLog {
  id: string
  periodStartDate: string
  cycleLength: number
  periodDuration: number
  flowIntensity?: string | null
  symptoms?: string[]
  notes?: string | null
}

interface CycleStatus extends CycleLog {
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  dayOfCycle: number
  daysUntilNextPeriod: number
  nextPeriodDate: string
  fertileWindowStart: number
  fertileWindowEnd: number
  smartCycleLength: number
  smartDuration: number
  periodDueToday: boolean
  isLate: boolean
  daysLate: number
}

const PHASE_CONFIG = {
  menstrual: {
    label: 'Menstrual', color: '#FF6B6B', bg: '#FF6B6B12', icon: '🔴',
    message: 'Rest is productive too — your body is working hard.',
    tip: 'Iron-rich foods like spinach, managu, beans and lentils can help with fatigue during your period.',
  },
  follicular: {
    label: 'Follicular', color: '#4CAF50', bg: '#4CAF5012', icon: '🌱',
    message: 'Energy rising — great time for new goals and challenges.',
    tip: 'Your energy and focus tend to be higher in this phase. Great time for deep work.',
  },
  ovulation: {
    label: 'Ovulation', color: '#FFA500', bg: '#FFA50012', icon: '✨',
    message: 'Peak energy — ideal for physical activity and social plans.',
    tip: 'You may feel more sociable and energetic today. Make the most of it.',
  },
  luteal: {
    label: 'Luteal', color: '#6366F1', bg: '#6366F112', icon: '🌙',
    message: 'Wind-down phase — mood dips and low energy are completely normal.',
    tip: 'Magnesium-rich foods like groundnuts, dark chocolate and greens can ease PMS symptoms.',
  },
}

const SYMPTOMS = [
  'Cramps', 'Bloating', 'Fatigue', 'Mood swings',
  'Headache', 'Back pain', 'Tender breasts', 'Nausea', 'Acne', 'Insomnia',
]

const FLOW_OPTIONS = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

/** Today's date as YYYY-MM-DD in the user's own timezone */
function todayKey(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Show a stored period date as the calendar day the user picked */
function formatDay(iso: string, opts: Intl.DateTimeFormatOptions) {
  // Stored as midnight UTC of the chosen day — read it back in UTC so it never shifts a day
  return new Date(iso).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' })
}

export default function CycleTracker() {
  const [cycleData, setCycleData] = useState<CycleStatus | null>(null)
  const [history, setHistory] = useState<CycleLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Log form
  const [logDate, setLogDate] = useState(todayKey())
  const [logFlow, setLogFlow] = useState('')
  const [logSymptoms, setLogSymptoms] = useState<string[]>([])
  const [logNotes, setLogNotes] = useState('')
  const [logSaving, setLogSaving] = useState(false)

  // Settings — the user's usual cycle, used until enough periods are logged to average
  const [cycleLength, setCycleLength] = useState(28)
  const [periodDuration, setPeriodDuration] = useState(5)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const fetchCycleData = async () => {
    setLoading(true)
    try {
      const [current, hist, defaults] = await Promise.all([
        apiGet<{ success: boolean; data: CycleStatus | null }>('/api/cycle'),
        apiGet<{ success: boolean; data: CycleLog[] }>('/api/cycle/history'),
        apiGet<{ success: boolean; data: { cycleLength: number; periodDuration: number } }>('/api/cycle/smart-average'),
      ])
      setCycleData(current.data)
      setHistory(hist.data)
      setCycleLength(defaults.data.cycleLength)
      setPeriodDuration(defaults.data.periodDuration)
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCycleData() }, [])

  const handleLogPeriod = async () => {
    if (logDate > todayKey()) {
      toast.error('The start date can’t be in the future')
      return
    }
    setLogSaving(true)
    try {
      await apiPost('/api/cycle', {
        // The chosen calendar day at midnight UTC — the server reads it as that day
        periodStartDate: `${logDate}T00:00:00.000Z`,
        cycleLength,
        periodDuration,
        flowIntensity: logFlow || undefined,
        symptoms: logSymptoms,
        notes: logNotes || undefined,
      })
      toast.success('Period logged')
      setLogOpen(false)
      setLogFlow('')
      setLogSymptoms([])
      setLogNotes('')
      scheduleScoreSync() // a cycle log keeps the streak going
      await fetchCycleData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save. Try again.')
    } finally { setLogSaving(false) }
  }

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    try {
      await apiPut('/api/cycle/settings', { cycleLength, periodDuration })
      toast.success('Cycle settings saved')
      setSettingsOpen(false)
      await fetchCycleData()
    } catch {
      toast.error('Could not save settings. Try again.')
    } finally { setSettingsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this period entry?')) return
    try {
      await apiDel(`/api/cycle/${id}`)
      toast.success('Entry deleted')
      await fetchCycleData()
    } catch {
      toast.error('Failed to delete entry')
    }
  }

  const toggleSymptom = (s: string) =>
    setLogSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const phase = cycleData ? PHASE_CONFIG[cycleData.phase] : null
  const shownLength = cycleData?.smartCycleLength ?? cycleData?.cycleLength ?? cycleLength

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-t-[#FF6B6B] border-black/10 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-black/80 dark:text-white/85">Cycle Tracker</h2>
          <p className="text-xs text-black/40 dark:text-white/35 mt-0.5">
            Private to you — it never changes your LifePulse Score
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/55 dark:text-white/50 hover:bg-black/[0.09] transition-all">
            <Settings2 size={13} /> Settings
          </button>
          <button type="button" onClick={() => { setLogDate(todayKey()); setLogOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#FF6B6B]/90 text-white hover:bg-[#FF6B6B] transition-all">
            <Plus size={13} /> Log period
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4 min-w-0">
          {/* Current phase */}
          {cycleData && phase ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-5"
              style={{ backgroundColor: phase.bg, borderColor: phase.color + '30' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{phase.icon}</span>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider" style={{ color: phase.color }}>
                        {phase.label} phase
                      </div>
                      <div className="text-xs text-black/45 dark:text-white/40">
                        Day {cycleData.dayOfCycle} of {shownLength}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-black/75 dark:text-white/75 mt-2">
                    {cycleData.isLate
                      ? 'Your period is later than expected. Cycles vary — log it when it starts.'
                      : cycleData.periodDueToday
                        ? 'Your period is expected today.'
                        : phase.message}
                  </p>
                  <p className="text-xs text-black/45 dark:text-white/40 leading-relaxed">{phase.tip}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {cycleData.isLate ? (
                    <>
                      <div className="text-2xl font-black" style={{ color: phase.color }}>{cycleData.daysLate}</div>
                      <div className="text-[10px] text-black/40 dark:text-white/35 leading-tight">day{cycleData.daysLate === 1 ? '' : 's'}<br />late</div>
                    </>
                  ) : cycleData.periodDueToday ? (
                    <div className="text-sm font-bold" style={{ color: phase.color }}>Due<br />today</div>
                  ) : (
                    <>
                      <div className="text-2xl font-black" style={{ color: phase.color }}>{cycleData.daysUntilNextPeriod + 1}</div>
                      <div className="text-[10px] text-black/40 dark:text-white/35 leading-tight">days until<br />next period</div>
                    </>
                  )}
                </div>
              </div>

              {/* Cycle progress */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-black/35 dark:text-white/30 mb-1.5">
                  <span>Day 1</span>
                  <span>Day {shownLength}</span>
                </div>
                <div className="h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.08] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: phase.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (cycleData.dayOfCycle / shownLength) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }} />
                </div>
                <div className="flex justify-between text-[9px] text-black/25 dark:text-white/20 mt-1">
                  <span>Menstrual</span><span>Follicular</span><span>Ovulation</span><span>Luteal</span>
                </div>
              </div>

              {cycleData.fertileWindowStart > 0 && cycleData.fertileWindowEnd > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-black/45 dark:text-white/40">
                  <Heart size={12} style={{ color: phase.color }} />
                  <span>Estimated fertile window: day {cycleData.fertileWindowStart}–{cycleData.fertileWindowEnd}</span>
                </div>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-black/45 dark:text-white/40">
                <Calendar size={12} style={{ color: phase.color }} />
                <span>
                  {cycleData.isLate ? 'Was expected' : 'Next period predicted'}:{' '}
                  {formatDay(`${cycleData.nextPeriodDate}T00:00:00.000Z`, { month: 'long', day: 'numeric' })}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/[0.10] dark:border-white/[0.10] p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B6B]/10 flex items-center justify-center mx-auto mb-3">
                <Droplets size={22} className="text-[#FF6B6B]" />
              </div>
              <p className="text-sm font-semibold text-black/55 dark:text-white/50">No cycle logged yet</p>
              <p className="text-xs text-black/35 dark:text-white/30 mt-1 mb-4">
                Log when your last period started to see your cycle phase and predictions
              </p>
              <button type="button" onClick={() => { setLogDate(todayKey()); setLogOpen(true) }}
                className="px-4 py-2 bg-[#FF6B6B]/90 text-white text-xs font-semibold rounded-xl hover:bg-[#FF6B6B] transition-all">
                Log your period
              </button>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] shadow-card p-5">
              <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-3">Period history</div>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <motion.div key={h.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="w-8 h-8 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center flex-shrink-0">
                      <Droplets size={14} className="text-[#FF6B6B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-black/75 dark:text-white/75">
                        {formatDay(h.periodStartDate, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-black/35 dark:text-white/30 mt-0.5">
                        {h.periodDuration}-day period{h.flowIntensity && ` · ${h.flowIntensity} flow`}
                      </div>
                      {Array.isArray(h.symptoms) && h.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {h.symptoms.slice(0, 3).map((s) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FF6B6B]/10 text-[#FF6B6B]/80">{s}</span>
                          ))}
                          {h.symptoms.length > 3 && (
                            <span className="text-[10px] text-black/30 dark:text-white/25">+{h.symptoms.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Always visible — phones have no hover */}
                    <button type="button" onClick={() => handleDelete(h.id)} aria-label="Delete entry"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 dark:text-white/30 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] shadow-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#FF6B6B]/15 flex items-center justify-center">
                <Info size={14} className="text-[#FF6B6B]" />
              </div>
              <span className="text-sm font-semibold text-black/70 dark:text-white/70">Cycle phases</span>
            </div>
            <div className="space-y-3">
              {Object.entries(PHASE_CONFIG).map(([key, p]) => (
                <div key={key} className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">{p.icon}</span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: p.color }}>{p.label}</div>
                    <div className="text-[11px] text-black/40 dark:text-white/35 leading-relaxed mt-0.5">{p.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.05] dark:border-white/[0.05] p-4 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-start gap-2">
              <Heart size={14} className="text-[#FF6B6B] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-black/60 dark:text-white/55">Privacy first</div>
                <p className="text-[11px] text-black/40 dark:text-white/35 leading-relaxed mt-0.5">
                  Your cycle data is only visible to you and never affects your wellness score. Predictions are estimates, not medical advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log period — rendered on <body> so the tab animation can't trap the overlay */}
      {createPortal(<AnimatePresence>
        {logOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setLogOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Log period"
              className="relative bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ duration: 0.2 }}>
              <h3 className="text-base font-bold text-black/85 dark:text-white/90 mb-4">Log period</h3>

              <div className="space-y-4">
                <label className="block">
                  <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-widest mb-1.5">Start date</div>
                  <input type="date" value={logDate} max={todayKey()} onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-sm focus:outline-none focus:border-[#FF6B6B]/40 focus:ring-1 focus:ring-[#FF6B6B]/30" />
                </label>

                <div>
                  <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-widest mb-2">Flow</div>
                  <div className="flex gap-2">
                    {FLOW_OPTIONS.map((f) => (
                      <button key={f.value} type="button" aria-pressed={logFlow === f.value}
                        onClick={() => setLogFlow(f.value === logFlow ? '' : f.value)}
                        className={clsx('flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                          logFlow === f.value ? 'text-white border-transparent bg-[#FF6B6B]' : 'border-black/[0.07] dark:border-white/[0.07] text-black/50 dark:text-white/45')}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-widest mb-2">Symptoms (optional)</div>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSymptom(s)} aria-pressed={logSymptoms.includes(s)}
                        className={clsx('px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                          logSymptoms.includes(s) ? 'bg-[#FF6B6B]/15 border-[#FF6B6B]/40 text-[#FF6B6B]' : 'border-black/[0.07] dark:border-white/[0.07] text-black/45 dark:text-white/40 hover:border-black/[0.15]')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-widest mb-1.5">Notes (optional)</div>
                  <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} rows={2}
                    placeholder="Anything you want to remember about this cycle…"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-sm focus:outline-none focus:border-[#FF6B6B]/40 resize-none placeholder:text-black/25 dark:placeholder:text-white/20" />
                </label>
              </div>

              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setLogOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 hover:bg-black/[0.09] transition-all">
                  Cancel
                </button>
                <button type="button" onClick={handleLogPeriod} disabled={logSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#FF6B6B] text-white hover:bg-red-500 transition-all disabled:opacity-50">
                  {logSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

      {/* Settings — rendered on <body> so the tab animation can't trap the overlay */}
      {createPortal(<AnimatePresence>
        {settingsOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Cycle settings"
              className="relative bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ duration: 0.2 }}>
              <h3 className="text-base font-bold text-black/85 dark:text-white/90 mb-1">Cycle settings</h3>
              <p className="text-xs text-black/40 dark:text-white/35 mb-4">
                Your usual cycle. Once you’ve logged a few periods, predictions use your real average instead.
              </p>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-widest">Cycle length</div>
                    <span className="text-sm font-bold text-[#FF6B6B]">{cycleLength} days</span>
                  </div>
                  <input type="range" min={21} max={45} step={1} value={cycleLength} aria-label="Cycle length in days"
                    onChange={(e) => setCycleLength(Number(e.target.value))} className="w-full accent-[#FF6B6B]" />
                  <div className="flex justify-between text-[10px] text-black/25 dark:text-white/20 mt-1">
                    <span>21 days</span><span>45 days</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-widest">Period length</div>
                    <span className="text-sm font-bold text-[#FF6B6B]">{periodDuration} days</span>
                  </div>
                  <input type="range" min={1} max={10} step={1} value={periodDuration} aria-label="Period length in days"
                    onChange={(e) => setPeriodDuration(Number(e.target.value))} className="w-full accent-[#FF6B6B]" />
                  <div className="flex justify-between text-[10px] text-black/25 dark:text-white/20 mt-1">
                    <span>1 day</span><span>10 days</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setSettingsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 hover:bg-black/[0.09] transition-all">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveSettings} disabled={settingsSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#FF6B6B] text-white hover:bg-red-500 transition-all disabled:opacity-50">
                  {settingsSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  )
}
