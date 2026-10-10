import { KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AuthShell from '../components/AuthShell'
import { useAuthStore } from '../store/useAuthStore'

/** Set a new password from the emailed link (/reset-password?token=…) */
export default function ResetPassword() {
  const resetPassword = useAuthStore((s) => s.resetPassword)
  // Read the token once, then take it out of the address bar and history
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '')
  useEffect(() => {
    if (window.location.search) window.history.replaceState({}, '', '/reset-password')
  }, [])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Use at least 8 characters'); return }
    if (password !== confirm) { setError("The two passwords don't match"); return }
    setBusy(true)
    setError(null)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset your password. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const field = 'w-full rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder:text-white/25 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lp-primary/50'

  return (
    <AuthShell>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-lp-primary/15 border border-lp-primary/25 flex items-center justify-center mx-auto">
          <KeyRound size={26} className="text-lp-primary" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">{done ? 'Password changed' : 'Set a new password'}</h1>
      </div>

      {!token ? (
        <p className="mt-4 text-sm text-white/50 text-center leading-relaxed">
          This link is incomplete. Open the link from the email again, or{' '}
          <Link to="/login" className="font-semibold text-lp-accent hover:underline">ask for a new one</Link>.
        </p>
      ) : done ? (
        <div className="mt-4 text-center space-y-4">
          <p className="text-sm text-white/50 leading-relaxed">
            You can now sign in with your new password. For your security, you&apos;ve been signed out on other devices.
          </p>
          <Link to="/login" className="block w-full bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 transition text-sm">
            Sign in
          </Link>
        </div>
      ) : (
        <form className="mt-6 space-y-3" onSubmit={submit} noValidate>
          <label className="block">
            <span className="text-xs font-semibold text-white/50">New password</span>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} mt-1`} placeholder="At least 8 characters" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-white/50">Type it again</span>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${field} mt-1`} />
          </label>
          {error && (
            <p role="alert" className="text-sm text-lp-alert">
              {error}
              {/expired|already been used/i.test(error) && (
                <> <Link to="/login" className="font-semibold text-lp-accent hover:underline">Ask for a new link</Link></>
              )}
            </p>
          )}
          <button type="submit" disabled={busy} className="w-full bg-lp-primary text-white font-semibold rounded-xl py-2.5 hover:bg-green-500 transition disabled:opacity-50 text-sm">
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
