import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Activity, ArrowRight, Brain, CalendarCheck, Check, ChevronLeft, Dumbbell,
  Footprints, Leaf, Moon, MonitorSmartphone, Scale, Target, UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { apiPost } from '../api/client'
import { useAuthStore } from '../store/useAuthStore'
import { useAppStore } from '../store/useAppStore'

// ─────────────────────────────────────────────────────────────────────────────
// Setup after sign-up: Goal → About you → Your typical day → Your targets.
// Creating the account is step 1, so this page shows steps 2–4.
// Only the goal is required; everything else can be skipped.
// ─────────────────────────────────────────────────────────────────────────────

type Draft = {
  primaryGoal: string
  birthYear: string
  gender: string
  heightCm: string
  weightKg: string
  hasDisability: boolean
  disabilityNote: string
  currentActivityLevel: string
  currentSleepHours: number
  currentScreenHours: number
  ecoConsciousness: string
}

const EMPTY: Draft = {
  primaryGoal: '', birthYear: '', gender: '', heightCm: '', weightKg: '',
  hasDisability: false, disabilityNote: '',
  currentActivityLevel: '', currentSleepHours: 0, currentScreenHours: 0, ecoConsciousness: '',
}

const GOALS: { value: string; label: string; desc: string; Icon: LucideIcon }[] = [
  { value: 'build-habits', label: 'Build healthy habits', desc: 'A bit better every day', Icon: CalendarCheck },
  { value: 'improve-fitness', label: 'Improve fitness', desc: 'More activity and stamina', Icon: Activity },
  { value: 'lose-weight', label: 'Lose weight', desc: 'Move more, eat smarter', Icon: Scale },
  { value: 'gain-muscle', label: 'Build strength', desc: 'Get stronger over time', Icon: Dumbbell },
  { value: 'better-sleep', label: 'Sleep better', desc: 'More rest, less screen time', Icon: Moon },
  { value: 'reduce-stress', label: 'Reduce stress', desc: 'Calmer, steadier days', Icon: Brain },
  { value: 'eco-lifestyle', label: 'Live more eco-friendly', desc: 'Lower your footprint', Icon: Leaf },
]

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

const ACTIVITY = [
  { value: 'sedentary', label: 'Mostly sitting' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very-active', label: 'Very active' },
]
const SLEEP = [
  { value: 4, label: 'Under 5h' },
  { value: 5.5, label: '5–6h' },
  { value: 6.5, label: '6–7h' },
  { value: 7.5, label: '7–8h' },
  { value: 9, label: '8h+' },
]
const SCREEN = [
  { value: 1, label: 'Under 2h' },
  { value: 3, label: '2–4h' },
  { value: 5, label: '4–6h' },
  { value: 7, label: '6–8h' },
  { value: 9, label: '8h+' },
]
const ECO = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'always', label: 'Always' },
]

type Goals = {
  goalStepsPerDay: number
  goalSleepHours: number
  goalScreenMinutes: number
  goalFocusMinutes: number
  goalEcoActionsPerDay: number
  goalCaloriesPerDay: number
}

const THIS_YEAR = new Date().getFullYear()

function draftKey(userId: string) {
  return `lp_setup_draft_${userId}`
}

// ── Small building blocks ────────────────────────────────────────────────────
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={clsx(
        'px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-150',
        selected
          ? 'bg-lp-primary/20 border-lp-primary/60 text-white'
          : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white/85',
      )}>
      {children}
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-white/70 text-[13px] font-semibold">{label}</p>
        {hint && <p className="text-white/30 text-[11px]">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function TextBox(props: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  const { suffix, className, ...rest } = props
  return (
    <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.06] focus-within:ring-1 focus-within:ring-lp-primary/50 focus-within:border-lp-primary/40">
      <input {...rest}
        className={clsx('flex-1 min-w-0 px-3.5 py-2.5 bg-transparent text-white text-base sm:text-sm focus:outline-none placeholder:text-white/25', className)} />
      {suffix && <span className="pr-3.5 text-white/35 text-sm">{suffix}</span>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function WelcomeSetup() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete)
  const profileLoaded = useAuthStore((s) => s.profileLoaded)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)
  const setLastAssessmentAt = useAuthStore((s) => s.setLastAssessmentAt)

  const [step, setStep] = useState(0) // 0 goal · 1 about you · 2 typical day · 3 targets
  const [draft, setDraft] = useState<Draft>(() => {
    if (!user?.id) return EMPTY
    try {
      const saved = localStorage.getItem(draftKey(user.id))
      return saved ? { ...EMPTY, ...JSON.parse(saved) } : EMPTY
    } catch { return EMPTY }
  })
  const [saving, setSaving] = useState(false)
  const [goals, setGoals] = useState<Goals | null>(null)

  // Keep the answers if the user closes the tab half-way (not once setup is saved)
  useEffect(() => {
    if (!user?.id || goals) return
    try { localStorage.setItem(draftKey(user.id), JSON.stringify(draft)) } catch { /* storage unavailable */ }
  }, [draft, user?.id, goals])

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const firstName = useMemo(() => (user?.name ?? '').trim().split(/\s+/)[0] || 'there', [user?.name])

  // Users who already finished setup (confirmed by the server) go to the dashboard.
  // Not while showing the targets screen — saving marks setup complete on the server.
  if (profileLoaded && onboardingComplete && !goals) return <Navigate to="/dashboard" replace />

  const birthYear = Number(draft.birthYear)
  const birthYearInvalid = draft.birthYear !== '' && (!Number.isInteger(birthYear) || birthYear < 1920 || birthYear > THIS_YEAR - 10)

  const save = async (skipHabits = false) => {
    if (birthYearInvalid) { setStep(1); toast.error(`Enter a year between 1920 and ${THIS_YEAR - 10}, or leave it blank`); return }
    setSaving(true)
    try {
      const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
      const res = await apiPost<{ success: boolean; data: { goals: Goals } }>('/api/user/onboarding', {
        primaryGoal: draft.primaryGoal,
        // Year of birth is enough for age-based targets; mid-year keeps the age within ±6 months
        ...(draft.birthYear && { dateOfBirth: `${draft.birthYear}-07-01T00:00:00.000Z` }),
        ...(draft.gender && { gender: draft.gender }),
        ...(num(draft.heightCm) && { heightCm: num(draft.heightCm) }),
        ...(num(draft.weightKg) && { weightKg: num(draft.weightKg) }),
        hasDisability: draft.hasDisability,
        ...(draft.hasDisability && draft.disabilityNote.trim() && { disabilityNote: draft.disabilityNote.trim() }),
        // Unanswered habits are left out and the server uses typical values
        ...(!skipHabits && draft.currentActivityLevel && { currentActivityLevel: draft.currentActivityLevel }),
        ...(!skipHabits && draft.currentSleepHours && { currentSleepHours: draft.currentSleepHours }),
        ...(!skipHabits && draft.currentScreenHours && { currentScreenHours: draft.currentScreenHours }),
        ...(!skipHabits && draft.ecoConsciousness && { ecoConsciousness: draft.ecoConsciousness }),
      })
      setGoals(res.data.goals)
      setStep(3)
      if (user?.id) try { localStorage.removeItem(draftKey(user.id)) } catch { /* ignore */ }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your answers. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const finish = async () => {
    setOnboardingComplete(true)
    setLastAssessmentAt(Date.now())
    // Pick up gender (cycle tracker), goals and the first score
    await useAuthStore.getState().loadMe().catch(() => null)
    void useAppStore.getState().hydrateFromApi()
    void useAppStore.getState().syncDashboardScore()
    navigate('/dashboard', { replace: true })
  }

  const titles = [
    { title: `Welcome, ${firstName}! What's your main goal?`, sub: 'Pick the one that matters most right now. You can change it any time.' },
    { title: 'A bit about you', sub: 'This helps us set realistic targets. Everything here is optional.' },
    { title: 'Your typical day', sub: 'Be honest — we start from where you are, not where you think you should be.' },
    { title: 'Your daily targets are ready', sub: 'Personalised from your answers. They adjust as your streak grows.' },
  ]

  return (
    <div className="min-h-dvh flex justify-center px-4 py-8 sm:py-12"
      style={{ background: 'linear-gradient(135deg, #091525 0%, #0e1d40 45%, #0b2218 100%)' }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-lp-primary/15 border border-lp-primary/25">
            <svg width="18" height="18" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <polyline points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18" stroke="#4CAF50" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-white font-bold text-[15px]">LivoraPulse</span>
        </div>

        <div className="bg-[#0d1e3d] border border-white/[0.07] rounded-2xl shadow-2xl p-5 sm:p-7">
          {/* Progress — creating the account was step 1 */}
          <div className="mb-5">
            <div className="flex justify-between text-[11px] text-white/35 mb-1.5">
              <span>{step < 3 ? `Step ${step + 2} of 4` : 'All set'}</span>
              {step < 3 && <span>About {step === 0 ? '1 minute' : step === 1 ? '40 seconds' : '20 seconds'} left</span>}
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full rounded-full bg-lp-primary"
                animate={{ width: `${(Math.min(step + 2, 4) / 4) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
            </div>
          </div>

          <h1 className="text-white font-bold text-xl leading-snug">{titles[step].title}</h1>
          <p className="text-white/45 text-sm mt-1.5 mb-5 leading-relaxed">{titles[step].sub}</p>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}>

              {/* ── Step 2: goal (one tap moves on) ── */}
              {step === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOALS.map(({ value, label, desc, Icon }) => {
                    const selected = draft.primaryGoal === value
                    return (
                      <button key={value} type="button" aria-pressed={selected}
                        onClick={() => { set({ primaryGoal: value }); setTimeout(() => setStep(1), 180) }}
                        className={clsx(
                          'flex items-center gap-3 text-left px-3.5 py-3 rounded-xl border transition-all duration-150',
                          selected ? 'bg-lp-primary/15 border-lp-primary/60' : 'bg-white/[0.04] border-white/[0.08] hover:border-white/20',
                        )}>
                        <span className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                          selected ? 'bg-lp-primary text-white' : 'bg-white/[0.06] text-lp-primary')}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-white leading-tight">{label}</span>
                          <span className="block text-xs text-white/40 mt-0.5">{desc}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Step 3: about you ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Year of birth">
                      <TextBox inputMode="numeric" placeholder={`e.g. ${THIS_YEAR - 25}`} maxLength={4}
                        value={draft.birthYear} onChange={(e) => set({ birthYear: e.target.value.replace(/\D/g, '') })}
                        aria-invalid={birthYearInvalid} />
                    </Field>
                    <div />
                  </div>
                  {birthYearInvalid && <p className="-mt-3 text-xs text-lp-alert/90">Enter a year between 1920 and {THIS_YEAR - 10}.</p>}

                  <Field label="Gender">
                    <div className="flex flex-wrap gap-2">
                      {GENDERS.map((g) => (
                        <Chip key={g.value} selected={draft.gender === g.value}
                          onClick={() => set({ gender: draft.gender === g.value ? '' : g.value })}>{g.label}</Chip>
                      ))}
                    </div>
                  </Field>

                  <Field label="Height and weight" hint="For accurate calorie targets">
                    <div className="grid grid-cols-2 gap-3">
                      <TextBox inputMode="numeric" placeholder="Height" suffix="cm" maxLength={3}
                        value={draft.heightCm} onChange={(e) => set({ heightCm: e.target.value.replace(/\D/g, '') })} />
                      <TextBox inputMode="decimal" placeholder="Weight" suffix="kg" maxLength={5}
                        value={draft.weightKg} onChange={(e) => set({ weightKg: e.target.value.replace(/[^\d.]/g, '') })} />
                    </div>
                  </Field>

                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span>
                        <span className="block text-sm font-semibold text-white/80">I have a physical limitation</span>
                        <span className="block text-xs text-white/40 mt-0.5">We'll keep your activity targets realistic</span>
                      </span>
                      <input type="checkbox" checked={draft.hasDisability}
                        onChange={(e) => set({ hasDisability: e.target.checked })}
                        className="w-5 h-5 accent-lp-primary flex-shrink-0" />
                    </label>
                    {draft.hasDisability && (
                      <div className="mt-3">
                        <TextBox placeholder="Tell us more (optional)" value={draft.disabilityNote}
                          onChange={(e) => set({ disabilityNote: e.target.value })} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 4: typical day ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <Field label="How active are you most weeks?">
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY.map((o) => (
                        <Chip key={o.value} selected={draft.currentActivityLevel === o.value}
                          onClick={() => set({ currentActivityLevel: o.value })}>{o.label}</Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label="How much do you sleep most nights?">
                    <div className="flex flex-wrap gap-2">
                      {SLEEP.map((o) => (
                        <Chip key={o.value} selected={draft.currentSleepHours === o.value}
                          onClick={() => set({ currentSleepHours: o.value })}>{o.label}</Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label="Screen time on a typical day?">
                    <div className="flex flex-wrap gap-2">
                      {SCREEN.map((o) => (
                        <Chip key={o.value} selected={draft.currentScreenHours === o.value}
                          onClick={() => set({ currentScreenHours: o.value })}>{o.label}</Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label="How often do you make eco-friendly choices?">
                    <div className="flex flex-wrap gap-2">
                      {ECO.map((o) => (
                        <Chip key={o.value} selected={draft.ecoConsciousness === o.value}
                          onClick={() => set({ ecoConsciousness: o.value })}>{o.label}</Chip>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* ── Result: personal targets ── */}
              {step === 3 && goals && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { Icon: Footprints, label: 'Steps', value: goals.goalStepsPerDay.toLocaleString(), unit: 'a day' },
                    { Icon: UtensilsCrossed, label: 'Calories', value: goals.goalCaloriesPerDay.toLocaleString(), unit: 'kcal' },
                    { Icon: Moon, label: 'Sleep', value: String(goals.goalSleepHours), unit: 'hours' },
                    { Icon: Target, label: 'Focus', value: String(goals.goalFocusMinutes), unit: 'minutes' },
                    { Icon: MonitorSmartphone, label: 'Screen limit', value: `${Math.floor(goals.goalScreenMinutes / 60)}h${goals.goalScreenMinutes % 60 ? ` ${goals.goalScreenMinutes % 60}m` : ''}`, unit: 'a day' },
                    { Icon: Leaf, label: 'Eco actions', value: String(goals.goalEcoActionsPerDay), unit: 'a day' },
                  ].map(({ Icon, label, value, unit }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                      className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5">
                      <div className="flex items-center gap-1.5 text-white/45 text-xs"><Icon size={13} className="text-lp-primary" /> {label}</div>
                      <div className="mt-1.5 text-white font-bold text-xl leading-none">
                        {value} <span className="text-xs font-medium text-white/40">{unit}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 space-y-3">
            {step === 0 && (
              <p className="text-center text-xs text-white/35">Tap a goal to continue</p>
            )}

            {(step === 1 || step === 2) && (
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold text-white/50 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/75 transition-all">
                  <ChevronLeft size={15} /> Back
                </button>
                <button type="button" disabled={saving || (step === 1 && birthYearInvalid)}
                  onClick={() => (step === 1 ? setStep(2) : save())}
                  className="flex-1 flex items-center justify-center gap-2 bg-lp-primary text-white font-semibold rounded-xl py-3 hover:bg-green-500 transition-all text-sm disabled:opacity-50">
                  {step === 1 ? 'Continue' : saving ? 'Setting up…' : 'See my targets'}
                  {!saving && <ArrowRight size={15} />}
                </button>
              </div>
            )}

            {step === 1 && (
              <button type="button" onClick={() => { set({ birthYear: '', gender: '', heightCm: '', weightKg: '' }); setStep(2) }}
                className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors">
                Skip for now
              </button>
            )}
            {step === 2 && (
              <button type="button" onClick={() => save(true)} disabled={saving}
                className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-50">
                Skip for now — use standard targets
              </button>
            )}

            {step === 3 && (
              <>
                <button type="button" onClick={finish}
                  className="w-full flex items-center justify-center gap-2 bg-lp-primary text-white font-semibold rounded-xl py-3 hover:bg-green-500 transition-all text-sm">
                  <Check size={16} /> Go to my dashboard
                </button>
                <p className="text-center text-xs text-white/35">
                  You can fine-tune these in Settings, or update them with the weekly check-in.
                </p>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-white/25 mt-5">Your answers are private and only used to set your targets.</p>
      </div>
    </div>
  )
}
