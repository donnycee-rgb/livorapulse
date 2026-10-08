import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'

import { apiPost } from '../api/client'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'

// Weekly check-in: re-asks the questions that set the user's goals and
// recalculates them on the server. Nothing is logged as activity.

type Answers = {
  primaryGoal: string
  currentActivityLevel: string
  currentSleepHours: number
  currentScreenHours: number
  ecoConsciousness: string
  weightKg: string
}

type Option<T> = { value: T; label: string; description: string }

const GOALS: Option<string>[] = [
  { value: 'lose-weight', label: 'Lose weight', description: 'Burn more calories, move more daily' },
  { value: 'gain-muscle', label: 'Build strength', description: 'Increase activity and track progress' },
  { value: 'better-sleep', label: 'Sleep better', description: 'Improve sleep quality and duration' },
  { value: 'reduce-stress', label: 'Reduce stress', description: 'Lower stress, improve mood daily' },
  { value: 'build-habits', label: 'Build healthy habits', description: 'Consistency across all dimensions' },
  { value: 'improve-fitness', label: 'Improve fitness', description: 'Higher activity and endurance' },
  { value: 'eco-lifestyle', label: 'Eco-friendly lifestyle', description: 'Reduce environmental impact' },
]
const ACTIVITY: Option<string>[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little to no exercise' },
  { value: 'light', label: 'Lightly active', description: 'Light exercise 1–3 days/week' },
  { value: 'moderate', label: 'Moderately active', description: 'Exercise 3–5 days/week' },
  { value: 'active', label: 'Active', description: 'Hard exercise 6–7 days/week' },
  { value: 'very-active', label: 'Very active', description: 'Physical job or twice-a-day training' },
]
const SLEEP: Option<number>[] = [
  { value: 4, label: 'Less than 5 hours', description: 'Very little sleep most nights' },
  { value: 5.5, label: '5–6 hours', description: 'Below the recommended amount' },
  { value: 6.5, label: '6–7 hours', description: 'Slightly under ideal' },
  { value: 7.5, label: '7–8 hours', description: 'Around the recommended amount' },
  { value: 9, label: '8+ hours', description: 'Getting plenty of rest' },
]
const SCREEN: Option<number>[] = [
  { value: 1, label: 'Under 2 hours', description: 'Very little screen time daily' },
  { value: 3, label: '2–4 hours', description: 'Moderate usage' },
  { value: 5, label: '4–6 hours', description: 'Above average usage' },
  { value: 7, label: '6–8 hours', description: 'High screen usage' },
  { value: 9, label: '8+ hours', description: 'Very high — mostly on screens' },
]
const ECO: Option<string>[] = [
  { value: 'rarely', label: 'Rarely', description: "I don't think much about my environmental impact" },
  { value: 'sometimes', label: 'Sometimes', description: 'I make eco-friendly choices occasionally' },
  { value: 'often', label: 'Often', description: 'I actively try to reduce my footprint' },
  { value: 'always', label: 'Always', description: 'Eco-consciousness is central to my lifestyle' },
]

const STEPS = [
  { title: "What's your main goal right now?", key: 'primaryGoal', options: GOALS },
  { title: 'How active were you this past week?', key: 'currentActivityLevel', options: ACTIVITY },
  { title: 'How much did you sleep most nights?', key: 'currentSleepHours', options: SLEEP },
  { title: 'How much screen time on a typical day?', key: 'currentScreenHours', options: SCREEN },
  { title: 'How eco-conscious were your choices?', key: 'ecoConsciousness', options: ECO },
  { title: 'Your current weight (optional)', key: 'weightKg', options: null },
] as const

export default function CheckInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const primaryGoal = useAppStore((s) => s.onboarding?.primaryGoal) ?? ''
  const weightKg = useAuthStore((s) => s.user?.profile?.weightKg)
  const setLastAssessmentAt = useAuthStore((s) => s.setLastAssessmentAt)

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState<Answers>({
    primaryGoal,
    currentActivityLevel: '',
    currentSleepHours: 0,
    currentScreenHours: 0,
    ecoConsciousness: '',
    weightKg: weightKg ? String(weightKg) : '',
  })

  const current = STEPS[step]
  const value = answers[current.key as keyof Answers]
  const answered = current.options === null || Boolean(value)
  const isLast = step === STEPS.length - 1

  const close = () => { setStep(0); onClose() }

  const submit = async () => {
    const weight = Number(answers.weightKg)
    if (answers.weightKg && (!Number.isFinite(weight) || weight < 20 || weight > 350)) {
      toast.error('Enter a weight between 20 and 350 kg, or leave it blank')
      return
    }
    setSaving(true)
    try {
      const res = await apiPost<{ success: boolean; data: { goals: Record<string, number> } }>('/api/user/onboarding/checkin', {
        primaryGoal: answers.primaryGoal,
        currentActivityLevel: answers.currentActivityLevel,
        currentSleepHours: answers.currentSleepHours,
        currentScreenHours: answers.currentScreenHours,
        ecoConsciousness: answers.ecoConsciousness,
        ...(answers.weightKg && { weightKg: weight }),
      })
      setLastAssessmentAt(Date.now())
      // Pull the new goals and score into the app
      await Promise.allSettled([
        useAuthStore.getState().loadMe(),
        useAppStore.getState().hydrateFromApi(),
      ])
      void useAppStore.getState().syncDashboardScore()
      const g = res.data.goals
      toast.success(`Goals updated — ${g.goalStepsPerDay.toLocaleString()} steps, ${g.goalCaloriesPerDay.toLocaleString()} kcal, ${g.goalFocusMinutes} min focus`)
      close()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your check-in. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // Rendered on <body> so animated (transformed) parents can't trap the fixed overlay
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <motion.div role="dialog" aria-modal="true" aria-label="Weekly check-in"
            className="relative bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 w-full max-w-md max-h-[88vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ duration: 0.2 }}>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-lp-primary">
                Weekly check-in · {step + 1} of {STEPS.length}
              </span>
              <button type="button" onClick={close} aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-black/35 dark:text-white/35 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
                <X size={14} />
              </button>
            </div>
            <div className="h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.08] mb-5">
              <div className="h-full rounded-full bg-lp-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>

            <h3 className="text-base font-bold text-black/85 dark:text-white/90 mb-4">{current.title}</h3>

            {current.options ? (
              <div className="space-y-1.5">
                {current.options.map((o) => {
                  const selected = value === o.value
                  return (
                    <button key={String(o.value)} type="button" aria-pressed={selected}
                      onClick={() => setAnswers((a) => ({ ...a, [current.key]: o.value }))}
                      className={clsx('w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all',
                        selected
                          ? 'border-lp-primary bg-lp-primary/10'
                          : 'border-black/[0.07] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.15]')}>
                      <span>
                        <span className="block text-sm font-semibold text-black/80 dark:text-white/85">{o.label}</span>
                        <span className="block text-xs text-black/45 dark:text-white/40 mt-0.5">{o.description}</span>
                      </span>
                      {selected && <Check size={15} className="text-lp-primary flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <label className="block">
                <span className="text-xs text-black/45 dark:text-white/40">Used for your calorie goal and walk calories. Leave blank to keep it unchanged.</span>
                <div className="mt-2 flex items-center gap-2">
                  <input type="number" inputMode="decimal" min={20} max={350} step="0.1"
                    value={answers.weightKg} onChange={(e) => setAnswers((a) => ({ ...a, weightKg: e.target.value }))}
                    placeholder="e.g. 65"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-sm focus:outline-none focus:border-lp-primary/50" />
                  <span className="text-sm text-black/50 dark:text-white/45">kg</span>
                </div>
              </label>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}
                className="flex items-center justify-center gap-1 flex-1 py-2.5 rounded-xl text-sm font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 hover:bg-black/[0.09] transition-all">
                {step === 0 ? 'Cancel' : <><ChevronLeft size={14} /> Back</>}
              </button>
              <button type="button" disabled={!answered || saving}
                onClick={() => (isLast ? submit() : setStep((s) => s + 1))}
                className="flex items-center justify-center gap-1 flex-1 py-2.5 rounded-xl text-sm font-semibold bg-lp-primary text-white hover:bg-green-600 transition-all disabled:opacity-40">
                {isLast ? (saving ? 'Saving…' : 'Update my goals') : <>Next <ChevronRight size={14} /></>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
