import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, User, Activity, MonitorSmartphone, BarChart3, Smile, Leaf } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { useAuthStore } from '../store/useAuthStore'
import HealthIllustration from '../components/HealthIllustration'
import LoginIllustration from '../components/FitnessIllustration'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Mode = 'login' | 'register' | 'forgot'
type FormSide = 'right' | 'left'

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
          className="flex-1 max-sm:min-w-0 px-3 py-2.5 max-sm:py-3 bg-transparent text-white text-sm max-sm:text-base focus:outline-none placeholder:text-white/20"
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
// Sign up — just the account. Goals are set up on /welcome right after.
// ---------------------------------------------------------------------------
function SignUpForm({ onSwitchToLogin, entryDelay }: { onSwitchToLogin: () => void; entryDelay: number }) {
  const register = useAuthStore((s) => s.register)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const d = entryDelay

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!name || name.trim().length < 2) errs.name = 'At least 2 characters'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email required'
    if (!password || password.length < 8) errs.password = 'Minimum 8 characters'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      // Once signed in, the app sends new users to /welcome to set their goals
      await register({ name: name.trim(), email, password })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 w-full">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d }}>
        <h2 className="text-white font-bold text-xl text-center">Create your account</h2>
        <p className="text-white/40 text-sm text-center mt-1">Free · takes about a minute</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d + 0.04 }}>
        <button type="button" onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3 bg-white text-[#1f2937] font-semibold text-sm hover:bg-white/90 transition-all duration-200">
          <GoogleIcon />
          Continue with Google
        </button>
      </motion.div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[11px] text-white/30 whitespace-nowrap">or use your email</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <FormInput icon={<User size={15} />} label="Name" placeholder="Your name" value={name} onChange={setName} error={errors.name} autoComplete="name" delay={d + 0.08} />
        <FormInput icon={<Mail size={15} />} label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} error={errors.email} autoComplete="email" delay={d + 0.12} />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d + 0.16 }}>
          <FormInput icon={<Lock size={15} />} label="Password" type={showPw ? 'text' : 'password'} placeholder="At least 8 characters" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password"
            rightElement={<button type="button" onClick={() => setShowPw((p) => !p)} aria-label={showPw ? 'Hide password' : 'Show password'} className="text-white/30 hover:text-white/60 transition-colors">{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
          <PasswordStrengthBar password={password} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: d + 0.2 }}>
          <button type="submit" disabled={loading}
            className="w-full bg-lp-primary text-white font-semibold rounded-xl py-3 hover:bg-green-500 hover:shadow-xl hover:shadow-lp-primary/25 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 text-sm">
            {loading ? <Spinner /> : 'Create account'}
          </button>
        </motion.div>
      </form>

      <p className="text-center text-sm text-white/35">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-lp-primary hover:text-green-400 transition-colors">Sign in</button>
      </p>
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
// Forgot password form
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
        <p className="text-sm text-white/45 mt-2 leading-relaxed">
          If there&apos;s an account for <span className="font-semibold text-white/70">{email}</span>, we&apos;ve sent it a link to set a new password. The link works for 1 hour. Check your spam folder too.
        </p>
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
          <h1 className="text-4xl font-black text-white leading-tight">Welcome<br /><span className="text-lp-primary">back.</span></h1>
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

const SIGNUP_STEPS = [
  { n: 1, title: 'Create your account', desc: 'Google or email — 30 seconds' },
  { n: 2, title: 'Pick your main goal', desc: 'One tap' },
  { n: 3, title: 'Tell us a little about you', desc: 'All optional' },
  { n: 4, title: 'Get your daily targets', desc: 'Personalised for you' },
]

function RegisterPromoPanel() {
  return (
    <div className="w-1/2 h-full hidden md:flex flex-col justify-between px-8 py-10 relative z-10 overflow-hidden">
      <div className="absolute inset-0 -z-10 flex items-end justify-center opacity-10 pointer-events-none">
        <HealthIllustration className="w-full h-auto" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-white tracking-tight">LivoraPulse</span>
        <span className="w-1.5 h-1.5 rounded-full bg-lp-primary animate-softPulse" aria-hidden />
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-white leading-tight">Your wellness,<br /><span className="text-lp-primary">made for you.</span></h1>
          <div className="w-10 h-[3px] bg-lp-primary rounded-full" />
          <p className="text-white/45 text-sm leading-relaxed max-w-xs">Four quick steps and you'll have daily targets built around your life.</p>
        </div>
        <ol className="space-y-3">
          {SIGNUP_STEPS.map((s) => (
            <li key={s.n} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white/[0.07] border border-white/10 text-white/70">{s.n}</span>
              <span>
                <span className="block text-sm font-semibold text-white/80">{s.title}</span>
                <span className="block text-xs text-white/35">{s.desc}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
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
  onSwitchToRegister: () => void
  onSwitchToLogin: () => void
  onForgotPassword: () => void
  onBackFromForgot: () => void
  entryDelay: number
}

function FormPanel({
  mode, onSwitchToRegister, onSwitchToLogin,
  onForgotPassword, onBackFromForgot, entryDelay,
}: FormPanelProps) {
  return (
    <div className="w-full md:w-1/2 h-full flex items-center justify-center px-6 py-8 max-sm:px-4 max-sm:py-6 max-sm:flex-col max-sm:justify-start max-sm:pt-[max(2rem,env(safe-area-inset-top))] relative z-10 overflow-y-auto">
      {/* Phones: the brand panel is hidden, so show the logo above the card */}
      <div className="sm:hidden w-full max-w-sm flex items-center gap-2.5 mb-5 mt-2">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-lp-primary/15 border border-lp-primary/25">
          <svg width="18" height="18" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <polyline points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18" stroke="#4CAF50" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="leading-tight">
          <div className="text-white font-bold text-[15px]">LivoraPulse</div>
          <div className="text-white/40 text-[11px]">Wellness tracking built for Kenya</div>
        </div>
      </div>
      <div className="w-full max-w-sm bg-[#0d1e3d] border border-white/[0.07] rounded-2xl shadow-2xl px-8 py-8 max-sm:px-5 max-sm:py-6">
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
          <SignUpForm
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
      setFormSide(nextMode === 'login' ? 'right' : 'left')
      setEntryDelay(0.32)
    }, 300)
    const t2 = setTimeout(() => setSweeping(false), 660)
    timers.current = [t1, t2]
  }, [sweeping])

  const handleForgotPassword = useCallback(() => { setMode('forgot'); setEntryDelay(0) }, [])
  const handleBackFromForgot = useCallback(() => { setMode('login'); setEntryDelay(0) }, [])

  // Signed in: the dashboard route sends anyone who hasn't finished setup to /welcome
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const leftPanel = mode === 'register'
    ? <RegisterPromoPanel />
    : <PromoPanel />

  const formPanel = (
    <FormPanel
      mode={mode}
      onSwitchToRegister={() => triggerSweep('register')}
      onSwitchToLogin={() => triggerSweep('login')}
      onForgotPassword={handleForgotPassword}
      onBackFromForgot={handleBackFromForgot}
      entryDelay={entryDelay}
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