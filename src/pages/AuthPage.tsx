import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, User, Activity, MonitorSmartphone, BarChart3, Smile, Leaf, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { useAuthStore } from '../store/useAuthStore'
import { apiPost } from '../api/client'
import HealthIllustration from '../components/HealthIllustration'
import LoginIllustration from '../components/FitnessIllustration'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Mode = 'login' | 'register' | 'forgot'
type FormSide = 'right' | 'left'

interface OnboardingData {
  dateOfBirth: string
  gender: string
  heightCm: string
  weightKg: string
  hasDisability: boolean
  disabilityNote: string
  primaryGoal: string
  currentSleepHours: number
  currentActivityLevel: string
  currentScreenHours: number
  currentMood: string
  currentStress: string
  ecoConsciousness: string
}

// ---------------------------------------------------------------------------
// Password strength
// ---------------------------------------------------------------------------
function getStrength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const STRENGTH_FILL = ['#FF6B6B', '#FFA500', '#00BCD4', '#4CAF50']
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getStrength(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={clsx('h-1 flex-1 rounded-full transition-all duration-300', i >= strength && 'bg-white/15')}
            style={i < strength ? { backgroundColor: STRENGTH_FILL[strength - 1] } : undefined}
          />
        ))}
      </div>
      {strength > 0 && <p className="text-[11px] text-white/35">{STRENGTH_LABELS[strength]}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form input
// ---------------------------------------------------------------------------
interface FormInputProps {
  icon?: React.ReactNode
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  rightElement?: React.ReactNode
  delay?: number
  autoComplete?: string
  label?: string
}

function FormInput({
  icon, type = 'text', placeholder, value, onChange,
  error, rightElement, delay = 0, autoComplete, label,
}: FormInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: 'easeOut' }}
      className="space-y-1.5"
    >
      {label && <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest">{label}</p>}
      <div className={clsx(
        'relative flex items-center rounded-xl border transition-all duration-200',
        'bg-white/[0.06] backdrop-blur-sm',
        'focus-within:ring-1 focus-within:ring-lp-primary/50 focus-within:border-lp-primary/40',
        error ? 'border-lp-alert/50' : 'border-white/[0.08] hover:border-white/20',
      )}>
        {icon && <span className="pl-4 text-white/25 flex-shrink-0">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="flex-1 px-3 py-2.5 bg-transparent text-white text-sm focus:outline-none placeholder:text-white/20"
        />
        {rightElement && <span className="pr-4 flex-shrink-0">{rightElement}</span>}
      </div>
      {error && <p className="text-[11px] text-lp-alert/80 pl-1">{error}</p>}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="flex-shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function OAuthDivider({ delay, onGoogle }: { delay: number; onGoogle: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, delay }}
        className="flex items-center gap-3"
      >
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[11px] text-white/25 whitespace-nowrap">or continue with</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: delay + 0.06 }}
      >
        <button
          type="button"
          onClick={onGoogle}
          className="w-full flex items-center justify-center gap-3 border border-white/[0.08] rounded-xl py-2.5 bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 text-sm text-white/60 hover:text-white/80"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </motion.div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Onboarding option button
// ---------------------------------------------------------------------------
function OptionButton({
  selected, onClick, children, description,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150',
        selected
          ? 'bg-lp-primary/15 border-lp-primary/50 text-white'
          : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white/80',
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className={clsx(
          'w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all',
          selected ? 'border-lp-primary bg-lp-primary' : 'border-white/30',
        )} />
        <div>
          <div className="text-sm font-semibold leading-tight">{children}</div>
          {description && (
            <div className={clsx('text-[11px] mt-0.5 leading-tight', selected ? 'text-white/55' : 'text-white/30')}>
              {description}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="space-y-1.5 mb-4">
      <div className="flex justify-between text-[10px] text-white/30">
        <span>Step {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-lp-primary"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assessment data seeding (kept from original)
// ---------------------------------------------------------------------------
export const ASSESSMENT_QUESTIONS = [
  { id: 'physical', dimension: 'Physical', color: '#4CAF50', question: 'Hours of exercise per week?', options: ['0–1 hrs', '2–3 hrs', '4–6 hrs', '7+ hrs'] },
  { id: 'digital', dimension: 'Digital', color: '#00BCD4', question: 'Hours on screens per day?', options: ['0–2 hrs', '3–5 hrs', '6–8 hrs', '9+ hrs'] },
  { id: 'productivity', dimension: 'Productivity', color: '#6366F1', question: 'How productive do you feel most days?', options: ['Low', 'Moderate', 'High', 'Very High'] },
  { id: 'mood', dimension: 'Mood', color: '#FFA500', question: 'How has your mood been this week?', options: ['Stressed', 'Neutral', 'Good', 'Excellent'] },
  { id: 'eco', dimension: 'Eco', color: '#34A853', question: 'How eco-conscious are your habits?', options: ['Rarely', 'Sometimes', 'Often', 'Always'] },
]

const PHYSICAL_MAP = [
  { steps: 2000, distanceKm: 1.2, caloriesKcal: 80, sleepMinutes: 390 },
  { steps: 5000, distanceKm: 3.5, caloriesKcal: 180, sleepMinutes: 420 },
  { steps: 8000, distanceKm: 5.5, caloriesKcal: 280, sleepMinutes: 450 },
  { steps: 12000, distanceKm: 8.5, caloriesKcal: 420, sleepMinutes: 480 },
]
const DIGITAL_MAP = [
  { screenTimeMinutes: 90, categoryBreakdown: { Social: 30, Productive: 40, Entertainment: 20 } },
  { screenTimeMinutes: 240, categoryBreakdown: { Social: 90, Productive: 80, Entertainment: 70 } },
  { screenTimeMinutes: 390, categoryBreakdown: { Social: 150, Productive: 120, Entertainment: 120 } },
  { screenTimeMinutes: 540, categoryBreakdown: { Social: 200, Productive: 140, Entertainment: 200 } },
]
const PRODUCTIVITY_MAP = [
  { durationSec: 900, label: 'Light focus' },
  { durationSec: 2700, label: 'Moderate focus' },
  { durationSec: 5400, label: 'Deep work' },
  { durationSec: 9000, label: 'Peak focus' },
]
const MOOD_MAP = [
  { emoji: '😣', stressScore: 9 },
  { emoji: '😐', stressScore: 6 },
  { emoji: '🙂', stressScore: 4 },
  { emoji: '😄', stressScore: 2 },
]
const ECO_MAP = [
  { category: 'WASTE', type: 'Basic recycling', impactKgCO2: 0.1 },
  { category: 'WASTE', type: 'Regular recycling', impactKgCO2: 0.3 },
  { category: 'TRANSPORT', type: 'Cycling commute', impactKgCO2: 0.6 },
  { category: 'TRANSPORT', type: 'Zero-emission day', impactKgCO2: 1.2 },
]

async function seedAssessmentData(answers: Record<string, number>): Promise<void> {
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const p = answers['physical'] ?? 0
  const di = answers['digital'] ?? 0
  const pr = answers['productivity'] ?? 0
  const m = answers['mood'] ?? 0
  const e = answers['eco'] ?? 0
  await Promise.allSettled([
    apiPost('/api/activity/physical', { ...PHYSICAL_MAP[p], timestamp: now }),
    apiPost('/api/activity/physical', { ...PHYSICAL_MAP[p], timestamp: yesterday }),
    apiPost('/api/activity/digital', { ...DIGITAL_MAP[di], date: now }),
    apiPost('/api/activity/digital', { ...DIGITAL_MAP[di], date: yesterday }),
    apiPost('/api/productivity/session', {
      kind: 'FOCUS', label: PRODUCTIVITY_MAP[pr].label,
      startedAt: new Date(Date.now() - PRODUCTIVITY_MAP[pr].durationSec * 1000).toISOString(),
      endedAt: now, durationSec: PRODUCTIVITY_MAP[pr].durationSec,
    }),
    apiPost('/api/mood', { ...MOOD_MAP[m] }),
    apiPost('/api/eco', { ...ECO_MAP[e] }),
  ])
}

// ---------------------------------------------------------------------------
// Onboarding step validation
// ---------------------------------------------------------------------------
function validateOnboardingStep(step: number, data: OnboardingData): string | null {
  if (step === 0 && (!data.dateOfBirth || !data.gender)) return 'Please fill in your date of birth and gender.'
  if (step === 2 && data.hasDisability === undefined) return 'Please select an option.'
  if (step === 3 && !data.primaryGoal) return 'Please select your primary goal.'
  if (step === 4 && !data.currentSleepHours) return 'Please select your sleep hours.'
  if (step === 5 && !data.currentActivityLevel) return 'Please select your activity level.'
  if (step === 6 && !data.currentScreenHours) return 'Please select your screen time.'
  if (step === 7 && !data.currentMood) return 'Please select your current mood.'
  if (step === 8 && !data.currentStress) return 'Please select your stress level.'
  if (step === 9 && !data.ecoConsciousness) return 'Please select an option.'
  return null
}

// ---------------------------------------------------------------------------
// Onboarding steps content (questions)
// ---------------------------------------------------------------------------
const ONBOARDING_TITLES = [
  "Let's get to know you",
  "Your physical profile",
  "Any limitations?",
  "What's your main goal?",
  "Your sleep habits",
  "How active are you?",
  "Screen time habits",
  "How's your mood?",
  "Your stress level",
  "Eco consciousness",
  "Create your account",
]

const ONBOARDING_TOTAL = 11

function OnboardingStepContent({
  step, data, setData,
}: {
  step: number
  data: OnboardingData
  setData: (p: Partial<OnboardingData>) => void
}) {
  if (step === 0) return (
    <div className="space-y-4">
      <FormInput label="Date of Birth" type="date" placeholder="" value={data.dateOfBirth} onChange={(v) => setData({ dateOfBirth: v })} />
      <div>
        <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-2">Gender</p>
        <div className="space-y-1.5">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'non-binary', label: 'Non-binary' },
            { value: 'prefer-not-to-say', label: 'Prefer not to say' },
          ].map((o) => (
            <OptionButton key={o.value} selected={data.gender === o.value} onClick={() => setData({ gender: o.value })}>{o.label}</OptionButton>
          ))}
        </div>
      </div>
    </div>
  )

  if (step === 1) return (
    <div className="space-y-4">
      <FormInput label="Height (cm)" type="number" placeholder="e.g. 175" value={data.heightCm} onChange={(v) => setData({ heightCm: v })} />
      <FormInput label="Weight (kg)" type="number" placeholder="e.g. 70" value={data.weightKg} onChange={(v) => setData({ weightKg: v })} />
      <p className="text-white/25 text-xs">Optional — helps with accurate calorie calculations.</p>
    </div>
  )

  if (step === 2) return (
    <div className="space-y-2">
      {[
        { value: false, label: 'No limitations', description: 'I can do most physical activities' },
        { value: true, label: 'I have some limitations', description: 'Physical disability or chronic condition' },
      ].map((o) => (
        <OptionButton key={String(o.value)} selected={data.hasDisability === o.value} onClick={() => setData({ hasDisability: o.value })} description={o.description}>{o.label}</OptionButton>
      ))}
      {data.hasDisability && (
        <div className="pt-1">
          <FormInput label="Tell us more (optional)" placeholder="e.g. chronic back pain, uses wheelchair..." value={data.disabilityNote} onChange={(v) => setData({ disabilityNote: v })} />
        </div>
      )}
    </div>
  )

  if (step === 3) return (
    <div className="space-y-1.5">
      {[
        { value: 'lose-weight', label: 'Lose weight', description: 'Burn more calories, move more daily' },
        { value: 'gain-muscle', label: 'Build strength', description: 'Increase activity and track progress' },
        { value: 'better-sleep', label: 'Sleep better', description: 'Improve sleep quality and duration' },
        { value: 'reduce-stress', label: 'Reduce stress', description: 'Lower stress, improve mood daily' },
        { value: 'build-habits', label: 'Build healthy habits', description: 'Consistency across all dimensions' },
        { value: 'improve-fitness', label: 'Improve fitness', description: 'Higher activity and endurance' },
        { value: 'eco-lifestyle', label: 'Eco-friendly lifestyle', description: 'Reduce environmental impact' },
      ].map((g) => (
        <OptionButton key={g.value} selected={data.primaryGoal === g.value} onClick={() => setData({ primaryGoal: g.value })} description={g.description}>{g.label}</OptionButton>
      ))}
    </div>
  )

  if (step === 4) return (
    <div className="space-y-1.5">
      {[
        { hours: 4, label: 'Less than 5 hours', description: 'Very little sleep most nights' },
        { hours: 5.5, label: '5–6 hours', description: 'Below the recommended amount' },
        { hours: 6.5, label: '6–7 hours', description: 'Slightly under ideal' },
        { hours: 7.5, label: '7–8 hours', description: 'Around the recommended amount' },
        { hours: 9, label: '8+ hours', description: 'Getting plenty of rest' },
      ].map((o) => (
        <OptionButton key={o.hours} selected={data.currentSleepHours === o.hours} onClick={() => setData({ currentSleepHours: o.hours })} description={o.description}>{o.label}</OptionButton>
      ))}
    </div>
  )

  if (step === 5) return (
    <div className="space-y-1.5">
      {[
        { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little to no exercise' },
        { value: 'light', label: 'Lightly active', description: 'Light exercise 1–3 days/week' },
        { value: 'moderate', label: 'Moderately active', description: 'Exercise 3–5 days/week' },
        { value: 'active', label: 'Active', description: 'Hard exercise 6–7 days/week' },
        { value: 'very-active', label: 'Very active', description: 'Physical job or twice-a-day training' },
      ].map((l) => (
        <OptionButton key={l.value} selected={data.currentActivityLevel === l.value} onClick={() => setData({ currentActivityLevel: l.value })} description={l.description}>{l.label}</OptionButton>
      ))}
    </div>
  )

  if (step === 6) return (
    <div className="space-y-1.5">
      {[
        { hours: 1, label: 'Under 2 hours', description: 'Very little screen time daily' },
        { hours: 3, label: '2–4 hours', description: 'Moderate usage' },
        { hours: 5, label: '4–6 hours', description: 'Above average usage' },
        { hours: 7, label: '6–8 hours', description: 'High screen usage' },
        { hours: 9, label: '8+ hours', description: 'Very high — mostly on screens' },
      ].map((o) => (
        <OptionButton key={o.hours} selected={data.currentScreenHours === o.hours} onClick={() => setData({ currentScreenHours: o.hours })} description={o.description}>{o.label}</OptionButton>
      ))}
    </div>
  )

  if (step === 7) return (
    <div className="space-y-1.5">
      {[
        { value: 'thriving', label: 'Thriving', description: 'I feel great most days — energetic and positive' },
        { value: 'balanced', label: 'Balanced', description: 'Generally okay, some good and some bad days' },
        { value: 'struggling', label: 'Struggling', description: 'More low days than good, finding things hard' },
        { value: 'overwhelmed', label: 'Overwhelmed', description: 'Feeling stressed or anxious most of the time' },
        { value: 'exhausted', label: 'Exhausted', description: 'Mentally and physically drained constantly' },
      ].map((m) => (
        <OptionButton key={m.value} selected={data.currentMood === m.value} onClick={() => setData({ currentMood: m.value })} description={m.description}>{m.label}</OptionButton>
      ))}
    </div>
  )

  if (step === 8) return (
    <div className="space-y-1.5">
      {[
        { value: 'very-calm', label: 'Very calm', description: 'Rarely feel stressed, handle pressure well' },
        { value: 'mild', label: 'Mild stress', description: 'Occasional stress but manageable' },
        { value: 'moderate', label: 'Moderate', description: 'Stress is noticeable and affects my day' },
        { value: 'high', label: 'High stress', description: 'Often stressed, hard to switch off' },
        { value: 'burned-out', label: 'Burned out', description: 'Constant stress, feeling at my limit' },
      ].map((l) => (
        <OptionButton key={l.value} selected={data.currentStress === l.value} onClick={() => setData({ currentStress: l.value })} description={l.description}>{l.label}</OptionButton>
      ))}
    </div>
  )

  if (step === 9) return (
    <div className="space-y-1.5">
      {[
        { value: 'rarely', label: 'Rarely', description: "I don't think much about my environmental impact" },
        { value: 'sometimes', label: 'Sometimes', description: 'I make eco-friendly choices occasionally' },
        { value: 'often', label: 'Often', description: 'I actively try to reduce my footprint' },
        { value: 'always', label: 'Always', description: 'Eco-consciousness is central to my lifestyle' },
      ].map((l) => (
        <OptionButton key={l.value} selected={data.ecoConsciousness === l.value} onClick={() => setData({ ecoConsciousness: l.value })} description={l.description}>{l.label}</OptionButton>
      ))}
    </div>
  )

  return null
}

// ---------------------------------------------------------------------------
// Register / Onboarding flow
// ---------------------------------------------------------------------------
interface RegisterFlowProps {
  onSwitchToLogin: () => void
  entryDelay: number
}

function RegisterFlow({ onSwitchToLogin, entryDelay }: RegisterFlowProps) {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const setLastAssessmentAt = useAuthStore((s) => s.setLastAssessmentAt)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)

  const [onboardingStep, setOnboardingStep] = useState(0)
  const [onboardingData, setOnboardingDataState] = useState<OnboardingData>({
    dateOfBirth: '', gender: '', heightCm: '', weightKg: '',
    hasDisability: false, disabilityNote: '', primaryGoal: '',
    currentSleepHours: 0, currentActivityLevel: '', currentScreenHours: 0,
    currentMood: '', currentStress: '', ecoConsciousness: '',
  })

  // Account creation fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const isAccountStep = onboardingStep === ONBOARDING_TOTAL - 1

  const setOnboardingData = useCallback((patch: Partial<OnboardingData>) => {
    setOnboardingDataState(prev => ({ ...prev, ...patch }))
  }, [])

  const handleNext = () => {
    const error = validateOnboardingStep(onboardingStep, onboardingData)
    if (error) { toast.error(error); return }
    setOnboardingStep(s => s + 1)
  }

  const handleBack = () => {
    if (onboardingStep === 0) { onSwitchToLogin(); return }
    setOnboardingStep(s => s - 1)
  }

  const saveOnboarding = async () => {
    try {
      await apiPost('/api/user/onboarding', {
        dateOfBirth: new Date(onboardingData.dateOfBirth).toISOString(),
        gender: onboardingData.gender,
        heightCm: onboardingData.heightCm ? Number(onboardingData.heightCm) : undefined,
        weightKg: onboardingData.weightKg ? Number(onboardingData.weightKg) : undefined,
        hasDisability: onboardingData.hasDisability,
        disabilityNote: onboardingData.disabilityNote || undefined,
        primaryGoal: onboardingData.primaryGoal,
        currentSleepHours: onboardingData.currentSleepHours,
        currentActivityLevel: onboardingData.currentActivityLevel,
        currentScreenHours: onboardingData.currentScreenHours,
        currentMood: onboardingData.currentMood,
        currentStress: onboardingData.currentStress,
        ecoConsciousness: onboardingData.ecoConsciousness,
      })
      setOnboardingComplete(true)
    } catch { /* non-fatal */ }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!name || name.trim().length < 2) errs.name = 'At least 2 characters'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email required'
    if (!password || password.length < 8) errs.password = 'Minimum 8 characters'
    if (password !== confirm) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await register({ name: name.trim(), email, password })
      await saveOnboarding()
      await seedAssessmentData({
        physical: ['sedentary', 'light'].includes(onboardingData.currentActivityLevel) ? 0 : onboardingData.currentActivityLevel === 'moderate' ? 1 : 2,
        digital: onboardingData.currentScreenHours <= 2 ? 0 : onboardingData.currentScreenHours <= 5 ? 1 : 2,
        productivity: onboardingData.currentActivityLevel === 'sedentary' ? 0 : 1,
        mood: ['thriving'].includes(onboardingData.currentMood) ? 3 : ['balanced'].includes(onboardingData.currentMood) ? 2 : 1,
        eco: ['rarely'].includes(onboardingData.ecoConsciousness) ? 0 : ['sometimes'].includes(onboardingData.ecoConsciousness) ? 1 : 2,
      })
      setLastAssessmentAt(Date.now())
      toast.success('Welcome to LivoraPulse!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally { setLoading(false) }
  }

  const handleGoogle = () => {
    sessionStorage.setItem('lp_pending_onboarding', JSON.stringify(onboardingData))
    loginWithGoogle()
  }

  const d = entryDelay

  return (
    <div className="space-y-4 w-full">
      <ProgressBar current={onboardingStep + 1} total={ONBOARDING_TOTAL} />

      <motion.h2
        key={onboardingStep + '-title'}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-white font-bold text-lg"
      >
        {ONBOARDING_TITLES[onboardingStep]}
      </motion.h2>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={onboardingStep}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.22 }}
        >
          {!isAccountStep ? (
            <OnboardingStepContent step={onboardingStep} data={onboardingData} setData={setOnboardingData} />
          ) : (
            // Account creation step
            <form onSubmit={handleCreateAccount} className="space-y-3" noValidate>
              <FormInput icon={<User size={15} />} label="Full Name" placeholder="Your full name" value={name} onChange={setName} error={errors.name} autoComplete="name" delay={d} />
              <FormInput icon={<Mail size={15} />} label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} error={errors.email} autoComplete="email" delay={d + 0.06} />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d + 0.12 }} className="space-y-1.5">
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest">Password</p>
                <div className={clsx('relative flex items-center rounded-xl border transition-all duration-200 bg-white/[0.06]', 'focus-within:ring-1 focus-within:ring-lp-primary/50 focus-within:border-lp-primary/40', errors.password ? 'border-lp-alert/50' : 'border-white/[0.08] hover:border-white/20')}>
                  <span className="pl-4 text-white/25 flex-shrink-0"><Lock size={15} /></span>
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="flex-1 px-3 py-2.5 bg-transparent text-white text-sm focus:outline-none placeholder:text-white/20" />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="pr-4 text-white/25 hover:text-white/60 transition-colors">{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                {errors.password && <p className="text-[11px] text-lp-alert/80 pl-1">{errors.password}</p>}
                <PasswordStrengthBar password={password} />
              </motion.div>
              <FormInput icon={<Lock size={15} />} label="Confirm Password" type={showCf ? 'text' : 'password'} placeholder="••••••••" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" delay={d + 0.18}
                rightElement={<button type="button" onClick={() => setShowCf(p => !p)} className="text-white/25 hover:text-white/60 transition-colors">{showCf ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d + 0.24 }}>
                <button type="submit" disabled={loading} className="w-full bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 text-sm">
                  {loading ? <Spinner /> : 'Create Account & Go to Dashboard →'}
                </button>
              </motion.div>
              <OAuthDivider delay={d + 0.30} onGoogle={handleGoogle} />
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      {!isAccountStep && (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
          >
            <ChevronLeft size={15} />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-sm"
          >
            Continue
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {isAccountStep && (
        <button type="button" onClick={handleBack} className="w-full text-center text-white/25 hover:text-white/50 text-xs transition-colors pt-1">
          ← Back to previous step
        </button>
      )}

      {onboardingStep === 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: d + 0.3 }} className="text-center text-sm text-white/35">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-semibold text-lp-primary hover:text-green-400 transition-colors">Sign in</button>
        </motion.p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Login form (unchanged from original)
// ---------------------------------------------------------------------------
function LoginForm({
  onSwitchToRegister, onForgotPassword, entryDelay,
}: { onSwitchToRegister: () => void; onForgotPassword: () => void; entryDelay: number }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const d = entryDelay

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await login({ email, password })
      if (remember) localStorage.setItem('lp_remember_email', email)
      navigate('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg)
      setErrors({ form: msg })
    } finally { setLoading(false) }
  }

  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
      <FormInput icon={<Mail size={15} />} placeholder="you@example.com" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" delay={d} label="Email" />
      <FormInput icon={<Lock size={15} />} placeholder="••••••••" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" delay={d + 0.06} label="Password"
        rightElement={<button type="button" onClick={() => setShowPw(p => !p)} className="text-white/25 hover:text-white/60 transition-colors">{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d + 0.12 }} className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-white/20 accent-lp-primary" />
          <span className="text-sm text-white/40">Remember me</span>
        </label>
        <button type="button" onClick={onForgotPassword} className="text-xs text-lp-accent/70 hover:text-lp-accent transition-colors">Forgot password?</button>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d + 0.18 }}>
        <button type="submit" disabled={loading} className="w-full bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 text-sm">
          {loading ? <Spinner /> : 'Sign In'}
        </button>
      </motion.div>
      <OAuthDivider delay={d + 0.24} onGoogle={() => loginWithGoogle()} />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, delay: d + 0.38 }} className="text-center text-sm text-white/35">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="font-semibold text-lp-primary hover:text-green-400 transition-colors">Create one</button>
      </motion.p>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Forgot password form (unchanged from original)
// ---------------------------------------------------------------------------
function ForgotForm({ onBack }: { onBack: () => void }) {
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrors({ email: 'A valid email is required' }); return }
    setErrors({})
    setLoading(true)
    try { await forgotPassword(email); setSent(true) } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally { setLoading(false) }
  }

  if (sent) return (
    <div className="w-full text-center space-y-5 py-6">
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} className="w-16 h-16 rounded-2xl bg-lp-primary/15 border border-lp-primary/25 flex items-center justify-center mx-auto">
        <Mail size={28} className="text-lp-primary" />
      </motion.div>
      <div>
        <h2 className="text-xl font-bold text-white">Check your inbox</h2>
        <p className="text-sm text-white/45 mt-2">We sent a reset link to <span className="font-semibold text-white/70">{email}</span></p>
      </div>
      <button type="button" onClick={onBack} className="text-lp-accent/70 hover:text-lp-accent text-sm font-medium transition-colors">← Back to sign in</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
      <p className="text-white/40 text-sm leading-relaxed">Enter your email and we&apos;ll send you a link to reset your password.</p>
      <FormInput icon={<Mail size={15} />} placeholder="you@example.com" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" delay={0.06} label="Email address" />
      <button type="submit" disabled={loading} className="w-full bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 text-sm">
        {loading ? <Spinner /> : 'Send Reset Link'}
      </button>
      <button type="button" onClick={onBack} className="text-lp-accent/70 hover:text-lp-accent text-sm font-medium transition-colors">← Back to sign in</button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Promo panels (exactly as original)
// ---------------------------------------------------------------------------
const FEATURES = [
  { icon: <Activity size={14} />, text: 'Track your physical activity daily' },
  { icon: <MonitorSmartphone size={14} />, text: 'Own your screen time and focus' },
  { icon: <BarChart3 size={14} />, text: 'See all your metrics in one place' },
  { icon: <Smile size={14} />, text: 'Log your mood and reduce stress' },
  { icon: <Leaf size={14} />, text: 'Build eco-conscious daily habits' },
]

// Right side content per onboarding step
const ONBOARDING_STEP_CONTENT = [
  { emoji: '👋', title: "Let's get to know you", message: "Before anything else, we want to understand who you are. This helps us build a wellness experience that's truly yours." },
  { emoji: '📏', title: "Your physical profile", message: "Height and weight help us calculate accurate calorie estimates and personalise your fitness goals. This data stays private." },
  { emoji: '🤝', title: "Any limitations?", message: "We want your goals to be realistic and respectful of your body. We'll adjust your targets accordingly — no pressure, no judgment." },
  { emoji: '🎯', title: "What's your main goal?", message: "Your primary goal shapes everything — which metrics matter most, how your score is calculated, and what the app highlights for you." },
  { emoji: '😴', title: "Your sleep habits", message: "Sleep is one of the most powerful levers for health. We'll use your current pattern to set a realistic, better target." },
  { emoji: '🏃', title: "How active are you?", message: "Be honest — there's no wrong answer. We want to meet you where you are, not where you think you should be." },
  { emoji: '📱', title: "Screen time habits", message: "The average person spends 7+ hours on screens daily. We'll help you understand your pattern and set a gentle reduction goal." },
  { emoji: '💚', title: "How's your mood?", message: "Your emotional baseline matters. LivoraPulse tracks mood over time so you can spot patterns between sleep, activity and feelings." },
  { emoji: '🧘', title: "Your stress level", message: "Stress affects everything — sleep, focus, physical health. Knowing your baseline helps us give you relevant insights." },
  { emoji: '🌱', title: "Eco consciousness", message: "LivoraPulse tracks your environmental impact too. Your eco goal grows with your habits over time." },
  { emoji: '✨', title: "Almost there!", message: "Your profile is ready. Create your account to save everything and access your personalised dashboard. You can also sign in with Google." },
]

function PromoPanel() {
  return (
    <div className="w-1/2 h-full hidden md:flex flex-col justify-between px-8 py-10 relative z-10 overflow-hidden">
      <div className="absolute inset-0 -z-10 flex items-end justify-center opacity-10 pointer-events-none">
        <LoginIllustration className="w-full h-auto" />
      </div>
      <div className="flex items-center gap-2.5">
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="10" fill="#4CAF50" fillOpacity="0.12" />
          <rect width="36" height="36" rx="10" stroke="#4CAF50" strokeOpacity="0.25" strokeWidth="1" />
          <polyline points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18" stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div>
          <div className="text-sm font-bold text-white tracking-tight leading-none">LivoraPulse</div>
          <div className="text-[10px] text-white/35 font-medium tracking-widest uppercase mt-0.5">Wellness OS</div>
        </div>
      </div>
      <div className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-white leading-tight">Welcome<br /><span className="text-lp-primary">back.</span></h2>
          <div className="w-10 h-[3px] bg-lp-primary rounded-full" />
          <p className="text-white/45 text-sm leading-relaxed">Your wellness data is waiting. Pick up right where you left off.</p>
        </div>
        <div className="space-y-3">
          <p className="text-white/50 font-semibold text-sm tracking-tight">Track your:</p>
          <div className="space-y-2">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">{feature.icon}</span>
                {feature.text}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[{ label: 'Physical', color: '#4CAF50' }, { label: 'Productivity', color: '#6366F1' }, { label: 'Mood', color: '#FFA500' }, { label: 'Eco', color: '#34A853' }].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 text-white/50 text-xs px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />{label}
          </span>
        ))}
      </div>
    </div>
  )
}

function RegisterPromoPanel({ step }: { step: number }) {
  const c = ONBOARDING_STEP_CONTENT[step] ?? ONBOARDING_STEP_CONTENT[0]
  return (
    <div className="w-1/2 h-full hidden md:flex flex-col justify-between px-8 py-10 relative z-10 overflow-hidden">
      <div className="absolute inset-0 -z-10 flex items-end justify-center opacity-10 pointer-events-none">
        <HealthIllustration className="w-full h-auto" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-white tracking-tight">LivoraPulse</span>
        <span className="w-1.5 h-1.5 rounded-full bg-lp-primary animate-softPulse" aria-hidden />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <div className="text-5xl">{c.emoji}</div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-white leading-tight">{c.title}</h2>
            <div className="w-10 h-[3px] bg-lp-primary rounded-full" />
            <p className="text-white/45 text-sm leading-relaxed max-w-xs">{c.message}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="text-xs text-white/20">Your data is private and secure. Never shared.</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form panel wrapper
// ---------------------------------------------------------------------------
const CARD_TITLES: Record<Mode, string> = {
  login: 'Sign In',
  register: 'Get Started',
  forgot: 'Reset Password',
}

interface FormPanelProps {
  mode: Mode
  registerStep: number
  onSwitchToRegister: () => void
  onSwitchToLogin: () => void
  onForgotPassword: () => void
  onBackFromForgot: () => void
  entryDelay: number
  onRegisterStepChange: (step: number) => void
}

function FormPanel({
  mode, registerStep, onSwitchToRegister, onSwitchToLogin,
  onForgotPassword, onBackFromForgot, entryDelay, onRegisterStepChange,
}: FormPanelProps) {
  return (
    <div className="w-full md:w-1/2 h-full flex items-center justify-center px-6 py-8 relative z-10 overflow-y-auto">
      <div className="w-full max-w-sm bg-[#0d1e3d] border border-white/[0.07] rounded-2xl shadow-2xl px-8 py-8">
        {mode !== 'register' && (
          <motion.h2
            key={mode + '-title'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: entryDelay }}
            className="text-white font-bold text-xl text-center mb-5"
          >
            {CARD_TITLES[mode]}
          </motion.h2>
        )}

        {mode === 'login' && (
          <LoginForm
            onSwitchToRegister={onSwitchToRegister}
            onForgotPassword={onForgotPassword}
            entryDelay={entryDelay + 0.04}
          />
        )}

        {mode === 'register' && (
          <RegisterFlow
            onSwitchToLogin={onSwitchToLogin}
            entryDelay={entryDelay + 0.04}
          />
        )}

        {mode === 'forgot' && (
          <AnimatePresence mode="wait">
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <ForgotForm onBack={onBackFromForgot} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AuthPage root — sweep animation preserved exactly
// ---------------------------------------------------------------------------
export default function AuthPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [mode, setMode] = useState<Mode>('login')
  const [registerStep, setRegisterStep] = useState(0)
  const [formSide, setFormSide] = useState<FormSide>('right')
  const [sweeping, setSweeping] = useState(false)
  const [entryDelay, setEntryDelay] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const triggerSweep = useCallback((nextMode: 'login' | 'register') => {
    if (sweeping) return
    setSweeping(true)
    const t1 = setTimeout(() => {
      setMode(nextMode)
      setRegisterStep(0)
      setFormSide(nextMode === 'login' ? 'right' : 'left')
      setEntryDelay(0.32)
    }, 300)
    const t2 = setTimeout(() => setSweeping(false), 660)
    timers.current = [t1, t2]
  }, [sweeping])

  const handleForgotPassword = useCallback(() => { setMode('forgot'); setEntryDelay(0) }, [])
  const handleBackFromForgot = useCallback(() => { setMode('login'); setEntryDelay(0) }, [])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const leftPanel = mode === 'register'
    ? <RegisterPromoPanel step={registerStep} />
    : <PromoPanel />

  const formPanel = (
    <FormPanel
      mode={mode}
      registerStep={registerStep}
      onSwitchToRegister={() => triggerSweep('register')}
      onSwitchToLogin={() => triggerSweep('login')}
      onForgotPassword={handleForgotPassword}
      onBackFromForgot={handleBackFromForgot}
      entryDelay={entryDelay}
      onRegisterStepChange={setRegisterStep}
    />
  )

  return (
    <div
      className="fixed inset-0 flex flex-col md:flex-row overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #091525 0%, #0e1d40 45%, #0b2218 100%)' }}
    >
      <div aria-hidden className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 16px)' }} />
      <div aria-hidden className="absolute inset-0 pointer-events-none z-0"
        style={{ background: ['radial-gradient(ellipse 60% 50% at 15% 55%, rgba(76,175,80,0.07) 0%, transparent 100%)', 'radial-gradient(ellipse 50% 40% at 85% 15%, rgba(0,188,212,0.05) 0%, transparent 100%)'].join(', ') }} />

      <AnimatePresence>
        {sweeping && (
          <motion.div
            key="slash" aria-hidden
            className="fixed inset-y-0 z-[9999] pointer-events-none"
            style={{
              width: '140vw', left: '-20vw',
              clipPath: 'polygon(7% 0%, 100% 0%, 93% 100%, 0% 100%)',
              background: 'linear-gradient(135deg, #0e1d40 0%, #0b2218 100%)',
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 16px)',
            }}
            initial={{ x: '-140vw' }}
            animate={{ x: '140vw' }}
            transition={{ duration: 0.58, ease: 'easeInOut' }}
            onAnimationComplete={() => setSweeping(false)}
          />
        )}
      </AnimatePresence>

      {formSide === 'right'
        ? <>{leftPanel}{formPanel}</>
        : <>{formPanel}{leftPanel}</>
      }
    </div>
  )
}