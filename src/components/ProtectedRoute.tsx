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
