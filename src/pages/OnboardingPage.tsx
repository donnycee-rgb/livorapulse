import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useAuthStore } from '../store/useAuthStore'
import { apiPost } from '../api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
// Step configuration — right panel content per step
// ---------------------------------------------------------------------------
const STEP_CONTENT = [
  {
    title: "Let's get to know you",
    subtitle: "Step 1 of 10",
    message: "Before we set up your account, we want to understand who you are. This helps us build a wellness experience that's truly yours — not a one-size-fits-all template.",
    emoji: "👋",
  },
  {
    title: "Your physical profile",
    subtitle: "Step 2 of 10",
    message: "Height and weight help us calculate accurate calorie estimates and personalise your fitness goals. This data stays private and is never shared.",
    emoji: "📏",
  },
  {
    title: "Any limitations?",
    subtitle: "Step 3 of 10",
    message: "We want to make sure your goals are realistic and respectful of your body. If you have any physical limitations, we'll adjust your targets accordingly — no pressure, no judgment.",
    emoji: "🤝",
  },
  {
    title: "What's your main goal?",
    subtitle: "Step 4 of 10",
    message: "Your primary goal shapes everything — which metrics matter most, how your score is calculated, and what the app highlights for you. You can always update this later.",
    emoji: "🎯",
  },
  {
    title: "Your sleep habits",
    subtitle: "Step 5 of 10",
    message: "Sleep is one of the most powerful levers for health. We'll use your current sleep pattern to set a realistic target — not something impossible, but something better than today.",
    emoji: "😴",
  },
  {
    title: "How active are you?",
    subtitle: "Step 6 of 10",
    message: "Be honest — there's no wrong answer. We want to meet you where you are, not where you think you should be. Your step goal will start from your current level.",
    emoji: "🏃",
  },
  {
    title: "Screen time habits",
    subtitle: "Step 7 of 10",
    message: "The average person spends 7+ hours on screens daily. We'll help you understand your pattern and set a gentle reduction goal — not a drastic change, just progress.",
    emoji: "📱",
  },
  {
    title: "How's your mood?",
    subtitle: "Step 8 of 10",
    message: "Your emotional baseline matters. LivoraPulse tracks mood over time so you can spot patterns — like how sleep affects your mood or how exercise lifts your spirits.",
    emoji: "💚",
  },
  {
    title: "Your stress level",
    subtitle: "Step 9 of 10",
    message: "Stress affects everything — sleep, focus, physical health. Knowing your baseline helps us give you relevant insights and flag when things are getting harder.",
    emoji: "🧘",
  },
  {
    title: "Eco consciousness",
    subtitle: "Step 10 of 10",
    message: "LivoraPulse tracks your environmental impact too — recycling, transport choices, carbon footprint. Your goal here grows with your habits over time.",
    emoji: "🌱",
  },
  {
    title: "Almost there!",
    subtitle: "Create your account",
    message: "Your profile is ready. Now create your account to save everything and access your personalised dashboard. You can also sign in with Google — we'll keep your onboarding data.",
    emoji: "✨",
  },
]

// ---------------------------------------------------------------------------
// Option button
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
        'w-full text-left px-4 py-3 rounded-xl border transition-all duration-150',
        selected
          ? 'bg-lp-primary/15 border-lp-primary/50 text-white'
          : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white/80',
      )}
    >
      <div className="flex items-center gap-3">
        <div className={clsx(
          'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all',
          selected ? 'border-lp-primary bg-lp-primary' : 'border-white/30',
        )}>
          {selected && <div className="w-full h-full rounded-full bg-white scale-50 block" />}
        </div>
        <div>
          <div className="text-sm font-semibold">{children}</div>
          {description && (
            <div className={clsx('text-xs mt-0.5', selected ? 'text-white/60' : 'text-white/35')}>
              {description}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Form input
// ---------------------------------------------------------------------------
function FormInput({
  label, type = 'text', placeholder, value, onChange, rightElement,
}: {
  label: string
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  rightElement?: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1.5">{label}</div>
      <div className="relative flex items-center rounded-xl border border-white/[0.08] bg-white/[0.06] focus-within:border-lp-primary/40 focus-within:ring-1 focus-within:ring-lp-primary/30 transition-all">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-transparent text-white text-sm focus:outline-none placeholder:text-white/20"
        />
        {rightElement && <span className="pr-4">{rightElement}</span>}
      </div>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] text-white/30">
        <span>Step {current} of {total}</span>
        <span>{pct}% complete</span>
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
// Right panel — encouraging text
// ---------------------------------------------------------------------------
function RightPanel({ step }: { step: number }) {
  const c = STEP_CONTENT[step]
  return (
    <div className="hidden md:flex w-1/2 h-full flex-col justify-between px-10 py-10 relative z-10">
      <div className="flex items-center gap-2">
        <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="10" fill="#4CAF50" fillOpacity="0.15" />
          <polyline points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18"
            stroke="#4CAF50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="text-sm font-bold text-white tracking-tight">LivoraPulse</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <div className="text-5xl">{c.emoji}</div>
          <div>
            <div className="text-xs font-semibold text-lp-primary uppercase tracking-widest mb-2">
              {c.subtitle}
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-3">{c.title}</h2>
            <div className="w-10 h-[3px] bg-lp-primary rounded-full mb-4" />
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">{c.message}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="text-xs text-white/20">Your data is private and secure. Never shared.</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual step forms
// ---------------------------------------------------------------------------
function Step1({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-5">
      <FormInput
        label="Date of Birth"
        type="date"
        placeholder="YYYY-MM-DD"
        value={data.dateOfBirth}
        onChange={(v) => setData({ dateOfBirth: v })}
      />
      <div>
        <div className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-2">Gender</div>
        <div className="space-y-2">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'non-binary', label: 'Non-binary' },
            { value: 'prefer-not-to-say', label: 'Prefer not to say' },
          ].map((opt) => (
            <OptionButton
              key={opt.value}
              selected={data.gender === opt.value}
              onClick={() => setData({ gender: opt.value })}
            >
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step2({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-4">
      <FormInput
        label="Height (cm)"
        type="number"
        placeholder="e.g. 175"
        value={data.heightCm}
        onChange={(v) => setData({ heightCm: v })}
      />
      <FormInput
        label="Weight (kg)"
        type="number"
        placeholder="e.g. 70"
        value={data.weightKg}
        onChange={(v) => setData({ weightKg: v })}
      />
      <p className="text-white/25 text-xs">These are optional but help with accurate calorie calculations.</p>
    </div>
  )
}

function Step3({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {[
          { value: false, label: 'No limitations', description: 'I can do most physical activities' },
          { value: true, label: 'I have some limitations', description: 'Physical disability or chronic condition' },
        ].map((opt) => (
          <OptionButton
            key={String(opt.value)}
            selected={data.hasDisability === opt.value}
            onClick={() => setData({ hasDisability: opt.value })}
            description={opt.description}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
      {data.hasDisability && (
        <FormInput
          label="Tell us more (optional)"
          placeholder="e.g. uses a wheelchair, chronic back pain..."
          value={data.disabilityNote}
          onChange={(v) => setData({ disabilityNote: v })}
        />
      )}
    </div>
  )
}

function Step4({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  const goals = [
    { value: 'lose-weight', label: 'Lose weight', description: 'Burn more calories, move more daily' },
    { value: 'gain-muscle', label: 'Build strength', description: 'Increase activity and track progress' },
    { value: 'better-sleep', label: 'Sleep better', description: 'Improve sleep quality and duration' },
    { value: 'reduce-stress', label: 'Reduce stress', description: 'Lower stress, improve mood daily' },
    { value: 'build-habits', label: 'Build healthy habits', description: 'Consistency across all dimensions' },
    { value: 'improve-fitness', label: 'Improve fitness', description: 'Higher activity and endurance' },
    { value: 'eco-lifestyle', label: 'Eco-friendly lifestyle', description: 'Reduce environmental impact' },
  ]
  return (
    <div className="space-y-2">
      {goals.map((g) => (
        <OptionButton
          key={g.value}
          selected={data.primaryGoal === g.value}
          onClick={() => setData({ primaryGoal: g.value })}
          description={g.description}
        >
          {g.label}
        </OptionButton>
      ))}
    </div>
  )
}

function Step5({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  const options = [
    { hours: 4, label: 'Less than 5 hours', description: 'Very little sleep most nights' },
    { hours: 5.5, label: '5–6 hours', description: 'Below the recommended amount' },
    { hours: 6.5, label: '6–7 hours', description: 'Slightly under ideal' },
    { hours: 7.5, label: '7–8 hours', description: 'Around the recommended amount' },
    { hours: 9, label: '8+ hours', description: 'Getting plenty of rest' },
  ]
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <OptionButton
          key={o.hours}
          selected={data.currentSleepHours === o.hours}
          onClick={() => setData({ currentSleepHours: o.hours })}
          description={o.description}
        >
          {o.label}
        </OptionButton>
      ))}
    </div>
  )
}

function Step6({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  const levels = [
    { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little to no exercise' },
    { value: 'light', label: 'Lightly active', description: 'Light exercise or walking 1–3 days/week' },
    { value: 'moderate', label: 'Moderately active', description: 'Exercise 3–5 days/week' },
    { value: 'active', label: 'Active', description: 'Hard exercise 6–7 days/week' },
    { value: 'very-active', label: 'Very active', description: 'Physical job or twice-a-day training' },
  ]
  return (
    <div className="space-y-2">
      {levels.map((l) => (
        <OptionButton
          key={l.value}
          selected={data.currentActivityLevel === l.value}
          onClick={() => setData({ currentActivityLevel: l.value })}
          description={l.description}
        >
          {l.label}
        </OptionButton>
      ))}
    </div>
  )
}

function Step7({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  const options = [
    { hours: 1, label: 'Under 2 hours', description: 'Very little screen time daily' },
    { hours: 3, label: '2–4 hours', description: 'Moderate usage' },
    { hours: 5, label: '4–6 hours', description: 'Above average usage' },
    { hours: 7, label: '6–8 hours', description: 'High screen usage' },
    { hours: 9, label: '8+ hours', description: 'Very high — mostly on screens' },
  ]
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <OptionButton
          key={o.hours}
          selected={data.currentScreenHours === o.hours}
          onClick={() => setData({ currentScreenHours: o.hours })}
          description={o.description}
        >
          {o.label}
        </OptionButton>
      ))}
    </div>
  )
}

function Step8({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  const moods = [
    { value: 'thriving', label: 'Thriving', description: 'I feel great most days — energetic and positive' },
    { value: 'balanced', label: 'Balanced', description: 'Generally okay, some good and some bad days' },
    { value: 'struggling', label: 'Struggling', description: 'More low days than good, finding things hard' },
    { value: 'overwhelmed', label: 'Overwhelmed', description: 'Feeling stressed or anxious most of the time' },
    { value: 'exhausted', label: 'Exhausted', description: 'Mentally and physically drained constantly' },
  ]
  return (
    <div className="space-y-2">
      {moods.map((m) => (
        <OptionButton
          key={m.value}
          selected={data.currentMood === m.value}
          onClick={() => setData({ currentMood: m.value })}
          description={m.description}
        >
          {m.label}
        </OptionButton>
      ))}
    </div>
  )
}

function Step9({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  const levels = [
    { value: 'very-calm', label: 'Very calm', description: 'Rarely feel stressed, handle pressure well' },
    { value: 'mild', label: 'Mild stress', description: 'Occasional stress but manageable' },
    { value: 'moderate', label: 'Moderate', description: 'Stress is noticeable and affects my day' },
    { value: 'high', label: 'High stress', description: 'Often stressed, hard to switch off' },
    { value: 'burned-out', label: 'Burned out', description: 'Constant stress, feeling at my limit' },
  ]
  return (
    <div className="space-y-2">
      {levels.map((l) => (
        <OptionButton
          key={l.value}
          selected={data.currentStress === l.value}
          onClick={() => setData({ currentStress: l.value })}
          description={l.description}
        >
          {l.label}
        </OptionButton>
      ))}
    </div>
  )
}

function Step10({ data, setData }: { data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }) {
  const levels = [
    { value: 'rarely', label: 'Rarely', description: "I don't think much about my environmental impact" },
    { value: 'sometimes', label: 'Sometimes', description: 'I make eco-friendly choices occasionally' },
    { value: 'often', label: 'Often', description: 'I actively try to reduce my footprint' },
    { value: 'always', label: 'Always', description: "Eco-consciousness is central to my lifestyle" },
  ]
  return (
    <div className="space-y-2">
      {levels.map((l) => (
        <OptionButton
          key={l.value}
          selected={data.ecoConsciousness === l.value}
          onClick={() => setData({ ecoConsciousness: l.value })}
          description={l.description}
        >
          {l.label}
        </OptionButton>
      ))}
    </div>
  )
}

function Step11({
  onComplete, onGoogle, isLoading,
}: {
  onComplete: (name: string, email: string, password: string) => Promise<void>
  onGoogle: () => void
  isLoading: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name || name.trim().length < 2) e.name = 'At least 2 characters'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required'
    if (!password || password.length < 8) e.password = 'Minimum 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    await onComplete(name.trim(), email, password)
  }

  const eyeBtn = (
    <button type="button" onClick={() => setShowPw(p => !p)} className="text-white/25 hover:text-white/60 transition-colors">
      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      <FormInput label="Full Name" placeholder="Your full name" value={name} onChange={setName} />
      {errors.name && <p className="text-xs text-lp-alert/80">{errors.name}</p>}

      <FormInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
      {errors.email && <p className="text-xs text-lp-alert/80">{errors.email}</p>}

      <FormInput label="Password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
        value={password} onChange={setPassword} rightElement={eyeBtn} />
      {errors.password && <p className="text-xs text-lp-alert/80">{errors.password}</p>}

      <FormInput label="Confirm Password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
        value={confirm} onChange={setConfirm} />
      {errors.confirm && <p className="text-xs text-lp-alert/80">{errors.confirm}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-lp-primary text-white font-semibold rounded-xl py-3 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 transition-all duration-200 disabled:opacity-50 text-sm mt-2"
      >
        {isLoading ? 'Creating your account…' : 'Create Account & Go to Dashboard'}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[11px] text-white/25">or</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        className="w-full flex items-center justify-center gap-3 border border-white/[0.08] rounded-xl py-2.5 bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 text-sm text-white/60 hover:text-white/80"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Validation per step
// ---------------------------------------------------------------------------
function validateStep(step: number, data: OnboardingData): string | null {
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
// Main OnboardingPage
// ---------------------------------------------------------------------------
export default function OnboardingPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setDataState] = useState<OnboardingData>({
    dateOfBirth: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    hasDisability: false,
    disabilityNote: '',
    primaryGoal: '',
    currentSleepHours: 0,
    currentActivityLevel: '',
    currentScreenHours: 0,
    currentMood: '',
    currentStress: '',
    ecoConsciousness: '',
  })

  const setData = useCallback((patch: Partial<OnboardingData>) => {
    setDataState(prev => ({ ...prev, ...patch }))
  }, [])

  const TOTAL_STEPS = 11

  const handleNext = () => {
    const error = validateStep(step, data)
    if (error) { toast.error(error); return }
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  const handleBack = () => setStep(s => Math.max(s - 1, 0))

  // Save onboarding data to backend
  const saveOnboarding = async () => {
    try {
      await apiPost('/api/user/onboarding', {
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        gender: data.gender,
        heightCm: data.heightCm ? Number(data.heightCm) : undefined,
        weightKg: data.weightKg ? Number(data.weightKg) : undefined,
        hasDisability: data.hasDisability,
        disabilityNote: data.disabilityNote || undefined,
        primaryGoal: data.primaryGoal,
        currentSleepHours: data.currentSleepHours,
        currentActivityLevel: data.currentActivityLevel,
        currentScreenHours: data.currentScreenHours,
        currentMood: data.currentMood,
        currentStress: data.currentStress,
        ecoConsciousness: data.ecoConsciousness,
      })
      setOnboardingComplete(true)
    } catch (err) {
      console.warn('Onboarding save failed:', err)
      // Non-fatal — user still gets to dashboard
    }
  }

  const handleCreateAccount = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      await register({ name, email, password })
      await saveOnboarding()
      navigate('/dashboard')
      toast.success('Welcome to LivoraPulse!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    // Store onboarding data in sessionStorage so it survives the OAuth redirect
    sessionStorage.setItem('lp_pending_onboarding', JSON.stringify(data))
    loginWithGoogle()
  }

  const stepComponents = [
    <Step1 data={data} setData={setData} />,
    <Step2 data={data} setData={setData} />,
    <Step3 data={data} setData={setData} />,
    <Step4 data={data} setData={setData} />,
    <Step5 data={data} setData={setData} />,
    <Step6 data={data} setData={setData} />,
    <Step7 data={data} setData={setData} />,
    <Step8 data={data} setData={setData} />,
    <Step9 data={data} setData={setData} />,
    <Step10 data={data} setData={setData} />,
    <Step11 onComplete={handleCreateAccount} onGoogle={handleGoogle} isLoading={loading} />,
  ]

  const isLastStep = step === TOTAL_STEPS - 1

  return (
    <div
      className="fixed inset-0 flex flex-col md:flex-row overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #091525 0%, #0e1d40 45%, #0b2218 100%)' }}
    >
      {/* Background grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 16px)',
        }}
      />

      {/* Right panel — desktop only */}
      <RightPanel step={step} />

      {/* Left panel — form */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center px-5 py-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-sm bg-[#0d1e3d] border border-white/[0.07] rounded-2xl shadow-2xl px-7 py-7 space-y-5">

          {/* Progress */}
          <ProgressBar current={step + 1} total={TOTAL_STEPS} />

          {/* Step title (mobile) */}
          <div className="md:hidden">
            <p className="text-lp-primary text-xs font-semibold uppercase tracking-widest">
              {STEP_CONTENT[step].subtitle}
            </p>
            <h2 className="text-white font-bold text-lg mt-0.5">{STEP_CONTENT[step].title}</h2>
          </div>

          {/* Desktop step title */}
          <h2 className="hidden md:block text-white font-bold text-xl">
            {STEP_CONTENT[step].title}
          </h2>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              {stepComponents[step]}
            </motion.div>
          </AnimatePresence>

          {/* Navigation — not shown on step 11 (account creation handles its own submit) */}
          {!isLastStep && (
            <div className="flex items-center gap-3 pt-1">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                >
                  <ChevronLeft size={15} />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 transition-all duration-200 text-sm"
              >
                Continue
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Back button on account creation step */}
          {isLastStep && (
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-center text-white/25 hover:text-white/50 text-xs transition-colors"
            >
              ← Back to previous step
            </button>
          )}
        </div>
      </div>
    </div>
  )
}