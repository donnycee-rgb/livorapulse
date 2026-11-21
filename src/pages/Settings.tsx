import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Sun, Moon, Ruler, Bell, BellOff,
  RefreshCw, Trash2, ClipboardList,
  Clock, CheckCircle2, ChevronRight,
  AlertTriangle, Droplets, Download, Smartphone, BellRing, MoonStar, Sunrise, Send,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from '../store/useAppStore'
import { selectProgressiveGoals, selectStreak } from '../store/selectors'
import CheckInModal from '../components/CheckInModal'
import { useAuthStore } from '../store/useAuthStore'
import { apiPut } from '../api/client'
import { useCycleTracking } from '../lib/cycle'
import { useInstall } from '../lib/install'
import { startInstall } from '../components/InstallApp'
import { openRemindersPrompt } from '../components/sleep/RemindersPrompt'
import {
  getReminderSettings, pushStatus, saveReminderSettings, sendTestNotification, turnOffPush, turnOnPush,
  type PushStatus, type ReminderSettings,
} from '../lib/push'

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
        enabled ? 'bg-lp-primary' : 'bg-black/20 dark:bg-white/20',
      )}
      aria-label={enabled ? 'Disable' : 'Enable'}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ left: enabled ? '22px' : '2px' }}
        transition={{ duration: 0.2 }}
      />
    </button>
  )
}

function SettingsRow({ icon, label, description, right, danger = false }: {
  icon: React.ReactNode
  label: string
  description?: string
  right: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className={clsx(
      'flex items-start sm:items-center justify-between gap-3 py-3 sm:py-4 max-sm:flex-wrap max-sm:gap-y-2.5',
      'border-b border-black/[0.05] dark:border-white/[0.05] last:border-0',
    )}>
      <div className="flex items-start gap-3 min-w-0 flex-1 max-sm:min-w-[60%]">
        <div className={clsx(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0',
          danger ? 'bg-lp-alert/15' : 'bg-black/[0.05] dark:bg-white/[0.06]',
        )}>
          <div className={danger ? 'text-lp-alert' : 'text-black/50 dark:text-white/50'}>
            {icon}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className={clsx(
            'text-sm font-semibold',
            danger ? 'text-lp-alert' : 'text-black/75 dark:text-white/75',
          )}>{label}</div>
          {description && (
            <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 leading-relaxed">{description}</div>
          )}
        </div>
      </div>
      {/* Right content — wraps below on very small screens if needed */}
      <div className="flex-shrink-0 mt-0.5 sm:mt-0 max-sm:ml-auto">{right}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden lp-card">
      <div className="px-4 sm:px-5 pt-4 pb-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/25">
          {title}
        </div>
      </div>
      <div className="px-4 sm:px-5 pb-2">
        {children}
      </div>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Goal slider row
// ---------------------------------------------------------------------------
function GoalSlider({
  label, description, value, min, max, step, unit, onChange,
}: {
  label: string
  description: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className={clsx(
      'py-3 sm:py-4 border-b border-black/[0.05] dark:border-white/[0.05] last:border-0',
    )}>
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-black/75 dark:text-white/75">{label}</div>
          <div className="text-xs text-black/40 dark:text-white/35 mt-0.5">{description}</div>
        </div>
        <div className="flex-shrink-0 min-w-[60px] text-right">
          <span className="text-sm font-bold text-lp-primary">{value}</span>
          <span className="text-xs text-black/40 dark:text-white/35 ml-1">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${((value - min) / (max - min)) * 100}%, rgba(0,0,0,0.1) ${((value - min) / (max - min)) * 100}%, rgba(0,0,0,0.1) 100%)`
        }}
      />
      <div className="flex justify-between text-[10px] text-black/25 dark:text-white/20 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sleep reminders on the phone
// ---------------------------------------------------------------------------
function RemindersSection() {
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [settings, setSettings] = useState<ReminderSettings | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    pushStatus().then(setStatus).catch(() => setStatus('unsupported'))
  }, [])
  useEffect(() => {
    if (status === 'on') getReminderSettings().then(setSettings).catch(() => null)
  }, [status])

  const save = async (patch: Partial<Pick<ReminderSettings, 'bedtime' | 'wakeReminder'>>) => {
    const before = settings
    if (settings) setSettings({ ...settings, ...patch })
    try { setSettings(await saveReminderSettings(patch)) } catch { setSettings(before); toast.error("Couldn't save. Check your connection.") }
  }

  const toggle = async () => {
    if (busy || !status) return
    setBusy(true)
    try {
      if (status === 'on') {
        await turnOffPush()
        setStatus('off')
        toast.success('Notifications off on this phone')
      } else if (status === 'off') {
        const r = await turnOnPush()
        if (r === 'on') {
          setStatus('on')
          // first time on: a bedtime reminder at a sensible default
          const s = await getReminderSettings()
          setSettings(s.bedtime ? s : await saveReminderSettings({ bedtime: '22:30' }))
          toast.success('Notifications on')
        } else if (r === 'blocked') setStatus('blocked')
        else if (r === 'unavailable') toast.error("Notifications aren't available on this browser yet.")
      } else if (status === 'install-first') {
        openRemindersPrompt()
      }
    } catch {
      toast.error("Couldn't change notifications. Check your connection.")
    } finally {
      setBusy(false)
    }
  }

  const description =
    status === 'on' ? 'Sleep reminders come to this phone, even when the app is closed'
    : status === 'blocked' ? 'Blocked for this site. Allow notifications in your browser or phone settings, then come back.'
    : status === 'install-first' ? 'On iPhone, install LivoraPulse to your home screen first'
    : status === 'unsupported' ? "This browser can't show notifications"
    : 'Get sleep reminders on this phone'

  return (
    <Section title="Reminders">
      <SettingsRow
        icon={<BellRing size={15} />}
        label="Phone notifications"
        description={description}
        right={status === 'on' || status === 'off'
          ? <Toggle enabled={status === 'on'} onToggle={toggle} />
          : status === 'install-first'
            ? <button type="button" onClick={toggle} className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-ui-raised text-ui-ink whitespace-nowrap">How</button>
            : null}
      />
      {status === 'on' && settings && (
        <>
          <SettingsRow
            icon={<MoonStar size={15} />}
            label="Bedtime reminder"
            description={settings.bedtime ? `Every night at ${settings.bedtime}` : 'Off'}
            right={
              <div className="flex items-center gap-2">
                {settings.bedtime && (
                  <input type="time" value={settings.bedtime} aria-label="Bedtime reminder time"
                    onChange={(e) => e.target.value && save({ bedtime: e.target.value })}
                    className="h-8 w-[122px] rounded-xl bg-ui-raised px-2 text-[13px] font-bold text-ui-ink tabular-nums outline-none" />
                )}
                <Toggle enabled={!!settings.bedtime} onToggle={() => save({ bedtime: settings.bedtime ? null : '22:30' })} />
              </div>
            }
          />
          <SettingsRow
            icon={<Sunrise size={15} />}
            label="Morning reminder"
            description="If you're still marked asleep, a nudge to log your wake-up"
            right={<Toggle enabled={settings.wakeReminder} onToggle={() => save({ wakeReminder: !settings.wakeReminder })} />}
          />
          <SettingsRow
            icon={<Send size={15} />}
            label="Send a test"
            description="Check that notifications reach this phone"
            right={
              <button type="button"
                onClick={() => sendTestNotification().then(() => toast.success('Sent. Look at your notifications.')).catch((e: Error) => toast.error(e.message || "Couldn't send"))}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-ui-raised text-ui-ink whitespace-nowrap">
                Send
              </button>
            }
          />
        </>
      )}
    </Section>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const theme = useAppStore((s) => s.preferences.theme)
  const units = useAppStore((s) => s.preferences.units)
  const notificationsEnabled = useAppStore((s) => s.preferences.notificationsEnabled)
  const setTheme = useAppStore((s) => s.setTheme)
  const setUnits = useAppStore((s) => s.setUnits)
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled)
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead)
  const resetAll = useAppStore((s) => s.resetAll)

  const lastAssessmentAt = useAuthStore((s) => s.lastAssessmentAt)
  const patchProfile = useAuthStore((s) => s.patchProfile)
  const cycleTracking = useCycleTracking()
  const { installed } = useInstall()
  const [cycleSaving, setCycleSaving] = useState(false)
  const toggleCycle = async () => {
    if (cycleSaving) return
    const next = !cycleTracking
    setCycleSaving(true)
    try {
      await apiPut('/api/cycle/settings', { tracking: next })
      patchProfile({ cycleTracking: next })
      toast.success(next ? 'Cycle tracker on. Find it on the Mood page.' : 'Cycle tracker hidden. Your logs are kept.')
    } catch {
      toast.error("Couldn't change that. Check your connection.")
    } finally {
      setCycleSaving(false)
    }
  }
  const [checkInOpen, setCheckInOpen] = useState(false)

  const [resetOpen, setResetOpen] = useState(false)
  const goals = useAppStore((s) => s.goals)
  const setGoals = useAppStore((s) => s.setGoals)
  const progressiveGoals = useAppStore(selectProgressiveGoals)
  const streak = useAppStore(selectStreak)

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()
  const canRetake = !lastAssessmentAt || (now - lastAssessmentAt) >= SEVEN_DAYS
  const daysUntilRetake = lastAssessmentAt
    ? Math.max(0, Math.ceil((lastAssessmentAt + SEVEN_DAYS - now) / (24 * 60 * 60 * 1000)))
    : 0

  const lastAssessmentLabel = lastAssessmentAt
    ? new Date(lastAssessmentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never taken'

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl">

      <h1 className="text-[24px] max-sm:text-[22px] font-bold leading-tight tracking-tight text-ui-ink">Settings</h1>

      {/* Appearance */}
      <Section title="Appearance">
        <SettingsRow
          icon={theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          label="Theme"
          description={theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'Device theme'}
          right={
            <div className="flex items-center gap-1 bg-black/[0.05] dark:bg-white/[0.06] rounded-xl p-1">
              {((['light', 'dark', 'system'] as const)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTheme(t); toast.success(`Theme: ${t}`) }}
                  className={clsx(
                    'px-3 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs sm:text-xs font-semibold transition-all duration-150 capitalize',
                    theme === t
                      ? 'bg-white dark:bg-slate-700 text-black/80 dark:text-white/80 shadow-sm'
                      : 'text-black/45 dark:text-white/40 hover:text-black/65 dark:hover:text-white/60',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
      </Section>

      {/* Units */}
      <Section title="Units & Measurements">
        <SettingsRow
          icon={<Ruler size={15} />}
          label="Distance units"
          description="Affects distance across the app"
          right={
            <div className="flex items-center gap-1 bg-black/[0.05] dark:bg-white/[0.06] rounded-xl p-1">
              {(['metric', 'imperial'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setUnits(u); toast.success(`Units: ${u}`) }}
                  className={clsx(
                    'px-3 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs sm:text-xs font-semibold transition-all duration-150',
                    units === u
                      ? 'bg-white dark:bg-slate-700 text-black/80 dark:text-white/80 shadow-sm'
                      : 'text-black/45 dark:text-white/40 hover:text-black/65 dark:hover:text-white/60',
                  )}
                >
                  {u === 'metric' ? 'km' : 'mi'}
                </button>
              ))}
            </div>
          }
        />
      </Section>

      {/* Features that are only for some people */}
      <Section title="Tracking">
        <SettingsRow
          icon={<Droplets size={15} />}
          label="Cycle tracker"
          description="Track your period on the Mood page. Only you can see it."
          right={<Toggle enabled={cycleTracking} onToggle={toggleCycle} />}
        />
      </Section>

      <RemindersSection />

      {/* The app on this phone */}
      <Section title="App">
        <SettingsRow
          icon={installed ? <Smartphone size={15} /> : <Download size={15} />}
          label={installed ? 'Installed' : 'Install LivoraPulse'}
          description={installed ? "You're using the app version." : 'Opens full screen and works without a connection'}
          right={installed ? null : (
            <button type="button" onClick={() => void startInstall()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-lp-primary text-white hover:bg-green-500 transition-all whitespace-nowrap">
              Install
            </button>
          )}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <SettingsRow
          icon={notificationsEnabled ? <Bell size={15} /> : <BellOff size={15} />}
          label="In-app notifications"
          description="Activity reminders and alerts"
          right={
            <Toggle
              enabled={notificationsEnabled}
              onToggle={() => {
                setNotificationsEnabled(!notificationsEnabled)
                toast.success(notificationsEnabled ? 'Notifications off' : 'Notifications on')
              }}
            />
          }
        />
        <SettingsRow
          icon={<CheckCircle2 size={15} />}
          label="Mark all as read"
          description="Clear unread badges"
          right={
            <button
              type="button"
              onClick={() => { markAllNotificationsRead(); toast.success('All read') }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/55 dark:text-white/50 hover:bg-black/[0.09] dark:hover:bg-white/[0.10] transition-all whitespace-nowrap"
            >
              Mark read
            </button>
          }
        />
      </Section>

      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />

      {/* Life Balance Check */}
      <Section title="Life Balance Check">
        <SettingsRow
          icon={<ClipboardList size={15} />}
          label="Weekly check-in"
          description={canRetake
            ? `Last done ${lastAssessmentLabel}. Ready to take again.`
            : `Available in ${daysUntilRetake} days. Last done ${lastAssessmentLabel}.`
          }
          right={
            canRetake ? (
              <button
                type="button"
                onClick={() => setCheckInOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-lp-primary text-white hover:bg-green-500 transition-all whitespace-nowrap"
              >
                Start
                <ChevronRight size={12} />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.06]">
                <Clock size={12} className="text-black/35 dark:text-white/30" />
                <span className="text-xs font-semibold text-black/40 dark:text-white/35 whitespace-nowrap">
                  {daysUntilRetake}d left
                </span>
              </div>
            )
          }
        />
      </Section>

      {/* My Goals */}
      <Section title="My Goals">
        <div className="pb-2">
          <div className="text-xs text-black/40 dark:text-white/35 pt-2 pb-1 leading-relaxed">
            Your personal targets. The app adjusts these upward as your streak grows.
            {streak >= 7 && (
              <span className="ml-1 font-semibold text-lp-primary">
                ({streak}-day streak: targets increased by {Math.round((Math.min(streak >= 60 ? 1.5 : streak >= 30 ? 1.35 : streak >= 14 ? 1.2 : 1.1, 1.5) - 1) * 100)}%)
              </span>
            )}
          </div>
          <GoalSlider
            label="Daily Steps"
            description="Steps per day target"
            value={goals.goalStepsPerDay}
            min={1000} max={20000} step={500} unit=" steps"
            onChange={(v) => setGoals({ goalStepsPerDay: v })}
          />
          <GoalSlider
            label="Sleep"
            description="Hours of sleep per night"
            value={goals.goalSleepHours}
            min={5} max={10} step={0.5} unit="h"
            onChange={(v) => setGoals({ goalSleepHours: v })}
          />
          <GoalSlider
            label="Focus Time"
            description="Minutes of focused work per day"
            value={goals.goalFocusMinutes}
            min={15} max={300} step={15} unit=" min"
            onChange={(v) => setGoals({ goalFocusMinutes: v })}
          />
          <GoalSlider
            label="Social Media Limit"
            description="Max social screen time before score drops"
            value={goals.goalSocialMinutes}
            min={15} max={180} step={15} unit=" min"
            onChange={(v) => setGoals({ goalSocialMinutes: v })}
          />
          <GoalSlider
            label="Entertainment Limit"
            description="Max entertainment screen time before score drops"
            value={goals.goalEntertainmentMinutes}
            min={15} max={240} step={15} unit=" min"
            onChange={(v) => setGoals({ goalEntertainmentMinutes: v })}
          />
          <GoalSlider
            label="Eco Actions"
            description="Eco-friendly actions per day"
            value={goals.goalEcoActionsPerDay}
            min={1} max={10} step={1} unit="/day"
            onChange={(v) => setGoals({ goalEcoActionsPerDay: v })}
          />
          <GoalSlider
            label="Daily Calories"
            description="Target calorie intake per day (optional)"
            value={goals.goalCaloriesPerDay ?? 2000}
            min={1200} max={4000} step={50} unit=" kcal"
            onChange={(v) => setGoals({ goalCaloriesPerDay: v })}
          />
          {streak >= 7 && (
            <div className="mt-3 p-3 rounded-xl bg-lp-primary/[0.06] border border-lp-primary/20">
              <div className="text-xs font-semibold text-lp-primary mb-1">Today's progressive targets</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-black/55 dark:text-white/50">
                <span>Steps: <strong className="text-black/75 dark:text-white/75">{progressiveGoals.goalStepsPerDay.toLocaleString()}</strong></span>
                <span>Sleep: <strong className="text-black/75 dark:text-white/75">{progressiveGoals.goalSleepHours}h</strong></span>
                <span>Focus: <strong className="text-black/75 dark:text-white/75">{progressiveGoals.goalFocusMinutes}min</strong></span>
                <span>Eco: <strong className="text-black/75 dark:text-white/75">{progressiveGoals.goalEcoActionsPerDay}/day</strong></span>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Data */}
      <Section title="Data Management">
        <SettingsRow
          icon={<Trash2 size={15} />}
          label="Reset local data"
          description="Clears all stored metrics"
          danger
          right={
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-lp-alert/15 text-lp-alert border border-lp-alert/25 hover:bg-lp-alert/25 transition-all whitespace-nowrap"
            >
              Reset
            </button>
          }
        />
      </Section>

      {/* Reset confirmation dialog */}
      <AnimatePresence>
        {resetOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setResetOpen(false)} />
            <motion.div
              className="relative bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 rounded-2xl bg-lp-alert/15 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-lp-alert" />
              </div>
              <h3 className="text-base font-bold text-black/85 dark:text-white/90 text-center">Reset all data?</h3>
              <p className="text-sm text-black/50 dark:text-white/45 text-center mt-2 leading-relaxed">
                This will clear all locally stored metrics. This cannot be undone.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setResetOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 hover:bg-black/[0.09] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetAll()
                    setResetOpen(false)
                    toast.success('Data reset complete')
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-lp-alert text-white hover:bg-red-500 transition-all"
                >
                  Yes, reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}