import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

type Props = {
  children?: ReactNode
}

/**
 * Wraps routes that require authentication.
 * – If not authenticated → redirects to /login
 * – If children are provided → renders them (for <Route element={<ProtectedRoute><Layout>…</Layout></ProtectedRoute>})
 * – If no children → renders <Outlet /> (for nested route layouts)
 */
export default function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
