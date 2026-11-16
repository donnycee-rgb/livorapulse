import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

type Props = {
  children?: ReactNode
  /** Send signed-in users who haven't finished setup to /welcome (default true) */
  requireSetup?: boolean
  /** Let signed-in users through before they've confirmed their email (the confirm page itself) */
  allowUnverified?: boolean
}

/**
 * Wraps routes that require authentication.
 * – If not authenticated → redirects to /login
 * – If children are provided → renders them (for <Route element={<ProtectedRoute><Layout>…</Layout></ProtectedRoute>})
 * – If no children → renders <Outlet /> (for nested route layouts)
 */
export default function ProtectedRoute({ children, requireSetup = true, allowUnverified = false }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  // Explicitly null means "not confirmed yet"; a missing value (older saved copy) is not treated as unconfirmed
  const unverified = useAuthStore((s) => s.user?.emailVerifiedAt === null)
  const profileLoaded = useAuthStore((s) => s.profileLoaded)
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete)
  const oauthPending = useAuthStore((s) => s.oauthPending)

  // Back from Google and still exchanging the code: wait rather than send them to /login
  if (oauthPending) return <SigningIn />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // New accounts confirm their email (6-digit code) before anything else
  if (unverified && !allowUnverified) {
    return <Navigate to="/verify-email" replace />
  }

  // Only decide once the server has confirmed the profile — the saved copy can be stale
  if (requireSetup && profileLoaded && !onboardingComplete) {
    return <Navigate to="/welcome" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

function SigningIn() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#F5F5F5] dark:bg-[#050b18]" role="status">
      <svg className="animate-spin h-8 w-8 text-[#3D9A41]" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-sm text-black/55 dark:text-white/55">Signing you in…</p>
    </div>
  )
}
