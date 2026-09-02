import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import AppToaster from './components/ui/Toaster'
import { useThemeSync } from './hooks/useThemeSync'
import { useAuthStore } from './store/useAuthStore'
import { useAppStore } from './store/useAppStore'
import { apiPost } from './api/client'
import './styles/globals.css'

function Root() {
  useThemeSync()

  const loadMe = useAuthStore((s) => s.loadMe)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete)
  const hydrateFromApi = useAppStore((s) => s.hydrateFromApi)
  const syncDashboardScore = useAppStore((s) => s.syncDashboardScore)
  const handleGoogleCallback = useAuthStore((s) => s.handleGoogleCallback)
  const [authReady, setAuthReady] = useState(false)

  // Handle Google OAuth redirect (?token= in URL)
  useEffect(() => {
    handleGoogleCallback()
  }, [])

  // After Google OAuth, save any pending onboarding data
  useEffect(() => {
    if (!isAuthenticated) return
    const pending = sessionStorage.getItem('lp_pending_onboarding')
    if (!pending) return
    try {
      const data = JSON.parse(pending)
      sessionStorage.removeItem('lp_pending_onboarding')
      apiPost('/api/user/onboarding', {
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
      }).then(() => {
        setOnboardingComplete(true)
      }).catch(() => null)
    } catch {
      sessionStorage.removeItem('lp_pending_onboarding')
    }
  }, [isAuthenticated])

  // Wait for auth store hydration
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setAuthReady(true))
    if (useAuthStore.persist.hasHydrated()) setAuthReady(true)
    return () => unsub()
  }, [])

  // Verify token is still valid
  useEffect(() => {
    if (!authReady) return
    loadMe().catch(() => null)
  }, [authReady, loadMe])

  // Pull data once authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    hydrateFromApi().catch(() => null)
    syncDashboardScore().catch(() => null)
  }, [isAuthenticated, hydrateFromApi, syncDashboardScore])

  return (
    <>
      <App />
      <AppToaster />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
)