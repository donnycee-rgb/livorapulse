import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { useAuthStore } from '../store/useAuthStore'
import { googleSignInFailed } from '../auth/googleReturn'

// ---------------------------------------------------------------------------
// Sign in / create account, in the landing page's style: light, one green
// accent, serif headlines. The logic of each form is unchanged.
// ---------------------------------------------------------------------------

type Mode = 'login' | 'register' | 'forgot'

const ACCENT = '#3D9A41'
const REMEMBER_KEY = 'lp_remember_email'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readRemembered(): string {
  try { return localStorage.getItem(REMEMBER_KEY) ?? '' } catch { return '' }
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
export function Wordmark({ sub = true }: { sub?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-none">
        <div className="text-[15px] font-bold tracking-tight text-black/85 dark:text-white/90">
          Livora<span style={{ color: ACCENT }}>Pulse</span>
        </div>
        {sub && <div className="text-[11px] text-black/40 dark:text-white/40 mt-1">Wellness built for Kenya</div>}
      </div>
    </div>
  )
}

function getStrength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const STRENGTH = [
  { label: 'Weak', color: '#E57373' },
  { label: 'Fair', color: '#F5A623' },
  { label: 'Good', color: '#7CB342' },
  { label: 'Strong', color: ACCENT },
]

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const s = getStrength(password)
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-black/[0.07] dark:bg-white/10 overflow-hidden">
            {i < s && <div className="h-full rounded-full" style={{ background: STRENGTH[s - 1].color }} />}
          </div>
        ))}
      </div>
      {s > 0 && <span className="text-[11px] text-black/45 dark:text-white/45 w-10 text-right">{STRENGTH[s - 1].label}</span>}
    </div>
  )
}

interface FieldProps {
  label: string
  icon: React.ReactNode
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
  right?: React.ReactNode
  autoFocus?: boolean
}

function Field({ label, icon, type = 'text', placeholder, value, onChange, error, autoComplete, right, autoFocus }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-black/65 dark:text-white/65 mb-1.5">{label}</span>
      <span className={clsx(
        'flex items-center rounded-xl border bg-white dark:bg-white/[0.04] transition-all',
        'focus-within:ring-4 focus-within:ring-[#3D9A41]/15',
        error
          ? 'border-[#E57373] focus-within:border-[#E57373]'
          : 'border-black/[0.12] dark:border-white/[0.12] hover:border-black/25 dark:hover:border-white/25 focus-within:border-[#3D9A41] dark:focus-within:border-[#3D9A41]',
      )}>
        <span className="pl-3.5 text-black/30 dark:text-white/30 flex-shrink-0">{icon}</span>
        <input
          type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className="flex-1 min-w-0 px-3 py-3 bg-transparent text-[15px] text-black/85 dark:text-white/90 placeholder:text-black/30 dark:placeholder:text-white/25 focus:outline-none"
        />
        {right && <span className="pr-3.5 flex-shrink-0">{right}</span>}
      </span>
      {error && <span className="block text-xs text-[#C62828] dark:text-[#EF9A9A] mt-1.5">{error}</span>}
    </label>
  )
}

function ShowPassword({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-label={shown ? 'Hide password' : 'Show password'}
      className="text-black/35 hover:text-black/65 dark:text-white/35 dark:hover:text-white/65 transition-colors">
      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function PrimaryButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full rounded-full py-3 text-[15px] font-semibold text-white bg-[#2E7D32] hover:bg-[#276b2b] active:scale-[0.99] transition-all disabled:opacity-60">
      {loading ? <Spinner /> : children}
    </button>
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

function GoogleButton() {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  return (
    <button type="button" onClick={() => loginWithGoogle()}
      className="w-full flex items-center justify-center gap-3 rounded-full py-3 text-[15px] font-semibold border border-black/[0.12] dark:border-white/[0.14] bg-white dark:bg-white/[0.04] text-black/75 dark:text-white/85 hover:bg-black/[0.02] dark:hover:bg-white/[0.08] transition-colors">
      <GoogleIcon /> Continue with Google
    </button>
  )
}

function OrEmail() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
      <span className="text-xs text-black/40 dark:text-white/40">or with email</span>
      <div className="flex-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Forms (logic as before)
// ---------------------------------------------------------------------------
function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const remembered = readRemembered()
  const [email, setEmail] = useState(remembered)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(!!remembered)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!email) errs.email = 'Enter your email'
    else if (!EMAIL_RE.test(email)) errs.email = 'That doesn’t look like an email address'
    if (!password) errs.password = 'Enter your password'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await login({ email, password })
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email)
        else localStorage.removeItem(REMEMBER_KEY)
      } catch { /* storage unavailable */ }
      navigate('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(msg)
      setErrors({ form: msg })
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <GoogleButton />
      <OrEmail />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email" icon={<Mail size={16} />} type="email" placeholder="you@example.com" value={email}
          onChange={setEmail} error={errors.email} autoComplete="email" />
        <Field label="Password" icon={<Lock size={16} />} type={showPw ? 'text' : 'password'} placeholder="Your password"
          value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" autoFocus={!!remembered}
          right={<ShowPassword shown={showPw} onToggle={() => setShowPw((p) => !p)} />} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded" style={{ accentColor: ACCENT }} />
            <span className="text-sm text-black/60 dark:text-white/60">Remember my email</span>
          </label>
          <button type="button" onClick={onForgotPassword}
            className="text-sm font-medium text-[#2E7D32] dark:text-[#6FCF73] hover:underline">
            Forgot password?
          </button>
        </div>
        {errors.form && (
          <p role="alert" className="text-sm text-[#C62828] dark:text-[#EF9A9A] bg-[#FFEBEE] dark:bg-[#E57373]/10 rounded-xl px-3 py-2">{errors.form}</p>
        )}
        <PrimaryButton loading={loading}>Sign in</PrimaryButton>
      </form>
    </div>
  )
}

function SignUpForm() {
  const register = useAuthStore((s) => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!name || name.trim().length < 2) errs.name = 'At least 2 characters'
    if (!email || !EMAIL_RE.test(email)) errs.email = 'Enter a valid email address'
    if (!password || password.length < 8) errs.password = 'At least 8 characters'
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
    <div className="space-y-5">
      <GoogleButton />
      <OrEmail />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Name" icon={<User size={16} />} placeholder="What should we call you?" value={name}
          onChange={setName} error={errors.name} autoComplete="name" />
        <Field label="Email" icon={<Mail size={16} />} type="email" placeholder="you@example.com" value={email}
          onChange={setEmail} error={errors.email} autoComplete="email" />
        <div>
          <Field label="Password" icon={<Lock size={16} />} type={showPw ? 'text' : 'password'} placeholder="At least 8 characters"
            value={password} onChange={setPassword} error={errors.password} autoComplete="new-password"
            right={<ShowPassword shown={showPw} onToggle={() => setShowPw((p) => !p)} />} />
          <PasswordStrength password={password} />
        </div>
        <PrimaryButton loading={loading}>Create my account</PrimaryButton>
      </form>
    </div>
  )
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const [email, setEmail] = useState(readRemembered())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !EMAIL_RE.test(email)) { setError('Enter a valid email address'); return }
    setError('')
    setLoading(true)
    try { await forgotPassword(email); setSent(true) } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally { setLoading(false) }
  }

  const back = (
    <button type="button" onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-black/55 dark:text-white/55 hover:text-black/80 dark:hover:text-white/85">
      <ArrowLeft size={15} /> Back to sign in
    </button>
  )

  if (sent) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="w-14 h-14 rounded-full bg-[#E8F5E9] dark:bg-[#3D9A41]/15 flex items-center justify-center mx-auto">
          <Mail size={24} style={{ color: ACCENT }} />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-black/85 dark:text-white/90">Check your inbox</h2>
          <p className="text-sm text-black/55 dark:text-white/55 mt-2 leading-relaxed">
            If there’s an account for <b className="font-semibold text-black/75 dark:text-white/80">{email}</b>, we’ve sent
            it a link to set a new password. It works for 1 hour. Check your spam folder too.
          </p>
        </div>
        {back}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-black/85 dark:text-white/90">Reset your password</h2>
        <p className="text-sm text-black/55 dark:text-white/55 mt-1.5 leading-relaxed">
          Enter your email and we’ll send you a link to set a new one.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email" icon={<Mail size={16} />} type="email" placeholder="you@example.com" value={email}
          onChange={setEmail} error={error} autoComplete="email" autoFocus />
        <PrimaryButton loading={loading}>Send reset link</PrimaryButton>
      </form>
      <div className="text-center">{back}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The brand side (desktop)
// ---------------------------------------------------------------------------
function PreviewCard() {
  const bars: Array<[string, number, string]> = [
    ['Sleep', 82, '#6366F1'], ['Movement', 68, '#22C55E'], ['Mood', 74, '#EC4899'], ['Focus', 70, '#8B5CF6'],
  ]
  const r = 30, c = 2 * Math.PI * r
  return (
    <div className="lp-card rounded-3xl p-5 w-full max-w-[320px]" aria-hidden>
      <div className="flex items-center gap-4">
        <svg width="78" height="78" viewBox="0 0 78 78" className="-rotate-90 flex-shrink-0">
          <circle cx="39" cy="39" r={r} fill="none" stroke="#E8F5E9" strokeWidth="7" />
          <circle cx="39" cy="39" r={r} fill="none" stroke={ACCENT} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${c * 0.78} ${c}`} />
        </svg>
        <div>
          <div className="text-xs text-black/45 dark:text-white/45">Today’s LifePulse</div>
          <div className="text-3xl font-semibold text-black/85 dark:text-white/90 leading-tight">78</div>
          <div className="text-xs font-medium" style={{ color: ACCENT }}>9-day streak</div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {bars.map(([label, v, color]) => (
          <div key={label}>
            <div className="flex justify-between text-xs text-black/55 dark:text-white/55 mb-1"><span>{label}</span><span>{v}</span></div>
            <div className="h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]">
              <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BrandSide({ mode }: { mode: Mode }) {
  const register = mode === 'register'
  return (
    <aside className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden bg-[#EEF6EF] dark:bg-[#0b1a12]">
      <div className="pointer-events-none absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/60 dark:bg-[#3D9A41]/10 blur-3xl" />
      <div className="relative"><Wordmark /></div>

      <div className="relative space-y-8">
        <div>
          <h1 className="font-serif font-normal text-black/85 dark:text-white/90 leading-[1.08] tracking-tight"
            style={{ fontSize: 'clamp(2.4rem, 3.4vw, 3.2rem)' }}>
            {register
              ? <>Wellness that fits your <em className="italic" style={{ color: ACCENT }}>life.</em></>
              : <>Welcome <em className="italic" style={{ color: ACCENT }}>back.</em></>}
          </h1>
          <p className="mt-4 text-[15px] text-black/55 dark:text-white/55 leading-relaxed max-w-md">
            {register
              ? 'Track your sleep, Kenyan meals, focus and mood in one place, and learn which habits help you feel your best.'
              : 'Pick up where you left off. Your streak, your patterns and today’s outlook are waiting.'}
          </p>
        </div>
        <PreviewCard />
      </div>

      <p className="relative flex items-center gap-2 text-xs text-black/45 dark:text-white/40">
        <ShieldCheck size={14} style={{ color: ACCENT }} /> Free to use. Your data belongs to you.
      </p>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AuthPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [mode, setMode] = useState<Mode>('login')
  // Sent back here when Google sign-in didn't finish (/login?error=oauth_failed)
  const [googleFailed] = useState(googleSignInFailed)

  // Signed in: the dashboard route sends anyone who hasn't finished setup to /welcome
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-[#F5F5F5] dark:bg-[#050b18]">
      <BrandSide mode={mode} />

      <main className="flex flex-col items-center justify-center px-6 py-10 max-sm:px-4 max-sm:py-8 max-sm:justify-start">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8 max-sm:mb-6"><Wordmark /></div>

          <div className="lp-card rounded-3xl p-8 max-sm:p-5">
            {googleFailed && mode !== 'forgot' && (
              <p role="alert" className="mb-5 text-sm text-[#8a4b00] dark:text-[#F5C26B] bg-[#FFF4E5] dark:bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl px-3 py-2.5">
                Google sign-in didn’t finish. Please try again, or sign in with your email.
              </p>
            )}
            {mode !== 'forgot' && (
              <>
                <h2 className="font-serif text-[28px] max-sm:text-2xl text-black/85 dark:text-white/90 leading-tight">
                  {mode === 'login' ? 'Sign in' : 'Create your account'}
                </h2>
                <p className="text-sm text-black/50 dark:text-white/50 mt-1 mb-6">
                  {mode === 'login' ? 'Good to see you again.' : 'Free, and ready in about a minute.'}
                </p>
                <div role="tablist" aria-label="Sign in or create an account"
                  className="grid grid-cols-2 p-1 mb-6 rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                  {(['login', 'register'] as const).map((m) => (
                    <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                      className={clsx('py-2 rounded-full text-sm font-semibold transition-all',
                        mode === m
                          ? 'bg-white dark:bg-white/[0.12] text-black/85 dark:text-white shadow-sm'
                          : 'text-black/50 dark:text-white/50 hover:text-black/75 dark:hover:text-white/75')}>
                      {m === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* A plain CSS fade: nothing to stall if the browser throttles scripts */}
            <div key={mode} className="animate-fadeIn">
              {mode === 'login' && <LoginForm onForgotPassword={() => setMode('forgot')} />}
              {mode === 'register' && <SignUpForm />}
              {mode === 'forgot' && <ForgotForm onBack={() => setMode('login')} />}
            </div>
          </div>

          <p className="text-xs text-center text-black/40 dark:text-white/35 mt-6 lg:hidden flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} style={{ color: ACCENT }} /> Free to use. Your data belongs to you.
          </p>
        </div>
      </main>
    </div>
  )
}
