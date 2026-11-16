import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Seo from './components/Seo'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import NotFound from './pages/NotFound'
import WelcomeSetup from './pages/WelcomeSetup'
import VerifyEmail from './pages/VerifyEmail'
import ResetPassword from './pages/ResetPassword'
import {
  Dashboard, Digital, Environment, HealthSummary, Insights, Mood, Nutrition, Physical, Productivity, Profile, Settings,
} from './pages/lazyPages'

// Public, opened from a shared link only
const SharedSummary = lazy(() => import('./pages/SharedSummary'))

export default function App() {
  return (
    // Only public lazy pages reach this fallback; signed-in pages load inside
    // the Layout, which shows a page skeleton instead
    <Suspense fallback={<div className="min-h-dvh bg-ui-bg" />}>
      <Seo />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        {/* Public: set a new password from the emailed link */}
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Signed in but email not confirmed yet */}
        <Route path="/verify-email" element={
          <ProtectedRoute requireSetup={false} allowUnverified><VerifyEmail /></ProtectedRoute>
        } />

        {/* Setup right after sign-up (signed in, setup not finished yet) */}
        <Route path="/welcome" element={
          <ProtectedRoute requireSetup={false}><WelcomeSetup /></ProtectedRoute>
        } />

        {/* Signed-in pages share one Layout that stays on screen between them */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/physical" element={<Physical />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/digital" element={<Digital />} />
          <Route path="/productivity" element={<Productivity />} />
          <Route path="/environment" element={<Environment />} />
          <Route path="/summary" element={<HealthSummary />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Public: a health summary someone shared; the token is the only key */}
        <Route path="/shared/summary/:token" element={<SharedSummary />} />

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Suspense>
  )
}
