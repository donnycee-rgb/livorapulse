import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

type Props = {
  children?: ReactNode
  /** Send signed-in users who haven't finished setup to /welcome (default true) */
  requireSetup?: boolean
}

/**
 * Wraps routes that require authentication.
 * – If not authenticated → redirects to /login
 * – If children are provided → renders them (for <Route element={<ProtectedRoute><Layout>…</Layout></ProtectedRoute>})
 * – If no children → renders <Outlet /> (for nested route layouts)
 */
export default function ProtectedRoute({ children, requireSetup = true }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const profileLoaded = useAuthStore((s) => s.profileLoaded)
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Only decide once the server has confirmed the profile — the saved copy can be stale
  if (requireSetup && profileLoaded && !onboardingComplete) {
    return <Navigate to="/welcome" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
