import { MailCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import AuthShell from '../components/AuthShell'
import { useAuthStore } from '../store/useAuthStore'

const RESEND_WAIT_SEC = 60

/** Step 2 of sign-up: enter the 6-digit code emailed to you */
export default function VerifyEmail() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const verifyEmail = useAuthStore((s) => s.verifyEmail)
  const resendVerification = useAuthStore((s) => s.resendVerification)
  const logout = useAuthStore((s) => s.logout)
  // false only when sign-up just happened and the email didn't go out
  const failedToSend = useAuthStore((s) => s.verificationSent === false)

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // A code was just sent at sign-up, so start with the wait already running —
  // unless that email failed, then "send a new code" is offered straight away
  const [wait, setWait] = useState(failedToSend ? 0 : RESEND_WAIT_SEC)
  const [sendFailed, setSendFailed] = useState(failedToSend)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  // Already confirmed (or signed in with Google): nothing to do here
  if (user && user.emailVerifiedAt !== null) return <Navigate to="/dashboard" replace />

  const submit = async (value = code) => {
    if (!/^\d{6}$/.test(value)) { setError('Enter the 6-digit code from the email'); return }
    setBusy(true)
    setError(null)
    try {
      await verifyEmail(value)
      toast.success('Email confirmed')
      navigate('/dashboard', { replace: true }) // new users then go on to set up their goals
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't check the code. Please try again.")
      setCode('')
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError(null)
    try {
      await resendVerification()
      toast.success('A new code is on its way')
      setSendFailed(false)
      setWait(RESEND_WAIT_SEC)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send a new code. Please try again.")
    }
  }

  return (
    <AuthShell>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-lp-primary/15 border border-lp-primary/25 flex items-center justify-center mx-auto">
          <MailCheck size={26} className="text-lp-primary" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">Confirm your email</h1>
        {sendFailed ? (
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            We couldn&apos;t send your code to <span className="font-semibold text-white/80">{user?.email ?? 'your email'}</span> just now. Tap &ldquo;send a new code&rdquo; below to try again.
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            We sent a 6-digit code to <span className="font-semibold text-white/80">{user?.email ?? 'your email'}</span>. It works for 15 minutes.
          </p>
        )}
      </div>

      <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); submit() }} noValidate>
        <label htmlFor="code" className="sr-only">6-digit code</label>
        <input
          id="code"
          ref={inputRef}
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6)
            setCode(v)
            setError(null)
            if (v.length === 6) submit(v) // pasted or typed the last digit
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="••••••"
          aria-invalid={!!error}
          className="w-full text-center tracking-[0.6em] text-2xl font-bold rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-white/20 py-3 focus:outline-none focus:ring-2 focus:ring-lp-primary/50"
        />
        {error && <p role="alert" className="text-sm text-lp-alert text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 transition disabled:opacity-50 text-sm"
        >
          {busy ? 'Checking…' : 'Confirm email'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-white/45 space-y-2">
        <p>
          Didn&apos;t get it? Check spam, or{' '}
          {wait > 0 ? (
            <span className="text-white/35">send a new code in {wait}s</span>
          ) : (
            <button type="button" onClick={resend} className="font-semibold text-lp-accent hover:underline">send a new code</button>
          )}
        </p>
        <button type="button" onClick={logout} className="text-white/35 hover:text-white/60">Wrong email? Sign out and start again</button>
      </div>
    </AuthShell>
  )
}
